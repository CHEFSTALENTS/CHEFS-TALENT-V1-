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
//
// ⚠️ SÉMANTIQUE : « payée » ici = le CLIENT a réglé Chefs Talents.
// Le versement au chef est géré séparément hors-app pour l'instant.
// Donc paidAmount correspond au MONTANT ENCAISSÉ DU CLIENT (généralement
// = client_amount).
//
// Body :
//   {
//     paymentStatus?: 'paid' | 'partial' | 'refunded',  // default 'paid'
//     paidAmount?: number,        // default = mission.chef_amount (sera
//                                  //  recalculé côté UI sur client_amount)
//     paymentMethod?: 'sepa' | 'stripe' | 'cash' | 'wire' | 'check' | 'other',
//     paymentReference?: string,
//   }
//
// La mission doit être en status='confirmed' (sinon 400). Il est inutile
// de marquer encaissée une mission qui n'a pas été confirmée.
// =============================================================
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const missionId = decodeURIComponent((await ctx.params).id || '').trim();
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
    // Default = client_amount (= ce qu'on facture au client, donc le
    // montant attendu pour l'encaissement). Fallback sur chef_amount
    // si client_amount est null pour ne pas crasher sur les vieilles
    // missions sans prix client renseigné.
    const finalAmount =
      paidAmount !== undefined && paidAmount !== null
        ? Number(paidAmount)
        : Number(mission.client_amount ?? mission.chef_amount ?? 0);

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
