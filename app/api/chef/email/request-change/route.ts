// app/api/chef/email/request-change/route.ts
//
// POST : un chef authentifié demande à changer son email.
//   body : { newEmail: string, locale?: 'fr' | 'en' | 'es' }
//
// Sécurité :
//   - Auth Bearer chef obligatoire (l'userId vient du token, JAMAIS du body)
//   - Rate limit 3 demandes / 10 minutes / IP (anti-spam)
//   - Vérif format email
//   - Vérif que le nouvel email n'est PAS déjà utilisé par un autre user (auth.users)
//   - Vérif que le nouvel email != email actuel
//
// Comportement :
//   1. Génère un token HMAC `{userId, email=newEmail, exp+24h}`
//   2. Envoie un email de confirmation au NOUVEL email avec lien de confirm
//   3. Stocke `pendingEmail` + `pendingEmailRequestedAt` dans chef_profiles.profile
//   4. L'ancien email reste actif tant que le nouvel email n'est pas confirmé

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateEmailVerifyToken } from '@/lib/auth/emailVerifyToken';
import { sendChefChangeEmailVerification } from '@/lib/email/sendChefChangeEmailVerification';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { requireChefOr401 } from '@/lib/auth/requireChef';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_24H_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  // Rate limit : 3 demandes / 10min / IP
  const rl = rateLimit(req, {
    identifier: 'chef-email-request-change',
    windowMs: 10 * 60_000,
    max: 3,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  // Auth Bearer chef obligatoire
  const auth = await requireChefOr401(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.id;
  const currentEmail = (auth.user.email || '').toLowerCase();

  let body: any = {};
  try { body = await req.json(); } catch { /* empty OK */ }

  const newEmail = String(body?.newEmail || '').trim().toLowerCase();
  const localeRaw = String(body?.locale || '');
  const locale: 'fr' | 'en' | 'es' =
    localeRaw === 'en' || localeRaw === 'es' ? localeRaw : 'fr';

  // ── Validations
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json(
      { error: 'INVALID_EMAIL', message: 'Format d\'email invalide.' },
      { status: 400 },
    );
  }
  if (newEmail === currentEmail) {
    return NextResponse.json(
      { error: 'SAME_EMAIL', message: 'Ce nouvel email est identique à l\'actuel.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Vérifie qu'aucun autre utilisateur n'a déjà cet email (auth.users.email is unique)
  try {
    const { data: existingByEmail } = await supabase.auth.admin.listUsers();
    const conflict = (existingByEmail?.users || []).find(
      (u) => (u.email || '').toLowerCase() === newEmail && u.id !== userId,
    );
    if (conflict) {
      return NextResponse.json(
        { error: 'EMAIL_ALREADY_USED', message: 'Cet email est déjà utilisé par un autre compte.' },
        { status: 409 },
      );
    }
  } catch (e: any) {
    // listUsers peut échouer sur les très gros datasets (>1000 users)
    // → on continue : Supabase rejettera de toute façon le swap final
    console.warn('[chef/email/request-change] listUsers fallback:', e?.message);
  }

  // Charge le profile chef
  const { data: row } = await supabase
    .from('chef_profiles')
    .select('user_id, email, profile')
    .eq('user_id', userId)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: 'CHEF_NOT_FOUND' }, { status: 404 });
  }

  const profile = (row.profile as any) ?? {};
  const firstName = profile.firstName || '';

  // Génère token (24h)
  const token = generateEmailVerifyToken(userId, newEmail, TTL_24H_MS);
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
  const verifyUrl = `${SITE_URL}/api/chef/email/confirm-change?token=${encodeURIComponent(token)}`;

  // Marque pendingEmail dans le profile (pour UX dashboard)
  const updatedProfile = {
    ...profile,
    pendingEmail: newEmail,
    pendingEmailRequestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await supabase
    .from('chef_profiles')
    .update({ profile: updatedProfile })
    .eq('user_id', userId);

  // Envoie l'email de vérification au NOUVEL email
  try {
    await sendChefChangeEmailVerification({
      newEmail,
      oldEmail: currentEmail,
      firstName,
      verifyUrl,
      locale,
    });
  } catch (e: any) {
    console.error('[chef/email/request-change] send error', e?.message);
    return NextResponse.json(
      { error: 'SEND_FAILED', message: 'Impossible d\'envoyer l\'email de vérification. Réessaie dans quelques instants.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    pendingEmail: newEmail,
    message: `Un email de confirmation a été envoyé à ${newEmail}. Clique sur le lien pour valider le changement (lien valide 24h).`,
  });
}
