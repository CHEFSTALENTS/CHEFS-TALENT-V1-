// app/api/admin/missions/[id]/payments/[paymentId]/route.ts
//
// PATCH  /api/admin/missions/[id]/payments/[paymentId]
//   Modifie une échéance. Plusieurs intents possibles via le body :
//     - { action: 'mark-paid', paidAmountEur?, paymentMethod, paymentReference?, paidAt? }
//     - { action: 'unmark-paid' }            → repasse status='pending'
//     - { action: 'cancel' }                  → status='cancelled'
//     - { action: 'mark-reminded' }           → incrémente reminder_count + last_reminded_at
//     - { action: 'edit', amountEur?, dueDate?, label?, notes? }  → simple édit
//
// DELETE /api/admin/missions/[id]/payments/[paymentId]
//   Supprime physiquement une échéance.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const VALID_METHODS = new Set([
  'virement', 'cb_link', 'revolut', 'stripe', 'especes', 'cheque', 'autre',
]);

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; paymentId: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: missionId, paymentId } = await ctx.params;
  if (!missionId || !paymentId) {
    return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty OK */ }

  const action = String(body.action || 'edit');
  const supabase = supabaseAdmin();

  // Vérifie l'appartenance à la mission
  const { data: existing } = await supabase
    .from('mission_payments')
    .select('*')
    .eq('id', paymentId)
    .eq('mission_id', missionId)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 });
  }

  const updates: Record<string, any> = {};

  if (action === 'mark-paid') {
    const method = String(body.paymentMethod || '').trim();
    if (method && !VALID_METHODS.has(method)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_METHOD', message: `Méthode invalide. Valeurs : ${Array.from(VALID_METHODS).join(', ')}` },
        { status: 400 },
      );
    }
    updates.status = 'paid';
    updates.paid_at = body.paidAt ? new Date(body.paidAt).toISOString() : new Date().toISOString();
    updates.paid_amount_eur = body.paidAmountEur != null ? Number(body.paidAmountEur) : Number(existing.amount_eur);
    updates.payment_method = method || null;
    updates.payment_reference = String(body.paymentReference || '').trim() || null;
  } else if (action === 'unmark-paid') {
    updates.status = 'pending';
    updates.paid_at = null;
    updates.paid_amount_eur = null;
    updates.payment_method = null;
    updates.payment_reference = null;
  } else if (action === 'cancel') {
    updates.status = 'cancelled';
  } else if (action === 'mark-reminded') {
    updates.last_reminded_at = new Date().toISOString();
    updates.reminder_count = (existing.reminder_count || 0) + 1;
  } else if (action === 'edit') {
    if (body.amountEur != null) {
      const amt = Number(body.amountEur);
      if (!Number.isFinite(amt) || amt <= 0) {
        return NextResponse.json({ ok: false, error: 'INVALID_AMOUNT' }, { status: 400 });
      }
      updates.amount_eur = amt;
    }
    if (body.dueDate != null) {
      const d = String(body.dueDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return NextResponse.json({ ok: false, error: 'INVALID_DATE' }, { status: 400 });
      }
      updates.due_date = d;
    }
    if (body.label !== undefined) updates.label = String(body.label || '').trim() || null;
    if (body.notes !== undefined) updates.notes = String(body.notes || '').trim() || null;
  } else {
    return NextResponse.json({ ok: false, error: 'UNKNOWN_ACTION' }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, payment: existing, noop: true });
  }

  const { data: row, error } = await supabase
    .from('mission_payments')
    .update(updates)
    .eq('id', paymentId)
    .select('*')
    .single();

  if (error) {
    console.error('[admin/missions/[id]/payments/[paymentId] PATCH] update error', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payment: row, action });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string; paymentId: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: missionId, paymentId } = await ctx.params;
  if (!missionId || !paymentId) {
    return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from('mission_payments')
    .delete()
    .eq('id', paymentId)
    .eq('mission_id', missionId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
