// lib/email/sendBoostEndingSoon.ts
// Email envoyé au chef ~7 jours avant la fin de son boost ponctuel.
// Le chef peut renouveler depuis /chef/upgrade (section Boost).
// Design : Revolut Business — sans-serif, blanc, accent burgundy.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas Delcroix <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
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
    intro: (days: number) => string;
    paragraph2: string;
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
    subject: 'Votre boost se termine dans 7 jours',
    preheader:
      'Renouvelez maintenant pour conserver votre visibilité prioritaire.',
    eyebrow: 'BOOST EN FIN',
    greeting: (name) => `Bonjour ${name},`,
    intro: (days) =>
      `Votre boost de visibilité se termine dans <strong>${days} jours</strong>. Votre profil restera bien sûr actif sur le réseau, mais sans la mise en avant prioritaire dont vous bénéficiez actuellement.`,
    paragraph2:
      'Si vous le souhaitez, vous pouvez le renouveler dès maintenant pour conserver votre visibilité maximale sans interruption.',
    untilLabel: (date) => `Actif jusqu’au ${date}`,
    cta: 'Renouveler mon boost',
    closing:
      'Si vous préférez attendre, aucune action n’est nécessaire. Votre profil reste accessible aux conciergeries comme avant.',
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  en: {
    subject: 'Your boost ends in 7 days',
    preheader: 'Renew now to keep your priority visibility.',
    eyebrow: 'BOOST ENDING',
    greeting: (name) => `Hello ${name},`,
    intro: (days) =>
      `Your visibility boost ends in <strong>${days} days</strong>. Your profile will of course remain active on the network, but without the priority placement you currently enjoy.`,
    paragraph2:
      'If you wish, you can renew it now to keep your maximum visibility without interruption.',
    untilLabel: (date) => `Active until ${date}`,
    cta: 'Renew my boost',
    closing:
      'If you prefer to wait, no action is needed. Your profile remains accessible to concierges as before.',
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  es: {
    subject: 'Su boost termina en 7 días',
    preheader: 'Renueve ahora para conservar su visibilidad prioritaria.',
    eyebrow: 'BOOST POR FINALIZAR',
    greeting: (name) => `Buenos días ${name},`,
    intro: (days) =>
      `Su boost de visibilidad termina en <strong>${days} días</strong>. Su perfil seguirá activo en la red, pero sin la prioridad de la que disfruta actualmente.`,
    paragraph2:
      'Si lo desea, puede renovarlo ahora para conservar su visibilidad máxima sin interrupción.',
    untilLabel: (date) => `Activo hasta el ${date}`,
    cta: 'Renovar mi boost',
    closing:
      'Si prefiere esperar, no hace falta ninguna acción. Su perfil seguirá accesible para las conciergeries como antes.',
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
  daysLeft: number;
  boostedUntil: string;
  locale: Locale;
}): string {
  const t = T[opts.locale];
  const dateStr = new Date(opts.boostedUntil).toLocaleDateString(
    DATE_LOCALE[opts.locale],
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

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
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 20px;font-family:${FONT};font-size:28px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.2;">
                ${t.greeting(escapeHtml(opts.firstName))}
              </h1>
              <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:#27272a;">
                ${t.intro(opts.daysLeft)}
              </p>
              <p style="margin:0 0 24px;font-family:${FONT};font-size:16px;line-height:1.6;color:#52525b;">
                ${t.paragraph2}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf4f4;border:1px solid #f5dada;border-radius:12px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="margin:0;font-family:${FONT};font-size:14px;font-weight:600;color:${ACCENT};letter-spacing:-0.01em;">
                      ${t.untilLabel(dateStr)}
                    </p>
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
                    <a href="${SITE_URL}/chef/upgrade" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
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
                    Chefs Talents — Bordeaux
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:12px;">
                    <a href="${SITE_URL}" style="color:#a1a1aa;text-decoration:none;">chefstalents.com</a>
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

export async function sendBoostEndingSoon(opts: {
  email: string;
  firstName?: string;
  boostedUntil: string;
  daysLeft: number;
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
      daysLeft: opts.daysLeft,
      boostedUntil: opts.boostedUntil,
      locale,
    }),
  });
}
