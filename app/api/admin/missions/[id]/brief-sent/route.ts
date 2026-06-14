// app/api/admin/missions/[id]/brief-sent/route.ts
//
// POST /api/admin/missions/[id]/brief-sent
//   body { channel: 'email' | 'whatsapp', content: string, edited?: boolean }
//   → marque le brief comme envoyé au chef (timestamp + canal + contenu)
//   → trace si Thomas a édité (signal qualité pour l'agent IA)
//
// DELETE /api/admin/missions/[id]/brief-sent
//   → annule le marquage (cas erreur de saisie)
//
// NON BLOQUANT : la mission peut être confirmée/démarrée sans brief
// envoyé. C'est juste un outil de rappel.

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

export async function POST(
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

  const channel = body.channel === 'whatsapp' ? 'whatsapp' : body.channel === 'email' ? 'email' : null;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const edited = !!body.edited;

  if (!channel) {
    return NextResponse.json({ ok: false, error: 'CHANNEL_REQUIRED (email | whatsapp)' }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ ok: false, error: 'CONTENT_REQUIRED' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('missions')
    .update({
      brief_chef_sent_at: new Date().toISOString(),
      brief_chef_channel: channel,
      brief_chef_content: content,
      brief_chef_edited: edited,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[brief-sent] update error', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mission: data });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('missions')
    .update({
      brief_chef_sent_at: null,
      brief_chef_channel: null,
      brief_chef_content: null,
      brief_chef_edited: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mission: data });
}
