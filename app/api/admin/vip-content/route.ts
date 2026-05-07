import { NextResponse } from 'next/server';
import { getVipContent, setVipContent, type VipTip } from '@/lib/vip-content';
import { sendVipNewTipToAll } from '@/lib/email/sendVipNewTip';

export const runtime = 'nodejs';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

/**
 * GET /api/admin/vip-content
 * → { content: VipContent }
 */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const content = await getVipContent();
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/vip-content
 * Body: { content: VipContent, notifyVips?: boolean }
 * → { content: VipContent, emails?: { sent, failed } }
 *
 * Détecte automatiquement les nouveaux tips (id absent dans la version
 * précédente) et envoie un email à tous les chefs VIP actifs pour chaque
 * nouveau tip — sauf si notifyVips === false (édition silencieuse).
 */
export async function PUT(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }

    // Snapshot avant modif pour comparer les tips
    const before = await getVipContent();
    const beforeIds = new Set((before.tips || []).map((t) => t.id));

    const content = await setVipContent(body.content ?? body);

    const notifyVips = body.notifyVips !== false; // default true
    let emailsResult: { sent: number; failed: number } | undefined;

    if (notifyVips) {
      const newTips: VipTip[] = (content.tips || []).filter(
        (t) => !beforeIds.has(t.id) && t.title.trim().length > 0,
      );

      if (newTips.length > 0) {
        let totalSent = 0;
        let totalFailed = 0;
        for (const tip of newTips) {
          try {
            const r = await sendVipNewTipToAll(tip);
            totalSent += r.sent;
            totalFailed += r.failed;
          } catch (e: any) {
            console.error('[vip-content PUT] new tip email failed', e?.message);
            totalFailed += 1;
          }
        }
        emailsResult = { sent: totalSent, failed: totalFailed };
      }
    }

    return NextResponse.json({ content, emails: emailsResult });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
