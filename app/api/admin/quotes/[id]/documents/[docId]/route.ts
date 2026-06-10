// app/api/admin/quotes/[id]/documents/[docId]/route.ts
//
// DELETE /api/admin/quotes/:id/documents/:docId
// Supprime un document (storage + row).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const BUCKET = 'chef-uploads';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: quoteId, docId } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: doc } = await supabase
    .from('quote_documents')
    .select('id, file_path, quote_id')
    .eq('id', docId)
    .maybeSingle();

  if (!doc || doc.quote_id !== quoteId) {
    return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  // Supprime le row d'abord (on s'en fout si le storage rate, on log)
  const { error: delErr } = await supabase
    .from('quote_documents')
    .delete()
    .eq('id', docId);
  if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });

  // Best-effort sur le storage
  if (doc.file_path) {
    const { error: stErr } = await supabase.storage.from(BUCKET).remove([doc.file_path]);
    if (stErr) console.warn('[quotes/documents] storage remove failed', stErr.message);
  }

  return NextResponse.json({ ok: true });
}
