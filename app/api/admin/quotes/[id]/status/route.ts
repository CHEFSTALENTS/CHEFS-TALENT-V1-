// app/api/admin/quotes/[id]/status/route.ts
//
// PATCH /api/admin/quotes/:id/status
// Change le statut d'un devis avec workflow complet :
//   - new status (sent / accepted / declined / expired / cancelled / draft)
//   - date personnalisée (sent_at / accepted_at / declined_at / expired_at / cancelled_at)
//   - motif (status_reason)
//   - montant final négocié optionnel (final_amount_ht_eur + final_amount_ttc_eur)
//
// Met à jour automatiquement la colonne *_at correspondant au nouveau statut,
// ou utilise la date fournie par l'admin si présente.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const VALID_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
  'cancelled',
] as const;
type QuoteStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: string): s is QuoteStatus {
  return (VALID_STATUSES as readonly string[]).includes(s);
}

/**
 * Selon le nouveau statut, le nom de la colonne *_at à remplir.
 * Pour 'draft' : on ne touche à aucune date d'événement.
 */
function statusDateColumn(status: QuoteStatus): string | null {
  switch (status) {
    case 'sent':      return 'sent_at';
    case 'accepted':  return 'accepted_at';
    case 'declined':  return 'declined_at';
    case 'expired':   return 'expired_at';
    case 'cancelled': return 'cancelled_at';
    case 'draft':     return null;
  }
}

function parseAmount(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const { status, eventDate, statusReason, finalAmountHt, finalAmountTtc } = body || {};

  if (!status || typeof status !== 'string' || !isValidStatus(status)) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_STATUS', allowed: VALID_STATUSES },
      { status: 400 },
    );
  }

  // Date de l'événement : ISO string si fournie, sinon now()
  let eventDateIso: string | null = null;
  if (status !== 'draft') {
    if (eventDate && typeof eventDate === 'string') {
      // Tolère YYYY-MM-DD ou ISO complet
      const d = new Date(eventDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_EVENT_DATE' },
          { status: 400 },
        );
      }
      eventDateIso = d.toISOString();
    } else {
      eventDateIso = new Date().toISOString();
    }
  }

  const updates: Record<string, any> = { status };

  const dateCol = statusDateColumn(status);
  if (dateCol && eventDateIso) {
    updates[dateCol] = eventDateIso;
  }

  if (typeof statusReason === 'string') {
    updates.status_reason = statusReason.trim() || null;
  }

  const finalHt = parseAmount(finalAmountHt);
  const finalTtc = parseAmount(finalAmountTtc);
  if (finalAmountHt !== undefined) updates.final_amount_ht_eur = finalHt;
  if (finalAmountTtc !== undefined) updates.final_amount_ttc_eur = finalTtc;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[quotes/status] update error', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, quote: data });
}
