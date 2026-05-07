import { NextResponse } from 'next/server';
import { sendVipBroadcast } from '@/lib/email/sendVipBroadcast';

export const runtime = 'nodejs';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

/**
 * POST /api/admin/vip-content/broadcast
 * Body: { subject: string, body: string }
 * → { sent: number, failed: number }
 *
 * Envoie un email custom à tous les chefs VIP actifs.
 */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body?.body === 'string' ? body.body.trim() : '';

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'INVALID_BODY', detail: 'subject and body are required' },
        { status: 400 },
      );
    }

    const result = await sendVipBroadcast({ subject, body: message });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[vip broadcast] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
