// app/api/admin/revenue/route.ts
// Calcule le CA admin à partir de Stripe (abonnements VIP + boost upfront)
// et Supabase (missions confirmées).
//
// GET /api/admin/revenue → renvoie un breakdown complet.
// Auth : Supabase Bearer token (admin allowlist).

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfYear(d = new Date()): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}
function startOfIsoWeek(d = new Date()): Date {
  const day = d.getDay() || 7; // dimanche = 7
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  monday.setDate(monday.getDate() - (day - 1));
  return monday;
}
function startOfQuarter(d = new Date()): Date {
  const q = Math.floor(d.getMonth() / 3); // 0..3
  return new Date(d.getFullYear(), q * 3, 1, 0, 0, 0, 0);
}
function nDaysAgo(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  r.setDate(r.getDate() - n);
  return r;
}

type PeriodKey =
  | 'current_week'
  | 'last_30d'
  | 'current_month'
  | 'current_quarter'
  | 'current_year';

const PERIOD_LABEL: Record<PeriodKey, string> = {
  current_week: 'Semaine en cours',
  last_30d: '30 derniers jours',
  current_month: 'Mois en cours',
  current_quarter: 'Trimestre en cours',
  current_year: 'Année en cours',
};

function getPeriodRange(key: PeriodKey, now = new Date()): { from: Date; to: Date } {
  const to = now;
  switch (key) {
    case 'current_week':
      return { from: startOfIsoWeek(now), to };
    case 'last_30d':
      return { from: nDaysAgo(now, 29), to };
    case 'current_quarter':
      return { from: startOfQuarter(now), to };
    case 'current_year':
      return { from: startOfYear(now), to };
    case 'current_month':
    default:
      return { from: startOfMonth(now), to };
  }
}

function isPeriodKey(v: any): v is PeriodKey {
  return v === 'current_week' || v === 'last_30d' || v === 'current_month'
    || v === 'current_quarter' || v === 'current_year';
}

/** Calcule le MRR depuis Stripe (abonnements actifs). En cents → euros. */
async function computeStripeMrr(): Promise<{
  mrrEur: number;
  activeCount: number;
}> {
  let activeCount = 0;
  let mrrCents = 0;

  // Iterate via auto-pagination, max 100 par page.
  for await (const sub of stripe.subscriptions.list({
    status: 'active',
    limit: 100,
    expand: ['data.items.data.price'],
  })) {
    activeCount++;
    for (const item of sub.items.data) {
      const price = item.price;
      const amount = price.unit_amount ?? 0; // cents
      const interval = price.recurring?.interval; // 'month' | 'year' | 'week' | 'day'
      const intervalCount = price.recurring?.interval_count ?? 1;
      const qty = item.quantity ?? 1;

      // Normalise tout en MRR.
      let monthlyAmount = 0;
      if (interval === 'month') {
        monthlyAmount = (amount * qty) / Math.max(1, intervalCount);
      } else if (interval === 'year') {
        monthlyAmount = (amount * qty) / (12 * Math.max(1, intervalCount));
      } else if (interval === 'week') {
        monthlyAmount = (amount * qty * 4.345) / Math.max(1, intervalCount);
      } else if (interval === 'day') {
        monthlyAmount = (amount * qty * 30) / Math.max(1, intervalCount);
      } else {
        monthlyAmount = amount * qty;
      }
      mrrCents += monthlyAmount;
    }
  }

  return { mrrEur: Math.round(mrrCents) / 100, activeCount };
}

/**
 * Somme les charges Stripe (paiements réels encaissés) sur une fenêtre.
 * Utilise charges.list avec created.gte. Limit 100/page, paginé.
 *
 * ⚠️ Exclut les charges dont metadata.source === 'mission' pour éviter
 * un double comptage avec sumMissionsCommission. Si un jour Stripe est
 * branché aux missions, c'est ce flag qui empêche le doublon.
 *
 * Tous les montants Stripe sont en TTC (Stripe encaisse du TTC).
 */
async function sumStripeCharges(sinceMs: number): Promise<{
  totalTtcEur: number;
  count: number;
  skippedMissionLinked: number;
}> {
  const since = Math.floor(sinceMs / 1000);
  let totalCents = 0;
  let count = 0;
  let skippedMissionLinked = 0;

  for await (const charge of stripe.charges.list({
    limit: 100,
    created: { gte: since },
  })) {
    if (charge.status !== 'succeeded') continue;
    if (charge.refunded) continue;

    // Si la charge est explicitement liée à une mission, on la skippe :
    // la commission de cette mission est déjà comptée par
    // sumMissionsCommission / sumMissionsPaid pour éviter le doublon.
    const meta = (charge.metadata ?? {}) as Record<string, string>;
    if (meta.source === 'mission' || meta.mission_id) {
      skippedMissionLinked++;
      continue;
    }

    // Charge.amount est en cents. On retire le refunded amount au cas où.
    const net = (charge.amount ?? 0) - (charge.amount_refunded ?? 0);
    if (net <= 0) continue;
    totalCents += net;
    count++;
  }

  return {
    totalTtcEur: Math.round(totalCents) / 100,
    count,
    skippedMissionLinked,
  };
}

/**
 * Somme les commissions des missions confirmed sur une fenêtre, depuis Supabase.
 * On compte les missions dont confirmed_at >= sinceISO et status='confirmed'.
 */
async function sumMissionsCommission(sinceIso: string): Promise<{
  commissionEur: number;
  count: number;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('missions')
    .select('commission_amount, confirmed_at, status')
    .gte('confirmed_at', sinceIso)
    .eq('status', 'confirmed')
    .limit(2000);

  if (error) {
    console.error('[admin/revenue] missions read', error);
    return { commissionEur: 0, count: 0 };
  }

  let commission = 0;
  let count = 0;
  for (const row of data ?? []) {
    const v = Number(row.commission_amount || 0);
    if (Number.isFinite(v) && v > 0) commission += v;
    count++;
  }
  return { commissionEur: Math.round(commission * 100) / 100, count };
}

/**
 * Somme les missions PAYÉES sur une fenêtre (paid_at >= sinceISO et
 * payment_status='paid'). Retourne le count, le total payé chef
 * (paid_amount) et la commission encaissée.
 *
 * Si la colonne payment_status n'existe pas encore (migration pas
 * appliquée), retourne 0 partout sans crasher.
 */
async function sumMissionsPaid(sinceIso: string): Promise<{
  count: number;
  paidAmountEur: number;
  commissionEur: number;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('missions')
    .select('paid_amount, commission_amount, paid_at, payment_status')
    .gte('paid_at', sinceIso)
    .eq('payment_status', 'paid')
    .limit(2000);

  if (error) {
    // Si la colonne n'existe pas (migration pas faite), on ne casse pas
    // l'endpoint — on retourne 0.
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('column') || msg.includes('does not exist')) {
      console.warn(
        '[admin/revenue] payment_status column not yet migrated, returning 0',
      );
      return { count: 0, paidAmountEur: 0, commissionEur: 0 };
    }
    console.error('[admin/revenue] missions paid read', error);
    return { count: 0, paidAmountEur: 0, commissionEur: 0 };
  }

  let paidAmount = 0;
  let commission = 0;
  let count = 0;
  for (const row of data ?? []) {
    const a = Number(row.paid_amount || 0);
    const c = Number(row.commission_amount || 0);
    if (Number.isFinite(a) && a > 0) paidAmount += a;
    if (Number.isFinite(c) && c > 0) commission += c;
    count++;
  }
  return {
    count,
    paidAmountEur: Math.round(paidAmount * 100) / 100,
    commissionEur: Math.round(commission * 100) / 100,
  };
}

/**
 * Somme les revenue_entries (ventes hors Stripe saisies manuellement :
 * intégrations, formations, autres) sur une fenêtre, en HT. Retourne
 * aussi un breakdown par catégorie pour le dashboard.
 */
async function sumManualEntries(sinceIso: string): Promise<{
  htEur: number;
  vatEur: number;
  count: number;
  byCategory: Record<string, { htEur: number; count: number }>;
}> {
  const supabase = getSupabaseAdmin();
  const sinceDate = sinceIso.slice(0, 10);
  const { data, error } = await supabase
    .from('revenue_entries')
    .select('*')
    .gte('occurred_at', sinceDate)
    .limit(5000);

  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('does not exist') || msg.includes('relation')) {
      console.warn('[admin/revenue] revenue_entries table not migrated yet, returning 0');
      return { htEur: 0, vatEur: 0, count: 0, byCategory: {} };
    }
    console.error('[admin/revenue] revenue_entries read', error);
    return { htEur: 0, vatEur: 0, count: 0, byCategory: {} };
  }

  let htCents = 0;
  let ttcCents = 0;
  let count = 0;
  const byCategory: Record<string, { htCents: number; count: number }> = {};

  for (const row of data ?? []) {
    const ht = Number(row.amount_ht_cents || 0);
    const ttc = Number(row.amount_ttc_cents || 0);
    if (!Number.isFinite(ht) || ht < 0) continue;
    htCents += ht;
    ttcCents += ttc;
    count++;
    const cat = String(row.category || 'autre');
    if (!byCategory[cat]) byCategory[cat] = { htCents: 0, count: 0 };
    byCategory[cat].htCents += ht;
    byCategory[cat].count++;
  }

  const byCategoryEur: Record<string, { htEur: number; count: number }> = {};
  for (const [k, v] of Object.entries(byCategory)) {
    byCategoryEur[k] = {
      htEur: Math.round(v.htCents) / 100,
      count: v.count,
    };
  }

  return {
    htEur: Math.round(htCents) / 100,
    vatEur: Math.round(ttcCents - htCents) / 100,
    count,
    byCategory: byCategoryEur,
  };
}

// Cache in-memory module-level pour les payloads /api/admin/revenue.
// TTL court (60s) pour soulager les round-trips Stripe + Supabase qui
// rendent le dashboard /admin lent. Sur Vercel serverless, le cache
// vit dans l'instance chaude ; cold start = miss (acceptable).
//
// Bypass possible via ?fresh=1 (utile quand on saisit une nouvelle
// vente manuelle et qu'on veut voir le total à jour immédiatement).
type RevenueCacheEntry = { at: number; payload: any };
const revenueCache = new Map<string, RevenueCacheEntry>();
const REVENUE_CACHE_TTL_MS = 30_000;

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const rawPeriod = searchParams.get('period');
  const periodKey: PeriodKey = isPeriodKey(rawPeriod) ? rawPeriod : 'current_month';
  const bypassCache = searchParams.get('fresh') === '1';

  // Cache lookup
  const cacheKey = periodKey;
  if (!bypassCache) {
    const cached = revenueCache.get(cacheKey);
    if (cached && Date.now() - cached.at < REVENUE_CACHE_TTL_MS) {
      return NextResponse.json(cached.payload, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age-Ms': String(Date.now() - cached.at),
        },
      });
    }
  }

  const now = new Date();
  const { from: periodFrom, to: periodTo } = getPeriodRange(periodKey, now);
  const periodStartMs = periodFrom.getTime();
  const yearStartMs = startOfYear(now).getTime();

  try {
    const [
      mrr,
      chargesPeriod,
      chargesYtd,
      missionsPeriod,
      missionsYtd,
      missionsPaidPeriod,
      missionsPaidYtd,
      manualPeriod,
      manualYtd,
    ] = await Promise.all([
      computeStripeMrr(),
      sumStripeCharges(periodStartMs),
      sumStripeCharges(yearStartMs),
      sumMissionsCommission(new Date(periodStartMs).toISOString()),
      sumMissionsCommission(new Date(yearStartMs).toISOString()),
      sumMissionsPaid(new Date(periodStartMs).toISOString()),
      sumMissionsPaid(new Date(yearStartMs).toISOString()),
      sumManualEntries(new Date(periodStartMs).toISOString()),
      sumManualEntries(new Date(yearStartMs).toISOString()),
    ]);

    // ─── Total CA "comptabilisé" (mix TTC + commission HT) ───
    // Stripe TTC + commission missions HT + ventes manuelles HT.
    // Note : Stripe est en TTC, le reste en HT — c'est volontairement
    // une vue *comptable* unifiée (≈ ce que CT a généré), pas une vue cash.
    const totalPeriod =
      chargesPeriod.totalTtcEur + missionsPeriod.commissionEur + manualPeriod.htEur;
    const totalYtd =
      chargesYtd.totalTtcEur + missionsYtd.commissionEur + manualYtd.htEur;

    // ─── CA en caisse TTC (effectivement encaissé) ─────────────────
    // Stripe encaissé hors-missions + missions payées (TTC, le chef est
    // payé en TTC) + ventes manuelles encaissées TTC.
    // NB : les ventes manuelles ne distinguent pas encore paid/non-paid
    // → on inclut le TTC. Si Thomas ajoute un champ paid_at plus tard,
    // on filtrera ici.
    const manualPeriodTtc = manualPeriod.htEur + manualPeriod.vatEur;
    const manualYtdTtc = manualYtd.htEur + manualYtd.vatEur;
    const cashPeriodTtc =
      chargesPeriod.totalTtcEur + missionsPaidPeriod.paidAmountEur + manualPeriodTtc;
    const cashYtdTtc =
      chargesYtd.totalTtcEur + missionsPaidYtd.paidAmountEur + manualYtdTtc;

    // ─── Commission brute HT (intermédiation CT) ───────────────────
    // client_amount - chef_amount sur missions confirmées (statut
    // 'confirmed'). Inclut les missions facturées même si pas encore
    // encaissées : c'est la marge brute "théorique" sur la période.
    const commissionPeriodHt = missionsPeriod.commissionEur;
    const commissionYtdHt = missionsYtd.commissionEur;

    const payload = {
      ok: true,
      generatedAt: new Date().toISOString(),
      period: {
        key: periodKey,
        label: PERIOD_LABEL[periodKey],
        from: periodFrom.toISOString(),
        to: periodTo.toISOString(),
      },
      stripe: {
        mrrEur: mrr.mrrEur,
        activeSubscriptions: mrr.activeCount,
        chargesPeriodTtcEur: chargesPeriod.totalTtcEur,
        chargesPeriodCount: chargesPeriod.count,
        chargesPeriodSkippedMission: chargesPeriod.skippedMissionLinked,
        chargesYtdTtcEur: chargesYtd.totalTtcEur,
        chargesYtdCount: chargesYtd.count,
        // Compat : alias historiques (sans suffixe TTC)
        chargesPeriodEur: chargesPeriod.totalTtcEur,
        chargesYtdEur: chargesYtd.totalTtcEur,
      },
      missions: {
        // Confirmées (facturées, pas forcément encaissées) sur la période
        confirmedPeriod: missionsPeriod.count,
        commissionPeriodHtEur: missionsPeriod.commissionEur,
        confirmedYtd: missionsYtd.count,
        commissionYtdHtEur: missionsYtd.commissionEur,
        // Payées (encaissées chef) — basé sur paid_at + payment_status='paid'
        paidPeriod: missionsPaidPeriod.count,
        paidAmountPeriodTtcEur: missionsPaidPeriod.paidAmountEur,
        paidCommissionPeriodHtEur: missionsPaidPeriod.commissionEur,
        paidYtd: missionsPaidYtd.count,
        paidAmountYtdTtcEur: missionsPaidYtd.paidAmountEur,
        paidCommissionYtdHtEur: missionsPaidYtd.commissionEur,
        // Compat : alias historiques
        commissionPeriodEur: missionsPeriod.commissionEur,
        commissionYtdEur: missionsYtd.commissionEur,
        paidAmountPeriodEur: missionsPaidPeriod.paidAmountEur,
        paidCommissionPeriodEur: missionsPaidPeriod.commissionEur,
        paidAmountYtdEur: missionsPaidYtd.paidAmountEur,
        paidCommissionYtdEur: missionsPaidYtd.commissionEur,
      },
      manualEntries: {
        periodHtEur: manualPeriod.htEur,
        periodVatEur: manualPeriod.vatEur,
        periodTtcEur: Math.round(manualPeriodTtc * 100) / 100,
        periodCount: manualPeriod.count,
        periodByCategory: manualPeriod.byCategory,
        ytdHtEur: manualYtd.htEur,
        ytdVatEur: manualYtd.vatEur,
        ytdTtcEur: Math.round(manualYtdTtc * 100) / 100,
        ytdCount: manualYtd.count,
      },
      // CA en caisse (effectivement encaissé) TTC
      cashTtc: {
        periodEur: Math.round(cashPeriodTtc * 100) / 100,
        ytdEur: Math.round(cashYtdTtc * 100) / 100,
      },
      // Commission brute (marge intermédiation CT) HT
      commissionHt: {
        periodEur: Math.round(commissionPeriodHt * 100) / 100,
        ytdEur: Math.round(commissionYtdHt * 100) / 100,
      },
      totals: {
        periodEur: Math.round(totalPeriod * 100) / 100,
        ytdEur: Math.round(totalYtd * 100) / 100,
      },
    };

    // Stocke en cache (TTL 30s — réduit pour Thomas qui rafraîchit souvent)
    revenueCache.set(cacheKey, { at: Date.now(), payload });

    return NextResponse.json(payload, {
      headers: { 'X-Cache': bypassCache ? 'BYPASS' : 'MISS' },
    });
  } catch (e: any) {
    console.error('[admin/revenue] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
