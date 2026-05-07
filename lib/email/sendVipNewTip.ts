// lib/email/sendVipNewTip.ts
// Email envoyé à tous les chefs VIP actifs quand l'admin ajoute un nouveau
// tip. Design éditorial, pas d'emojis.

import { Resend } from 'resend';
import type { VipTip } from '@/lib/vip-content';
import { listVipChefs } from './listVipChefs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas — Chefs Talents <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

type Locale = 'fr' | 'en' | 'es';

const T: Record<
  Locale,
  {
    subject: (title: string) => string;
    greeting: (name: string) => string;
    intro: string;
    overline: string;
    ctaWithLink: string;
    ctaSpace: string;
    closing: string;
    signLine1: string;
    signLine2: string;
    signTitle: string;
    footer: string;
  }
> = {
  fr: {
    subject: (title) => `Nouvelle ressource — ${title}`,
    greeting: (name) => `Bonjour ${name},`,
    intro:
      'Une nouvelle ressource vient d’être ajoutée à votre espace VIP. Elle est désormais disponible à votre consultation.',
    overline: 'Nouvelle parution',
    ctaWithLink: 'Ouvrir la ressource',
    ctaSpace: 'Consulter mon espace',
    closing:
      'Toutes les ressources VIP restent disponibles dans votre espace, à tout moment.',
    signLine1: 'Bien à vous,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Fondateur, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  en: {
    subject: (title) => `New resource — ${title}`,
    greeting: (name) => `Hello ${name},`,
    intro:
      'A new resource has just been added to your VIP space. It is now available to you.',
    overline: 'New release',
    ctaWithLink: 'Open the resource',
    ctaSpace: 'Open my space',
    closing:
      'All VIP resources remain available in your space, at any time.',
    signLine1: 'With kind regards,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Founder, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  es: {
    subject: (title) => `Nuevo recurso — ${title}`,
    greeting: (name) => `Buenos días ${name},`,
    intro:
      'Acaba de añadirse un nuevo recurso a su espacio VIP. Ya está disponible para su consulta.',
    overline: 'Nueva publicación',
    ctaWithLink: 'Abrir el recurso',
    ctaSpace: 'Consultar mi espacio',
    closing:
      'Todos los recursos VIP permanecen disponibles en su espacio, en todo momento.',
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

function buildHtml(opts: {
  firstName: string;
  tip: VipTip;
  locale: Locale;
}): string {
  const t = T[opts.locale];
  const tip = opts.tip;
  const link = tip.href || `${SITE_URL}/chef/vip`;
  const cta = tip.href ? t.ctaWithLink : t.ctaSpace;

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tip.title)}</title>
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
              <h1 style="margin:0 0 28px;font-size:28px;font-weight:400;color:#1a1815;letter-spacing:-0.01em;line-height:1.25;">
                ${t.greeting(opts.firstName)}
              </h1>

              <p style="margin:0 0 28px;font-size:16px;line-height:1.75;color:#3f3a34;">
                ${t.intro}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf9f5;border:1px solid #ece6dc;">
                <tr>
                  <td style="padding:28px 30px;font-family:Georgia,'Times New Roman',serif;">
                    <p style="margin:0 0 14px;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:#9b9082;">
                      ${t.overline}
                    </p>
                    <h2 style="margin:0 0 14px;font-size:22px;font-weight:400;color:#1a1815;line-height:1.35;">
                      ${escapeHtml(tip.title)}
                    </h2>
                    ${
                      tip.desc
                        ? `<p style="margin:0;font-size:15px;line-height:1.7;color:#59544d;">${escapeHtml(tip.desc)}</p>`
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:0 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#1a1815;">
                    <a href="${escapeHtml(link)}" style="display:inline-block;padding:14px 30px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      ${cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 32px;font-family:Georgia,'Times New Roman',serif;">
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#7d756a;font-style:italic;">
                ${t.closing}
              </p>

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
