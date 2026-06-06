// app/api/admin/quote-memories/[id]/route.ts
//
// DELETE /api/admin/quote-memories/:id  → supprime une mémoire (obsolete, mauvaise)
// PATCH  /api/admin/quote-memories/:id   → édite (value, rationale, confidence)

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();
  const { error } = await supabase.from('quote_agent_memories').delete().eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

const EDITABLE = ['value', 'rationale', 'confidence'] as const;

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
  for (const k of EDITABLE) {
    if (Object.prototype.hasOwnProperty.call(body, k)) updates[k] = body[k];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_CHANGES' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('quote_agent_memories')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, memory: data });
}
