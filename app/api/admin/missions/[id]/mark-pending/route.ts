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
// PATCH /api/admin/missions/[id]/mark-pending
// Annule le marquage payé d'une mission (cas erreur de saisie,
// chargeback, etc.). Reset payment_status='pending' et clear les
// champs paid_at, paid_amount, payment_method, payment_reference.
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

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from('missions')
      .update({
        payment_status: 'pending',
        paid_at: null,
        paid_amount: null,
        payment_method: null,
        payment_reference: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', missionId)
      .select('*')
      .single();

    if (error) {
      console.error(
        '[admin/missions/mark-pending] update error',
        error.message,
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, mission: data });
  } catch (e: any) {
    console.error('[admin/missions/mark-pending] fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
