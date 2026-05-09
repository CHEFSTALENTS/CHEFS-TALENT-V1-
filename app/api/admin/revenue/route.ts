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
 */
async function sumStripeCharges(sinceMs: number): Promise<{
  totalEur: number;
  count: number;
}> {
  const since = Math.floor(sinceMs / 1000);
  let totalCents = 0;
  let count = 0;

  for await (const charge of stripe.charges.list({
    limit: 100,
    created: { gte: since },
  })) {
    if (charge.status !== 'succeeded') continue;
    if (charge.refunded) continue;
    // Charge.amount est en cents. On retire le refunded amount au cas où.
    const net = (charge.amount ?? 0) - (charge.amount_refunded ?? 0);
    if (net <= 0) continue;
    totalCents += net;
    count++;
  }

  return { totalEur: Math.round(totalCents) / 100, count };
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

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const monthStartMs = startOfMonth().getTime();
  const yearStartMs = startOfYear().getTime();

  try {
    const [
      mrr,
      chargesMonth,
      chargesYtd,
      missionsMonth,
      missionsYtd,
      missionsPaidMonth,
      missionsPaidYtd,
    ] = await Promise.all([
      computeStripeMrr(),
      sumStripeCharges(monthStartMs),
      sumStripeCharges(yearStartMs),
      sumMissionsCommission(new Date(monthStartMs).toISOString()),
      sumMissionsCommission(new Date(yearStartMs).toISOString()),
      sumMissionsPaid(new Date(monthStartMs).toISOString()),
      sumMissionsPaid(new Date(yearStartMs).toISOString()),
    ]);

    const totalMonth = chargesMonth.totalEur + missionsMonth.commissionEur;
    const totalYtd = chargesYtd.totalEur + missionsYtd.commissionEur;

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      stripe: {
        mrrEur: mrr.mrrEur,
        activeSubscriptions: mrr.activeCount,
        chargesMonthEur: chargesMonth.totalEur,
        chargesMonthCount: chargesMonth.count,
        chargesYtdEur: chargesYtd.totalEur,
        chargesYtdCount: chargesYtd.count,
      },
      missions: {
        // Confirmées (facturées, pas forcément encaissées)
        confirmedMonth: missionsMonth.count,
        commissionMonthEur: missionsMonth.commissionEur,
        confirmedYtd: missionsYtd.count,
        commissionYtdEur: missionsYtd.commissionEur,
        // Payées (encaissées chef) — basé sur paid_at + payment_status='paid'
        paidMonth: missionsPaidMonth.count,
        paidAmountMonthEur: missionsPaidMonth.paidAmountEur,
        paidCommissionMonthEur: missionsPaidMonth.commissionEur,
        paidYtd: missionsPaidYtd.count,
        paidAmountYtdEur: missionsPaidYtd.paidAmountEur,
        paidCommissionYtdEur: missionsPaidYtd.commissionEur,
      },
      totals: {
        monthEur: Math.round(totalMonth * 100) / 100,
        ytdEur: Math.round(totalYtd * 100) / 100,
      },
    });
  } catch (e: any) {
    console.error('[admin/revenue] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
