// lib/email/sendBoostEndingSoon.ts
// Email envoyé au chef ~7 jours avant la fin de son boost ponctuel.
// Le chef peut renouveler depuis /chef/upgrade (section Boost).

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas — Chefs Talents <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

type Locale = 'fr' | 'en' | 'es';

const T: Record<
  Locale,
  {
    subject: string;
    greeting: (name: string) => string;
    intro: (days: number) => string;
    paragraph2: string;
    untilLabel: (date: string) => string;
    cta: string;
    closing: string;
    signLine1: string;
    signLine2: string;
    signTitle: string;
    footer: string;
  }
> = {
  fr: {
    subject: 'Votre boost se termine dans 7 jours',
    greeting: (name) => `Bonjour ${name},`,
    intro: (days) =>
      `Votre boost de visibilité se termine dans <strong>${days} jours</strong>. Votre profil restera bien sûr actif sur le réseau, mais sans la mise en avant prioritaire dont vous bénéficiez actuellement.`,
    paragraph2:
      'Si vous le souhaitez, vous pouvez le renouveler dès maintenant pour conserver votre visibilité maximale sans interruption.',
    untilLabel: (date) => `Actif jusqu’au ${date}`,
    cta: 'Renouveler mon boost',
    closing:
      'Si vous préférez attendre, aucune action n’est nécessaire — votre profil reste accessible aux conciergeries comme avant.',
    signLine1: 'Bien à vous,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Fondateur, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  en: {
    subject: 'Your boost ends in 7 days',
    greeting: (name) => `Hello ${name},`,
    intro: (days) =>
      `Your visibility boost ends in <strong>${days} days</strong>. Your profile will of course remain active on the network, but without the priority placement you currently enjoy.`,
    paragraph2:
      'If you wish, you can renew it now to keep your maximum visibility without interruption.',
    untilLabel: (date) => `Active until ${date}`,
    cta: 'Renew my boost',
    closing:
      'If you prefer to wait, no action is needed — your profile remains accessible to concierges as before.',
    signLine1: 'With kind regards,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Founder, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  es: {
    subject: 'Su boost termina en 7 días',
    greeting: (name) => `Buenos días ${name},`,
    intro: (days) =>
      `Su boost de visibilidad termina en <strong>${days} días</strong>. Su perfil seguirá activo en la red, pero sin la prioridad de la que disfruta actualmente.`,
    paragraph2:
      'Si lo desea, puede renovarlo ahora para conservar su visibilidad máxima sin interrupción.',
    untilLabel: (date) => `Activo hasta el ${date}`,
    cta: 'Renovar mi boost',
    closing:
      'Si prefiere esperar, no hace falta ninguna acción — su perfil seguirá accesible para las conciergeries como antes.',
    signLine1: 'Atentamente,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Fundador, Chefs Talents',
    footer: 'Chefs Talents · Burdeos',
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
  <title>${escapeHtml(t.subject)}</title>
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
                ${t.greeting(escapeHtml(opts.firstName))}
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:1.75;color:#3f3a34;">
                ${t.intro(opts.daysLeft)}
              </p>

              <p style="margin:0 0 28px;font-size:16px;line-height:1.75;color:#3f3a34;">
                ${t.paragraph2}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-left:2px solid #c9a85f;padding:6px 0 6px 18px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.7;color:#5c4a18;font-style:italic;">
                    ${t.untilLabel(dateStr)}
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
                    <a href="${SITE_URL}/chef/upgrade" style="display:inline-block;padding:14px 30px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      ${t.cta}
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
