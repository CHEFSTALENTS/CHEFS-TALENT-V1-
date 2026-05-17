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

const ALLOWED_STATUSES = new Set([
  'shortlisted',
  'pitched',
  'accepted',
  'declined',
  'expired',
]);

const ALLOWED_CHANNELS = new Set(['email', 'whatsapp', 'manual']);

// =============================================================
// GET /api/admin/proposals/[id]
// =============================================================
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('mission_proposals')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('[admin/proposals/[id]] GET error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (e: any) {
    console.error('[admin/proposals/[id]] GET fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// PUT /api/admin/proposals/[id]
// Body : { status?, channel?, notes?, chefAmount?, clientAmount?, ... }
// Permet à l'admin de mettre à jour le statut manuellement (le chef
// répond par WhatsApp / téléphone, l'admin reflète ici).
// =============================================================
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
    const supabase = supabaseAdmin();

    const patch: Record<string, any> = {};

    if (body.status !== undefined) {
      const s = String(body.status).toLowerCase();
      if (!ALLOWED_STATUSES.has(s)) {
        return NextResponse.json(
          { error: `Invalid status: ${s}` },
          { status: 400 }
        );
      }
      patch.status = s;

      // Si on passe à pitched/accepted/declined, on met à jour les
      // timestamps correspondants.
      const nowIso = new Date().toISOString();
      if (s === 'pitched') patch.pitched_at = nowIso;
      if (s === 'accepted' || s === 'declined') patch.responded_at = nowIso;
    }

    if (body.channel !== undefined) {
      if (body.channel === null || body.channel === '') {
        patch.channel = null;
      } else {
        const c = String(body.channel).toLowerCase();
        if (!ALLOWED_CHANNELS.has(c)) {
          return NextResponse.json(
            { error: `Invalid channel: ${c}` },
            { status: 400 }
          );
        }
        patch.channel = c;
      }
    }

    // Champs éditables (les autres sont snapshots au moment de la
    // création, on n'autorise pas leur modification a posteriori).
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.chefAmount !== undefined) patch.chef_amount = body.chefAmount;
    if (body.clientAmount !== undefined) patch.client_amount = body.clientAmount;
    if (body.contractUrl !== undefined) patch.contract_url = body.contractUrl;

    if (
      patch.chef_amount !== undefined &&
      patch.client_amount !== undefined &&
      patch.chef_amount !== null &&
      patch.client_amount !== null
    ) {
      patch.commission_amount =
        Number(patch.client_amount) - Number(patch.chef_amount);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'No editable field provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('mission_proposals')
      .update(patch)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) {
      console.error('[admin/proposals/[id]] PUT error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, proposal: data });
  } catch (e: any) {
    console.error('[admin/proposals/[id]] PUT fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// DELETE /api/admin/proposals/[id]
// Pour supprimer une proposal créée par erreur. Pas de soft-delete
// pour l'instant — la table est en RLS strict, l'admin a la main.
// =============================================================
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from('mission_proposals')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('[admin/proposals/[id]] DELETE error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[admin/proposals/[id]] DELETE fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
