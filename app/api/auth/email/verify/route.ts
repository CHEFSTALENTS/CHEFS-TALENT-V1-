// app/api/auth/email/verify/route.ts
// GET ?token=… : vérifie le token signé et flag profile.emailVerified=true.
// Renvoie une page HTML simple (succès / expiré / invalide) avec un lien
// de retour vers le dashboard.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyEmailVerifyToken } from '@/lib/auth/emailVerifyToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";
const ACCENT = '#7f1d1d';

type PageKind = 'success' | 'expired' | 'invalid' | 'already';

function htmlPage(kind: PageKind, opts: { email?: string }): string {
  const copy =
    kind === 'success'
      ? {
          title: 'Email vérifié',
          body: 'Votre adresse email est maintenant vérifiée. Vous pouvez accéder à votre espace chef.',
          cta: 'Accéder à mon espace',
          ctaHref: `${SITE_URL}/chef/dashboard`,
          tone: 'success' as const,
        }
      : kind === 'already'
        ? {
            title: 'Déjà vérifié',
            body: 'Cette adresse email est déjà vérifiée. Vous pouvez vous connecter à votre espace.',
            cta: 'Accéder à mon espace',
            ctaHref: `${SITE_URL}/chef/dashboard`,
            tone: 'success' as const,
          }
        : kind === 'expired'
          ? {
              title: 'Lien expiré',
              body: 'Ce lien de vérification est expiré. Connectez-vous à votre espace pour en recevoir un nouveau.',
              cta: 'Se connecter',
              ctaHref: `${SITE_URL}/chef/login?resendVerify=1`,
              tone: 'warning' as const,
            }
          : {
              title: 'Lien invalide',
              body: 'Ce lien de vérification n’est pas valide. Si vous avez créé un compte récemment, vérifiez votre boîte mail ou connectez-vous pour recevoir un nouveau lien.',
              cta: 'Se connecter',
              ctaHref: `${SITE_URL}/chef/login?resendVerify=1`,
              tone: 'error' as const,
            };

  const accent =
    copy.tone === 'success' ? ACCENT : copy.tone === 'warning' ? '#92651a' : '#7f1d1d';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${copy.title} — Chefs Talents</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: ${FONT}; color: #09090b; -webkit-font-smoothing: antialiased; }
    .wrap { max-width: 520px; margin: 80px auto; padding: 0 24px; }
    .card { background: #fff; border-radius: 16px; padding: 48px 36px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); text-align: center; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; color: ${accent}; margin: 0 0 18px; }
    h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-size: 30px; letter-spacing: -0.02em; margin: 0 0 18px; }
    p { font-size: 15px; color: #52525b; line-height: 1.65; margin: 0 0 28px; }
    .email { font-size: 13px; color: #71717a; font-family: ui-monospace, Menlo, Consolas, monospace; margin: 18px 0 28px; padding: 8px 12px; background: #fafafa; border-radius: 6px; display: inline-block; }
    .cta { display: inline-block; background: #09090b; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-size: 14px; font-weight: 600; }
    .cta:hover { background: #27272a; }
    .home { display: block; margin-top: 28px; color: #a1a1aa; font-size: 13px; text-decoration: none; }
    .home:hover { color: #71717a; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <p class="eyebrow">CHEFS TALENTS</p>
      <h1>${copy.title}</h1>
      <p>${copy.body}</p>
      ${opts.email ? `<div class="email">${opts.email}</div>` : ''}
      <a href="${copy.ctaHref}" class="cta">${copy.cta} →</a>
      <a href="${SITE_URL}" class="home">Retour vers chefstalents.com</a>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';

  const result = verifyEmailVerifyToken(token);

  // Token invalide
  if (!result.userId && !result.expired) {
    return new NextResponse(htmlPage('invalid', {}), {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  // Token expiré
  if (result.expired) {
    return new NextResponse(htmlPage('expired', { email: result.email }), {
      status: 410,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  // Token valide : on flag emailVerified=true
  try {
    const admin = getSupabaseAdmin();
    const { data: row } = await admin
      .from('chef_profiles')
      .select('user_id, profile')
      .eq('user_id', result.userId)
      .maybeSingle();

    const profile = (row?.profile as any) ?? {};

    // Si déjà vérifié : page "déjà vérifié" (mais c'est OK, idempotent)
    if (profile.emailVerified === true) {
      return new NextResponse(htmlPage('already', { email: result.email }), {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    const next = {
      ...profile,
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (row?.user_id) {
      await admin
        .from('chef_profiles')
        .update({ profile: next })
        .eq('user_id', row.user_id);
    } else {
      // Edge case : user_id pas trouvé. On crée la ligne minimale.
      await admin.from('chef_profiles').upsert(
        {
          user_id: result.userId,
          email: result.email,
          profile: {
            id: result.userId,
            email: result.email,
            emailVerified: true,
            emailVerifiedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        { onConflict: 'user_id' },
      );
    }

    return new NextResponse(htmlPage('success', { email: result.email }), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch (e: any) {
    console.error('[auth/email/verify] update error', e?.message);
    return new NextResponse(htmlPage('invalid', { email: result.email }), {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}
