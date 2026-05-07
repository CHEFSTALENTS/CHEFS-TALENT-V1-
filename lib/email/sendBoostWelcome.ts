// lib/email/sendBoostWelcome.ts
// Email envoyé au chef après achat d'un boost ponctuel (1 mois).
// Design : Revolut Business — sans-serif, blanc, accent burgundy.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas Delcroix <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const HERO_IMAGE = `${SITE_URL}/images/email/kitchen-preparation.jpg`;
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

type Locale = 'fr' | 'en' | 'es';

const T: Record<
  Locale,
  {
    subject: string;
    preheader: string;
    eyebrow: string;
    greeting: (name: string) => string;
    intro: string;
    paragraph2: string;
    overline: string;
    bullets: { title: string; body: string }[];
    untilLabel: (date: string) => string;
    cta: string;
    closing: string;
    signLine1: string;
    signTitle: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  fr: {
    subject: 'Votre boost est activé pour 30 jours',
    preheader: 'Visibilité maximale pendant 30 jours auprès des conciergeries.',
    eyebrow: 'BOOST ACTIF',
    greeting: (name) => `Bonjour ${name},`,
    intro:
      'Votre boost est activé. Pendant les 30 prochains jours, votre profil bénéficie d’une visibilité maximale auprès des conciergeries et des clients qualifiés du réseau.',
    paragraph2:
      'Vous remontez en priorité dans les sélections que nous présentons à nos partenaires.',
    overline: 'PÉRIODE DE BOOST',
    bullets: [
      {
        title: 'Mise en avant',
        body: 'Profil prioritaire dans les sélections conciergerie.',
      },
      {
        title: 'Score renforcé',
        body: 'Matching boosté sur toutes les nouvelles demandes.',
      },
      {
        title: '30 jours pleins',
        body: 'Visibilité accrue jusqu’à la date indiquée ci-dessous.',
      },
    ],
    untilLabel: (date) => `Actif jusqu’au ${date}`,
    cta: 'Voir mon profil',
    closing:
      'À mi-parcours, nous vous rappellerons la date de fin afin que vous puissiez décider sereinement de prolonger.',
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  en: {
    subject: 'Your boost is now active for 30 days',
    preheader: 'Maximum visibility for 30 days with concierge partners.',
    eyebrow: 'BOOST ACTIVE',
    greeting: (name) => `Hello ${name},`,
    intro:
      'Your boost is now active. For the next 30 days, your profile gets maximum visibility with concierges and qualified clients from the network.',
    paragraph2:
      'You move up in priority within the selections we present to our partners.',
    overline: 'BOOST PERIOD',
    bullets: [
      {
        title: 'Featured profile',
        body: 'Priority placement in concierge selections.',
      },
      {
        title: 'Boosted score',
        body: 'Enhanced matching on every new request.',
      },
      {
        title: '30 full days',
        body: 'Higher visibility until the date shown below.',
      },
    ],
    untilLabel: (date) => `Active until ${date}`,
    cta: 'See my profile',
    closing:
      'We will remind you of the end date midway through, so you can decide calmly whether to extend.',
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  es: {
    subject: 'Su boost está activo durante 30 días',
    preheader: 'Visibilidad máxima durante 30 días con las conciergeries.',
    eyebrow: 'BOOST ACTIVO',
    greeting: (name) => `Buenos días ${name},`,
    intro:
      'Su boost está activado. Durante los próximos 30 días, su perfil obtiene la máxima visibilidad ante las conciergeries y los clientes cualificados de la red.',
    paragraph2:
      'Sube con prioridad en las selecciones que presentamos a nuestros partners.',
    overline: 'PERIODO DE BOOST',
    bullets: [
      {
        title: 'Perfil destacado',
        body: 'Posición prioritaria en las selecciones de conciergeries.',
      },
      {
        title: 'Score reforzado',
        body: 'Matching mejorado en todas las nuevas solicitudes.',
      },
      {
        title: '30 días completos',
        body: 'Mayor visibilidad hasta la fecha indicada abajo.',
      },
    ],
    untilLabel: (date) => `Activo hasta el ${date}`,
    cta: 'Ver mi perfil',
    closing:
      'A mitad del periodo, le recordaremos la fecha de finalización para que pueda decidir con calma si desea prolongar.',
    signLine1: 'Atentamente,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Burdeos',
    footerRight: 'chefstalents.com',
  },
};

const DATE_LOCALE: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
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
  boostedUntil: string;
  locale: Locale;
}): string {
  const t = T[opts.locale];
  const dateStr = new Date(opts.boostedUntil).toLocaleDateString(
    DATE_LOCALE[opts.locale],
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  const bulletRows = t.bullets
    .map(
      (b, i) => `
            <tr>
              <td style="padding:${i === 0 ? '0' : '14px'} 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="top" width="28" style="padding-top:6px;">
                      <div style="width:8px;height:8px;background:${ACCENT};border-radius:50%;"></div>
                    </td>
                    <td valign="top">
                      <p style="margin:0 0 4px;font-family:${FONT};font-size:15px;font-weight:600;color:#09090b;line-height:1.4;">${escapeHtml(b.title)}</p>
                      <p style="margin:0;font-family:${FONT};font-size:14px;color:#52525b;line-height:1.55;">${escapeHtml(b.body)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>${escapeHtml(t.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">${escapeHtml(t.preheader)}</span>
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
              <h1 style="margin:0 0 20px;font-family:${FONT};font-size:28px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.2;">
                ${t.greeting(escapeHtml(opts.firstName))}
              </h1>
              <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:#27272a;">
                ${t.intro}
              </p>
              <p style="margin:0 0 24px;font-family:${FONT};font-size:16px;line-height:1.6;color:#52525b;">
                ${t.paragraph2}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border-radius:12px;border:1px solid #f4f4f5;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:#71717a;">
                      ${t.overline}
                    </p>
                    <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;color:${ACCENT};font-weight:600;">
                      ${t.untilLabel(dateStr)}
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${bulletRows}
                    </table>
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
                    <a href="${SITE_URL}/chef/dashboard" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      ${t.cta} →
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

export async function sendBoostWelcome(opts: {
  email: string;
  firstName?: string;
  boostedUntil: string;
  locale?: Locale;
}) {
  const locale: Locale =
    opts.locale === 'fr' || opts.locale === 'en' || opts.locale === 'es'
      ? opts.locale
      : 'fr';
  const t = T[locale];
  const name = (opts.firstName || '').trim() || 'Chef';

  await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: t.subject,
    html: buildHtml({
      firstName: name,
      boostedUntil: opts.boostedUntil,
      locale,
    }),
  });
}
