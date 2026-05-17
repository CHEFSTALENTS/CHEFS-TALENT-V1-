// app/api/admin/missions/[id]/send-signature/route.ts
//
// Envoie un contrat (essai / chef / client) pour signature électronique YouSign.
//
// POST body : { kind: 'essai' | 'chef' | 'client' }
//
// Comportement :
//   1. Auth admin
//   2. Charge la mission + chef_profile + client_request
//   3. Reconstruit le contractData (buildXxxDefaults + spread de contracts_data)
//   4. Rend l'HTML (renderEssai/renderChef/renderClient)
//   5. Convertit en PDF (htmlToPdf serverless)
//   6. Détermine les signataires selon le kind :
//        - essai  : Client + Chef + Thomas (3)
//        - chef   : Chef + Thomas (2)
//        - client : Client + Thomas (2)
//   7. Envoie via YouSign (sendForSignature)
//   8. Insère ligne signature_requests (idempotent : 1 seul ongoing par
//      mission+kind à la fois → refuse 409 si déjà un en cours)
//
// Le webhook /api/webhooks/yousign met à jour le status au fil des signatures.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;            // Plan Pro Vercel

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { htmlToPdf } from '@/lib/pdf/htmlToPdf';
import { getPdfMeta } from '@/lib/pdf/pdfMeta';
import { sendForSignature, type YousignSignerInput } from '@/lib/yousign/client';
import {
  type EssaiData,
  type ChefContractData,
  type ClientContractData,
  buildEssaiDefaults,
  buildChefDefaults,
  buildClientDefaults,
  renderEssai,
  renderChef,
  renderClient,
} from '@/app/admin/missions/[id]/_lib/contracts';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type ContractKind = 'essai' | 'chef' | 'client';

// Sépare un "Prénom Nom" en {first, last}. Si une seule partie : first=valeur, last="—".
// YouSign accepte ces valeurs pour le test sandbox.
function splitName(full: string | null | undefined): { first: string; last: string } {
  const s = String(full || '').trim();
  if (!s) return { first: '—', last: '—' };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '—' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const missionId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!missionId) {
    return NextResponse.json({ ok: false, error: 'Missing mission id' }, { status: 400 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty OK */ }

  const kind = String(body.kind || '').toLowerCase() as ContractKind;
  if (kind !== 'essai' && kind !== 'chef' && kind !== 'client') {
    return NextResponse.json({ ok: false, error: 'kind must be essai|chef|client' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // ── 1. Charger la mission
  const { data: mission, error: mErr } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .maybeSingle();
  if (mErr) {
    return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 });
  }
  if (!mission) {
    return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 });
  }

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

  // ── 2. Charger chef + client (selon ce dont on a besoin)
  let chefProfile: { firstName: string; lastName: string; email: string; phone?: string } | null = null;
  if (mission.chef_id) {
    const { data: c } = await supabase
      .from('chef_profiles')
      .select('email, profile')
      .eq('user_id', mission.chef_id)
      .maybeSingle();
    if (c) {
      const p = (c.profile || {}) as any;
      chefProfile = {
        firstName: p.firstName || splitName(p.name || mission.chef_name).first,
        lastName: p.lastName || splitName(p.name || mission.chef_name).last,
        email: c.email,
        phone: p.phone || p.phoneNumber || undefined,
      };
    }
  }

  let clientReq: { fullName: string; email: string; phone?: string; companyName?: string } | null = null;
  if (mission.request_id) {
    const { data: r } = await supabase
      .from('client_requests')
      .select('full_name, first_name, email, phone, company_name')
      .eq('id', mission.request_id)
      .maybeSingle();
    if (r) {
      clientReq = {
        fullName: r.full_name || r.first_name || '',
        email: r.email,
        phone: r.phone || undefined,
        companyName: r.company_name || undefined,
      };
    }
  }

  // ── 3. Reconstruire contractData (mêmes defaults que ContractsPanel)
  const contractsData = (mission.contracts_data || {}) as {
    essai?: Partial<EssaiData>;
    chef?: Partial<ChefContractData>;
    client?: Partial<ClientContractData>;
  };

  const missionLike = {
    chef_name: mission.chef_name,
    chef_email: mission.chef_email,
    location: mission.location,
    start_date: mission.start_date,
    end_date: mission.end_date,
    guest_count: mission.guest_count,
    service_level: mission.service_level,
    chef_amount: mission.chef_amount,
    client_amount: mission.client_amount,
  };
  const clientLike = {
    fullName: clientReq?.fullName ?? null,
    companyName: clientReq?.companyName ?? null,
  };

  // ── 4. Build HTML
  let html: string;
  let contractSnapshot: any;
  let docNameSuffix: string;
  if (kind === 'essai') {
    const data = { ...buildEssaiDefaults(missionLike, clientLike), ...(contractsData.essai ?? {}) } as EssaiData;
    html = renderEssai(data);
    contractSnapshot = data;
    docNameSuffix = `essai_${data.trialDate || mission.start_date || ''}`;
  } else if (kind === 'chef') {
    const data = { ...buildChefDefaults(missionLike), ...(contractsData.chef ?? {}) } as ChefContractData;
    html = renderChef(data);
    contractSnapshot = data;
    docNameSuffix = `chef_${data.chefName || mission.chef_name || ''}`;
  } else {
    const data = { ...buildClientDefaults(missionLike, clientLike), ...(contractsData.client ?? {}) } as ClientContractData;
    html = renderClient(data);
    contractSnapshot = data;
    docNameSuffix = `client_${data.clientName || clientReq?.fullName || ''}`;
  }

  // ── 5. HTML → PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await htmlToPdf(html);
  } catch (e: any) {
    console.error('[send-signature] htmlToPdf error', e?.message || e);
    return NextResponse.json({ ok: false, stage: 'htmlToPdf', error: e?.message }, { status: 500 });
  }

  let pdfMeta: Awaited<ReturnType<typeof getPdfMeta>>;
  try {
    pdfMeta = await getPdfMeta(pdfBuffer);
  } catch (e: any) {
    console.error('[send-signature] getPdfMeta error', e?.message || e);
    return NextResponse.json({ ok: false, stage: 'pdfMeta', error: e?.message }, { status: 500 });
  }

  // ── 6. Construire les signataires
  // Thomas (l'Agence) — défaut + override possible via env
  const agencySigner: YousignSignerInput = {
    firstName: process.env.YOUSIGN_AGENCY_FIRST_NAME || 'Thomas',
    lastName: process.env.YOUSIGN_AGENCY_LAST_NAME || 'Delcroix',
    email: process.env.YOUSIGN_AGENCY_EMAIL || 'contact@chefstalents.com',
    role: 'agency',
  };

  const signers: YousignSignerInput[] = [];
  const missingFields: string[] = [];

  if (kind === 'essai' || kind === 'client') {
    if (!clientReq?.email || !clientReq?.fullName) {
      missingFields.push('client (full_name + email)');
    } else {
      const sn = splitName(clientReq.fullName);
      signers.push({
        firstName: sn.first,
        lastName: sn.last,
        email: clientReq.email,
        phoneNumber: clientReq.phone,
        role: 'client',
      });
    }
  }

  if (kind === 'essai' || kind === 'chef') {
    if (!chefProfile?.email) {
      missingFields.push('chef (email + name)');
    } else {
      signers.push({
        firstName: chefProfile.firstName,
        lastName: chefProfile.lastName,
        email: chefProfile.email,
        phoneNumber: chefProfile.phone,
        role: 'chef',
      });
    }
  }

  signers.push(agencySigner);

  if (missingFields.length > 0) {
    return NextResponse.json({
      ok: false,
      error: 'MISSING_SIGNER_DATA',
      missing: missingFields,
      message: `Données signataires incomplètes : ${missingFields.join(', ')}.`,
    }, { status: 400 });
  }

  // ── 7. YouSign
  let result: Awaited<ReturnType<typeof sendForSignature>>;
  try {
    result = await sendForSignature({
      name: `Contrat ${kind} — ${docNameSuffix}`.slice(0, 200),
      pdfBuffer,
      filename: `Contrat_${kind}_${(docNameSuffix || 'chefstalents').replace(/[^a-zA-Z0-9_]/g, '_')}.pdf`,
      signers,
      pdfMeta,
    });
  } catch (e: any) {
    console.error('[send-signature] YouSign error', e?.message || e, e?.body);
    return NextResponse.json({
      ok: false,
      stage: 'yousign',
      error: e?.message,
      detail: e?.body,
    }, { status: 500 });
  }

  // ── 8. Insert DB
  const { data: row, error: insErr } = await supabase
    .from('signature_requests')
    .insert({
      kind,
      target_kind: 'mission',
      target_id: missionId,
      yousign_request_id: result.signatureRequest.id,
      yousign_status: result.signatureRequest.status,
      signers: signers.map((s) => ({
        name: `${s.firstName} ${s.lastName}`.trim(),
        email: s.email,
        role: s.role,
      })),
      contract_snapshot: contractSnapshot,
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
      signerCount: signers.length,
    },
  });
}
