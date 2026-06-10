// app/api/admin/quotes/stats/route.ts
//
// GET /api/admin/quotes/stats
// Renvoie l'ensemble des KPIs commerciaux pour le dashboard /admin/quotes
// et le widget sur /admin.
//
// Query :
//   ?range=30d|90d|ytd|all (défaut: 90d)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type QuoteRow = {
  id: string;
  status: string;
  created_at: string;
  issued_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  tariff_options: Array<{ ht_eur?: number; ttc_eur?: number }> | null;
  chef_cost_eur: number | null;
  chef_travel_cost_eur: number | null;
  butler_required: boolean;
  butler_cost_eur: number | null;
  destinataire_nom: string | null;
  lieu: string | null;
  // Workflow / négo
  final_amount_ht_eur: number | null;
  final_amount_ttc_eur: number | null;
  is_external: boolean | null;
};

const HARD_LIMIT = 1000;

/**
 * Mois "comptable" du revenu d'un devis accepté :
 * - accepted_at quand renseigné (le CA tombe le mois de l'acceptation)
 * - sinon issued_at (pour les devis externes saisis a posteriori)
 * - sinon created_at en dernier recours
 */
function revenueMonthKey(q: QuoteRow): string {
  if (q.accepted_at) return q.accepted_at.slice(0, 7);
  if (q.is_external && q.issued_at) return q.issued_at.slice(0, 7);
  return q.created_at.slice(0, 7);
}

/**
 * Date de référence pour le tri/volume d'un devis (axe "création").
 * Pour les devis externes saisis a posteriori, on prend issued_at
 * (date réelle d'émission) plutôt que created_at (date d'import).
 */
function effectiveCreationKey(q: QuoteRow): string {
  if (q.is_external && q.issued_at) return q.issued_at.slice(0, 7);
  return q.created_at.slice(0, 7);
}

function fromIsoForRange(range: string): string | null {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'ytd') {
    return new Date(now.getUTCFullYear(), 0, 1).toISOString();
  }
  const days = range === '30d' ? 30 : range === '90d' ? 90 : 90;
  return new Date(now.getTime() - days * 86400000).toISOString();
}

function avgHt(opts: QuoteRow['tariff_options']): number {
  if (!opts || opts.length === 0) return 0;
  const sum = opts.reduce((s, o) => s + (Number(o.ht_eur) || 0), 0);
  return sum / opts.length;
}

function avgTtc(opts: QuoteRow['tariff_options']): number {
  if (!opts || opts.length === 0) return 0;
  const sum = opts.reduce((s, o) => s + (Number(o.ttc_eur) || 0), 0);
  return sum / opts.length;
}

/**
 * Pour les KPIs CA / marge : préfère le montant FINAL négocié quand
 * il est renseigné (cas devis accepté à un prix différent, ou devis
 * externe importé), sinon fallback sur la moyenne des tariff_options.
 */
function effectiveHt(q: QuoteRow): number {
  if (q.final_amount_ht_eur !== null && q.final_amount_ht_eur !== undefined) {
    return Number(q.final_amount_ht_eur);
  }
  return avgHt(q.tariff_options);
}

function effectiveTtc(q: QuoteRow): number {
  if (q.final_amount_ttc_eur !== null && q.final_amount_ttc_eur !== undefined) {
    return Number(q.final_amount_ttc_eur);
  }
  return avgTtc(q.tariff_options);
}

function totalCost(q: QuoteRow): number {
  return (
    Number(q.chef_cost_eur || 0) +
    Number(q.chef_travel_cost_eur || 0) +
    (q.butler_required ? Number(q.butler_cost_eur || 0) : 0)
  );
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const range = url.searchParams.get('range') || '90d';
  const fromIso = fromIsoForRange(range);

  const supabase = getSupabase();
  let q = supabase
    .from('quotes')
    .select(
      'id, status, created_at, issued_at, sent_at, accepted_at, tariff_options, chef_cost_eur, chef_travel_cost_eur, butler_required, butler_cost_eur, destinataire_nom, lieu, final_amount_ht_eur, final_amount_ttc_eur, is_external',
    )
    .order('created_at', { ascending: false })
    .limit(HARD_LIMIT);
  // Pour les devis internes, on filtre sur created_at. Pour les devis
  // externes (qui peuvent être saisis longtemps après l'événement),
  // on récupère tout puis on filtre côté JS sur issued_at — cf. plus bas.
  if (fromIso) {
    // OR clause : created_at >= fromIso, OU is_external (on récupère
    // les externes même hors fenêtre, on les filtre ensuite par issued_at)
    q = q.or(`created_at.gte.${fromIso},is_external.eq.true`);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  let quotes = (data || []) as QuoteRow[];

  // Re-filtrage côté JS : pour les externes, on ne garde que ceux dont
  // issued_at >= fromIso (la date d'émission, pas d'import).
  if (fromIso) {
    const fromDay = fromIso.slice(0, 10);
    quotes = quotes.filter((qr) => {
      if (qr.is_external) {
        return (qr.issued_at || qr.created_at).slice(0, 10) >= fromDay;
      }
      return true; // les internes ont déjà été filtrés côté SQL
    });
  }

  const truncated = quotes.length >= HARD_LIMIT;
  if (truncated) {
    console.warn(`[quotes/stats] HARD_LIMIT atteint (${HARD_LIMIT}) — KPIs potentiellement sous-estimés`);
  }

  // ─── Compteurs par statut ───
  const byStatus = {
    draft: 0, sent: 0, accepted: 0, declined: 0, expired: 0, cancelled: 0,
  } as Record<string, number>;
  for (const q of quotes) byStatus[q.status] = (byStatus[q.status] || 0) + 1;

  // ─── Taux d'acceptation : accepted / (accepted + declined + expired) ───
  const decided = byStatus.accepted + byStatus.declined + byStatus.expired;
  const acceptanceRate = decided > 0 ? Math.round((byStatus.accepted / decided) * 1000) / 10 : null;

  // ─── CA potentiel (somme TTC des devis encore vivants : draft + sent) ───
  // Pour les devis vivants on prend la moyenne des tariff_options (montant
  // final pas encore fixé).
  const aliveQuotes = quotes.filter((q) => q.status === 'draft' || q.status === 'sent');
  const potentialRevenueTtc = aliveQuotes.reduce((sum, q) => sum + effectiveTtc(q), 0);

  // ─── CA gagné (devis accepted) — préfère le montant final négocié ─────
  // Si la négo a réduit/augmenté le montant à l'acceptation, c'est ce
  // chiffre qui compte. Sinon fallback sur la moyenne des tariff_options.
  const wonQuotes = quotes.filter((q) => q.status === 'accepted');
  const wonRevenueHt = wonQuotes.reduce((sum, q) => sum + effectiveHt(q), 0);
  const wonRevenueTtc = wonQuotes.reduce((sum, q) => sum + effectiveTtc(q), 0);

  // ─── Marge moyenne sur devis acceptés ───
  const marginRows = wonQuotes
    .map((q) => {
      const htVal = effectiveHt(q);
      const cost = totalCost(q);
      if (htVal <= 0) return null;
      const marginEur = htVal - cost;
      const marginPct = (marginEur / htVal) * 100;
      return { marginEur, marginPct };
    })
    .filter((x): x is { marginEur: number; marginPct: number } => x !== null);
  const avgMarginEur = marginRows.length > 0
    ? Math.round(marginRows.reduce((s, m) => s + m.marginEur, 0) / marginRows.length)
    : null;
  const avgMarginPct = marginRows.length > 0
    ? Math.round((marginRows.reduce((s, m) => s + m.marginPct, 0) / marginRows.length) * 10) / 10
    : null;

  // ─── Temps moyen de réponse client (sent_at → accepted_at) en jours ───
  const responseTimes = wonQuotes
    .filter((q) => q.sent_at && q.accepted_at)
    .map((q) => (new Date(q.accepted_at!).getTime() - new Date(q.sent_at!).getTime()) / 86400000);
  const avgResponseDays = responseTimes.length > 0
    ? Math.round((responseTimes.reduce((s, d) => s + d, 0) / responseTimes.length) * 10) / 10
    : null;

  // ─── Volume par mois (12 derniers mois) ───
  //   - "created" = mois d'émission effectif (issued_at pour les externes,
  //     created_at sinon), EXCLUT les cancelled
  //   - "accepted" + "revenueHt" = mois d'acceptation (accepted_at)
  const monthly: Record<string, { created: number; accepted: number; revenueHt: number }> = {};
  for (const q of quotes) {
    if (q.status === 'cancelled') continue; // pas de bruit dans le volume

    const createdKey = effectiveCreationKey(q);
    if (!monthly[createdKey]) monthly[createdKey] = { created: 0, accepted: 0, revenueHt: 0 };
    monthly[createdKey].created += 1;

    if (q.status === 'accepted') {
      const revKey = revenueMonthKey(q);
      if (!monthly[revKey]) monthly[revKey] = { created: 0, accepted: 0, revenueHt: 0 };
      monthly[revKey].accepted += 1;
      monthly[revKey].revenueHt += effectiveHt(q);
    }
  }

  // ─── Top destinataires par volume + revenue gagné (exclut cancelled) ───
  const byDest: Record<string, { count: number; won: number; revenueHt: number }> = {};
  for (const q of quotes) {
    if (q.status === 'cancelled') continue;
    const name = (q.destinataire_nom || '—').trim() || '—';
    if (!byDest[name]) byDest[name] = { count: 0, won: 0, revenueHt: 0 };
    byDest[name].count += 1;
    if (q.status === 'accepted') {
      byDest[name].won += 1;
      byDest[name].revenueHt += effectiveHt(q);
    }
  }
  const topDestinataires = Object.entries(byDest)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.revenueHt - a.revenueHt)
    .slice(0, 8);

  // Total effectif (exclut cancelled) pour affichage volume
  const totalActive = quotes.filter((q) => q.status !== 'cancelled').length;

  return NextResponse.json({
    ok: true,
    range,
    fromIso,
    total: quotes.length,        // y compris cancelled (pour compat existant)
    totalActive,                 // hors cancelled (pour affichage volume)
    truncated,                   // true si HARD_LIMIT atteint
    byStatus,
    acceptanceRate,              // %
    potentialRevenueTtc,         // € TTC
    wonRevenueHt,                // € HT
    wonRevenueTtc,               // € TTC
    avgMarginEur,                // € HT
    avgMarginPct,                // %
    avgResponseDays,             // jours
    monthly,                     // { '2026-06': {created, accepted, revenueHt(HT)} }
    topDestinataires,            // revenueHt en € HT
  });
}
