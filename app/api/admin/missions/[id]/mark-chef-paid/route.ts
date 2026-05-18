// app/api/admin/missions/[id]/mark-chef-paid/route.ts
//
// PATCH : marque le CHEF comme payé pour cette mission.
//
// ⚠️ Distinction importante :
//   /mark-paid       → le CLIENT a payé Chefs Talents (encaissement agence)
//   /mark-chef-paid  → Chefs Talents a payé le CHEF (versement chef)
//
// Body : {
//   chefPaidAmount?: number,        // défaut = mission.chef_amount
//   chefPaidMethod?: string,        // 'virement', 'revolut', 'especes', etc.
//   chefPaidReference?: string,     // n° virement, etc.
//   chefPaidAt?: string,            // ISO timestamp, défaut = now
// }
//
// Méthode DELETE : annule le marquage (chef_paid_at = null)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const ALLOWED_METHODS = new Set([
  'virement', 'cb_link', 'revolut', 'stripe', 'especes', 'cheque', 'autre',
]);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const missionId = decodeURIComponent((await ctx.params).id || '').trim();
    if (!missionId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      chefPaidAmount,
      chefPaidMethod,
      chefPaidReference,
      chefPaidAt,
    } = body;

    if (chefPaidMethod !== undefined && chefPaidMethod !== null && chefPaidMethod !== '') {
      const m = String(chefPaidMethod).toLowerCase();
      if (!ALLOWED_METHODS.has(m)) {
        return NextResponse.json({ error: `Invalid chefPaidMethod: ${m}` }, { status: 400 });
      }
    }

    const supabase = supabaseAdmin();

    // Charge la mission pour avoir le chef_amount par défaut
    const { data: mission, error: fetchErr } = await supabase
      .from('missions')
      .select('id, chef_amount')
      .eq('id', missionId)
      .single();

    if (fetchErr || !mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    const finalAmount =
      chefPaidAmount !== undefined && chefPaidAmount !== null
        ? Number(chefPaidAmount)
        : Number(mission.chef_amount ?? 0);

    const nowIso = new Date().toISOString();
    const paidAtIso = chefPaidAt ? new Date(chefPaidAt).toISOString() : nowIso;

    const { data: updated, error: updateErr } = await supabase
      .from('missions')
      .update({
        chef_paid_at: paidAtIso,
        chef_paid_amount: finalAmount > 0 ? finalAmount : null,
        chef_paid_method: chefPaidMethod ? String(chefPaidMethod).toLowerCase() : null,
        chef_paid_reference: chefPaidReference || null,
        updated_at: nowIso,
      })
      .eq('id', missionId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[mark-chef-paid] update error', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, mission: updated });
  } catch (e: any) {
    console.error('[mark-chef-paid] fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE : annule le marquage chef payé
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const missionId = decodeURIComponent((await ctx.params).id || '').trim();
    if (!missionId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from('missions')
      .update({
        chef_paid_at: null,
        chef_paid_amount: null,
        chef_paid_method: null,
        chef_paid_reference: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
