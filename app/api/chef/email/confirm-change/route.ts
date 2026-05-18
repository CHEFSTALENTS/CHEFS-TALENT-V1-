// app/api/chef/email/confirm-change/route.ts
//
// GET /api/chef/email/confirm-change?token=... — confirme le changement d'email.
//
// Endpoint PUBLIC (pas d'auth Bearer) puisque le chef clique sur un lien depuis
// son email — il n'est pas forcément loggé. La sécurité repose sur :
//   1. Validation HMAC du token (impossible à forger sans EMAIL_VERIFY_SECRET)
//   2. Vérif que payload.email matche chef_profiles.profile.pendingEmail
//   3. Vérif que le token n'est pas expiré (24h)
//
// Si OK :
//   - Update auth.users.email via supabase.auth.admin.updateUserById
//   - Update chef_profiles.email
//   - Clear pendingEmail du profile
//   - Redirige vers /chef/dashboard?email-changed=1

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyEmailVerifyToken } from '@/lib/auth/emailVerifyToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function redirectWithMessage(error: string, ok = false): NextResponse {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
  const url = new URL('/chef/dashboard', SITE_URL);
  if (ok) {
    url.searchParams.set('email-changed', '1');
  } else {
    url.searchParams.set('email-change-error', error);
  }
  return NextResponse.redirect(url.toString(), { status: 302 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';

  if (!token) {
    return redirectWithMessage('MISSING_TOKEN');
  }

  // 1. Vérif HMAC + expiry
  const result = verifyEmailVerifyToken(token);
  if (!result.valid) {
    return redirectWithMessage(result.expired ? 'EXPIRED' : 'INVALID_TOKEN');
  }
  const { userId, email: newEmail } = result;

  const supabase = getSupabaseAdmin();

  // 2. Charge le chef + vérif que pendingEmail matche newEmail
  const { data: row, error: rowErr } = await supabase
    .from('chef_profiles')
    .select('user_id, email, profile')
    .eq('user_id', userId)
    .maybeSingle();

  if (rowErr || !row) {
    return redirectWithMessage('CHEF_NOT_FOUND');
  }

  const profile = (row.profile as any) ?? {};
  const pendingEmail = String(profile.pendingEmail || '').toLowerCase();

  if (pendingEmail !== newEmail.toLowerCase()) {
    // Le token est valide mais ne correspond plus au pendingEmail (annulé /
    // remplacé entre temps). On refuse pour ne pas changer vers un mauvais email.
    return redirectWithMessage('MISMATCH');
  }

  // 3. Update auth.users.email (côté Supabase Auth)
  const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
    email: newEmail,
    email_confirm: true,           // bypass le double opt-in Supabase (notre HMAC fait foi)
  });
  if (authErr) {
    console.error('[chef/email/confirm-change] auth.admin.updateUserById error', authErr.message);
    return redirectWithMessage('AUTH_UPDATE_FAILED');
  }

  // 4. Update chef_profiles.email + clear pendingEmail
  const nextProfile = {
    ...profile,
    pendingEmail: null,
    pendingEmailRequestedAt: null,
    emailChangedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await supabase
    .from('chef_profiles')
    .update({ email: newEmail, profile: nextProfile })
    .eq('user_id', userId);

  console.log('[chef/email/confirm-change] OK userId=', userId, 'new=', newEmail);

  return redirectWithMessage('', true);
}
