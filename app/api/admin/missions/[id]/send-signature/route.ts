// app/api/admin/missions/[id]/send-signature/route.ts
//
// GET  → preview : renvoie signataires + html + missingFields SANS rien envoyer
//        (utilisé par le modal de confirmation avant le vrai POST)
//
// POST → envoie réel : génère PDF + appelle YouSign + insert signature_requests
//
// La résolution des signataires + du contractData est extraite dans _resolveSigners.ts
// pour garantir que GET preview et POST envoient EXACTEMENT le même contenu.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { htmlToPdf } from '@/lib/pdf/htmlToPdf';
import { getPdfMeta } from '@/lib/pdf/pdfMeta';
import { sendForSignature } from '@/lib/yousign/client';
import { resolveContract, type ContractKind } from './_resolveSigners';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function loadMissionData(missionId: string) {
  const supabase = supabaseAdmin();

  const { data: mission, error: mErr } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .maybeSingle();
  if (mErr) throw new Error(`mission load: ${mErr.message}`);
  if (!mission) return { mission: null, chef: null, clientRequest: null };

  let chef: any = null;
  if (mission.chef_id) {
    const { data: c } = await supabase
      .from('chef_profiles')
      .select('email, profile')
      .eq('user_id', mission.chef_id)
      .maybeSingle();
    chef = c || null;
  }

  let clientRequest: any = null;
  if (mission.request_id) {
    const { data: r } = await supabase
      .from('client_requests')
      .select('full_name, first_name, email, phone, company_name')
      .eq('id', mission.request_id)
      .maybeSingle();
    clientRequest = r || null;
  }

  return { mission, chef, clientRequest };
}

function parseKind(raw: string | null): ContractKind | null {
  const k = (raw || '').toLowerCase();
  if (k === 'essai' || k === 'chef' || k === 'client') return k;
  return null;
}

// ────────────────────────────────────────────────────────────
// GET /api/admin/missions/[id]/send-signature?kind=client
// Preview : signataires + HTML + missingFields, sans rien envoyer.
// ────────────────────────────────────────────────────────────
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const missionId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!missionId) {
    return NextResponse.json({ ok: false, error: 'Missing mission id' }, { status: 400 });
  }

  const url = new URL(req.url);
  const kind = parseKind(url.searchParams.get('kind'));
  if (!kind) {
    return NextResponse.json({ ok: false, error: 'kind must be essai|chef|client' }, { status: 400 });
  }

  let loaded: Awaited<ReturnType<typeof loadMissionData>>;
  try {
    loaded = await loadMissionData(missionId);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
  if (!loaded.mission) {
    return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 });
  }

  const resolved = resolveContract({
    kind,
    mission: loaded.mission,
    chef: loaded.chef,
    clientRequest: loaded.clientRequest,
  });

  // Vérifie aussi s'il y a déjà une signature ongoing (pour griser le bouton dans le modal)
  const supabase = supabaseAdmin();
  const { data: existing } = await supabase
    .from('signature_requests')
    .select('id, yousign_status')
    .eq('target_kind', 'mission')
    .eq('target_id', missionId)
    .eq('kind', kind)
    .in('yousign_status', ['draft', 'ongoing'])
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    kind,
    signers: resolved.signers.map((s) => ({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      role: s.role,
      warnings: s.warnings,
    })),
    missingFields: resolved.missingFields,
    html: resolved.html,
    filename: resolved.filename,
    alreadyPending: !!existing,
    canSend: resolved.missingFields.length === 0 && !existing,
  });
}

// ────────────────────────────────────────────────────────────
// POST /api/admin/missions/[id]/send-signature
// Body : { kind: 'essai' | 'chef' | 'client' }
// ────────────────────────────────────────────────────────────
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const missionId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!missionId) {
    return NextResponse.json({ ok: false, error: 'Missing mission id' }, { status: 400 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty OK */ }

  const kind = parseKind(body.kind);
  if (!kind) {
    return NextResponse.json({ ok: false, error: 'kind must be essai|chef|client' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // Idempotence : refuse si une signature_request 'ongoing' existe déjà pour ce kind
  const { data: existing } = await supabase
    .from('signature_requests')
    .select('id, yousign_status')
    .eq('target_kind', 'mission')
    .eq('target_id', missionId)
    .eq('kind', kind)
    .in('yousign_status', ['draft', 'ongoing'])
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      ok: false,
      error: 'ALREADY_PENDING',
      message: `Une signature ${kind} est déjà en cours sur cette mission. Annule-la dans YouSign avant d'en relancer une.`,
      existingId: existing.id,
    }, { status: 409 });
  }

  let loaded: Awaited<ReturnType<typeof loadMissionData>>;
  try {
    loaded = await loadMissionData(missionId);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
  if (!loaded.mission) {
    return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 });
  }

  const resolved = resolveContract({
    kind,
    mission: loaded.mission,
    chef: loaded.chef,
    clientRequest: loaded.clientRequest,
  });

  if (resolved.missingFields.length > 0) {
    return NextResponse.json({
      ok: false,
      error: 'MISSING_SIGNER_DATA',
      missing: resolved.missingFields,
      message: `Données signataires incomplètes : ${resolved.missingFields.join(', ')}.`,
    }, { status: 400 });
  }

  // HTML → PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await htmlToPdf(resolved.html);
  } catch (e: any) {
    console.error('[send-signature] htmlToPdf error', e?.message || e);
    return NextResponse.json({ ok: false, stage: 'htmlToPdf', error: e?.message }, { status: 500 });
  }

  let pdfMeta: Awaited<ReturnType<typeof getPdfMeta>>;
  try {
    pdfMeta = await getPdfMeta(pdfBuffer);
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'pdfMeta', error: e?.message }, { status: 500 });
  }

  // YouSign — on retire le champ `warnings` interne avant d'envoyer
  let result: Awaited<ReturnType<typeof sendForSignature>>;
  try {
    result = await sendForSignature({
      name: `Contrat ${kind} — ${resolved.docName}`.slice(0, 200),
      pdfBuffer,
      filename: resolved.filename,
      signers: resolved.signers.map(({ warnings: _w, ...s }) => s),
      pdfMeta,
    });
  } catch (e: any) {
    console.error('[send-signature] YouSign error', e?.message || e, e?.body);
    return NextResponse.json({
      ok: false,
      stage: 'yousign',
      error: e?.message,
      message: e?.message,                    // dupliqué pour que l'UI le récupère via .message
      detail: e?.body,
      violations: e?.violations || [],
    }, { status: 500 });
  }

  const { data: row, error: insErr } = await supabase
    .from('signature_requests')
    .insert({
      kind,
      target_kind: 'mission',
      target_id: missionId,
      yousign_request_id: result.signatureRequest.id,
      yousign_status: result.signatureRequest.status,
      signers: resolved.signers.map((s) => ({
        name: `${s.firstName} ${s.lastName}`.trim(),
        email: s.email,
        role: s.role,
      })),
      contract_snapshot: resolved.contractSnapshot,
      sent_at: new Date().toISOString(),
    })
    .select('id, yousign_status, sent_at')
    .single();

  if (insErr) {
    console.error('[send-signature] DB insert error', insErr.message);
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
      signerCount: resolved.signers.length,
    },
  });
}
