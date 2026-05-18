// app/api/webhooks/yousign/route.ts
//
// Webhook YouSign — reçoit les events signature_request.activated/done/declined…
// Sécurité : vérif HMAC-SHA256 via X-YouSign-Signature-256 + secret partagé.
//
// Setup côté YouSign (dashboard) :
//   URL       : https://chefstalents.com/api/webhooks/yousign
//   Events    : signature_request.activated, .done, .declined, .expired, .cancelled
//   Secret    : copié dans YOUSIGN_WEBHOOK_SECRET (env Vercel)
//
// Quand on reçoit signature_request.done :
//   1. Met à jour signature_requests.yousign_status='done' + completed_at
//   2. Télécharge le PDF signé via API YouSign
//   3. Upload dans Supabase Storage bucket 'signed-contracts' (privé)
//   4. Stocke le path dans signature_requests.signed_pdf_url
//   5. Notifie l'admin par email (TODO PR2 — pour l'instant log seulement)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyYousignSignature,
  type YousignWebhookEvent,
} from '@/lib/yousign/webhook';
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

export async function POST(req: Request) {
  const secret = process.env.YOUSIGN_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhooks/yousign] YOUSIGN_WEBHOOK_SECRET non configuré');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  // 1. RAW body d'abord — sinon HMAC ne match pas
  const rawBody = await req.text();
  const signature = req.headers.get('x-yousign-signature-256') || req.headers.get('X-YouSign-Signature-256');

  if (!verifyYousignSignature(rawBody, signature, secret)) {
    console.warn('[webhooks/yousign] signature HMAC invalide');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  // 2. Parse l'event
  let event: YousignWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const sigRequestId = event?.data?.signature_request?.id;
  const eventName = event?.event_name;
  if (!sigRequestId || !eventName) {
    return NextResponse.json({ error: 'malformed event' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // 3. Map event_name → yousign_status DB
  const statusMap: Record<string, string> = {
    'signature_request.activated': 'ongoing',
    'signature_request.done':      'done',
    'signature_request.declined':  'declined',
    'signature_request.expired':   'expired',
    'signature_request.cancelled': 'cancelled',
  };
  const newStatus = statusMap[eventName] || null;

  if (!newStatus) {
    // Event qu'on ne traite pas (signer.done par ex.) — on log et on accuse
    // réception en 200 pour éviter les retries YouSign.
    console.log('[webhooks/yousign] event ignoré:', eventName, sigRequestId);
    return NextResponse.json({ ok: true, ignored: eventName });
  }

  // 4. Update signature_requests
  const updates: Record<string, any> = { yousign_status: newStatus };
  if (newStatus === 'done') {
    updates.completed_at = new Date().toISOString();
  }

  const { data: sigRow, error: updErr } = await supabase
    .from('signature_requests')
    .update(updates)
    .eq('yousign_request_id', sigRequestId)
    .select('id, kind, target_kind, target_id')
    .maybeSingle();

  if (updErr) {
    console.error('[webhooks/yousign] update DB error', updErr.message);
    return NextResponse.json({ error: 'db update failed' }, { status: 500 });
  }
  if (!sigRow) {
    console.warn('[webhooks/yousign] signature_request introuvable en DB:', sigRequestId);
    return NextResponse.json({ ok: true, warning: 'unknown signature_request' });
  }

  // 5. Si signé : récupère le PDF signé et l'archive dans Supabase Storage + Google Drive
  if (newStatus === 'done') {
    try {
      const full = await getSignatureRequest(sigRequestId);
      const signableDoc = full.documents.find((d) => d.nature === 'signable_document') || full.documents[0];
      if (signableDoc) {
        const pdfBuffer = await downloadSignedDocument({
          signatureRequestId: sigRequestId,
          documentId: signableDoc.id,
        });

        // 5a. Backup Supabase Storage (bucket privé)
        const path = `${sigRow.kind}/${sigRow.id}.pdf`;
        const { error: upErr } = await supabase.storage
          .from(SIGNED_BUCKET)
          .upload(path, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        const dbUpdates: Record<string, any> = {};
        if (upErr) {
          console.error('[webhooks/yousign] upload storage error', upErr.message);
        } else {
          dbUpdates.signed_pdf_url = path;
        }

        // 5b. Backup Google Drive (best-effort — skip silencieux si non activé)
        const driveFilename = signableDoc.filename || `Contrat_${sigRow.kind}_${sigRow.id.slice(0, 8)}.pdf`;
        const driveResult = await uploadSignedContractToDrive({
          pdfBuffer,
          filename: driveFilename,
          subfolder: sigRow.kind, // organisé par /YYYY/MM/[essai|chef|client|ncc]/
        });
        if (driveResult) {
          dbUpdates.drive_file_id = driveResult.fileId;
          dbUpdates.drive_file_url = driveResult.webViewLink;
        }

        // Update DB en une seule requête si on a quelque chose à mettre
        if (Object.keys(dbUpdates).length > 0) {
          await supabase
            .from('signature_requests')
            .update(dbUpdates)
            .eq('id', sigRow.id);
        }
      }
    } catch (e: any) {
      console.error('[webhooks/yousign] archive PDF error', e?.message || e);
      // On ne fail pas le webhook — l'archive PDF est best-effort
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}

// YouSign teste parfois l'endpoint en GET pour vérifier qu'il répond — on
// renvoie un 200 sans révéler l'existence du webhook.
export async function GET() {
  return new NextResponse('OK', { status: 200 });
}
