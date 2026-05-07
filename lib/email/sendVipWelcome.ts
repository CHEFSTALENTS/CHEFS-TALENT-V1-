// lib/email/sendVipWelcome.ts
// Email envoyé au chef après activation VIP (paiement Stripe ou grant admin).
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
    introPaid: (planLabel: string) => string;
    introComp: (planLabel: string) => string;
    paragraph2: string;
    overlineWhatsNext: string;
    bullets: string[];
    callIncluded: string;
    cta: string;
    closing: string;
    signLine1: string;
    signLine2: string;
    footerLeft: string;
  }
> = {
  fr: {
    subject: 'Bienvenue parmi les Chef VIP — Chefs Talents',
    greeting: (name) => `Bonjour ${name},`,
    introPaid: (planLabel) =>
      `Votre adhésion <em>${planLabel}</em> est confirmée. Vous rejoignez le cercle restreint des chefs membres VIP de Chefs Talents.`,
    introComp: (planLabel) =>
      `Nous vous offrons un accès <em>${planLabel}</em> au cercle des chefs membres VIP de Chefs Talents.`,
    paragraph2:
      'Vous bénéficiez désormais d’un accès prioritaire aux missions, des ressources éditoriales exclusives et de l’accompagnement réservé au réseau.',
    overlineWhatsNext: 'Ce qui vous attend',
    bullets: [
      'Canal WhatsApp VIP — missions adressées en priorité',
      'Documentation éditoriale : tarification, codes clients, gestion de mission',
      'Espace VIP avec l’ensemble des ressources',
    ],
    callIncluded:
      'Votre engagement annuel inclut un échange de positionnement de trente minutes avec Thomas. Le lien est disponible dans votre espace.',
    cta: 'Accéder à mon espace',
    closing:
      'Le canal WhatsApp Last Minute vous sera adressé personnellement sous vingt-quatre heures, après vérification de votre profil.',
    signLine1: 'Bien à vous,',
    signLine2: 'Thomas Delcroix',
    footerLeft: 'Chefs Talents · Bordeaux',
  },
  en: {
    subject: 'Welcome to Chef VIP — Chefs Talents',
    greeting: (name) => `Hello ${name},`,
    introPaid: (planLabel) =>
      `Your <em>${planLabel}</em> membership is confirmed. You are now part of the inner circle of VIP member chefs at Chefs Talents.`,
    introComp: (planLabel) =>
      `We are offering you <em>${planLabel}</em> access to the inner circle of VIP member chefs at Chefs Talents.`,
    paragraph2:
      'You now enjoy priority access to missions, exclusive editorial resources, and the support reserved to the network.',
    overlineWhatsNext: 'What awaits you',
    bullets: [
      'VIP WhatsApp channel — missions sent to you first',
      'Editorial documentation: pricing, client codes, mission management',
      'VIP space with all the resources',
    ],
    callIncluded:
      'Your annual commitment includes a thirty-minute positioning conversation with Thomas. The link is available in your space.',
    cta: 'Open my space',
    closing:
      'The Last Minute WhatsApp channel will be sent to you personally within twenty-four hours, after profile verification.',
    signLine1: 'With kind regards,',
    signLine2: 'Thomas Delcroix',
    footerLeft: 'Chefs Talents · Bordeaux',
  },
  es: {
    subject: 'Bienvenido al círculo Chef VIP — Chefs Talents',
    greeting: (name) => `Buenos días ${name},`,
    introPaid: (planLabel) =>
      `Su adhesión <em>${planLabel}</em> está confirmada. Se une al círculo restringido de chefs miembros VIP de Chefs Talents.`,
    introComp: (planLabel) =>
      `Le ofrecemos un acceso <em>${planLabel}</em> al círculo de chefs miembros VIP de Chefs Talents.`,
    paragraph2:
      'A partir de ahora dispone de acceso prioritario a las misiones, de recursos editoriales exclusivos y del acompañamiento reservado a la red.',
    overlineWhatsNext: 'Lo que le espera',
    bullets: [
      'Canal WhatsApp VIP — misiones enviadas con prioridad',
      'Documentación editorial: tarificación, códigos cliente, gestión de misión',
      'Espacio VIP con todos los recursos',
    ],
    callIncluded:
      'Su compromiso anual incluye una conversación de posicionamiento de treinta minutos con Thomas. El enlace está disponible en su espacio.',
    cta: 'Acceder a mi espacio',
    closing:
      'El canal WhatsApp Last Minute le será enviado personalmente en veinticuatro horas, tras la verificación de su perfil.',
    signLine1: 'Atentamente,',
    signLine2: 'Thomas Delcroix',
    footerLeft: 'Chefs Talents · Burdeos',
  },
};

const PLAN_LABELS: Record<string, Record<Locale, string>> = {
  vip_3m: { fr: 'VIP 3 mois', en: 'VIP 3 months', es: 'VIP 3 meses' },
  vip_6m: { fr: 'VIP 6 mois', en: 'VIP 6 months', es: 'VIP 6 meses' },
  vip_12m: { fr: 'VIP 12 mois', en: 'VIP 12 months', es: 'VIP 12 meses' },
};

const SIGN_TITLE: Record<Locale, string> = {
  fr: 'Fondateur, Chefs Talents',
  en: 'Founder, Chefs Talents',
  es: 'Fundador, Chefs Talents',
};

function buildHtml(opts: {
  firstName: string;
  planLabel: string;
  isComplimentary: boolean;
  includesCall: boolean;
  locale: Locale;
}): string {
  const t = T[opts.locale];
  const intro = opts.isComplimentary
    ? t.introComp(opts.planLabel)
    : t.introPaid(opts.planLabel);

  const bulletRows = t.bullets
    .map(
      (b) => `
              <tr>
                <td style="padding:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#3f3a34;">
                  <span style="display:inline-block;width:22px;color:#9b9082;">—</span>${b}
                </td>
              </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
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
              <h1 style="margin:0 0 28px;font-size:30px;font-weight:400;color:#1a1815;letter-spacing:-0.01em;line-height:1.2;">
                ${t.greeting(opts.firstName)}
              </h1>

              <p style="margin:0 0 18px;font-size:16px;line-height:1.75;color:#3f3a34;">
                ${intro}
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
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:#9b9082;">
                      ${t.overlineWhatsNext}
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${bulletRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            opts.includesCall
              ? `
          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-left:2px solid #c9a85f;padding:6px 0 6px 18px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.7;color:#5c4a18;font-style:italic;">
                    ${t.callIncluded}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <tr>
            <td align="left" style="padding:8px 40px 36px;">
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
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#7d756a;font-style:italic;">
                ${t.closing}
              </p>

              <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#3f3a34;">
                ${t.signLine1}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3a34;">
                <em>${t.signLine2}</em><br>
                <span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b9082;">${SIGN_TITLE[opts.locale]}</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;background:#f7f5f2;border-top:1px solid #ece6dc;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#a8a29e;text-align:center;">
                ${t.footerLeft} &middot; chefstalents.com
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

export async function sendVipWelcome(opts: {
  email: string;
  firstName?: string;
  planKey: string;
  isComplimentary: boolean;
  locale?: Locale;
}) {
  const locale: Locale =
    opts.locale === 'fr' || opts.locale === 'en' || opts.locale === 'es'
      ? opts.locale
      : 'fr';
  const t = T[locale];
  const name = (opts.firstName || '').trim() || 'Chef';
  const planLabel =
    PLAN_LABELS[opts.planKey]?.[locale] || opts.planKey || 'VIP';

  await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: t.subject,
    html: buildHtml({
      firstName: name,
      planLabel,
      isComplimentary: opts.isComplimentary,
      includesCall: opts.planKey === 'vip_12m',
      locale,
    }),
  });
}
