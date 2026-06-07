// app/api/admin/requests/[id]/quote/route.ts
//
// GET  /api/admin/requests/:id/quote
//   → renvoie le devis existant lié à cette request (ou 404)
//
// POST /api/admin/requests/:id/quote
//   → crée un devis pré-rempli depuis les infos de la request
//   → status='draft', insert + retourne le row

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import {
  buildQuoteDefaults,
  generateQuoteReference,
} from '@/lib/contracts/quoteTemplate';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: requestId } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ ok: true, quote: data });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: requestId } = await params;
  const supabase = getSupabase();

  // 1. Lire la request pour pré-remplir
  const { data: request, error: reqErr } = await supabase
    .from('client_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (reqErr) return NextResponse.json({ ok: false, error: reqErr.message }, { status: 500 });
  if (!request) return NextResponse.json({ ok: false, error: 'REQUEST_NOT_FOUND' }, { status: 404 });

  // 2. Vérifier qu'il n'y a pas déjà un devis non-cancelled pour cette request
  const { data: existing } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('request_id', requestId)
    .neq('status', 'cancelled')
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      ok: false,
      error: 'QUOTE_ALREADY_EXISTS',
      existingId: existing.id,
      message: `Un devis existe déjà pour cette demande (status: ${existing.status}). Modifie-le ou annule-le d'abord.`,
    }, { status: 409 });
  }

  // 3. Pré-remplir + générer référence
  const defaults = buildQuoteDefaults(request);
  const reference = generateQuoteReference({ type: 'CONC' });

  // 4. Validité par défaut : J+15
  const validity = new Date();
  validity.setDate(validity.getDate() + 15);

  const insertRow = {
    reference,
    request_id: requestId,
    status: 'draft',
    issued_at: new Date().toISOString().slice(0, 10),
    validity_date: validity.toISOString().slice(0, 10),

    intitule: defaults.intitule,
    lieu: defaults.lieu,
    dates_text: defaults.dates_text,
    convives_text: defaults.convives_text,
    rythme_text: defaults.rythme_text,
    langues_text: defaults.langues_text,
    hebergement_text: defaults.hebergement_text,

    emetteur_nom: defaults.emetteur_nom,
    emetteur_ville: defaults.emetteur_ville,
    emetteur_siret: defaults.emetteur_siret,
    emetteur_tva: defaults.emetteur_tva,

    destinataire_nom: defaults.destinataire_nom,
    destinataire_type: defaults.destinataire_type,

    tariff_options: defaults.tariff_options,
    courses_text: defaults.courses_text,
    courses_provision_text: defaults.courses_provision_text,
    conditions: defaults.conditions,

    tva_rate_pct: 20.0,
    currency: 'EUR',

    created_by_admin_email: auth.user.email,
  };

  const { data: created, error: insErr } = await supabase
    .from('quotes')
    .insert(insertRow)
    .select('*')
    .single();

  let finalQuote = created;

  if (insErr) {
    // Gestion conflit unique reference (rare mais possible si double-clic)
    if (String(insErr.message || '').toLowerCase().includes('unique')) {
      // Regénère avec suffix timestamp et retente une fois
      const retry = {
        ...insertRow,
        reference: `${reference}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      };
      const r2 = await supabase.from('quotes').insert(retry).select('*').single();
      if (r2.error) {
        return NextResponse.json({ ok: false, error: r2.error.message }, { status: 500 });
      }
      finalQuote = r2.data;
    } else {
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }
  }

  // 5. Faire passer la request en 'in_review' si elle est encore 'new'.
  //    Cohérent avec /api/admin/proposals qui fait déjà la même chose,
  //    pour qu'une demande qui a un devis ne soit plus dans "À traiter".
  if (request.status === 'new') {
    const { error: updErr } = await supabase
      .from('client_requests')
      .update({ status: 'in_review' })
      .eq('id', requestId)
      .eq('status', 'new'); // guard contre race condition
    if (updErr) {
      console.warn('[quote/POST] failed to mark request in_review', updErr.message);
      // Non bloquant : le devis a été créé, on continue.
    }
  }

  return NextResponse.json({ ok: true, quote: finalQuote });
}
