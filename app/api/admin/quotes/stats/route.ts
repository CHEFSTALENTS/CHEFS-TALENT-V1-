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
      'id, status, created_at, sent_at, accepted_at, tariff_options, chef_cost_eur, chef_travel_cost_eur, butler_required, butler_cost_eur, destinataire_nom, lieu, final_amount_ht_eur, final_amount_ttc_eur, is_external',
    )
    .order('created_at', { ascending: false })
    .limit(500);
  if (fromIso) q = q.gte('created_at', fromIso);

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const quotes = (data || []) as QuoteRow[];

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
  const monthly: Record<string, { created: number; accepted: number; revenueHt: number }> = {};
  for (const q of quotes) {
    const m = q.created_at.slice(0, 7); // YYYY-MM
    if (!monthly[m]) monthly[m] = { created: 0, accepted: 0, revenueHt: 0 };
    monthly[m].created += 1;
    if (q.status === 'accepted') {
      monthly[m].accepted += 1;
      monthly[m].revenueHt += effectiveHt(q);
    }
  }

  // ─── Top destinataires par volume + revenue gagné ───
  const byDest: Record<string, { count: number; won: number; revenueHt: number }> = {};
  for (const q of quotes) {
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

  return NextResponse.json({
    ok: true,
    range,
    fromIso,
    total: quotes.length,
    byStatus,
    acceptanceRate,             // %
    potentialRevenueTtc,        // €
    wonRevenueHt,               // €
    wonRevenueTtc,              // €
    avgMarginEur,               // €
    avgMarginPct,               // %
    avgResponseDays,            // jours
    monthly,                    // { '2026-06': {created, accepted, revenueHt} }
    topDestinataires,
  });
}
