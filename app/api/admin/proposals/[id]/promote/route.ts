export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =============================================================
// POST /api/admin/proposals/[id]/promote
//
// Convertit une proposal en mission confirmée :
//   1) Insert dans missions (status='confirmed') avec snapshot des
//      données de la proposal
//   2) Update la proposal : status='accepted',
//      promoted_to_mission_id = nouvelle mission, responded_at = now
//   3) Décline auto les autres proposals de la même request
//      (status='declined' si encore shortlisted/pitched)
//   4) Update la client_request : status='assigned'
//
// Body (optionnel) : peut surcharger snapshot avant promote
// =============================================================
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const supabase = supabaseAdmin();
    const proposalId = params.id;
    const body = await req.json().catch(() => ({}));

    // 1) Lire la proposal source
    const { data: proposal, error: e1 } = await supabase
      .from('mission_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (e1 || !proposal) {
      return NextResponse.json(
        { error: e1?.message || 'Proposal not found' },
        { status: 404 }
      );
    }

    if (proposal.status === 'accepted' && proposal.promoted_to_mission_id) {
      return NextResponse.json(
        {
          error: 'Already promoted',
          missionId: proposal.promoted_to_mission_id,
        },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();

    // 2) Insert dans missions (status='confirmed' direct)
    const missionRow = {
      request_id: proposal.request_id || null,
      chef_id: proposal.chef_id,
      chef_email: proposal.chef_email,
      chef_name: proposal.chef_name,
      title: body.title ?? proposal.title,
      location: body.location ?? proposal.location,
      start_date: body.startDate ?? proposal.start_date,
      end_date: body.endDate ?? proposal.end_date,
      guest_count: body.guestCount ?? proposal.guest_count,
      service_level: body.serviceLevel ?? proposal.service_level,
      notes: body.notes ?? proposal.notes,
      chef_amount: body.chefAmount ?? proposal.chef_amount,
      client_amount: body.clientAmount ?? proposal.client_amount,
      commission_amount:
        body.chefAmount !== undefined && body.clientAmount !== undefined
          ? Number(body.clientAmount) - Number(body.chefAmount)
          : proposal.commission_amount,
      contract_url: body.contractUrl ?? proposal.contract_url,
      status: 'confirmed',
      offered_at: proposal.pitched_at,
      offer_email_sent_at: proposal.email_sent_at,
      confirmed_at: nowIso,
    };

    const { data: mission, error: e2 } = await supabase
      .from('missions')
      .insert(missionRow)
      .select('id')
      .single();

    if (e2 || !mission) {
      console.error('[proposals/promote] mission insert failed', e2?.message);
      return NextResponse.json(
        { error: e2?.message || 'Failed to create mission' },
        { status: 500 }
      );
    }

    const missionId = mission.id;

    // 3) Update la proposal : accepted + promoted_to_mission_id
    const { error: e3 } = await supabase
      .from('mission_proposals')
      .update({
        status: 'accepted',
        responded_at: nowIso,
        promoted_to_mission_id: missionId,
      })
      .eq('id', proposalId);

    if (e3) {
      console.error('[proposals/promote] proposal update failed', e3.message);
      // On ne rollback pas la mission : Thomas pourra re-promote ou
      // patcher manuellement. Mais on signale l'erreur.
    }

    // 4) Décline auto les autres proposals de la même request
    if (proposal.request_id) {
      const { error: e4 } = await supabase
        .from('mission_proposals')
        .update({
          status: 'declined',
          responded_at: nowIso,
        })
        .eq('request_id', proposal.request_id)
        .neq('id', proposalId)
        .in('status', ['shortlisted', 'pitched']);

      if (e4) {
        console.error('[proposals/promote] auto-decline failed', e4.message);
      }
    }

    // 5) Update la client_request en 'assigned'
    if (proposal.request_id) {
      await supabase
        .from('client_requests')
        .update({ status: 'assigned' })
        .eq('id', proposal.request_id);
    }

    return NextResponse.json({
      ok: true,
      missionId,
      proposalId,
    });
  } catch (e: any) {
    console.error('[admin/proposals/promote] fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
