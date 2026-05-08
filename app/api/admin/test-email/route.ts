// app/api/admin/test-email/route.ts
// Endpoint admin pour envoyer un email de test à n'importe quelle adresse.
// Utile pour les tests délivrabilité (mail-tester, glockapps, etc.) sans
// avoir à modifier un profil chef.
//
// Auth: x-admin-email
// Body: { to: string, kind: 'vip_welcome' | 'boost_welcome' | 'vip_new_tip' }

import { NextResponse } from 'next/server';
import { sendVipWelcome } from '@/lib/email/sendVipWelcome';
import { sendBoostWelcome } from '@/lib/email/sendBoostWelcome';
import { sendBoostEndingSoon } from '@/lib/email/sendBoostEndingSoon';
import { sendChefActivated } from '@/lib/email/sendChefActivated';

export const runtime = 'nodejs';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

type TestKind =
  | 'vip_welcome'
  | 'boost_welcome'
  | 'boost_ending_soon'
  | 'chef_activated';

const VALID_KINDS: TestKind[] = [
  'vip_welcome',
  'boost_welcome',
  'boost_ending_soon',
  'chef_activated',
];

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const to = String(body?.to || '').trim();
    const kind = String(body?.kind || 'vip_welcome') as TestKind;
    const firstName = String(body?.firstName || 'Chef Test').trim();
    const locale = (body?.locale === 'en' || body?.locale === 'es'
      ? body.locale
      : 'fr') as 'fr' | 'en' | 'es';

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL', detail: 'A valid "to" email is required.' },
        { status: 400 },
      );
    }
    if (!VALID_KINDS.includes(kind)) {
      return NextResponse.json(
        {
          error: 'INVALID_KIND',
          detail: `kind must be one of ${VALID_KINDS.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (kind === 'vip_welcome') {
      await sendVipWelcome({
        email: to,
        firstName,
        planKey: 'vip_3m',
        isComplimentary: true,
        locale,
      });
    } else if (kind === 'boost_welcome') {
      await sendBoostWelcome({
        email: to,
        firstName,
        boostedUntil: new Date(
          Date.now() + 30 * 24 * 3600 * 1000,
        ).toISOString(),
        locale,
      });
    } else if (kind === 'boost_ending_soon') {
      await sendBoostEndingSoon({
        email: to,
        firstName,
        boostedUntil: new Date(
          Date.now() + 7 * 24 * 3600 * 1000,
        ).toISOString(),
        daysLeft: 7,
        locale,
      });
    } else if (kind === 'chef_activated') {
      await sendChefActivated({
        email: to,
        firstName,
        locale,
      });
    }

    return NextResponse.json({
      ok: true,
      sent_to: to,
      kind,
      locale,
    });
  } catch (e: any) {
    console.error('[test-email] error', e);
    return NextResponse.json(
      { error: 'SEND_FAILED', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
