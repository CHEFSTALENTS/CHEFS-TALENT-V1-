export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { signChefUrl } from '@/lib/storage';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// =============================================================
// GET /api/admin/missions/[id]
// Retourne la mission + données enrichies (chef profile, client
// request, proposals liées) pour la page back-office /admin/missions/[id].
// =============================================================
export async function GET(
  req: Request,
  ctx: { params: { id: string } },
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = decodeURIComponent(ctx.params.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // 1. Mission principale
    const { data: mission, error: mErr } = await supabase
      .from('missions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (mErr) {
      console.error('[admin/missions/[id]] GET mission error', mErr.message);
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // 2. Chef profile (via chef_id = chef_profiles.user_id)
    let chef: any = null;
    if (mission.chef_id) {
      const { data: chefRow } = await supabase
        .from('chef_profiles')
        .select('user_id, email, profile')
        .eq('user_id', mission.chef_id)
        .maybeSingle();
      if (chefRow) {
        const profile = chefRow.profile || {};
        chef = {
          userId: chefRow.user_id,
          email: chefRow.email,
          firstName: profile.firstName || null,
          lastName: profile.lastName || null,
          name:
            `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
            profile.name ||
            null,
          phone: profile.phone || profile.phoneNumber || null,
          baseCity:
            profile?.location?.baseCity || profile?.baseCity || null,
          // Bucket chef-uploads privé → on signe l'URL avant retour
          avatarUrl: await signChefUrl(
            profile?.avatarUrl || profile?.photoUrl || null,
            3600,
          ),
          status: profile?.status || null,
        };
      }
    }

    // 3. Client request (si liée)
    let clientRequest: any = null;
    if (mission.request_id) {
      const { data: req } = await supabase
        .from('client_requests')
        .select('*')
        .eq('id', mission.request_id)
        .maybeSingle();
      if (req) {
        clientRequest = {
          id: req.id,
          email: req.email,
          fullName: req.full_name || req.first_name,
          phone: req.phone,
          clientType: req.client_type,
          companyName: req.company_name,
          status: req.status,
          matchType: req.match_type,
          notes: req.notes || req.message,
          createdAt: req.created_at,
          budgetRange: req.budget_range,
          budgetAmount: req.budget_amount,
          budgetUnit: req.budget_unit,
        };
      }
    }

    // 4. Proposals liées (si la table existe — créée en PR #29)
    // On lit toutes les proposals associées à la même request_id pour
    // donner du contexte (qui a été proposé avant que cette mission ne
    // soit créée).
    let proposals: any[] = [];
    if (mission.request_id) {
      const { data: props } = await supabase
        .from('mission_proposals')
        .select('*')
        .eq('request_id', mission.request_id)
        .order('created_at', { ascending: false });
      if (props) {
        proposals = props;
      }
    }

    return NextResponse.json({
      ok: true,
      mission,
      chef,
      clientRequest,
      proposals,
    });
  } catch (e: any) {
    console.error('[admin/missions/[id]] GET fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// PATCH /api/admin/missions/[id]
// Update partiel d'une mission. Champs autorisés :
//   - status : 'offered' | 'accepted' | 'confirmed' | 'in_progress'
//              | 'completed' | 'cancelled' | 'declined'
//   - contractUrl
//   - contractSignedAt : ISO string ou null (pour marquer signé / annuler)
//   - notes
//   - chefAmount, clientAmount (recompute commission)
// Ne touche PAS aux champs de paiement (utiliser /mark-paid / /mark-pending).
// =============================================================
const ALLOWED_STATUSES = new Set([
  'offered',
  'accepted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'declined',
]);

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } },
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = decodeURIComponent(ctx.params.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};

    if (body.status !== undefined) {
      const s = String(body.status).toLowerCase();
      if (!ALLOWED_STATUSES.has(s)) {
        return NextResponse.json(
          { error: `Invalid status: ${s}` },
          { status: 400 },
        );
      }
      patch.status = s;
      const nowIso = new Date().toISOString();
      // Timestamps automatiques selon transition
      if (s === 'confirmed') patch.confirmed_at = nowIso;
      if (s === 'cancelled' || s === 'declined') {
        // pas de champ cancelled_at en DB pour l'instant — note dans updated_at
      }
    }

    if (body.contractUrl !== undefined) {
      patch.contract_url = body.contractUrl || null;
    }

    if (body.contractSignedAt !== undefined) {
      // Accepte ISO string, true (= now), false/null (= reset)
      if (body.contractSignedAt === true) {
        patch.contract_signed_at = new Date().toISOString();
      } else if (
        body.contractSignedAt === false ||
        body.contractSignedAt === null
      ) {
        patch.contract_signed_at = null;
      } else {
        patch.contract_signed_at = String(body.contractSignedAt);
      }
    }

    if (body.notes !== undefined) patch.notes = body.notes || null;
    if (body.title !== undefined) patch.title = body.title || null;
    if (body.location !== undefined) patch.location = body.location || null;
    if (body.startDate !== undefined) patch.start_date = body.startDate || null;
    if (body.endDate !== undefined) patch.end_date = body.endDate || null;
    if (body.guestCount !== undefined) patch.guest_count = body.guestCount;
    if (body.serviceLevel !== undefined) patch.service_level = body.serviceLevel || null;
    if (body.chefAmount !== undefined) patch.chef_amount = body.chefAmount;
    if (body.clientAmount !== undefined) patch.client_amount = body.clientAmount;

    if (
      body.chefAmount !== undefined &&
      body.clientAmount !== undefined &&
      body.chefAmount != null &&
      body.clientAmount != null
    ) {
      patch.commission_amount =
        Number(body.clientAmount) - Number(body.chefAmount);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'No editable field provided' },
        { status: 400 },
      );
    }

    patch.updated_at = new Date().toISOString();

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('missions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/missions/[id]] PATCH error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, mission: data });
  } catch (e: any) {
    console.error('[admin/missions/[id]] PATCH fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
