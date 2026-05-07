// lib/email/sendVipBroadcast.ts
// Email broadcast custom envoyé à tous les chefs VIP actifs
// (déclenché manuellement depuis l'admin avec un sujet et un body texte).

import { Resend } from 'resend';
import { listVipChefs } from './listVipChefs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas — Chefs Talents <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Convertit un texte brut en HTML simple : préserve les sauts de ligne. */
function textToHtml(s: string): string {
  return escapeHtml(s)
    .split(/\n\n+/)
    .map((para) => `<p style="font-size:16px;line-height:1.8;color:#3f3a34;margin:0 0 16px;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function buildHtml(opts: {
  firstName: string;
  subject: string;
  body: string;
}): string {
  const name = opts.firstName?.trim() || 'Chef';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">

    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 40px;">
      CHEFS TALENTS · CHEF VIP
    </p>

    <h1 style="font-size:24px;font-weight:normal;color:#161616;margin:0 0 24px;line-height:1.3;">
      Bonjour ${escapeHtml(name)},
    </h1>

    ${textToHtml(opts.body)}

    <p style="margin:32px 0 0;">
      <a href="${SITE_URL}/chef/vip" style="display:inline-block;background:#161616;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:14px;letter-spacing:0.05em;">
        Accéder à mon espace VIP →
      </a>
    </p>

    <p style="font-size:14px;line-height:1.7;color:#3f3a34;margin:48px 0 0;">
      À très vite,<br>Thomas
    </p>

    <p style="font-size:11px;color:#a8a29e;margin:48px 0 0;border-top:1px solid #e2dccf;padding-top:24px;">
      Vous recevez cet email car vous êtes membre VIP Chefs Talents · ${SITE_URL}
    </p>
  </div>
</body>
</html>`;
}

export async function sendVipBroadcast(opts: {
  subject: string;
  body: string;
}): Promise<{ sent: number; failed: number }> {
  const subject = opts.subject.trim();
  const body = opts.body.trim();
  if (!subject || !body) {
    throw new Error('subject and body are required');
  }

  const recipients = await listVipChefs();
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  const BATCH = 20;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((r) =>
        resend.emails.send({
          from: FROM,
          to: r.email,
          subject,
          html: buildHtml({ firstName: r.firstName, subject, body }),
        }),
      ),
    );
    for (const res of results) {
      if (res.status === 'fulfilled') sent++;
      else failed++;
    }
  }

  return { sent, failed };
}
