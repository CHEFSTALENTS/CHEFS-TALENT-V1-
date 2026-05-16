// app/api/auth/email/send-verification/route.ts
// POST : génère un token, envoie le welcome email avec lien de vérification.
// Auth Bearer Supabase requise : on vérifie que le caller authentifié
// est bien l'owner du userId qu'il veut faire vérifier (anti-spoofing).
// Anti-abuse rapide : on ne renvoie pas d'email si emailVerified est déjà true.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateEmailVerifyToken } from '@/lib/auth/emailVerifyToken';
import { sendChefWelcomeAndVerify } from '@/lib/email/sendChefWelcomeAndVerify';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { requireChefOr401 } from '@/lib/auth/requireChef';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const rl = rateLimit(req, {
    identifier: 'send-verification',
    windowMs: 10 * 60_000,
    max: 3,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  // Auth Bearer Supabase : on lit l'userId du token, JAMAIS du body.
  // Empêche un attaquant de spammer des mails vers n'importe quel chef
  // en passant n'importe quel userId / email.
  const auth = await requireChefOr401(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.id;
  const email = (auth.user.email || '').toLowerCase();

  try {
    const body = await req.json().catch(() => null);
    const firstName = String(body?.firstName || '').trim();
    const localeRaw = String(body?.locale || '');
    const locale: 'fr' | 'en' | 'es' =
      localeRaw === 'en' || localeRaw === 'es' ? localeRaw : 'fr';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', detail: 'authenticated user has no email' },
        { status: 400 },
      );
    }

    // Vérifie que l'utilisateur existe et n'est pas déjà vérifié.
    const admin = getSupabaseAdmin();
    const { data: row } = await admin
      .from('chef_profiles')
      .select('user_id, email, profile')
      .eq('user_id', userId)
      .maybeSingle();

    const profile = (row?.profile as any) ?? {};
    if (profile.emailVerified === true) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'ALREADY_VERIFIED',
      });
    }

    const token = generateEmailVerifyToken(userId, email);
    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
    const verifyUrl = `${SITE_URL}/api/auth/email/verify?token=${encodeURIComponent(token)}`;

    // Track côté profile que le mail a été envoyé (utile pour le throttling
    // futur et pour distinguer les chefs qui n'ont jamais reçu le mail).
    if (row?.user_id) {
      const next = {
        ...profile,
        emailVerified: false,
        emailVerificationSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await admin
        .from('chef_profiles')
        .update({ profile: next })
        .eq('user_id', userId);
    }

    await sendChefWelcomeAndVerify({
      email,
      firstName,
      verifyUrl,
      locale,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[auth/email/send-verification] error', e?.message);
    return NextResponse.json(
      { error: 'SEND_FAILED', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
