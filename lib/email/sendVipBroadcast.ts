// lib/email/sendVipBroadcast.ts
// Email broadcast custom envoyé à tous les chefs VIP actifs (déclenché
// manuellement depuis l'admin avec un sujet et un body texte).
// Design : Revolut Business — sans-serif, blanc, accent burgundy.

import { Resend } from 'resend';
import { listVipChefs } from './listVipChefs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas Delcroix <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

type Locale = 'fr' | 'en' | 'es';

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    greeting: (name: string) => string;
    cta: string;
    signLine1: string;
    signTitle: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  fr: {
    eyebrow: 'MESSAGE VIP',
    greeting: (name) => `Bonjour ${name},`,
    cta: 'Accéder à mon espace',
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  en: {
    eyebrow: 'VIP MESSAGE',
    greeting: (name) => `Hello ${name},`,
    cta: 'Open my space',
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  es: {
    eyebrow: 'MENSAJE VIP',
    greeting: (name) => `Buenos días ${name},`,
    cta: 'Acceder a mi espacio',
    signLine1: 'Atentamente,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Burdeos',
    footerRight: 'chefstalents.com',
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

function textToHtml(s: string): string {
  return escapeHtml(s)
    .split(/\n\n+/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:#27272a;">${para.replace(/\n/g, '<br>')}</p>`,
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
  <meta name="color-scheme" content="light only">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;width:100%;max-width:600px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONT};font-size:14px;font-weight:700;color:#09090b;letter-spacing:-0.01em;">
                    Chefs Talents
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.18em;color:${ACCENT};">
                    ${t.eyebrow}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 20px;font-family:${FONT};font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.25;">
                ${t.greeting(opts.firstName)}
              </h1>
              ${textToHtml(opts.body)}
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:8px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#09090b;border-radius:999px;">
                    <a href="${SITE_URL}/chef/vip" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      ${t.cta} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 4px;font-family:${FONT};font-size:14px;line-height:1.5;color:#52525b;">
                ${t.signLine1}
              </p>
              <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.5;">
                <span style="font-weight:700;color:#09090b;">Thomas Delcroix</span><br>
                <span style="font-size:13px;color:#71717a;">${t.signTitle}</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONT};font-size:12px;color:#a1a1aa;">
                    ${t.footerLeft}
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:12px;">
                    <a href="${SITE_URL}" style="color:#a1a1aa;text-decoration:none;">${t.footerRight}</a>
                  </td>
                </tr>
              </table>
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
