// app/api/admin/requests/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // ⚠️ IMPORTANT: service role côté server uniquement
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);

// Helpers de normalisation pour le POST
function strOrNull(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}
function numberOrNull(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function dateOrNull(v: any): string | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    // ✅ On lit TOUTES les demandes (B2B + B2C) depuis client_requests
    // Si tu avais un .eq('client_type','concierge') ou autre => c'était la cause.
    const { data, error } = await supabaseAdmin
      .from('client_requests')
      .select(
        `
        id,
        created_at,
        status,
        match_type,
        client_type,
        location,
        city,
        guest_count,
        guests,
        budget_range,
        budget,
        start_date,
        end_date,
        assignment_type,
        first_name,
        company_name,
        email,
        phone
      `
      )
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) throw error;

    // ✅ Normalisation : status par défaut. match_type est legacy et conservé
    // tel quel pour rétrocompat (peut être null sur les nouvelles lignes).
    const items = (data ?? []).map((x: any) => ({
      ...x,
      status: x.status ?? 'new',
    }));

    // Warn (visible Vercel logs) si la limite est atteinte — les KPIs
    // dashboard se basent sur cette liste, donc une troncature passe
    // silencieuse côté UI.
    if (items.length >= 2000) {
      console.warn('[admin/requests] HARD_LIMIT 2000 atteint — paginer ou augmenter');
    }

    return NextResponse.json({ items, truncated: items.length >= 2000 });
  } catch (e: any) {
    console.error('GET /api/admin/requests error', e);
    return NextResponse.json(
      { items: [], error: e?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}

// =============================================================
// POST /api/admin/requests
// Création manuelle d'une demande client par l'admin (cas où la
// demande arrive par email/WhatsApp/téléphone hors formulaire web).
// La row sera créée en statut 'new' avec source='admin' pour pouvoir
// la distinguer des demandes formulaire dans les stats.
// =============================================================
export async function POST(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));

    const email = strOrNull(body.email);
    const fullName = strOrNull(body.fullName);
    const firstName =
      strOrNull(body.firstName) ||
      (fullName ? fullName.split(' ')[0] : null);

    // L'email est requis : c'est l'identifiant client minimum
    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    const insertRow = {
      email,
      first_name: firstName,
      full_name: fullName,
      phone: strOrNull(body.phone),

      // match_type est NOT NULL en DB. La logique business fast/concierge
      // a été retirée mais on doit écrire une valeur valide. 'concierge'
      // sert de valeur par défaut neutre.
      match_type: 'concierge',
      // 'new' : la demande vient de rentrer, pas encore traitée
      status: 'new',

      client_type: strOrNull(body.clientType),
      company_name: strOrNull(body.companyName),
      location: strOrNull(body.location),

      start_date: dateOrNull(body.startDate),
      end_date: dateOrNull(body.endDate),
      date_mode: strOrNull(body.dateMode),

      guest_count: numberOrNull(body.guestCount),

      budget_range: strOrNull(body.budgetRange),
      budget_amount: numberOrNull(body.budgetAmount),
      budget_unit: strOrNull(body.budgetUnit),

      assignment_type: strOrNull(body.assignmentType),
      service_expectations: strOrNull(body.serviceExpectations),
      service_rhythm: strOrNull(body.serviceRhythm),

      mission_category: strOrNull(body.missionCategory),
      meal_plan: strOrNull(body.mealPlan),
      replacement_needed: strOrNull(body.replacementNeeded),

      preferred_language: strOrNull(body.preferredLanguage),
      dietary_restrictions: strOrNull(body.dietaryRestrictions),
      cuisine_preferences: strOrNull(body.cuisinePreferences),

      notes: strOrNull(body.notes),
      message: strOrNull(body.message),
      // marqueur de provenance pour différencier des demandes formulaire
      source: strOrNull(body.source) || 'admin',
    };

    const { data, error } = await supabaseAdmin
      .from('client_requests')
      .insert(insertRow)
      .select('id')
      .single();

    if (error) {
      // Si la colonne `source` n'existe pas en DB (cas legacy),
      // on retry sans ce champ pour ne pas bloquer.
      if (
        String(error.message || '').toLowerCase().includes('column') &&
        String(error.message || '').toLowerCase().includes('source')
      ) {
        const { source: _drop, ...rowWithoutSource } = insertRow;
        const retry = await supabaseAdmin
          .from('client_requests')
          .insert(rowWithoutSource)
          .select('id')
          .single();

        if (retry.error) {
          console.error(
            '[admin/requests] POST insert retry error',
            retry.error.message,
          );
          return NextResponse.json(
            { error: retry.error.message },
            { status: 500 },
          );
        }
        return NextResponse.json({ ok: true, requestId: retry.data?.id });
      }

      console.error('[admin/requests] POST insert error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, requestId: data?.id });
  } catch (e: any) {
    console.error('[admin/requests] POST fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
