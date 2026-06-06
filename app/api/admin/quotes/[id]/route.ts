// app/api/admin/quotes/[id]/route.ts
//
// GET    /api/admin/quotes/:id  → renvoie le row complet
// PATCH  /api/admin/quotes/:id  → édite n'importe quel champ section par section
// DELETE /api/admin/quotes/:id  → cancelled si pas envoyé, hard-delete sinon

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

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

  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ ok: true, quote: data });
}

// Liste blanche des champs éditables (sécurité : on n'expose pas
// `id`, `created_at`, `created_by_admin_email`, etc.).
const EDITABLE_FIELDS = [
  'reference',
  'status',
  'issued_at',
  'validity_date',
  'intitule', 'lieu', 'dates_text', 'convives_text',
  'rythme_text', 'langues_text', 'hebergement_text',
  'emetteur_nom', 'emetteur_ville', 'emetteur_siret', 'emetteur_tva',
  'destinataire_nom', 'destinataire_type', 'destinataire_adresse',
  'tariff_options', 'courses_text', 'courses_provision_text',
  'conditions', 'tva_rate_pct', 'currency', 'admin_notes',
  // ─── Coûts internes (Phase 1 marge — JAMAIS exposés au client) ───
  'chef_cost_eur', 'chef_travel_cost_eur',
  'butler_required', 'butler_cost_eur',
  'margin_notes',
] as const;

const ALLOWED_STATUS = new Set(['draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled']);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  for (const key of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = body[key];
    }
  }

  if (updates.status && !ALLOWED_STATUS.has(updates.status)) {
    return NextResponse.json({ ok: false, error: `Status invalide: ${updates.status}` }, { status: 400 });
  }

  // Transition automatique : si status passe à 'sent' on set sent_at
  if (updates.status === 'sent') updates.sent_at = new Date().toISOString();
  if (updates.status === 'accepted') updates.accepted_at = new Date().toISOString();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'NO_CHANGES' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, quote: data });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

  // Si déjà envoyé/accepté, on cancelled (audit). Sinon hard delete.
  if (existing.status === 'sent' || existing.status === 'accepted') {
    await supabase.from('quotes').update({ status: 'cancelled' }).eq('id', id);
    return NextResponse.json({ ok: true, action: 'cancelled' });
  }
  await supabase.from('quotes').delete().eq('id', id);
  return NextResponse.json({ ok: true, action: 'deleted' });
}
