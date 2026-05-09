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

const ALLOWED_METHODS = new Set([
  'sepa',
  'stripe',
  'cash',
  'wire',
  'check',
  'other',
]);

const ALLOWED_STATUSES = new Set(['paid', 'partial', 'refunded']);

// =============================================================
// PATCH /api/admin/missions/[id]/mark-paid
// Body :
//   {
//     paymentStatus?: 'paid' | 'partial' | 'refunded',  // default 'paid'
//     paidAmount?: number,        // default = mission.chef_amount
//     paymentMethod?: 'sepa' | 'stripe' | 'cash' | 'wire' | 'check' | 'other',
//     paymentReference?: string,
//   }
//
// La mission doit être en status='confirmed' (sinon 400) pour être
// marquée payée. Il est inutile de marquer payée une mission qui n'a
// pas été confirmée.
// =============================================================
export async function PATCH(
  req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const missionId = decodeURIComponent(ctx.params.id || '').trim();
    if (!missionId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      paymentStatus = 'paid',
      paidAmount,
      paymentMethod,
      paymentReference,
    } = body;

    const status = String(paymentStatus).toLowerCase();
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid paymentStatus: ${status}` },
        { status: 400 }
      );
    }

    if (paymentMethod !== undefined && paymentMethod !== null) {
      const m = String(paymentMethod).toLowerCase();
      if (!ALLOWED_METHODS.has(m)) {
        return NextResponse.json(
          { error: `Invalid paymentMethod: ${m}` },
          { status: 400 }
        );
      }
    }

    const supabase = supabaseAdmin();

    // 1) Lire la mission pour valider le state
    const { data: mission, error: fetchErr } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();

    if (fetchErr || !mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    if (mission.status !== 'confirmed') {
      return NextResponse.json(
        {
          error: `Mission must be confirmed before marking paid (current: ${mission.status})`,
        },
        { status: 400 }
      );
    }

    // 2) Update payment fields
    const finalAmount =
      paidAmount !== undefined && paidAmount !== null
        ? Number(paidAmount)
        : Number(mission.chef_amount || 0);

    const nowIso = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from('missions')
      .update({
        payment_status: status,
        paid_at: nowIso,
        paid_amount: finalAmount,
        payment_method: paymentMethod
          ? String(paymentMethod).toLowerCase()
          : null,
        payment_reference: paymentReference || null,
        updated_at: nowIso,
      })
      .eq('id', missionId)
      .select('*')
      .single();

    if (updateErr) {
      console.error(
        '[admin/missions/mark-paid] update error',
        updateErr.message,
      );
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, mission: updated });
  } catch (e: any) {
    console.error('[admin/missions/mark-paid] fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
