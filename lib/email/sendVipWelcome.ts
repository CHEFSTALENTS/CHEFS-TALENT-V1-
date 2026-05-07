// lib/email/sendVipWelcome.ts
// Email envoyé au chef après activation VIP (paiement Stripe ou grant admin).
// Design : Revolut Business — sans-serif moderne, fond blanc, accent burgundy,
// hero image, CTA pill noir, signature Thomas Delcroix Founder.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas Delcroix <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const HERO_IMAGE = `${SITE_URL}/images/email/hero-vip-welcome.jpg`;
const ACCENT = '#7f1d1d'; // burgundy

type Locale = 'fr' | 'en' | 'es';

const T: Record<
  Locale,
  {
    subject: string;
    preheader: string;
    eyebrow: string;
    greeting: (name: string) => string;
    introPaid: (planLabel: string) => string;
    introComp: (planLabel: string) => string;
    paragraph2: string;
    overlineWhatsNext: string;
    bullets: { title: string; body: string }[];
    callIncluded: string;
    cta: string;
    closing: string;
    signLine1: string;
    signTitle: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  fr: {
    subject: 'Bienvenue parmi les Chefs VIP',
    preheader: 'Votre adhésion est confirmée. Voici ce qui vous attend.',
    eyebrow: 'CHEFS VIP',
    greeting: (name) => `Bonjour ${name},`,
    introPaid: (planLabel) =>
      `Votre adhésion <strong>${planLabel}</strong> est confirmée. Vous rejoignez le cercle restreint des chefs membres VIP de Chefs Talents.`,
    introComp: (planLabel) =>
      `Nous vous offrons un accès <strong>${planLabel}</strong> au cercle des chefs membres VIP de Chefs Talents.`,
    paragraph2:
      'Vous bénéficiez désormais d’un accès prioritaire aux missions, des ressources éditoriales exclusives et de l’accompagnement réservé au réseau.',
    overlineWhatsNext: 'CE QUI VOUS ATTEND',
    bullets: [
      {
        title: 'Missions en priorité',
        body: 'Les briefs sont adressés aux VIP avant le reste du réseau.',
      },
      {
        title: 'Ressources VIP',
        body: 'Guides tarification, codes clients, gestion de mission longue.',
      },
      {
        title: 'Espace dédié',
        body: 'Un tableau de bord avec l’ensemble des contenus du programme.',
      },
    ],
    callIncluded:
      'Votre engagement annuel inclut un échange de positionnement de 30 minutes avec Thomas. Le lien est disponible dans votre espace.',
    cta: 'Accéder à mon espace VIP',
    closing:
      'Le canal WhatsApp Last Minute vous sera adressé personnellement sous 24 heures, après vérification de votre profil.',
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  en: {
    subject: 'Welcome to Chefs VIP',
    preheader: 'Your membership is confirmed. Here is what awaits you.',
    eyebrow: 'CHEFS VIP',
    greeting: (name) => `Hello ${name},`,
    introPaid: (planLabel) =>
      `Your <strong>${planLabel}</strong> membership is confirmed. You are now part of the inner circle of VIP member chefs at Chefs Talents.`,
    introComp: (planLabel) =>
      `We are offering you <strong>${planLabel}</strong> access to the inner circle of VIP member chefs at Chefs Talents.`,
    paragraph2:
      'You now enjoy priority access to missions, exclusive editorial resources, and the support reserved for the network.',
    overlineWhatsNext: 'WHAT AWAITS YOU',
    bullets: [
      {
        title: 'Missions first',
        body: 'Briefs are sent to VIP members before the rest of the network.',
      },
      {
        title: 'VIP resources',
        body: 'Pricing guides, client codes, long-mission playbook.',
      },
      {
        title: 'Dedicated space',
        body: 'A dashboard with all the program content in one place.',
      },
    ],
    callIncluded:
      'Your annual commitment includes a 30-minute positioning conversation with Thomas. The link is available in your space.',
    cta: 'Open my VIP space',
    closing:
      'The Last Minute WhatsApp channel will be sent to you personally within 24 hours, after profile verification.',
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  es: {
    subject: 'Bienvenido al círculo Chefs VIP',
    preheader: 'Su adhesión está confirmada. Esto es lo que le espera.',
    eyebrow: 'CHEFS VIP',
    greeting: (name) => `Buenos días ${name},`,
    introPaid: (planLabel) =>
      `Su adhesión <strong>${planLabel}</strong> está confirmada. Se une al círculo restringido de chefs miembros VIP de Chefs Talents.`,
    introComp: (planLabel) =>
      `Le ofrecemos un acceso <strong>${planLabel}</strong> al círculo de chefs miembros VIP de Chefs Talents.`,
    paragraph2:
      'A partir de ahora dispone de acceso prioritario a las misiones, de recursos editoriales exclusivos y del acompañamiento reservado a la red.',
    overlineWhatsNext: 'LO QUE LE ESPERA',
    bullets: [
      {
        title: 'Misiones con prioridad',
        body: 'Los briefs se envían a los VIP antes del resto de la red.',
      },
      {
        title: 'Recursos VIP',
        body: 'Guías de tarificación, códigos cliente, gestión de misión larga.',
      },
      {
        title: 'Espacio dedicado',
        body: 'Un panel con todos los contenidos del programa.',
      },
    ],
    callIncluded:
      'Su compromiso anual incluye una conversación de posicionamiento de 30 minutos con Thomas. El enlace está disponible en su espacio.',
    cta: 'Acceder a mi espacio VIP',
    closing:
      'El canal WhatsApp Last Minute le será enviado personalmente en 24 horas, tras la verificación de su perfil.',
    signLine1: 'Atentamente,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Burdeos',
    footerRight: 'chefstalents.com',
  },
};

const PLAN_LABELS: Record<string, Record<Locale, string>> = {
  vip_3m: { fr: 'VIP 3 mois', en: 'VIP 3 months', es: 'VIP 3 meses' },
  vip_6m: { fr: 'VIP 6 mois', en: 'VIP 6 months', es: 'VIP 6 meses' },
  vip_12m: { fr: 'VIP 12 mois', en: 'VIP 12 months', es: 'VIP 12 meses' },
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

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
      (b, i) => `
            <tr>
              <td style="padding:${i === 0 ? '0' : '14px'} 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="top" width="28" style="padding-top:6px;">
                      <div style="width:8px;height:8px;background:${ACCENT};border-radius:50%;"></div>
                    </td>
                    <td valign="top">
                      <p style="margin:0 0 4px;font-family:${FONT};font-size:15px;font-weight:600;color:#09090b;line-height:1.4;">${b.title}</p>
                      <p style="margin:0;font-family:${FONT};font-size:14px;color:#52525b;line-height:1.55;">${b.body}</p>
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
  <meta name="supported-color-schemes" content="light">
  <title>${t.subject}</title>
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
              <h1 style="margin:0 0 20px;font-family:${FONT};font-size:28px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.2;">
                ${t.greeting(opts.firstName)}
              </h1>
              <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:#27272a;">
                ${intro}
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
                    <p style="margin:0 0 16px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:#71717a;">
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
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf4f4;border:1px solid #f5dada;border-radius:12px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:#5a1717;">
                      ${t.callIncluded}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <tr>
            <td align="left" style="padding:0 32px 32px;">
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
