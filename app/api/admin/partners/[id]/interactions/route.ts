// app/api/admin/partners/[id]/interactions/route.ts
//
// GET  /api/admin/partners/:id/interactions
// POST /api/admin/partners/:id/interactions
//
// Permet la saisie rétroactive (occurred_at peut être dans le passé) pour
// reconstituer l'historique d'une relation.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const VALID_KINDS = ['call', 'whatsapp', 'email', 'meeting_irl', 'gift', 'social', 'lead_received', 'note'] as const;

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
  const { data, error } = await supabase
    .from('partner_interactions')
    .select('*')
    .eq('partner_id', id)
    .order('occurred_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, interactions: data || [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: partnerId } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const kind = body.kind;
  const summary = (body.summary || '').trim();
  const occurredAt = body.occurred_at ? new Date(body.occurred_at) : new Date();

  if (!(VALID_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ ok: false, error: 'INVALID_KIND', allowed: VALID_KINDS }, { status: 400 });
  }
  if (!summary) {
    return NextResponse.json({ ok: false, error: 'SUMMARY_REQUIRED' }, { status: 400 });
  }
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ ok: false, error: 'INVALID_OCCURRED_AT' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('partner_interactions')
    .insert({
      partner_id: partnerId,
      occurred_at: occurredAt.toISOString(),
      kind,
      summary,
      related_mission_id: body.related_mission_id || null,
      related_quote_id: body.related_quote_id || null,
      created_by_admin_email: auth.user.email,
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, interaction: data });
}
