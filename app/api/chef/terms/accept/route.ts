import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireChefOr401 } from '@/lib/auth/requireChef';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chef/terms/accept
 * Body: { version, accepted }
 * Auth: Bearer token Supabase. `userId` est dérivé du token, jamais du body.
 *
 * Effets :
 * 1. Patch chef_profiles.profile (rétrocompatible : termsAccepted, termsAcceptedAt, termsAcceptedVersion)
 * 2. Insert chef_terms_acceptances (audit log immuable, append-only)
 *
 * Note : la table chef_terms_acceptances est créée par
 * migrations/2026-05-chef-terms-acceptances.sql. Si la table n'existe pas
 * (migration non appliquée), l'insert échoue silencieusement et l'endpoint
 * continue de fonctionner (rétrocompatibilité).
 */
export async function POST(req: Request) {
  try {
    const auth = await requireChefOr401(req);
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.id; // SOURCE DE VÉRITÉ

    const body = await req.json().catch(() => ({}));

    const accepted = body?.accepted === undefined ? true : Boolean(body?.accepted);
    const version = String(body?.version || '08/05/2026').trim();

    if (!accepted) {
      return NextResponse.json({ success: false, error: 'accepted=false not supported' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Métadonnées probatoires de la requête
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;
    const userAgent = req.headers.get('user-agent') || null;
    const acceptedAt = new Date().toISOString();

    // 1) Lire le profile actuel
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('profile')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const currentProfile = (data?.profile ?? {}) as any;
    const email: string | null = (currentProfile?.email as string | undefined) ?? null;

    // 2) Patch acceptance dans chef_profiles.profile (rétrocompatible)
    const patchedProfile = {
      ...currentProfile,
      termsAccepted: true,
      termsAcceptedAt: acceptedAt,
      termsAcceptedVersion: version,
    };

    const { error: upErr } = await supabase
      .from('chef_profiles')
      .upsert(
        { user_id: userId, profile: patchedProfile },
        { onConflict: 'user_id' },
      );

    if (upErr) {
      console.error('[chef/terms/accept] upsert profile error', upErr);
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }

    // 3) Insert dans le journal d'audit immuable
    // Si la table n'existe pas (migration non appliquée), on log et on continue
    // pour ne pas bloquer l'acceptation.
    const { error: auditErr } = await supabase
      .from('chef_terms_acceptances')
      .insert({
        user_id: userId,
        email,
        version,
        accepted_at: acceptedAt,
        ip,
        user_agent: userAgent,
      });

    if (auditErr) {
      // Code 42P01 = relation does not exist (table absente)
      // On log mais on ne fait pas échouer la requête.
      console.warn(
        '[chef/terms/accept] audit insert failed (non-blocking)',
        auditErr.code,
        auditErr.message,
      );
    }

    return NextResponse.json({
      success: true,
      termsAccepted: true,
      termsAcceptedAt: acceptedAt,
      termsAcceptedVersion: version,
      audited: !auditErr,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
