// app/api/admin/missions/[id]/signature-requests/route.ts
//
// GET → liste les signature_requests d'une mission (tous kinds confondus),
//        avec URL signée pour télécharger le PDF signé final si dispo.
//
// Utilisé par le panneau Contrats pour afficher les bandeaux de statut
// par onglet (essai / chef / client) et le lien « Télécharger le contrat signé ».

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const SIGNED_BUCKET = 'signed-contracts';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const missionId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!missionId) {
    return NextResponse.json({ ok: false, error: 'Missing mission id' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: rows, error } = await supabase
    .from('signature_requests')
    .select('id, kind, yousign_request_id, yousign_status, signers, sent_at, completed_at, signed_pdf_url, error_message, created_at')
    .eq('target_kind', 'mission')
    .eq('target_id', missionId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Signer une URL temporaire (1h) vers chaque PDF signé archivé
  const items = await Promise.all((rows || []).map(async (r) => {
    let signedUrl: string | null = null;
    if (r.signed_pdf_url) {
      const { data: s } = await supabase.storage
        .from(SIGNED_BUCKET)
        .createSignedUrl(r.signed_pdf_url, 3600);
      signedUrl = s?.signedUrl ?? null;
    }
    return {
      id: r.id,
      kind: r.kind,
      status: r.yousign_status,
      yousignId: r.yousign_request_id,
      signers: r.signers,
      sentAt: r.sent_at,
      completedAt: r.completed_at,
      createdAt: r.created_at,
      errorMessage: r.error_message,
      signedPdfUrl: signedUrl,
    };
  }));

  return NextResponse.json({ ok: true, items });
}
