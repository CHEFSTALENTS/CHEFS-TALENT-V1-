// app/api/admin/requests/[id]/send-ncc/route.ts
//
// Envoi du NCC (Accord de Non-Contournement & Confidentialité) depuis la
// fiche demande /admin/requests/[id]. À 4 signataires :
//   - Apporteur (Chef Référent ou Concierge)
//   - Chef Exécutant
//   - Client (pré-rempli depuis la request)
//   - Chefs Talents (Thomas)
//
// GET  → preview : rend NccData + HTML + missingFields SANS envoyer
//        Le NccData est merge entre :
//          1. buildNccDefaults(request) → pré-remplissage automatique
//          2. dernier snapshot d'un signature_requests précédent (continuité
//             si l'admin avait déjà saisi avant et qu'il revient)
//          3. body POST si fourni (override)
//
// POST → envoi réel :
//        - Body : { ncc: NccData partiel (au minimum apporteur + chef
//          exécutant + sanction %) }
//        - Génère le PDF + envoie via YouSign + insert signature_requests
//          (kind='ncc', target_kind='request', target_id=request.id)

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
  type NccData,
  buildNccDefaults,
  renderNcc,
} from '@/lib/contracts/nccTemplate';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type ResolvedSignerOut = {
  firstName: string;
  lastName: string;
  email: string;
  role: 'apporteur' | 'chef' | 'client' | 'agency';
  warnings: string[];
};

function validateEmail(email: string | null | undefined, role: string, ctx?: { company?: string }): string[] {
  const warnings: string[] = [];
  const e = String(email || '').trim().toLowerCase();
  if (!e) { warnings.push('Email manquant'); return warnings; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) warnings.push('Format email invalide');
  if (role === 'client' && ctx?.company) {
    const personal = ['gmail.com', 'yahoo.fr', 'yahoo.com', 'hotmail.fr', 'hotmail.com', 'orange.fr', 'wanadoo.fr', 'free.fr', 'icloud.com', 'outlook.com', 'me.com'];
    const dom = e.split('@')[1];
    if (dom && personal.includes(dom)) warnings.push('Email perso alors qu\'une société est renseignée');
  }
  return warnings;
}

function resolveNccSigners(d: NccData): { signers: ResolvedSignerOut[]; missingFields: string[] } {
  const signers: ResolvedSignerOut[] = [];
  const missing: string[] = [];

  // Apporteur
  if (!d.apporteurFirstName || !d.apporteurLastName || !d.apporteurEmail) {
    missing.push('Apporteur (prénom + nom + email)');
  } else {
    signers.push({
      firstName: d.apporteurFirstName,
      lastName: d.apporteurLastName,
      email: d.apporteurEmail,
      role: 'apporteur',
      warnings: validateEmail(d.apporteurEmail, 'apporteur'),
    });
  }

  // Chef Exécutant
  if (!d.chefFirstName || !d.chefLastName || !d.chefEmail) {
    missing.push('Chef Exécutant (prénom + nom + email)');
  } else {
    signers.push({
      firstName: d.chefFirstName,
      lastName: d.chefLastName,
      email: d.chefEmail,
      role: 'chef',
      warnings: validateEmail(d.chefEmail, 'chef'),
    });
  }

  // Client
  if (!d.clientFirstName || !d.clientEmail) {
    missing.push('Client (prénom + email)');
  } else {
    signers.push({
      firstName: d.clientFirstName,
      lastName: d.clientLastName || '—',
      email: d.clientEmail,
      role: 'client',
      warnings: validateEmail(d.clientEmail, 'client', { company: d.clientCompany }),
    });
  }

  // Agence
  signers.push({
    firstName: process.env.YOUSIGN_AGENCY_FIRST_NAME || d.agencyRep.split(' ')[0] || 'Thomas',
    lastName: process.env.YOUSIGN_AGENCY_LAST_NAME || d.agencyRep.split(' ').slice(1).join(' ') || 'Delcroix',
    email: process.env.YOUSIGN_AGENCY_EMAIL || d.agencyEmail || 'contact@chefstalents.com',
    role: 'agency',
    warnings: validateEmail(process.env.YOUSIGN_AGENCY_EMAIL || d.agencyEmail, 'agency'),
  });

  return { signers, missingFields: missing };
}

async function loadRequest(requestId: string) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('client_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw new Error(`request load: ${error.message}`);
  return data;
}

async function loadLastNccSnapshot(requestId: string): Promise<Partial<NccData> | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from('signature_requests')
    .select('contract_snapshot')
    .eq('target_kind', 'request')
    .eq('target_id', requestId)
    .eq('kind', 'ncc')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.contract_snapshot as Partial<NccData>) || null;
}

// ────────────────────────────────────────────────────────────
// GET — preview
// ────────────────────────────────────────────────────────────
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const requestId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!requestId) return NextResponse.json({ ok: false, error: 'Missing request id' }, { status: 400 });

  let request: any;
  try {
    request = await loadRequest(requestId);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
  if (!request) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });

  // Merge defaults + dernier snapshot + body (si POST-like body GET via search)
  const defaults = buildNccDefaults(request);
  const lastSnap = await loadLastNccSnapshot(requestId);
  const merged: NccData = { ...defaults, ...(lastSnap ?? {}) };

  const { signers, missingFields } = resolveNccSigners(merged);
  const html = renderNcc(merged);

  // Idempotence : déjà ongoing ?
  const supabase = supabaseAdmin();
  const { data: existing } = await supabase
    .from('signature_requests')
    .select('id')
    .eq('target_kind', 'request')
    .eq('target_id', requestId)
    .eq('kind', 'ncc')
    .in('yousign_status', ['draft', 'ongoing'])
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    nccData: merged,
    signers,
    missingFields,
    html,
    filename: `NCC_${(merged.missionRef || requestId).replace(/[^a-zA-Z0-9_]/g, '_')}.pdf`,
    alreadyPending: !!existing,
    canSend: missingFields.length === 0 && !existing,
  });
}

// ────────────────────────────────────────────────────────────
// POST — preview-with-body OR send
// ────────────────────────────────────────────────────────────
//
// Body :
//   { nccData: Partial<NccData>, action: 'preview' | 'send' }
//
// action='preview' → renvoie {signers, html, missingFields, canSend} comme GET
// action='send'    → idem + envoie réellement à YouSign
// ────────────────────────────────────────────────────────────
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const requestId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!requestId) return NextResponse.json({ ok: false, error: 'Missing request id' }, { status: 400 });

  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }

  const action = body.action === 'send' ? 'send' : 'preview';
  const userData = (body.nccData || {}) as Partial<NccData>;

  let request: any;
  try {
    request = await loadRequest(requestId);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
  if (!request) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });

  const supabase = supabaseAdmin();

  // Idempotence
  const { data: existing } = await supabase
    .from('signature_requests')
    .select('id, yousign_status')
    .eq('target_kind', 'request')
    .eq('target_id', requestId)
    .eq('kind', 'ncc')
    .in('yousign_status', ['draft', 'ongoing'])
    .maybeSingle();
  if (existing && action === 'send') {
    return NextResponse.json({
      ok: false,
      error: 'ALREADY_PENDING',
      message: 'Un NCC est déjà en cours sur cette demande. Annule-le dans YouSign avant d\'en relancer un.',
      existingId: existing.id,
    }, { status: 409 });
  }

  const defaults = buildNccDefaults(request);
  const lastSnap = await loadLastNccSnapshot(requestId);
  const merged: NccData = { ...defaults, ...(lastSnap ?? {}), ...userData };

  const { signers, missingFields } = resolveNccSigners(merged);
  const html = renderNcc(merged);
  const filename = `NCC_${(merged.missionRef || requestId).replace(/[^a-zA-Z0-9_]/g, '_')}.pdf`;

  if (action === 'preview') {
    return NextResponse.json({
      ok: true,
      nccData: merged,
      signers,
      missingFields,
      html,
      filename,
      alreadyPending: !!existing,
      canSend: missingFields.length === 0 && !existing,
    });
  }

  // ─── action='send'
  if (missingFields.length > 0) {
    return NextResponse.json({
      ok: false,
      error: 'MISSING_SIGNER_DATA',
      missing: missingFields,
      message: `Données signataires incomplètes : ${missingFields.join(', ')}.`,
    }, { status: 400 });
  }

  // PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await htmlToPdf(html);
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'htmlToPdf', error: e?.message }, { status: 500 });
  }

  let pdfMeta: Awaited<ReturnType<typeof getPdfMeta>>;
  try {
    pdfMeta = await getPdfMeta(pdfBuffer);
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'pdfMeta', error: e?.message }, { status: 500 });
  }

  const yousignSigners: YousignSignerInput[] = signers.map((s) => ({
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    role: s.role,
  }));

  let result: Awaited<ReturnType<typeof sendForSignature>>;
  try {
    result = await sendForSignature({
      name: `NCC — ${merged.missionRef || requestId.slice(0, 8)}`.slice(0, 200),
      pdfBuffer,
      filename,
      signers: yousignSigners,
      pdfMeta,
    });
  } catch (e: any) {
    console.error('[send-ncc] YouSign error', e?.message || e, e?.body);
    return NextResponse.json({ ok: false, stage: 'yousign', error: e?.message, detail: e?.body }, { status: 500 });
  }

  const { data: row, error: insErr } = await supabase
    .from('signature_requests')
    .insert({
      kind: 'ncc',
      target_kind: 'request',
      target_id: requestId,
      yousign_request_id: result.signatureRequest.id,
      yousign_status: result.signatureRequest.status,
      signers: signers.map((s) => ({
        name: `${s.firstName} ${s.lastName}`.trim(),
        email: s.email,
        role: s.role,
      })),
      contract_snapshot: merged,
      sent_at: new Date().toISOString(),
    })
    .select('id, yousign_status, sent_at')
    .single();

  if (insErr) {
    return NextResponse.json({
      ok: false,
      stage: 'db_insert',
      error: insErr.message,
      yousignId: result.signatureRequest.id,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    signatureRequest: {
      id: row.id,
      yousignId: result.signatureRequest.id,
      status: row.yousign_status,
      sentAt: row.sent_at,
      signerCount: signers.length,
    },
  });
}
