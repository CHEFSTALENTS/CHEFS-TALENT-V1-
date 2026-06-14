// app/api/admin/partners/[id]/route.ts
//
// GET    /api/admin/partners/:id  → fiche complète
//   → { partner, missions, quotes, interactions, stats }
// PATCH  /api/admin/partners/:id  → édition
// DELETE /api/admin/partners/:id  → suppression (cascade interactions,
//                                    nullifie partner_id sur missions/quotes)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const VALID_TYPES = ['concierge', 'villa_manager', 'yacht_manager', 'travel_planner', 'apporteur_indep', 'chef', 'client_direct', 'other'] as const;
const VALID_STATUS = ['active', 'dormant', 'archived'] as const;

const EDITABLE_FIELDS = [
  'name', 'type', 'status', 'destinations', 'contact_first_name',
  'contact_last_name', 'email', 'phone', 'whatsapp', 'company', 'notes',
  'language', 'acquisition_source', 'linked_chef_email', 'last_contact_at',
] as const;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();

  const [partnerRes, missionsRes, quotesRes, interactionsRes, requestsRes] = await Promise.all([
    supabase.from('partners').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('missions')
      .select('id, location, start_date, end_date, chef_name, chef_amount, client_amount, commission_amount, status, payment_status, source, created_at')
      .eq('partner_id', id)
      .order('start_date', { ascending: false, nullsFirst: false }),
    supabase
      .from('quotes')
      .select('id, reference, destinataire_nom, lieu, dates_text, status, final_amount_ht_eur, tariff_options, source, issued_at, created_at')
      .eq('partner_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('partner_interactions')
      .select('*')
      .eq('partner_id', id)
      .order('occurred_at', { ascending: false }),
    supabase
      .from('client_requests')
      .select('id, email, full_name, company_name, client_type, status, acquisition_channel, location, start_date, created_at')
      .eq('partner_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (partnerRes.error) return NextResponse.json({ ok: false, error: partnerRes.error.message }, { status: 500 });
  if (!partnerRes.data) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

  const missions = (missionsRes.data || []) as any[];
  const quotes = (quotesRes.data || []) as any[];
  const interactions = (interactionsRes.data || []) as any[];
  const requests = (requestsRes.data || []) as any[];

  // Agrégats (exclut missions annulées)
  const activeMissions = missions.filter((m) => !['cancelled', 'canceled', 'declined'].includes(String(m.status || '').toLowerCase()));
  const missionsCount = activeMissions.length;
  const totalCommissionHt = activeMissions.reduce((s, m) => s + Number(m.commission_amount || 0), 0);
  const totalClientHt = activeMissions.reduce((s, m) => s + Number(m.client_amount || 0), 0);
  const totalChefHt = activeMissions.reduce((s, m) => s + Number(m.chef_amount || 0), 0);

  // Helper : montant HT d'un devis (final ou première option)
  const quoteHt = (q: any): number => {
    const final = Number(q.final_amount_ht_eur || 0);
    if (final > 0) return final;
    const first = Array.isArray(q.tariff_options) && q.tariff_options[0]
      ? Number(q.tariff_options[0].ht_eur || 0) : 0;
    return first;
  };

  // ─── Agrégats devis ──────────────────────────────────────
  const quotesSent = quotes.filter((q) => q.status === 'sent');
  const quotesAccepted = quotes.filter((q) => q.status === 'accepted');
  const quotesDeclined = quotes.filter((q) => q.status === 'declined');
  const quotesExpired = quotes.filter((q) => q.status === 'expired');
  const pipelineHt = quotesSent.reduce((s, q) => s + quoteHt(q), 0);
  const acceptedHt = quotesAccepted.reduce((s, q) => s + quoteHt(q), 0);

  // ─── Agrégats demandes ───────────────────────────────────
  const requestsByStatus: Record<string, number> = {};
  for (const r of requests) {
    const s = String(r.status || '—').toLowerCase();
    requestsByStatus[s] = (requestsByStatus[s] || 0) + 1;
  }

  // ─── Funnel global du partner ────────────────────────────
  const funnel = {
    requests: requests.length,
    quotes_sent_or_more: quotes.filter((q) => ['sent', 'accepted', 'declined', 'expired'].includes(q.status)).length,
    quotes_accepted: quotesAccepted.length,
    missions_confirmed: activeMissions.filter((m) => ['confirmed', 'in_progress', 'completed'].includes(m.status)).length,
  };
  const conversion = {
    request_to_quote: funnel.requests > 0 ? Math.round((funnel.quotes_sent_or_more / funnel.requests) * 100) : 0,
    quote_to_accept: funnel.quotes_sent_or_more > 0 ? Math.round((funnel.quotes_accepted / funnel.quotes_sent_or_more) * 100) : 0,
    accept_to_mission: funnel.quotes_accepted > 0 ? Math.round((funnel.missions_confirmed / funnel.quotes_accepted) * 100) : 0,
  };

  // Répartition par destination (sur les missions actives)
  const byDestination: Record<string, { count: number; commissionHt: number }> = {};
  for (const m of activeMissions) {
    const dest = (m.location || '—').trim() || '—';
    if (!byDestination[dest]) byDestination[dest] = { count: 0, commissionHt: 0 };
    byDestination[dest].count += 1;
    byDestination[dest].commissionHt += Number(m.commission_amount || 0);
  }

  // Répartition par statut
  const byStatus: Record<string, number> = {};
  for (const m of missions) {
    const s = String(m.status || '—').toLowerCase();
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    partner: partnerRes.data,
    missions,
    quotes,
    interactions,
    requests,
    stats: {
      requestsCount: requests.length,
      requestsByStatus,
      quotesCount: quotes.length,
      quotesSent: quotesSent.length,
      quotesAccepted: quotesAccepted.length,
      quotesDeclined: quotesDeclined.length,
      quotesExpired: quotesExpired.length,
      pipelineHtEur: Math.round(pipelineHt * 100) / 100,
      acceptedHtEur: Math.round(acceptedHt * 100) / 100,
      missionsCount,
      totalCommissionHtEur: Math.round(totalCommissionHt * 100) / 100,
      totalClientHtEur: Math.round(totalClientHt * 100) / 100,
      totalChefHtEur: Math.round(totalChefHt * 100) / 100,
      byDestination,
      byStatus,
      interactionsCount: interactions.length,
      funnel,
      conversion,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  for (const k of EDITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, k)) continue;
    updates[k] = body[k];
  }

  // Validation type / status si présents
  if (updates.type !== undefined && !(VALID_TYPES as readonly string[]).includes(updates.type)) {
    return NextResponse.json({ ok: false, error: 'INVALID_TYPE' }, { status: 400 });
  }
  if (updates.status !== undefined && !(VALID_STATUS as readonly string[]).includes(updates.status)) {
    return NextResponse.json({ ok: false, error: 'INVALID_STATUS' }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_CHANGES' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('partners')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, partner: data });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
