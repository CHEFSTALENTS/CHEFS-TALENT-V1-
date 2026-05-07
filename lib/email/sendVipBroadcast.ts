// lib/email/sendVipBroadcast.ts
// Email broadcast custom envoyé à tous les chefs VIP actifs (déclenché
// manuellement depuis l'admin avec un sujet et un body texte).
// Design éditorial, pas d'emojis ajoutés.

import { Resend } from 'resend';
import { listVipChefs } from './listVipChefs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas — Chefs Talents <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

type Locale = 'fr' | 'en' | 'es';

const COPY: Record<
  Locale,
  {
    greeting: (name: string) => string;
    cta: string;
    signLine1: string;
    signLine2: string;
    signTitle: string;
    footer: string;
  }
> = {
  fr: {
    greeting: (name) => `Bonjour ${name},`,
    cta: 'Accéder à mon espace',
    signLine1: 'Bien à vous,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Fondateur, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  en: {
    greeting: (name) => `Hello ${name},`,
    cta: 'Open my space',
    signLine1: 'With kind regards,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Founder, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  es: {
    greeting: (name) => `Buenos días ${name},`,
    cta: 'Acceder a mi espacio',
    signLine1: 'Atentamente,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Fundador, Chefs Talents',
    footer: 'Chefs Talents · Burdeos',
  },
};

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
    .map(
      (para) =>
        `<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.75;color:#3f3a34;">${para.replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function buildHtml(opts: {
  firstName: string;
  body: string;
  locale: Locale;
}): string {
  const t = COPY[opts.locale];

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f7f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f2;">
    <tr>
      <td align="center" style="padding:56px 16px;">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #ece6dc;width:100%;max-width:540px;">

          <tr>
            <td style="padding:36px 40px 22px;border-bottom:1px solid #ece6dc;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.42em;text-transform:uppercase;color:#9b9082;">
                CHEFS&nbsp;TALENTS
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 8px;font-family:Georgia,'Times New Roman',serif;">
              <h1 style="margin:0 0 28px;font-size:26px;font-weight:400;color:#1a1815;letter-spacing:-0.01em;line-height:1.3;">
                ${t.greeting(opts.firstName)}
              </h1>

              ${textToHtml(opts.body)}
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:16px 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#1a1815;">
                    <a href="${SITE_URL}/chef/vip" style="display:inline-block;padding:14px 30px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 32px;font-family:Georgia,'Times New Roman',serif;">
              <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#3f3a34;">
                ${t.signLine1}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3a34;">
                <em>${t.signLine2}</em><br>
                <span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b9082;">${t.signTitle}</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;background:#f7f5f2;border-top:1px solid #ece6dc;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#a8a29e;text-align:center;">
                ${t.footer} &middot; chefstalents.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
          html: buildHtml({
            firstName: r.firstName?.trim() || 'Chef',
            body,
            locale: r.locale,
          }),
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
