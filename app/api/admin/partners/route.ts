// app/api/admin/partners/route.ts
//
// GET  /api/admin/partners  → liste filtrée
//   ?type=concierge,villa_manager,...
//   ?status=active|dormant|archived
//   ?destination=saint-tropez
//   ?q=search (sur name, company, email)
//   ?limit=500
//
// POST /api/admin/partners  → create
//
// Chaque partner est renvoyé avec ses stats agrégées (missions_count,
// total_commission_ht_eur, last_contact_at). Les agrégations sont
// calculées via une vue inline en JS — pas de view SQL pour rester
// flexible aux changements de schéma.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const VALID_TYPES = ['concierge', 'villa_manager', 'yacht_manager', 'travel_planner', 'apporteur_indep', 'chef', 'client_direct', 'other'] as const;
const VALID_STATUS = ['active', 'dormant', 'archived'] as const;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

// ─── GET — liste ──────────────────────────────────────────────
export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const typeParam = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status');
  const destination = url.searchParams.get('destination')?.trim();
  const search = url.searchParams.get('q')?.trim();
  const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || '500')), 1000);

  const supabase = getSupabase();
  const dormantDays = await getDormantThresholdDays(supabase);
  const dormantSince = new Date(Date.now() - dormantDays * 86400000).toISOString();

  let q = supabase
    .from('partners')
    .select('*')
    .order('last_contact_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (typeParam) {
    const types = typeParam.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length > 0) q = q.in('type', types);
  }
  if (statusParam) {
    q = q.eq('status', statusParam);
  }
  if (destination) {
    q = q.contains('destinations', [destination]);
  }
  if (search) {
    const s = `%${search.replace(/[%_]/g, '\\$&')}%`;
    q = q.or(`name.ilike.${s},company.ilike.${s},email.ilike.${s},contact_first_name.ilike.${s},contact_last_name.ilike.${s}`);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const partners = (data || []) as any[];

  // Agréger les stats par partner depuis missions
  const partnerIds = partners.map((p) => p.id);
  let missionsByPartner: Record<string, { count: number; commissionHt: number; clientHt: number }> = {};
  if (partnerIds.length > 0) {
    const { data: missions } = await supabase
      .from('missions')
      .select('partner_id, commission_amount, client_amount, status')
      .in('partner_id', partnerIds);
    for (const m of (missions || []) as any[]) {
      const pid = m.partner_id;
      if (!pid) continue;
      // On exclut les missions annulées du CA / commission
      const isCancelled = ['cancelled', 'canceled', 'declined'].includes(String(m.status || '').toLowerCase());
      if (isCancelled) continue;
      if (!missionsByPartner[pid]) missionsByPartner[pid] = { count: 0, commissionHt: 0, clientHt: 0 };
      missionsByPartner[pid].count += 1;
      missionsByPartner[pid].commissionHt += Number(m.commission_amount || 0);
      missionsByPartner[pid].clientHt += Number(m.client_amount || 0);
    }
  }

  // Tag dormant computed (live) si last_contact_at < seuil
  const enriched = partners.map((p) => {
    const stats = missionsByPartner[p.id] || { count: 0, commissionHt: 0, clientHt: 0 };
    const computedDormant = p.last_contact_at
      ? new Date(p.last_contact_at).toISOString() < dormantSince
      : true; // jamais contacté = dormant si on l'a importé sans interaction
    return {
      ...p,
      missions_count: stats.count,
      total_commission_ht_eur: Math.round(stats.commissionHt * 100) / 100,
      total_client_ht_eur: Math.round(stats.clientHt * 100) / 100,
      computed_dormant: computedDormant && p.status !== 'archived',
    };
  });

  return NextResponse.json({ ok: true, partners: enriched, dormantThresholdDays: dormantDays });
}

// ─── POST — create ────────────────────────────────────────────
export async function POST(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const type = body.type;
  if (!name) return NextResponse.json({ ok: false, error: 'NAME_REQUIRED' }, { status: 400 });
  if (!(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ ok: false, error: 'INVALID_TYPE', allowed: VALID_TYPES }, { status: 400 });
  }
  const status = body.status && (VALID_STATUS as readonly string[]).includes(body.status) ? body.status : 'active';

  const insertRow: Record<string, any> = {
    name,
    type,
    status,
    destinations: Array.isArray(body.destinations) ? body.destinations.filter((d: any) => typeof d === 'string') : null,
    contact_first_name: body.contact_first_name || null,
    contact_last_name: body.contact_last_name || null,
    email: body.email || null,
    phone: body.phone || null,
    whatsapp: body.whatsapp || null,
    company: body.company || null,
    notes: body.notes || null,
    language: body.language || null,
    acquisition_source: body.acquisition_source || null,
    linked_chef_email: body.linked_chef_email || null,
    first_contact_at: body.first_contact_at ? new Date(body.first_contact_at).toISOString() : new Date().toISOString(),
    last_contact_at: body.last_contact_at ? new Date(body.last_contact_at).toISOString() : null,
    created_by_admin_email: auth.user.email,
  };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('partners')
    .insert(insertRow)
    .select('*')
    .single();
  if (error) {
    console.error('[partners/POST]', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, partner: data });
}
