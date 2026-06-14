// app/api/admin/quotes/[id]/extract-from-pdf/route.ts
//
// POST /api/admin/quotes/:id/extract-from-pdf
//
// Reçoit un PDF de devis (multipart/form-data, champ `file`), le lit
// via Claude, retourne les champs structurés extraits ET stocke le PDF
// dans les documents du devis (kind='external') pour traçabilité.
//
// Le quote doit être en status 'draft'. Sur tout autre status on refuse :
// on n'écrase pas un devis envoyé/accepté avec une extraction PDF.
//
// L'endpoint NE PATCH PAS la DB — il retourne le JSON, c'est l'UI qui
// affiche un diff et applique via PATCH /api/admin/quotes/[id].

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Lecture PDF + appel Claude = peut durer 30-60s
export const maxDuration = 120;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { extractQuoteFromPdf } from '@/lib/ai/pdfQuoteExtractor';

const BUCKET = 'chef-uploads';
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — un PDF de devis dépasse rarement ça

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: quoteId } = await params;

  // ─── 1. Lire le multipart ──────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_FORM' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES },
      { status: 413 },
    );
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json(
      { ok: false, error: 'NOT_A_PDF', message: 'Seuls les PDF sont supportés pour l\'extraction.' },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  // ─── 2. Vérifier que le quote existe et est en draft ──────
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('id', quoteId)
    .maybeSingle();
  if (!quote) {
    return NextResponse.json({ ok: false, error: 'QUOTE_NOT_FOUND' }, { status: 404 });
  }
  if (quote.status !== 'draft') {
    return NextResponse.json(
      {
        ok: false,
        error: 'QUOTE_NOT_DRAFT',
        message: `Le devis est en status "${quote.status}". L'extraction PDF n'est autorisée que sur un devis en brouillon, pour éviter d'écraser un devis envoyé ou accepté.`,
      },
      { status: 409 },
    );
  }

  // ─── 3. Stocker le PDF (traçabilité) ────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = sanitizeFilename(file.name) || 'devis.pdf';
  const path = `quotes/${quoteId}/${Date.now()}-extract-${safeName}`;

  let storedFileUrl: string | null = null;
  let storedDocId: string | null = null;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    });
  if (upErr) {
    // Non bloquant : on continue même si le stockage échoue, l'admin
    // pourra ré-uploader manuellement après si besoin.
    console.warn('[extract-from-pdf] storage upload failed', upErr.message);
  } else {
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    storedFileUrl = pub?.publicUrl || null;
    const { data: doc } = await supabase
      .from('quote_documents')
      .insert({
        quote_id: quoteId,
        kind: 'external',
        file_name: file.name,
        file_path: path,
        file_url: storedFileUrl,
        file_size: file.size,
        mime_type: 'application/pdf',
        description: '[Lecture IA] PDF d\'origine importé pour extraction des chiffres',
        uploaded_by_admin_email: auth.user.email,
      })
      .select('id')
      .single();
    storedDocId = doc?.id ?? null;
  }

  // ─── 4. Appeler Claude ─────────────────────────────────────
  let extracted;
  try {
    extracted = await extractQuoteFromPdf({
      pdfBase64: buffer.toString('base64'),
    });
  } catch (e: any) {
    console.error('[extract-from-pdf] Claude extraction failed', e?.message);
    return NextResponse.json(
      {
        ok: false,
        error: 'EXTRACTION_FAILED',
        message: e?.message || 'Lecture du PDF impossible',
        storedDocId,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    extracted: extracted.data,
    stored: {
      documentId: storedDocId,
      fileUrl: storedFileUrl,
    },
    cost: {
      inputTokens: extracted.inputTokens,
      outputTokens: extracted.outputTokens,
      costEur: extracted.costEur,
    },
  });
}
