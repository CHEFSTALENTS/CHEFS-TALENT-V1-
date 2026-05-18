// app/api/admin/signature-requests/[id]/cancel/route.ts
//
// Annule une signature_request en cours (status='ongoing' ou 'draft').
// Utilisé quand l'admin réalise qu'il a fait une erreur (mauvais email,
// mauvais signataire, etc.) et veut renvoyer proprement.
//
// POST /api/admin/signature-requests/[id]/cancel
//   body : { reason?: string }
//
// Comportement :
//   1. Charge la ligne signature_requests
//   2. Appelle l'API YouSign (cancel pour ongoing, delete pour draft)
//   3. Update DB → yousign_status='cancelled'
//
// Après annulation, l'admin peut relancer un nouvel envoi (l'idempotence
// 409 ALREADY_PENDING ne bloque plus puisque status n'est plus draft/ongoing).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import {
  cancelSignatureRequest,
  deleteSignatureRequest,
} from '@/lib/yousign/client';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const id = decodeURIComponent((await ctx.params).id || '').trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing signature_request id' }, { status: 400 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty OK */ }
  const reason = String(body.reason || '').trim() || 'Annulation par l\'Agence';

  const supabase = supabaseAdmin();

  // 1. Charge la ligne
  const { data: row, error: rowErr } = await supabase
    .from('signature_requests')
    .select('id, yousign_request_id, yousign_status, kind, target_kind, target_id')
    .eq('id', id)
    .maybeSingle();
  if (rowErr) {
    return NextResponse.json({ ok: false, error: rowErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ ok: false, error: 'signature_request not found' }, { status: 404 });
  }

  // Refuse si déjà finalisé (signé/refusé/expiré/annulé) → rien à annuler
  const finalStatuses = new Set(['done', 'declined', 'expired', 'cancelled']);
  if (finalStatuses.has(row.yousign_status)) {
    return NextResponse.json({
      ok: false,
      error: 'ALREADY_FINALIZED',
      message: `Cette signature est déjà en statut « ${row.yousign_status} », elle ne peut pas être annulée.`,
    }, { status: 409 });
  }

  // 2. Appelle YouSign — cancel pour ongoing, delete pour draft
  if (row.yousign_request_id) {
    try {
      if (row.yousign_status === 'draft') {
        await deleteSignatureRequest(row.yousign_request_id);
      } else {
        // ongoing (ou autre) → cancel
        await cancelSignatureRequest(row.yousign_request_id, reason);
      }
    } catch (e: any) {
      console.error('[cancel] YouSign error', e?.message || e, e?.body);
      // Continue quand même : on update notre DB pour que l'admin puisse relancer
      // (la SR côté YouSign restera ouverte mais ne nous bloquera plus)
    }
  }

  // 3. Update DB
  const { error: updErr } = await supabase
    .from('signature_requests')
    .update({
      yousign_status: 'cancelled',
      completed_at: new Date().toISOString(),
      error_message: reason,
    })
    .eq('id', id);

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Signature annulée. Tu peux maintenant relancer un nouvel envoi.',
  });
}
