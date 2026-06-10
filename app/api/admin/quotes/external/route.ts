// app/api/admin/quotes/external/route.ts
//
// POST /api/admin/quotes/external
// Crée un devis "externe" — traité hors plateforme — pour le tracker
// dans les KPIs sans générer de PDF.
//
// Body :
//   {
//     destinataire_nom: string  (requis)
//     lieu?: string
//     intitule?: string
//     dates_text?: string
//     convives_text?: string
//     origin?: string           // téléphone, ancien Word, conciergerie X
//     status: 'sent'|'accepted'|'declined'|'expired'|'cancelled'  (requis)
//     eventDate?: ISO string    // sinon = now
//     statusReason?: string
//     amountHt: number          (requis pour les KPIs)
//     amountTtc?: number        // sinon = HT × 1.20
//     chefCostEur?: number      // pour le calcul de marge
//     chefTravelCostEur?: number
//     butlerRequired?: boolean
//     butlerCostEur?: number
//     adminNotes?: string
//     requestId?: string        // optionnel : lier à une demande existante
//   }
//
// Crée une row dans quotes avec is_external=true et une référence préfixée 'EXT-'.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { generateQuoteReference } from '@/lib/contracts/quoteTemplate';

const ALLOWED_STATUS = ['sent', 'accepted', 'declined', 'expired', 'cancelled'] as const;

function statusDateColumn(status: string): string | null {
  if (status === 'sent') return 'sent_at';
  if (status === 'accepted') return 'accepted_at';
  if (status === 'declined') return 'declined_at';
  if (status === 'expired') return 'expired_at';
  if (status === 'cancelled') return 'cancelled_at';
  return null;
}

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const destinataireNom = (body.destinataire_nom || '').trim();
  const status = String(body.status || '');
  const amountHt = parseNumber(body.amountHt);
  const amountTtc = parseNumber(body.amountTtc) ?? (amountHt !== null ? Math.round(amountHt * 1.20 * 100) / 100 : null);

  if (!destinataireNom) {
    return NextResponse.json({ ok: false, error: 'DESTINATAIRE_REQUIRED' }, { status: 400 });
  }
  if (!(ALLOWED_STATUS as readonly string[]).includes(status)) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_STATUS', allowed: ALLOWED_STATUS },
      { status: 400 },
    );
  }
  if (amountHt === null) {
    return NextResponse.json({ ok: false, error: 'AMOUNT_HT_REQUIRED' }, { status: 400 });
  }

  // Date événement
  let eventDateIso = new Date().toISOString();
  if (body.eventDate) {
    const d = new Date(body.eventDate);
    if (!Number.isNaN(d.getTime())) eventDateIso = d.toISOString();
  }

  const reference = `EXT-${generateQuoteReference({ type: 'CONC' })}`;

  const insertRow: Record<string, any> = {
    reference,
    request_id: body.requestId || null,
    status,
    issued_at: eventDateIso.slice(0, 10),
    is_external: true,
    external_origin: body.origin ? String(body.origin).trim() : null,

    intitule: body.intitule ? String(body.intitule).trim() : null,
    lieu: body.lieu ? String(body.lieu).trim() : null,
    dates_text: body.dates_text ? String(body.dates_text).trim() : null,
    convives_text: body.convives_text ? String(body.convives_text).trim() : null,

    destinataire_nom: destinataireNom,
    destinataire_type: body.destinataire_type ? String(body.destinataire_type).trim() : null,

    // On stocke une tariff_option unique avec les montants saisis pour
    // rester compatible avec les KPIs existants.
    tariff_options: [{
      label: 'Montant négocié',
      ht_eur: amountHt,
      tva_eur: amountTtc !== null ? Math.round((amountTtc - amountHt) * 100) / 100 : 0,
      ttc_eur: amountTtc ?? amountHt,
    }],

    // Montants finaux (= ce qui a été facturé)
    final_amount_ht_eur: amountHt,
    final_amount_ttc_eur: amountTtc,

    // Coûts internes optionnels pour la marge
    chef_cost_eur: parseNumber(body.chefCostEur),
    chef_travel_cost_eur: parseNumber(body.chefTravelCostEur),
    butler_required: !!body.butlerRequired,
    butler_cost_eur: parseNumber(body.butlerCostEur),

    status_reason: body.statusReason ? String(body.statusReason).trim() : null,
    admin_notes: body.adminNotes ? String(body.adminNotes).trim() : null,

    tva_rate_pct: 20.0,
    currency: 'EUR',
    created_by_admin_email: auth.user.email,
  };

  const dateCol = statusDateColumn(status);
  if (dateCol) insertRow[dateCol] = eventDateIso;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('quotes')
    .insert(insertRow)
    .select('*')
    .single();

  if (error) {
    console.error('[quotes/external] insert error', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, quote: data });
}
