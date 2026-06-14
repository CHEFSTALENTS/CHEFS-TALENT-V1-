// app/api/admin/partners/[id]/interactions/[intId]/route.ts
//
// DELETE /api/admin/partners/:id/interactions/:intId
// PATCH  /api/admin/partners/:id/interactions/:intId — édition (occurred_at, kind, summary)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const EDITABLE = ['occurred_at', 'kind', 'summary', 'related_mission_id', 'related_quote_id'] as const;
const VALID_KINDS = ['call', 'whatsapp', 'email', 'meeting_irl', 'gift', 'social', 'lead_received', 'note'] as const;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; intId: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id, intId } = await params;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('partner_interactions')
    .delete()
    .eq('id', intId)
    .eq('partner_id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; intId: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id, intId } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  for (const k of EDITABLE) {
    if (!Object.prototype.hasOwnProperty.call(body, k)) continue;
    updates[k] = body[k];
  }

  if (updates.kind !== undefined && !(VALID_KINDS as readonly string[]).includes(updates.kind)) {
    return NextResponse.json({ ok: false, error: 'INVALID_KIND' }, { status: 400 });
  }
  if (updates.occurred_at !== undefined) {
    const d = new Date(updates.occurred_at);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ ok: false, error: 'INVALID_OCCURRED_AT' }, { status: 400 });
    updates.occurred_at = d.toISOString();
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_CHANGES' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('partner_interactions')
    .update(updates)
    .eq('id', intId)
    .eq('partner_id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, interaction: data });
}
