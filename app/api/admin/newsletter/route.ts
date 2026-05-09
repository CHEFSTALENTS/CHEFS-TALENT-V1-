// app/api/admin/newsletter/route.ts
// Newsletter centre admin :
// - GET ?segments=active,approved,...   → renvoie le nombre de destinataires
// - POST { subject, body, cta?, segments }   → envoie la newsletter
// - POST { test: true, to, subject, body, cta? }   → envoie un email de test
//
// Auth : x-admin-email

import { NextResponse } from 'next/server';
import {
  listChefsByStatus,
  type ChefStatus,
} from '@/lib/email/listChefsByStatus';
import {
  sendNewsletterToList,
  sendNewsletterTest,
} from '@/lib/email/sendNewsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

const VALID: ChefStatus[] = [
  'pending_validation',
  'approved',
  'active',
  'paused',
];

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

function parseSegments(raw: unknown): ChefStatus[] {
  const arr = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',')
      : [];
  return arr
    .map((s) => String(s).trim().toLowerCase())
    .filter((s): s is ChefStatus => (VALID as string[]).includes(s));
}

/**
 * GET /api/admin/newsletter?segments=active,approved
 * Renvoie le compte de destinataires + breakdown par segment.
 */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  try {
    const url = new URL(req.url);
    const segments = parseSegments(url.searchParams.get('segments'));
    const recipients = await listChefsByStatus(segments);

    const breakdown: Record<string, number> = {};
    for (const r of recipients) {
      breakdown[r.status] = (breakdown[r.status] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      total: recipients.length,
      breakdown,
      segments,
    });
  } catch (e: any) {
    console.error('[admin/newsletter GET] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/newsletter
 * Body :
 *   - { test: true, to, subject, body, cta? }   → email de test à `to`
 *   - { subject, body, cta?, segments: [...] }  → envoi en masse
 */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const subject = String(body?.subject || '').trim();
    const text = String(body?.body || '').trim();
    const ctaLabel = String(body?.cta?.label || '').trim();
    const ctaUrl = String(body?.cta?.url || '').trim();
    const cta = ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined;

    if (!subject) {
      return NextResponse.json(
        { error: 'MISSING_SUBJECT', detail: 'Le sujet est obligatoire.' },
        { status: 400 },
      );
    }
    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: 'MISSING_BODY', detail: 'Le corps doit faire au moins 10 caractères.' },
        { status: 400 },
      );
    }

    // Mode test : envoie un seul email de preview.
    if (body?.test === true) {
      const to = String(body?.to || '').trim().toLowerCase();
      if (!to.includes('@')) {
        return NextResponse.json(
          { error: 'INVALID_TEST_EMAIL' },
          { status: 400 },
        );
      }
      const firstName = String(body?.firstName || 'Chef Test').trim();
      const locale =
        body?.locale === 'en' || body?.locale === 'es' ? body.locale : 'fr';
      await sendNewsletterTest({
        to,
        subject,
        body: text,
        cta,
        firstName,
        locale,
      });
      return NextResponse.json({ ok: true, mode: 'test', sent_to: to });
    }

    // Mode single : envoie 1 email à un destinataire connu.
    // Utilisé par le front pour boucler côté client avec throttling et
    // éviter le timeout serverless Vercel (10 s sur Hobby) sur les
    // broadcasts massifs.
    if (body?.single && typeof body.single === 'object') {
      const single = body.single as {
        email?: string;
        firstName?: string | null;
        locale?: string;
      };
      const to = String(single.email || '').trim().toLowerCase();
      if (!to.includes('@')) {
        return NextResponse.json(
          { error: 'INVALID_RECIPIENT_EMAIL' },
          { status: 400 },
        );
      }
      const firstName = String(single.firstName || '').trim() || 'Chef';
      const locale =
        single.locale === 'en' || single.locale === 'es' ? single.locale : 'fr';
      try {
        await sendNewsletterTest({
          to,
          subject,
          body: text,
          cta,
          firstName,
          locale,
        });
        return NextResponse.json({ ok: true, mode: 'single', sent_to: to });
      } catch (e: any) {
        console.error('[admin/newsletter POST single] send error', to, e?.message);
        return NextResponse.json(
          {
            ok: false,
            mode: 'single',
            sent_to: to,
            error: 'SEND_FAIL',
            detail: String(e?.message ?? e),
          },
          { status: 502 },
        );
      }
    }

    // Mode broadcast réel (legacy : envoi en masse côté serveur).
    // ⚠️ À éviter pour > 30 destinataires sur plan Vercel Hobby (timeout 10 s).
    // Préférer le mode { single } appelé en boucle côté front.
    const segments = parseSegments(body?.segments);
    if (segments.length === 0) {
      return NextResponse.json(
        {
          error: 'NO_SEGMENTS',
          detail:
            'Choisissez au moins un segment (pending_validation, approved, active, paused).',
        },
        { status: 400 },
      );
    }

    const recipients = await listChefsByStatus(segments);
    if (recipients.length === 0) {
      return NextResponse.json({
        ok: true,
        mode: 'broadcast',
        total: 0,
        sent: 0,
        failed: 0,
        message: 'Aucun destinataire dans les segments choisis.',
      });
    }

    const result = await sendNewsletterToList({
      subject,
      body: text,
      cta,
      recipients,
    });

    return NextResponse.json({
      ok: true,
      mode: 'broadcast',
      total: recipients.length,
      sent: result.sent,
      failed: result.failed,
      segments,
    });
  } catch (e: any) {
    console.error('[admin/newsletter POST] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
