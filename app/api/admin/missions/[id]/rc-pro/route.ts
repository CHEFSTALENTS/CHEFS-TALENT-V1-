// app/api/admin/missions/[id]/rc-pro/route.ts
//
// POST   multipart : upload du PDF de l'attestation RC Pro chef
// PATCH  body { url } : enregistre uniquement une URL externe
//                       (Drive, Dropbox) sans upload
// DELETE : retire le RC Pro (storage + DB)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const BUCKET = 'chef-uploads';
const MAX_BYTES = 20 * 1024 * 1024;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function extFromName(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : 'pdf';
}

// ── Upload PDF ─────────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_FORM' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES }, { status: 413 });
  }

  const supabase = getSupabase();
  const path = `missions/${id}/rc-pro.${extFromName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'application/pdf',
      upsert: true,
    });
  if (upErr) {
    console.error('[rc-pro/upload]', upErr.message);
    return NextResponse.json({ ok: false, error: `UPLOAD_FAILED: ${upErr.message}` }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: mission, error: dbErr } = await supabase
    .from('missions')
    .update({
      brief_chef_rc_pro_file_path: path,
      brief_chef_rc_pro_url: pub?.publicUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    return NextResponse.json({ ok: false, error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mission });
}

// ── URL externe uniquement ─────────────────────────────────────
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
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!/^https?:\/\/.+/i.test(url)) {
    return NextResponse.json({ ok: false, error: 'INVALID_URL' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('missions')
    .update({
      brief_chef_rc_pro_url: url,
      brief_chef_rc_pro_file_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mission: data });
}

// ── Suppression ────────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();

  const { data: prev } = await supabase
    .from('missions')
    .select('brief_chef_rc_pro_file_path')
    .eq('id', id)
    .maybeSingle();
  const filePath = (prev as any)?.brief_chef_rc_pro_file_path as string | null;

  const { data, error } = await supabase
    .from('missions')
    .update({
      brief_chef_rc_pro_url: null,
      brief_chef_rc_pro_file_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  if (filePath) {
    await supabase.storage.from(BUCKET).remove([filePath]).catch((e) => {
      console.warn('[rc-pro/delete] storage remove failed', e);
    });
  }

  return NextResponse.json({ ok: true, mission: data });
}
