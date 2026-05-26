// app/api/admin/ncc-partner/send/route.ts
//
// POST /api/admin/ncc-partner/send
// Génère et envoie un NCC partenaire (2 signataires : Client + Chefs Talents)
// à un nouveau partenaire SANS qu'il y ait de request/mission existante.
//
// Stocké en signature_requests avec kind='ncc', target_kind='adhoc'.
//
// Body : {
//   ncc: NccPartnerData partiel (au minimum clientCompany + clientRep + clientEmail)
//   previewOnly?: boolean   // si true, retourne juste le HTML preview (pas d'envoi)
// }

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { htmlToPdf } from '@/lib/pdf/htmlToPdf';
import { getPdfMeta } from '@/lib/pdf/pdfMeta';
import { sendForSignature, type YousignSignerInput } from '@/lib/yousign/client';
import {
  type NccPartnerData,
  buildNccPartnerDefaults,
  renderNccPartner,
} from '@/lib/contracts/nccPartnerTemplate';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAndMerge(input: any): {
  data: NccPartnerData;
  missing: string[];
} {
  const defaults = buildNccPartnerDefaults();
  const data: NccPartnerData = { ...defaults, ...(input || {}) };

  const missing: string[] = [];
  if (!data.clientCompany?.trim()) missing.push('Raison sociale');
  if (!data.clientRepFirstName?.trim()) missing.push('Prénom du représentant');
  if (!data.clientRepLastName?.trim()) missing.push('Nom du représentant');
  if (!data.clientEmail?.trim() || !EMAIL_RE.test(data.clientEmail.trim().toLowerCase())) {
    missing.push('Email valide du représentant');
  }
  // SIRET et adresse pas obligatoires (mais recommandés).
  return { data, missing };
}

export async function POST(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const { data, missing } = validateAndMerge(body?.ncc);
  const previewOnly = !!body?.previewOnly;

  // Mode preview : on rend juste le HTML sans envoyer
  if (previewOnly) {
    const html = renderNccPartner(data);
    return NextResponse.json({
      ok: true,
      preview: true,
      html,
      data,
      missing,
    });
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'MISSING_FIELDS',
        message: `Champs manquants : ${missing.join(', ')}`,
        missing,
      },
      { status: 400 },
    );
  }

  // 1. Génère le HTML + PDF
  const html = renderNccPartner(data);
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await htmlToPdf(html);
  } catch (e: any) {
    console.error('[ncc-partner/send] htmlToPdf', e);
    return NextResponse.json(
      { ok: false, stage: 'htmlToPdf', error: e?.message },
      { status: 500 },
    );
  }

  let pdfMeta: Awaited<ReturnType<typeof getPdfMeta>>;
  try {
    pdfMeta = await getPdfMeta(pdfBuffer);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, stage: 'pdfMeta', error: e?.message },
      { status: 500 },
    );
  }

  // 2. Prépare les 2 signataires
  const yousignSigners: YousignSignerInput[] = [
    {
      firstName: data.clientRepFirstName,
      lastName: data.clientRepLastName,
      email: data.clientEmail.trim().toLowerCase(),
      role: 'client',
    },
    {
      firstName: data.agencyRep.split(' ')[0] || 'Thomas',
      lastName: data.agencyRep.split(' ').slice(1).join(' ') || 'Delcroix',
      email: data.agencyEmail,
      role: 'agency',
    },
  ];

  // 3. Envoie via YouSign
  let result: Awaited<ReturnType<typeof sendForSignature>>;
  try {
    const slug = (data.clientCompany || 'partenaire')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);
    result = await sendForSignature({
      name: `NCC Partenaire — ${data.clientCompany}`.slice(0, 200),
      pdfBuffer,
      filename: `NCC-${data.reference}-${slug}.pdf`,
      signers: yousignSigners,
      pdfMeta,
    });
  } catch (e: any) {
    console.error('[ncc-partner/send] YouSign error', e?.message, e?.body);
    return NextResponse.json(
      { ok: false, stage: 'yousign', error: e?.message, detail: e?.body },
      { status: 500 },
    );
  }

  // 4. Stocke en signature_requests (target_kind='adhoc' déjà supporté)
  const supabase = supabaseAdmin();
  const { data: row, error: insErr } = await supabase
    .from('signature_requests')
    .insert({
      kind: 'ncc',
      target_kind: 'adhoc',
      target_id: null,
      yousign_request_id: result.signatureRequest.id,
      yousign_status: result.signatureRequest.status,
      signers: yousignSigners.map((s) => ({
        name: `${s.firstName} ${s.lastName}`.trim(),
        email: s.email,
        role: s.role,
      })),
      contract_snapshot: {
        ...data,
        contract_type: 'ncc_partner', // pour distinguer du NCC mission dans les snapshots
      },
      sent_at: new Date().toISOString(),
    })
    .select('id, yousign_status, sent_at')
    .single();

  if (insErr) {
    console.error('[ncc-partner/send] db insert error', insErr);
    return NextResponse.json(
      {
        ok: false,
        stage: 'db_insert',
        error: insErr.message,
        yousignId: result.signatureRequest.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    signatureRequest: {
      id: row.id,
      yousignId: result.signatureRequest.id,
      status: row.yousign_status,
      sentAt: row.sent_at,
      signerCount: yousignSigners.length,
    },
    reference: data.reference,
  });
}
