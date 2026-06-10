// app/api/admin/missions/at-risk/route.ts
//
// GET /api/admin/missions/at-risk
// Liste les missions confirmées qui démarrent dans ≤ 14 jours
// avec leurs flags de risque :
//   - !contractSigned : pas de contract_signed_at ET pas de signature_requests
//                       chef+client en 'done'
//   - !nccSigned      : aucun signature_requests kind='ncc' lié à la request
//                       parente en statut 'done'
//
// Utilisé par le widget UpcomingMissionsRiskPanel sur /admin.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const WINDOW_DAYS = 14;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type MissionAtRisk = {
  id: string;
  request_id: string | null;
  chef_name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  client_amount: number | null;
  chef_amount: number | null;
  contract_signed_at?: string | null;
  daysUntilStart: number;
  contractSigned: boolean;
  nccSigned: boolean;
  hasAnyRisk: boolean;
};

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const supabase = getSupabase();

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const horizon = new Date(now.getTime() + WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  // 1. Récupère missions confirmées dans la fenêtre.
  //    On tente d'abord avec contract_signed_at, fallback sans si la
  //    colonne n'existe pas sur cet environnement (migration partielle).
  const baseSelect = 'id, request_id, chef_name, location, start_date, end_date, client_amount, chef_amount';
  let useContractSignedColumn = true;
  let firstAttempt: { data: any[] | null; error: any } = await supabase
    .from('missions')
    .select(`${baseSelect}, contract_signed_at`)
    .eq('status', 'confirmed')
    .gte('start_date', todayIso)
    .lte('start_date', horizon)
    .order('start_date', { ascending: true });

  if (firstAttempt.error) {
    const msg = String(firstAttempt.error.message || '').toLowerCase();
    if (msg.includes('contract_signed_at') || msg.includes('does not exist') || msg.includes('column')) {
      // Fallback : colonne legacy absente → on s'appuiera uniquement
      // sur les signature_requests pour le check contrat.
      useContractSignedColumn = false;
      firstAttempt = await supabase
        .from('missions')
        .select(baseSelect)
        .eq('status', 'confirmed')
        .gte('start_date', todayIso)
        .lte('start_date', horizon)
        .order('start_date', { ascending: true });
    }
  }

  if (firstAttempt.error) {
    return NextResponse.json({ ok: false, error: firstAttempt.error.message }, { status: 500 });
  }

  const rows = (firstAttempt.data || []) as Array<{
    id: string;
    request_id: string | null;
    chef_name: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    client_amount: number | null;
    chef_amount: number | null;
    contract_signed_at?: string | null;
  }>;

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, missions: [] });
  }

  // 2. Pour les missions où contract_signed_at est null (ou absent du
  //    schéma), on regarde les signature_requests liées
  //    (target_kind='mission', kind∈{chef,client})
  const missionIds = rows
    .filter((r) => useContractSignedColumn ? !r.contract_signed_at : true)
    .map((r) => r.id);
  let sigByMission: Record<string, { chef: boolean; client: boolean }> = {};
  if (missionIds.length > 0) {
    const { data: sigs } = await supabase
      .from('signature_requests')
      .select('target_id, kind, yousign_status')
      .eq('target_kind', 'mission')
      .in('target_id', missionIds)
      .in('kind', ['chef', 'client']);

    for (const s of sigs || []) {
      const mid = String((s as any).target_id || '');
      if (!sigByMission[mid]) sigByMission[mid] = { chef: false, client: false };
      const done = String((s as any).yousign_status || '').toLowerCase() === 'done';
      if (done) {
        if ((s as any).kind === 'chef') sigByMission[mid].chef = true;
        if ((s as any).kind === 'client') sigByMission[mid].client = true;
      }
    }
  }

  // 3. NCC : on regarde les signature_requests target_kind='request', kind='ncc'
  //    sur les request_id liées à ces missions
  const requestIds = rows.map((r) => r.request_id).filter((x): x is string => !!x);
  const nccSignedRequestIds = new Set<string>();
  if (requestIds.length > 0) {
    const { data: nccs } = await supabase
      .from('signature_requests')
      .select('target_id, yousign_status')
      .eq('target_kind', 'request')
      .eq('kind', 'ncc')
      .in('target_id', requestIds);

    for (const n of nccs || []) {
      if (String((n as any).yousign_status || '').toLowerCase() === 'done') {
        nccSignedRequestIds.add(String((n as any).target_id || ''));
      }
    }
  }

  // 4. Assemble + flags
  const out: MissionAtRisk[] = rows.map((r) => {
    const daysUntilStart = r.start_date
      ? Math.max(0, Math.ceil((new Date(r.start_date).getTime() - now.getTime()) / 86400000))
      : 999;

    const sigStatus = sigByMission[r.id] || { chef: false, client: false };
    const contractSigned =
      !!r.contract_signed_at || (sigStatus.chef && sigStatus.client);

    const nccSigned = r.request_id ? nccSignedRequestIds.has(r.request_id) : false;

    const hasAnyRisk = !contractSigned || !nccSigned;

    return {
      ...r,
      daysUntilStart,
      contractSigned,
      nccSigned,
      hasAnyRisk,
    };
  });

  return NextResponse.json({ ok: true, missions: out });
}
