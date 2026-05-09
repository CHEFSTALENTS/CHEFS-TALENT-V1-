import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireChefOr401 } from '@/lib/auth/requireChef';

const ALLOWED = new Set(['fr', 'en', 'es']);

/**
 * POST /api/chef/me/locale
 * Body: { locale: 'fr' | 'en' | 'es' }
 * Auth: Supabase session (Bearer token via Authorization header)
 *
 * Persiste la préférence de langue dans chef_profiles.profile.preferredLocale
 * (champ JSON existant — aucune migration DB requise).
 */
export async function POST(req: Request) {
  try {
    const auth = await requireChefOr401(req);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.id;

    const body = await req.json().catch(() => null);
    const locale = body?.locale;

    if (!ALLOWED.has(locale)) {
      return NextResponse.json(
        { error: 'INVALID_LOCALE', detail: 'locale must be fr | en | es' },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    // Lecture du profil actuel pour merge (évite d'écraser les autres champs)
    const { data: existing, error: readErr } = await admin
      .from('chef_profiles')
      .select('user_id, profile')
      .eq('user_id', userId)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json(
        { error: 'READ_FAIL', detail: readErr.message },
        { status: 500 },
      );
    }

    const currentProfile =
      (existing?.profile && typeof existing.profile === 'object'
        ? existing.profile
        : {}) ?? {};

    const nextProfile = {
      ...currentProfile,
      preferredLocale: locale,
    };

    const { error: upsertErr } = await admin
      .from('chef_profiles')
      .upsert(
        {
          user_id: userId,
          profile: nextProfile,
        },
        { onConflict: 'user_id' },
      );

    if (upsertErr) {
      return NextResponse.json(
        { error: 'WRITE_FAIL', detail: upsertErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, locale });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
