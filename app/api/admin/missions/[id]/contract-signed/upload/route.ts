// app/api/admin/missions/[id]/contract-signed/upload/route.ts
//
// POST multipart : upload du PDF du contrat signé hors plateforme.
// Stocké dans bucket 'chef-uploads' sous missions/<id>/contract-signed.<ext>
// (upsert true → on remplace l'ancien si re-upload).
//
// Met à jour :
//   contract_signed_at        = signedAt ou now
//   contract_signed_method    = 'external_pdf'
//   contract_signed_file_path
//   contract_signed_file_url
//   contract_signed_notes     (optionnel)

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
  const signedAt = form.get('signedAt') ? String(form.get('signedAt')) : null;
  const notes = form.get('notes') ? String(form.get('notes')).trim() : null;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES }, { status: 413 });
  }

  let signedIso = new Date().toISOString();
  if (signedAt) {
    const d = new Date(signedAt);
    if (!Number.isNaN(d.getTime())) signedIso = d.toISOString();
  }

  const supabase = getSupabase();
  const path = `missions/${id}/contract-signed.${extFromName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'application/pdf',
      upsert: true,
    });
  if (upErr) {
    console.error('[contract-signed/upload]', upErr.message);
    return NextResponse.json({ ok: false, error: `UPLOAD_FAILED: ${upErr.message}` }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: mission, error: dbErr } = await supabase
    .from('missions')
    .update({
      contract_signed_at: signedIso,
      contract_signed_method: 'external_pdf',
      contract_signed_url: null,
      contract_signed_file_path: path,
      contract_signed_file_url: pub?.publicUrl || null,
      contract_signed_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (dbErr) {
    // Rollback storage si l'update DB échoue
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    return NextResponse.json({ ok: false, error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mission });
}
