// app/api/admin/yousign-test/route.ts
//
// Endpoint admin temporaire pour valider l'intégration YouSign en SANDBOX.
// À utiliser une seule fois après avoir configuré YOUSIGN_API_KEY (sandbox).
// → Sera supprimé en PR 2 une fois le bouton « Envoyer pour signature » live.
//
// Usage :
//   POST /api/admin/yousign-test
//   Authorization: Bearer <admin-supabase-token>
//   Content-Type: application/json
//   {
//     "signerFirstName": "Thomas",
//     "signerLastName": "Test",
//     "signerEmail": "ton.email@exemple.com"
//   }
//
// Comportement :
//   1. Génère un HTML minimal de test
//   2. Le convertit en PDF (htmlToPdf)
//   3. Crée une signature request YouSign avec 1 signataire
//   4. Active → YouSign envoie l'email d'invitation
//   5. Insère une ligne en signature_requests (target_kind='adhoc', kind='ncc')
//   6. Renvoie l'id YouSign + l'id DB pour debug

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;          // Plan Pro Vercel — sinon 10s sur hobby

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { htmlToPdf } from '@/lib/pdf/htmlToPdf';
import { sendForSignature } from '@/lib/yousign/client';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body OK */ }

  const firstName = String(body.signerFirstName || '').trim() || 'Thomas';
  const lastName  = String(body.signerLastName  || '').trim() || 'Test';
  const email     = String(body.signerEmail     || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'signerEmail requis (valide)' }, { status: 400 });
  }

  // 1. HTML de test
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>
  body { font-family: Georgia, serif; padding: 40mm 20mm; line-height: 1.6; font-size: 13pt; }
  h1 { text-align: center; }
  .signature { margin-top: 80mm; border-top: 1px solid #000; padding-top: 8mm; }
</style></head><body>
  <h1>Document de test — YouSign Sandbox</h1>
  <p>Ceci est un document généré par Chefs Talents pour valider l'intégration YouSign.</p>
  <p>Date : ${new Date().toLocaleString('fr-FR')}</p>
  <p>Demandé par : ${auth.user.email}</p>
  <div class="signature">Signature : ____________________</div>
</body></html>`;

  // 2. HTML → PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await htmlToPdf(html);
  } catch (e: any) {
    console.error('[yousign-test] htmlToPdf error', e?.message || e);
    return NextResponse.json({
      ok: false,
      stage: 'htmlToPdf',
      error: e?.message || String(e),
    }, { status: 500 });
  }

  // 3+4. Send to YouSign
  let result: Awaited<ReturnType<typeof sendForSignature>>;
  try {
    result = await sendForSignature({
      name: `Test Chefs Talents — ${new Date().toISOString().slice(0, 10)}`,
      pdfBuffer,
      filename: 'test_chefstalents.pdf',
      signers: [{
        firstName,
        lastName,
        email,
        role: 'agency',
      }],
    });
  } catch (e: any) {
    console.error('[yousign-test] sendForSignature error', e?.message || e, e?.body);
    return NextResponse.json({
      ok: false,
      stage: 'sendForSignature',
      error: e?.message || String(e),
      detail: e?.body,
    }, { status: 500 });
  }

  // 5. Insert DB
  const supabase = supabaseAdmin();
  const { data: row, error: insErr } = await supabase
    .from('signature_requests')
    .insert({
      kind: 'ncc',                     // arbitraire pour le test
      target_kind: 'adhoc',
      target_id: null,
      yousign_request_id: result.signatureRequest.id,
      yousign_status: result.signatureRequest.status,
      signers: [{ name: `${firstName} ${lastName}`, email, role: 'agency' }],
      contract_snapshot: { test: true, requestedBy: auth.user.email },
      sent_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insErr) {
    console.error('[yousign-test] DB insert error', insErr.message);
    return NextResponse.json({
      ok: false,
      stage: 'db_insert',
      error: insErr.message,
      yousignId: result.signatureRequest.id,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    yousign: {
      id: result.signatureRequest.id,
      status: result.signatureRequest.status,
      name: result.signatureRequest.name,
    },
    signatureRequestDbId: row.id,
    sentTo: email,
    note: 'Check ta boîte mail — invitation YouSign envoyée. Le webhook /api/webhooks/yousign mettra à jour le status quand tu signeras.',
  });
}
