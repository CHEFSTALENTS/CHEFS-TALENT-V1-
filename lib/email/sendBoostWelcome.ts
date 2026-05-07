// lib/email/sendBoostWelcome.ts
// Email envoyé au chef après achat d'un boost ponctuel (1 mois).
// Design : éditorial, serif, palette warm-luxe restreinte. Pas d'emojis.

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
    intro: string;
    paragraph2: string;
    overline: string;
    bullets: string[];
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
    subject: 'Boost activé — visibilité maximale pendant 30 jours',
    greeting: (name) => `Bonjour ${name},`,
    intro:
      'Votre boost est activé. Pendant les 30 prochains jours, votre profil bénéficie d’une visibilité maximale auprès des conciergeries et des clients qualifiés du réseau.',
    paragraph2:
      'Vous remontez en priorité dans les sélections que nous présentons à nos partenaires.',
    overline: 'Période de boost',
    bullets: [
      'Profil mis en avant dans les sélections conciergerie',
      'Score matching renforcé pour les nouvelles demandes',
      'Visibilité accrue pendant 30 jours pleins',
    ],
    untilLabel: (date) => `Actif jusqu’au ${date}`,
    cta: 'Voir mon profil',
    closing:
      'À mi-parcours, nous vous rappellerons la date de fin afin que vous puissiez décider sereinement de prolonger.',
    signLine1: 'Bien à vous,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Fondateur, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  en: {
    subject: 'Boost activated — maximum visibility for 30 days',
    greeting: (name) => `Hello ${name},`,
    intro:
      'Your boost is now active. For the next 30 days, your profile gets maximum visibility with concierges and qualified clients from the network.',
    paragraph2:
      'You move up in priority within the selections we present to our partners.',
    overline: 'Boost period',
    bullets: [
      'Profile featured in concierge selections',
      'Enhanced matching score on new requests',
      'Increased visibility for 30 full days',
    ],
    untilLabel: (date) => `Active until ${date}`,
    cta: 'See my profile',
    closing:
      'We will remind you of the end date midway through, so you can decide calmly whether to extend.',
    signLine1: 'With kind regards,',
    signLine2: 'Thomas Delcroix',
    signTitle: 'Founder, Chefs Talents',
    footer: 'Chefs Talents · Bordeaux',
  },
  es: {
    subject: 'Boost activado — visibilidad máxima durante 30 días',
    greeting: (name) => `Buenos días ${name},`,
    intro:
      'Su boost está activado. Durante los próximos 30 días, su perfil obtiene la máxima visibilidad ante las conciergeries y los clientes cualificados de la red.',
    paragraph2:
      'Sube con prioridad en las selecciones que presentamos a nuestros partners.',
    overline: 'Periodo de boost',
    bullets: [
      'Perfil destacado en las selecciones de conciergeries',
      'Score de matching reforzado en las nuevas solicitudes',
      'Visibilidad aumentada durante 30 días completos',
    ],
    untilLabel: (date) => `Activo hasta el ${date}`,
    cta: 'Ver mi perfil',
    closing:
      'A mitad del periodo, le recordaremos la fecha de finalización para que pueda decidir con calma si desea prolongar.',
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
  boostedUntil: string; // ISO
  locale: Locale;
}): string {
  const t = T[opts.locale];
  const dateStr = new Date(opts.boostedUntil).toLocaleDateString(
    DATE_LOCALE[opts.locale],
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  const bulletRows = t.bullets
    .map(
      (b) => `
              <tr>
                <td style="padding:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#3f3a34;">
                  <span style="display:inline-block;width:22px;color:#9b9082;">—</span>${escapeHtml(b)}
                </td>
              </tr>`,
    )
    .join('');

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
                ${t.intro}
              </p>

              <p style="margin:0 0 28px;font-size:16px;line-height:1.75;color:#3f3a34;">
                ${t.paragraph2}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf9f5;border:1px solid #ece6dc;">
                <tr>
                  <td style="padding:24px 28px;font-family:Georgia,'Times New Roman',serif;">
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:#9b9082;">
                      ${t.overline}
                    </p>
                    <p style="margin:0 0 16px;font-size:15px;color:#1a1815;font-style:italic;">
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
            <td align="left" style="padding:0 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#1a1815;">
                    <a href="${SITE_URL}/chef/dashboard" style="display:inline-block;padding:14px 30px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
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
