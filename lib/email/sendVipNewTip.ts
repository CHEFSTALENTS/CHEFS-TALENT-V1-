// lib/email/sendVipNewTip.ts
// Email envoyé à tous les chefs VIP actifs quand l'admin ajoute un nouveau
// guide. Design : Revolut Business — sans-serif, blanc, accent burgundy.

import { Resend } from 'resend';
import type { VipTip } from '@/lib/vip-content';
import { listVipChefs } from './listVipChefs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas Delcroix <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const HERO_IMAGE = `${SITE_URL}/images/email/plating.jpg`;
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

type Locale = 'fr' | 'en' | 'es';

const T: Record<
  Locale,
  {
    subject: (title: string) => string;
    preheader: string;
    eyebrow: string;
    greeting: (name: string) => string;
    intro: string;
    sectionLabel: string;
    ctaWithLink: string;
    ctaSpace: string;
    closing: string;
    signLine1: string;
    signTitle: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  fr: {
    subject: (title) => `Nouvelle ressource VIP, ${title}`,
    preheader: 'Une nouvelle ressource a été ajoutée à votre espace VIP.',
    eyebrow: 'NOUVELLE PARUTION',
    greeting: (name) => `Bonjour ${name},`,
    intro:
      'Une nouvelle ressource vient d’être publiée dans votre espace VIP. Elle est disponible dès maintenant.',
    sectionLabel: 'À LIRE',
    ctaWithLink: 'Lire la ressource',
    ctaSpace: 'Consulter mon espace',
    closing:
      'L’ensemble de la bibliothèque VIP reste accessible depuis votre espace, à tout moment.',
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  en: {
    subject: (title) => `New VIP resource, ${title}`,
    preheader: 'A new resource has been added to your VIP space.',
    eyebrow: 'NEW RELEASE',
    greeting: (name) => `Hello ${name},`,
    intro:
      'A new resource has just been published in your VIP space. It is available right now.',
    sectionLabel: 'READ',
    ctaWithLink: 'Read the resource',
    ctaSpace: 'Open my space',
    closing:
      'The full VIP library remains accessible from your space at any time.',
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  es: {
    subject: (title) => `Nuevo recurso VIP, ${title}`,
    preheader: 'Se ha añadido un nuevo recurso a su espacio VIP.',
    eyebrow: 'NUEVA PUBLICACIÓN',
    greeting: (name) => `Buenos días ${name},`,
    intro:
      'Acaba de publicarse un nuevo recurso en su espacio VIP. Está disponible desde ya.',
    sectionLabel: 'LEER',
    ctaWithLink: 'Leer el recurso',
    ctaSpace: 'Consultar mi espacio',
    closing:
      'Toda la biblioteca VIP permanece accesible desde su espacio en todo momento.',
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

function buildHtml(opts: {
  firstName: string;
  tip: VipTip;
  locale: Locale;
}): string {
  const t = T[opts.locale];
  const tip = opts.tip;
  const isInternal = !!tip.href && tip.href.startsWith('/');
  const link = tip.href
    ? isInternal
      ? `${SITE_URL}${tip.href}`
      : tip.href
    : `${SITE_URL}/chef/vip`;
  const cta = tip.href ? t.ctaWithLink : t.ctaSpace;

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>${escapeHtml(tip.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">${t.preheader}</span>
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
            <td style="padding:24px 32px 0;">
              <img src="${HERO_IMAGE}" alt="" width="536" style="display:block;width:100%;height:auto;border-radius:12px;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 20px;font-family:${FONT};font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.2;">
                ${t.greeting(opts.firstName)}
              </h1>
              <p style="margin:0 0 24px;font-family:${FONT};font-size:16px;line-height:1.6;color:#27272a;">
                ${t.intro}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 12px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:${ACCENT};">
                      ${t.sectionLabel}
                    </p>
                    <h2 style="margin:0 0 12px;font-family:${FONT};font-size:20px;font-weight:700;color:#09090b;letter-spacing:-0.01em;line-height:1.3;">
                      ${escapeHtml(tip.title)}
                    </h2>
                    ${
                      tip.desc
                        ? `<p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:#52525b;">${escapeHtml(tip.desc)}</p>`
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:0 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#09090b;border-radius:999px;">
                    <a href="${escapeHtml(link)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      ${cta} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:1.6;color:#71717a;">
                ${t.closing}
              </p>
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

/**
 * Envoie l'email "nouvelle ressource VIP" à tous les chefs VIP actifs.
 * Returns: { sent, failed }
 */
export async function sendVipNewTipToAll(tip: VipTip): Promise<{
  sent: number;
  failed: number;
}> {
  const recipients = await listVipChefs();
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  const subjectByLocale: Record<Locale, string> = {
    fr: T.fr.subject(tip.title),
    en: T.en.subject(tip.title),
    es: T.es.subject(tip.title),
  };

  let sent = 0;
  let failed = 0;

  // Envoi en parallèle, par batches de 20 pour éviter le rate limit
  const BATCH = 20;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((r) =>
        resend.emails.send({
          from: FROM,
          to: r.email,
          subject: subjectByLocale[r.locale] || subjectByLocale.fr,
          html: buildHtml({
            firstName: r.firstName?.trim() || 'Chef',
            tip,
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
