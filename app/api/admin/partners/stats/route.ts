// app/api/admin/partners/stats/route.ts
//
// GET /api/admin/partners/stats?range=30d|90d|ytd|all|custom&from=&to=
//
// Renvoie le rapport fin de saison demandé par Thomas :
//   - topPartners : classement par commission HT générée
//   - bySource    : missions par canal d'acquisition
//   - byDestination : missions par destination (toutes sources)
//   - dormants    : partners actifs avant, silencieux depuis > seuil

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

function fromIsoForRange(range: string, customFrom?: string | null): string | null {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'custom' && customFrom) {
    const d = new Date(customFrom);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (range === 'ytd') return new Date(now.getUTCFullYear(), 0, 1).toISOString();
  const days = range === '30d' ? 30 : range === '90d' ? 90 : 365;
  return new Date(now.getTime() - days * 86400000).toISOString();
}

function toIsoForRange(range: string, customTo?: string | null): string | null {
  if (range === 'custom' && customTo) {
    const d = new Date(customTo);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

async function getDormantThresholdDays(supabase: ReturnType<typeof getSupabase>): Promise<number> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'crm.partner_dormant_days')
    .maybeSingle();
  const v = data?.value;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 90;
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const range = url.searchParams.get('range') || 'ytd';
  const customFrom = url.searchParams.get('from');
  const customTo = url.searchParams.get('to');
  const fromIso = fromIsoForRange(range, customFrom);
  const toIso = toIsoForRange(range, customTo);

  const supabase = getSupabase();

  // ─── Missions sur la période ─────────────────────────────────
  // On filtre par start_date (date de la prestation) plutôt que created_at
  // pour que le rapport "saison été 2026" reflète les missions JOUÉES,
  // pas signées (à confirmer avec Thomas si pivot voulu).
  let missionsQuery = supabase
    .from('missions')
    .select('id, partner_id, location, start_date, end_date, chef_amount, client_amount, commission_amount, status, source')
    .order('start_date', { ascending: false, nullsFirst: false })
    .limit(5000);
  if (fromIso) missionsQuery = missionsQuery.gte('start_date', fromIso.slice(0, 10));
  if (toIso) missionsQuery = missionsQuery.lte('start_date', toIso.slice(0, 10));

  const { data: missionsRaw, error: missErr } = await missionsQuery;
  if (missErr) return NextResponse.json({ ok: false, error: missErr.message }, { status: 500 });

  // Exclut annulées des KPIs financiers (mais on les expose dans byStatus)
  const missions = (missionsRaw || []) as any[];
  const isCancelled = (m: any) => ['cancelled', 'canceled', 'declined'].includes(String(m.status || '').toLowerCase());
  const activeMissions = missions.filter((m) => !isCancelled(m));

  // ─── Top partners par commission HT ─────────────────────────
  const byPartner: Record<string, { count: number; commissionHt: number; clientHt: number }> = {};
  for (const m of activeMissions) {
    if (!m.partner_id) continue;
    if (!byPartner[m.partner_id]) byPartner[m.partner_id] = { count: 0, commissionHt: 0, clientHt: 0 };
    byPartner[m.partner_id].count += 1;
    byPartner[m.partner_id].commissionHt += Number(m.commission_amount || 0);
    byPartner[m.partner_id].clientHt += Number(m.client_amount || 0);
  }
  const partnerIds = Object.keys(byPartner);
  const { data: partnerRows } = partnerIds.length > 0
    ? await supabase.from('partners').select('id, name, type, status').in('id', partnerIds)
    : { data: [] };
  const partnerById = new Map<string, any>();
  for (const p of (partnerRows || []) as any[]) partnerById.set(p.id, p);

  const topPartners = partnerIds
    .map((pid) => ({
      partner_id: pid,
      partner: partnerById.get(pid) || null,
      missions_count: byPartner[pid].count,
      total_commission_ht_eur: Math.round(byPartner[pid].commissionHt * 100) / 100,
      total_client_ht_eur: Math.round(byPartner[pid].clientHt * 100) / 100,
    }))
    .sort((a, b) => b.total_commission_ht_eur - a.total_commission_ht_eur);

  // ─── By source ──────────────────────────────────────────────
  const bySource: Record<string, { count: number; commissionHt: number; clientHt: number }> = {};
  for (const m of activeMissions) {
    const src = String(m.source || 'unknown');
    if (!bySource[src]) bySource[src] = { count: 0, commissionHt: 0, clientHt: 0 };
    bySource[src].count += 1;
    bySource[src].commissionHt += Number(m.commission_amount || 0);
    bySource[src].clientHt += Number(m.client_amount || 0);
  }
  const bySourceArr = Object.entries(bySource).map(([src, s]) => ({
    source: src,
    count: s.count,
    total_commission_ht_eur: Math.round(s.commissionHt * 100) / 100,
    total_client_ht_eur: Math.round(s.clientHt * 100) / 100,
  })).sort((a, b) => b.total_commission_ht_eur - a.total_commission_ht_eur);

  // ─── By destination ──────────────────────────────────────────
  const byDestination: Record<string, { count: number; commissionHt: number }> = {};
  for (const m of activeMissions) {
    const dest = (m.location || '—').trim() || '—';
    if (!byDestination[dest]) byDestination[dest] = { count: 0, commissionHt: 0 };
    byDestination[dest].count += 1;
    byDestination[dest].commissionHt += Number(m.commission_amount || 0);
  }
  const byDestinationArr = Object.entries(byDestination).map(([d, s]) => ({
    destination: d,
    count: s.count,
    total_commission_ht_eur: Math.round(s.commissionHt * 100) / 100,
  })).sort((a, b) => b.total_commission_ht_eur - a.total_commission_ht_eur);

  // ─── Dormants (calcul live sur tous partners, pas filtré par période) ──
  const dormantDays = await getDormantThresholdDays(supabase);
  const dormantThresholdIso = new Date(Date.now() - dormantDays * 86400000).toISOString();
  const { data: dormantRaw } = await supabase
    .from('partners')
    .select('id, name, type, last_contact_at, status')
    .neq('status', 'archived')
    .or(`last_contact_at.lt.${dormantThresholdIso},last_contact_at.is.null`);
  // Filtre out ceux qui n'ont JAMAIS rien apporté (less utile)
  const partnersWithMissions = new Set<string>();
  // On regarde sur TOUS les temps, pas que la période
  const { data: allActiveMissions } = await supabase
    .from('missions')
    .select('partner_id')
    .not('partner_id', 'is', null);
  for (const m of (allActiveMissions || []) as any[]) {
    if (m.partner_id) partnersWithMissions.add(m.partner_id);
  }
  const dormants = ((dormantRaw || []) as any[])
    .filter((p) => partnersWithMissions.has(p.id))
    .map((p) => ({
      ...p,
      days_since_last_contact: p.last_contact_at
        ? Math.floor((Date.now() - new Date(p.last_contact_at).getTime()) / 86400000)
        : null,
    }))
    .sort((a, b) => (b.days_since_last_contact || 999999) - (a.days_since_last_contact || 999999));

  // ─── Quotes sur la période (pour le pipeline) ──────────────
  // On lit les devis avec leur partner_id pour pouvoir agréger par
  // partner ET par status. Filtre par issued_at (date d'émission du
  // devis) pour rester cohérent avec missions.start_date.
  let quotesQuery = supabase
    .from('quotes')
    .select('id, partner_id, status, issued_at, final_amount_ht_eur, tariff_options, source')
    .order('issued_at', { ascending: false, nullsFirst: false })
    .limit(5000);
  if (fromIso) quotesQuery = quotesQuery.gte('issued_at', fromIso.slice(0, 10));
  if (toIso) quotesQuery = quotesQuery.lte('issued_at', toIso.slice(0, 10));
  const { data: quotesRaw } = await quotesQuery;
  const quotes = (quotesRaw || []) as any[];

  // Helper : montant HT d'un devis (montant final négocié si présent,
  // sinon premier tariff_option)
  const quoteHt = (q: any): number => {
    const final = Number(q.final_amount_ht_eur || 0);
    if (final > 0) return final;
    const first = Array.isArray(q.tariff_options) && q.tariff_options[0]
      ? Number(q.tariff_options[0].ht_eur || 0) : 0;
    return first;
  };

  // ─── Client requests sur la période (entrées du funnel) ────
  let requestsQuery = supabase
    .from('client_requests')
    .select('id, partner_id, status, acquisition_channel, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (fromIso) requestsQuery = requestsQuery.gte('created_at', fromIso);
  if (toIso) requestsQuery = requestsQuery.lte('created_at', toIso);
  const { data: requestsRaw } = await requestsQuery;
  const requests = (requestsRaw || []) as any[];

  // ─── Enrichissement topPartners : pipeline devis + demandes ──
  for (const tp of topPartners) {
    const pid = tp.partner_id;
    const pq = quotes.filter((q) => q.partner_id === pid);
    const pr = requests.filter((r) => r.partner_id === pid);
    (tp as any).requests_count = pr.length;
    (tp as any).quotes_sent = pq.filter((q) => q.status === 'sent').length;
    (tp as any).quotes_accepted = pq.filter((q) => q.status === 'accepted').length;
    (tp as any).quotes_declined = pq.filter((q) => q.status === 'declined').length;
    (tp as any).quotes_pipeline_ht_eur = Math.round(
      pq.filter((q) => q.status === 'sent').reduce((s, q) => s + quoteHt(q), 0) * 100,
    ) / 100;
  }

  // Inclut aussi les partners qui ont des devis mais pas encore de mission
  for (const q of quotes) {
    if (!q.partner_id) continue;
    if (topPartners.find((tp) => tp.partner_id === q.partner_id)) continue;
    const p = partnerById.get(q.partner_id);
    if (!p) {
      const { data: extraPartner } = await supabase
        .from('partners').select('id, name, type, status').eq('id', q.partner_id).maybeSingle();
      if (extraPartner) partnerById.set(q.partner_id, extraPartner);
    }
  }
  const partnersInQuotesOnly = new Set<string>();
  for (const q of quotes) {
    if (q.partner_id && !byPartner[q.partner_id]) partnersInQuotesOnly.add(q.partner_id);
  }
  for (const pid of partnersInQuotesOnly) {
    const pq = quotes.filter((q) => q.partner_id === pid);
    const pr = requests.filter((r) => r.partner_id === pid);
    topPartners.push({
      partner_id: pid,
      partner: partnerById.get(pid) || null,
      missions_count: 0,
      total_commission_ht_eur: 0,
      total_client_ht_eur: 0,
      requests_count: pr.length,
      quotes_sent: pq.filter((q) => q.status === 'sent').length,
      quotes_accepted: pq.filter((q) => q.status === 'accepted').length,
      quotes_declined: pq.filter((q) => q.status === 'declined').length,
      quotes_pipeline_ht_eur: Math.round(
        pq.filter((q) => q.status === 'sent').reduce((s, q) => s + quoteHt(q), 0) * 100,
      ) / 100,
    } as any);
  }
  topPartners.sort((a: any, b: any) =>
    (b.total_commission_ht_eur + (b.quotes_pipeline_ht_eur || 0))
    - (a.total_commission_ht_eur + (a.quotes_pipeline_ht_eur || 0)));

  // ─── Quotes by status (global) ─────────────────────────────
  const quotesByStatus: Record<string, { count: number; ht_eur: number }> = {};
  for (const q of quotes) {
    const s = String(q.status || 'draft');
    if (!quotesByStatus[s]) quotesByStatus[s] = { count: 0, ht_eur: 0 };
    quotesByStatus[s].count += 1;
    quotesByStatus[s].ht_eur += quoteHt(q);
  }
  const quotesByStatusArr = Object.entries(quotesByStatus).map(([s, v]) => ({
    status: s,
    count: v.count,
    total_ht_eur: Math.round(v.ht_eur * 100) / 100,
  }));

  // ─── Funnel global ──────────────────────────────────────────
  const funnel = {
    requests: requests.length,
    quotes_sent: quotes.filter((q) => ['sent', 'accepted', 'declined', 'expired'].includes(q.status)).length,
    quotes_accepted: quotes.filter((q) => q.status === 'accepted').length,
    missions_confirmed: activeMissions.filter((m) => ['confirmed', 'in_progress', 'completed'].includes(m.status)).length,
  };

  // ─── Totaux globaux ──────────────────────────────────────────
  const totalMissions = activeMissions.length;
  const totalCommissionHt = activeMissions.reduce((s, m) => s + Number(m.commission_amount || 0), 0);
  const totalClientHt = activeMissions.reduce((s, m) => s + Number(m.client_amount || 0), 0);
  const totalPipelineHt = quotes
    .filter((q) => q.status === 'sent')
    .reduce((s, q) => s + quoteHt(q), 0);

  return NextResponse.json({
    ok: true,
    range,
    fromIso,
    toIso,
    dormantThresholdDays: dormantDays,
    totals: {
      requests: requests.length,
      quotes: quotes.length,
      quotes_sent: quotes.filter((q) => q.status === 'sent').length,
      quotes_accepted: quotes.filter((q) => q.status === 'accepted').length,
      quotes_declined: quotes.filter((q) => q.status === 'declined').length,
      pipeline_ht_eur: Math.round(totalPipelineHt * 100) / 100,
      missions: totalMissions,
      cancelled: missions.length - activeMissions.length,
      commission_ht_eur: Math.round(totalCommissionHt * 100) / 100,
      client_ht_eur: Math.round(totalClientHt * 100) / 100,
    },
    funnel,
    quotesByStatus: quotesByStatusArr,
    topPartners,
    bySource: bySourceArr,
    byDestination: byDestinationArr,
    dormants,
  });
}
