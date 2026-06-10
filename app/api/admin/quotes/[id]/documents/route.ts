// app/api/admin/quotes/[id]/documents/route.ts
//
// GET  /api/admin/quotes/:id/documents    → liste les docs du devis
// POST /api/admin/quotes/:id/documents    → upload (multipart)
//
// Body POST (multipart/form-data) :
//   file        : Blob (PDF, image, docx, etc.)
//   kind        : 'signed' | 'external' | 'exchange' | 'brief' | 'contract' | 'other'
//   description : optionnel
//
// Stockage : bucket Supabase 'chef-uploads' sous le préfixe 'quotes/<quoteId>/'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const BUCKET = 'chef-uploads';
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

const VALID_KINDS = ['signed', 'external', 'exchange', 'brief', 'contract', 'other'] as const;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[^\w.\-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

// ────────────────────────────────────────────────────────────
// GET — liste
// ────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('quote_documents')
    .select('*')
    .eq('quote_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, documents: data || [] });
}

// ────────────────────────────────────────────────────────────
// POST — upload
// ────────────────────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: quoteId } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_FORM' }, { status: 400 });
  }

  const file = form.get('file');
  const kindRaw = String(form.get('kind') || 'other');
  const description = (form.get('description') ? String(form.get('description')) : null)?.trim() || null;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES }, { status: 413 });
  }

  const kind = (VALID_KINDS as readonly string[]).includes(kindRaw) ? kindRaw : 'other';

  const supabase = getSupabase();

  // Vérifier que le devis existe
  const { data: q } = await supabase
    .from('quotes')
    .select('id')
    .eq('id', quoteId)
    .maybeSingle();
  if (!q) return NextResponse.json({ ok: false, error: 'QUOTE_NOT_FOUND' }, { status: 404 });

  // Path : quotes/<quoteId>/<timestamp>-<sanitized-name>
  const safeName = sanitizeFilename(file.name) || 'document';
  const path = `quotes/${quoteId}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (upErr) {
    console.error('[quotes/documents] upload error', upErr.message);
    return NextResponse.json({ ok: false, error: `UPLOAD_FAILED: ${upErr.message}` }, { status: 500 });
  }

  // URL publique du bucket (le bucket chef-uploads est déjà public,
  // sinon on génèrerait une signed URL ici)
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data: doc, error: insErr } = await supabase
    .from('quote_documents')
    .insert({
      quote_id: quoteId,
      kind,
      file_name: file.name,
      file_path: path,
      file_url: pub?.publicUrl || null,
      file_size: file.size,
      mime_type: file.type || null,
      description,
      uploaded_by_admin_email: auth.user.email,
    })
    .select('*')
    .single();

  if (insErr) {
    // Rollback storage si l'insert échoue
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    console.error('[quotes/documents] insert error', insErr.message);
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document: doc });
}
