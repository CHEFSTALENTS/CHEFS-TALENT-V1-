// app/api/admin/partners/export/route.ts
//
// GET /api/admin/partners/export?view=partners|missions|interactions&range=ytd
//
// Renvoie un CSV téléchargeable de la vue demandée. Pas de lib externe :
// génération string + Content-Type text/csv.

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

function csvEscape(v: any): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (Array.isArray(v)) s = v.join('|');
  if (typeof v === 'object') s = JSON.stringify(v);
  if (/[",\n]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function rowsToCsv(headers: string[], rows: Array<Record<string, any>>): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(','));
  }
  return lines.join('\n');
}

function fromIsoForRange(range: string): string | null {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'ytd') return new Date(now.getUTCFullYear(), 0, 1).toISOString();
  const days = range === '30d' ? 30 : range === '90d' ? 90 : 365;
  return new Date(now.getTime() - days * 86400000).toISOString();
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const view = url.searchParams.get('view') || 'partners';
  const range = url.searchParams.get('range') || 'all';
  const fromIso = fromIsoForRange(range);

  const supabase = getSupabase();
  let csv = '';
  let filename = `partners-export-${new Date().toISOString().slice(0, 10)}.csv`;

  if (view === 'partners') {
    // Liste des partners avec stats agrégées
    const { data: partners } = await supabase
      .from('partners')
      .select('*')
      .order('name');
    const { data: missions } = await supabase
      .from('missions')
      .select('partner_id, commission_amount, client_amount, status');

    const stats: Record<string, { count: number; commissionHt: number; clientHt: number }> = {};
    for (const m of (missions || []) as any[]) {
      if (!m.partner_id) continue;
      if (['cancelled', 'canceled', 'declined'].includes(String(m.status || '').toLowerCase())) continue;
      if (!stats[m.partner_id]) stats[m.partner_id] = { count: 0, commissionHt: 0, clientHt: 0 };
      stats[m.partner_id].count += 1;
      stats[m.partner_id].commissionHt += Number(m.commission_amount || 0);
      stats[m.partner_id].clientHt += Number(m.client_amount || 0);
    }

    const enriched = ((partners || []) as any[]).map((p) => ({
      ...p,
      missions_count: stats[p.id]?.count || 0,
      total_commission_ht_eur: stats[p.id]?.commissionHt || 0,
      total_client_ht_eur: stats[p.id]?.clientHt || 0,
    }));

    const headers = [
      'name', 'type', 'status', 'destinations', 'contact_first_name', 'contact_last_name',
      'email', 'phone', 'whatsapp', 'company', 'language', 'notes',
      'first_contact_at', 'last_contact_at',
      'missions_count', 'total_commission_ht_eur', 'total_client_ht_eur',
      'acquisition_source', 'linked_chef_email', 'created_at',
    ];
    csv = rowsToCsv(headers, enriched);
    filename = `partners-export-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (view === 'missions') {
    // Missions avec partner joinné par nom
    let q = supabase
      .from('missions')
      .select('id, partner_id, chef_name, location, start_date, end_date, guest_count, chef_amount, client_amount, commission_amount, status, payment_status, source, created_at')
      .order('start_date', { ascending: false, nullsFirst: false })
      .limit(5000);
    if (fromIso) q = q.gte('start_date', fromIso.slice(0, 10));
    const { data: missions } = await q;

    const partnerIds = Array.from(new Set(((missions || []) as any[]).map((m) => m.partner_id).filter(Boolean)));
    const partnerById = new Map<string, any>();
    if (partnerIds.length > 0) {
      const { data: partnerRows } = await supabase.from('partners').select('id, name').in('id', partnerIds);
      for (const p of (partnerRows || []) as any[]) partnerById.set(p.id, p);
    }

    const enriched = ((missions || []) as any[]).map((m) => ({
      ...m,
      partner_name: m.partner_id ? (partnerById.get(m.partner_id)?.name || '—') : '',
    }));

    const headers = [
      'start_date', 'end_date', 'location', 'chef_name',
      'partner_name', 'source',
      'guest_count', 'chef_amount', 'client_amount', 'commission_amount',
      'status', 'payment_status', 'created_at', 'id',
    ];
    csv = rowsToCsv(headers, enriched);
    filename = `missions-export-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (view === 'interactions') {
    const { data: interactions } = await supabase
      .from('partner_interactions')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(5000);

    const partnerIds = Array.from(new Set(((interactions || []) as any[]).map((i) => i.partner_id).filter(Boolean)));
    const partnerById = new Map<string, any>();
    if (partnerIds.length > 0) {
      const { data: partnerRows } = await supabase.from('partners').select('id, name').in('id', partnerIds);
      for (const p of (partnerRows || []) as any[]) partnerById.set(p.id, p);
    }

    const enriched = ((interactions || []) as any[]).map((i) => ({
      ...i,
      partner_name: partnerById.get(i.partner_id)?.name || '—',
    }));

    const headers = ['occurred_at', 'partner_name', 'kind', 'summary', 'related_mission_id', 'related_quote_id', 'created_at'];
    csv = rowsToCsv(headers, enriched);
    filename = `partner-interactions-export-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    return NextResponse.json({ ok: false, error: 'INVALID_VIEW' }, { status: 400 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
