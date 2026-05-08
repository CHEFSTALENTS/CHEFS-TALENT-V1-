// lib/email/sendNewsletter.ts
// Newsletter template — subject et body custom, CTA optionnel, design
// Revolut Business cohérent avec les autres emails.
// Plain-text + List-Unsubscribe automatiques pour la délivrabilité.

import { Resend } from 'resend';
import {
  htmlToText,
  buildUnsubscribeHeaders,
  unsubscribeFooterHtml,
  unsubscribeFooterText,
} from './_helpers';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas Delcroix <contact@chefstalents.com>';
const REPLY_TO = 'contact@chefstalents.com';
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
    signLine1: string;
    signTitle: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  fr: {
    eyebrow: 'NEWSLETTER',
    greeting: (name) => `Bonjour ${name},`,
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  en: {
    eyebrow: 'NEWSLETTER',
    greeting: (name) => `Hello ${name},`,
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  es: {
    eyebrow: 'NEWSLETTER',
    greeting: (name) => `Buenos días ${name},`,
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

/**
 * Convertit un texte brut en HTML simple : préserve les sauts de paragraphe.
 * Lignes blanches doubles => séparation paragraphe. Sauts de ligne simples => <br>.
 */
function bodyToHtml(s: string): string {
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
  cta?: { label: string; url: string };
  locale: Locale;
  unsubscribeHtml?: string;
}): string {
  const t = COPY[opts.locale];
  const ctaBlock = opts.cta
    ? `
          <tr>
            <td align="left" style="padding:8px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#09090b;border-radius:999px;">
                    <a href="${escapeHtml(opts.cta.url)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      ${escapeHtml(opts.cta.label)} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : '';

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
              ${bodyToHtml(opts.body)}
            </td>
          </tr>

          ${ctaBlock}

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
              ${opts.unsubscribeHtml || ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type NewsletterRecipient = {
  email: string;
  firstName?: string;
  locale?: Locale;
};

/**
 * Envoie une newsletter à une liste de destinataires en batches de 20.
 * @returns { sent, failed }
 */
export async function sendNewsletterToList(opts: {
  subject: string;
  body: string;
  cta?: { label: string; url: string };
  recipients: NewsletterRecipient[];
}): Promise<{ sent: number; failed: number }> {
  const subject = opts.subject.trim();
  const body = opts.body.trim();
  if (!subject || !body) {
    throw new Error('subject and body are required');
  }
  const recipients = opts.recipients.filter((r) => r.email && r.email.includes('@'));
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const BATCH = 20;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((r) => {
        const locale: Locale =
          r.locale === 'en' || r.locale === 'es' ? r.locale : 'fr';
        const firstName = (r.firstName || '').trim() || 'Chef';
        const unsub = unsubscribeFooterHtml(r.email, 'broadcast', locale);
        const html = buildHtml({
          firstName,
          body,
          cta: opts.cta,
          locale,
          unsubscribeHtml: unsub,
        });
        const text =
          htmlToText(html) +
          unsubscribeFooterText(r.email, 'broadcast', locale);
        return resend.emails.send({
          from: FROM,
          replyTo: REPLY_TO,
          to: r.email,
          subject,
          html,
          text,
          headers: buildUnsubscribeHeaders(r.email, 'broadcast'),
        });
      }),
    );

    for (const res of results) {
      if (res.status === 'fulfilled') sent++;
      else failed++;
    }
  }

  return { sent, failed };
}

/**
 * Envoie un email de test à une seule adresse (pour preview avant envoi en masse).
 */
export async function sendNewsletterTest(opts: {
  to: string;
  subject: string;
  body: string;
  cta?: { label: string; url: string };
  firstName?: string;
  locale?: Locale;
}) {
  const locale: Locale =
    opts.locale === 'en' || opts.locale === 'es' ? opts.locale : 'fr';
  const firstName = (opts.firstName || 'Chef Test').trim();
  const unsub = unsubscribeFooterHtml(opts.to, 'broadcast', locale);
  const html = buildHtml({
    firstName,
    body: opts.body,
    cta: opts.cta,
    locale,
    unsubscribeHtml: unsub,
  });
  const text =
    htmlToText(html) +
    unsubscribeFooterText(opts.to, 'broadcast', locale);

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: opts.subject,
    html,
    text,
    headers: buildUnsubscribeHeaders(opts.to, 'broadcast'),
  });
}
