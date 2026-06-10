// app/api/admin/missions/[id]/contract-signed/route.ts
//
// Endpoint pour les contrats signés HORS YouSign (Drive, Dropbox, PDF reçu
// par email, etc.). Distinct du suivi YouSign qui passe par
// signature_requests.
//
// PATCH  — marque la mission comme « contrat signé » avec
//          method/url/file_path/notes optionnels
// DELETE — annule le marquage manuel
//
// L'upload du PDF est géré côté UI : multipart vers
// /api/admin/missions/[id]/contract-signed/upload (séparé pour rester
// content-type cohérent ici).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const ALLOWED_METHODS = new Set(['manual', 'external_link', 'external_pdf']);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

  const {
    signedAt,                 // ISO string ou null (par défaut now)
    method,                   // 'manual' | 'external_link' | 'external_pdf'
    url,                      // URL externe si method = external_link
    notes,                    // note libre
  } = body || {};

  const m = method ? String(method) : 'manual';
  if (!ALLOWED_METHODS.has(m)) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_METHOD', allowed: Array.from(ALLOWED_METHODS) },
      { status: 400 },
    );
  }

  let signedIso = new Date().toISOString();
  if (signedAt && typeof signedAt === 'string') {
    const d = new Date(signedAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ ok: false, error: 'INVALID_SIGNED_AT' }, { status: 400 });
    }
    signedIso = d.toISOString();
  }

  if (m === 'external_link' && (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url))) {
    return NextResponse.json(
      { ok: false, error: 'EXTERNAL_LINK_REQUIRED_HTTP_URL' },
      { status: 400 },
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('missions')
    .update({
      contract_signed_at: signedIso,
      contract_signed_method: m,
      contract_signed_url: m === 'external_link' ? url : null,
      contract_signed_notes: notes ? String(notes).trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[missions/contract-signed PATCH]', error.message);
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

  // Récupère le file_path pour nettoyer le storage avant
  const { data: prev } = await supabase
    .from('missions')
    .select('contract_signed_file_path')
    .eq('id', id)
    .maybeSingle();

  const filePath = (prev as any)?.contract_signed_file_path as string | null;

  const { data, error } = await supabase
    .from('missions')
    .update({
      contract_signed_at: null,
      contract_signed_method: null,
      contract_signed_url: null,
      contract_signed_file_path: null,
      contract_signed_file_url: null,
      contract_signed_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[missions/contract-signed DELETE]', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (filePath) {
    // Best-effort : on supprime le fichier du bucket
    const { error: stErr } = await supabase.storage.from('chef-uploads').remove([filePath]);
    if (stErr) console.warn('[missions/contract-signed DELETE] storage remove failed', stErr.message);
  }

  return NextResponse.json({ ok: true, mission: data });
}
