// app/api/admin/signature-requests/[id]/sync/route.ts
//
// POST : force-sync du statut YouSign vers notre DB.
//
// Utile quand :
//   - Le webhook YouSign n'est jamais arrivé (URL mal configurée, HMAC fail,
//     event filtré côté YouSign, etc.)
//   - L'admin veut vérifier manuellement si le contrat a été signé
//
// Comportement :
//   1. Charge signature_request en DB par ID
//   2. Appelle YouSign GET /signature_requests/{yousign_request_id}
//   3. Update notre DB avec le vrai statut + complétion
//   4. Si status='done' et signed_pdf_url manquant → télécharge le PDF +
//      archive Supabase Storage + Google Drive (best-effort)
//   5. Renvoie le nouveau statut côté UI

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import {
  downloadSignedDocument,
  getSignatureRequest,
} from '@/lib/yousign/client';
import { uploadSignedContractToDrive } from '@/lib/storage/googleDrive';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const SIGNED_BUCKET = 'signed-contracts';

// Map status YouSign → notre status DB (mêmes valeurs que le webhook)
const STATUS_MAP: Record<string, string> = {
  draft: 'draft',
  ongoing: 'ongoing',
  done: 'done',
  declined: 'declined',
  expired: 'expired',
  cancelled: 'cancelled',
};

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const sigRequestId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!sigRequestId) {
    return NextResponse.json({ ok: false, error: 'Missing signature_request id' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // 1. Charge la ligne DB
  const { data: row, error: rowErr } = await supabase
    .from('signature_requests')
    .select('id, kind, yousign_request_id, yousign_status, signed_pdf_url')
    .eq('id', sigRequestId)
    .maybeSingle();

  if (rowErr || !row) {
    return NextResponse.json({ ok: false, error: 'signature_request not found' }, { status: 404 });
  }

  if (!row.yousign_request_id) {
    return NextResponse.json(
      { ok: false, error: 'NO_YOUSIGN_ID', message: 'Cette signature n\'a pas d\'ID YouSign — impossible de synchroniser.' },
      { status: 400 },
    );
  }

  // 2. Fetch le statut réel depuis YouSign
  let yousignData: any;
  try {
    yousignData = await getSignatureRequest(row.yousign_request_id);
  } catch (e: any) {
    console.error('[signature-requests sync] YouSign GET error', e?.message);
    return NextResponse.json({
      ok: false,
      error: 'YOUSIGN_FETCH_FAILED',
      message: e?.message || 'Impossible de joindre YouSign',
    }, { status: 502 });
  }

  const ysStatus = String(yousignData?.status || '').toLowerCase();
  const newStatus = STATUS_MAP[ysStatus] || row.yousign_status;
  const isDone = newStatus === 'done';

  // 3. Update DB
  const dbUpdates: Record<string, any> = { yousign_status: newStatus };
  if (isDone && !row.signed_pdf_url) {
    dbUpdates.completed_at = new Date().toISOString();
  }

  // 4. Si done + pas encore archivé → archive Storage + Drive
  let archivedPdf = false;
  if (isDone && !row.signed_pdf_url) {
    try {
      const signableDoc = yousignData.documents?.find((d: any) => d.nature === 'signable_document') || yousignData.documents?.[0];
      if (signableDoc) {
        const pdfBuffer = await downloadSignedDocument({
          signatureRequestId: row.yousign_request_id,
          documentId: signableDoc.id,
        });
        const filename = signableDoc.filename || `Contrat_${row.kind}_${row.id.slice(0, 8)}.pdf`;

        // Supabase Storage
        const path = `${row.kind}/${row.id}.pdf`;
        const { error: upErr } = await supabase.storage
          .from(SIGNED_BUCKET)
          .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });
        if (!upErr) {
          dbUpdates.signed_pdf_url = path;
          archivedPdf = true;
        }

        // Google Drive (best-effort)
        const driveResult = await uploadSignedContractToDrive({
          pdfBuffer,
          filename,
          subfolder: row.kind,
        });
        if (driveResult) {
          dbUpdates.drive_file_id = driveResult.fileId;
          dbUpdates.drive_file_url = driveResult.webViewLink;
        }
      }
    } catch (e: any) {
      console.error('[signature-requests sync] archive error', e?.message);
      // Continue : on update au moins le status
    }
  }

  const { error: updErr } = await supabase
    .from('signature_requests')
    .update(dbUpdates)
    .eq('id', sigRequestId);

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    previousStatus: row.yousign_status,
    newStatus,
    changed: row.yousign_status !== newStatus,
    archivedPdf,
    yousignStatus: ysStatus,
  });
}
