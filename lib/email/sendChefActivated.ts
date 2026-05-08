// lib/email/sendChefActivated.ts
// Email envoyé au chef quand l'admin fait passer son status de
// 'approved' à 'active' (validation post-onboarding visio).
// Design : Revolut Business — sans-serif, blanc, accent burgundy,
// hero image villa-service, signature Thomas Delcroix Founder.

import { Resend } from 'resend';
import {
  htmlToText,
  buildUnsubscribeHeaders,
  unsubscribeFooterHtml,
  unsubscribeFooterText,
} from './_helpers';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas Delcroix <thomas@chefstalents.com>';
const REPLY_TO = 'thomas@chefstalents.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const HERO_IMAGE = `${SITE_URL}/images/email/villa-service.jpg`;
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

// Contact WhatsApp Thomas (lien wa.me, sans le +)
const WHATSAPP_NUMBER = '33756827612';

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
    overlineHowItWorks: string;
    bullets: { title: string; body: string }[];
    ctaDashboard: string;
    whatsappEyebrow: string;
    whatsappTitle: string;
    whatsappBody: string;
    whatsappCta: string;
    whatsappPrefilled: string;
    vipEyebrow: string;
    vipTitle: string;
    vipBody: string;
    vipCta: string;
    closing: string;
    signLine1: string;
    signTitle: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  fr: {
    subject: 'Votre profil est actif sur Chefs Talents',
    preheader:
      'Suite à notre échange, votre profil est désormais visible auprès du réseau.',
    eyebrow: 'PROFIL ACTIVÉ',
    greeting: (name) => `Bonjour ${name},`,
    intro:
      'Suite à notre échange, j’ai le plaisir de vous confirmer que votre profil est désormais actif sur Chefs Talents. À partir de maintenant, les conciergeries et les clients du réseau peuvent recevoir votre proposition lorsqu’une mission correspond à votre profil.',
    paragraph2:
      'Voici comment se passe la suite, dans le quotidien.',
    overlineHowItWorks: 'CE QUI CHANGE POUR VOUS',
    bullets: [
      {
        title: 'Missions adressées',
        body: 'Nous vous contactons par email dès qu’une demande correspond à votre profil et à vos disponibilités.',
      },
      {
        title: 'Profil à jour',
        body: 'Pensez à actualiser régulièrement vos disponibilités et photos. C’est ce qui détermine votre visibilité.',
      },
      {
        title: 'Réponse rapide',
        body: 'Les conciergeries placent leurs missions en 24 à 48 heures. Les chefs qui répondent vite passent devant.',
      },
    ],
    ctaDashboard: 'Accéder à mon espace chef',
    whatsappEyebrow: 'CONTACT DIRECT',
    whatsappTitle: 'Mon WhatsApp',
    whatsappBody:
      'Vous pouvez m’écrire à tout moment, pour discuter d’une mission entrante, d’un point de positionnement ou d’une question pratique. Je suis votre interlocuteur direct.',
    whatsappCta: 'Discuter sur WhatsApp',
    whatsappPrefilled:
      'Bonjour Thomas, je viens de recevoir l’activation de mon profil Chefs Talents.',
    vipEyebrow: 'POUR ALLER PLUS LOIN',
    vipTitle: 'Le programme VIP',
    vipBody:
      'Les chefs qui souhaitent recevoir les missions en priorité, accéder à la bibliothèque opérationnelle et bénéficier d’un accompagnement personnalisé peuvent rejoindre le programme VIP.',
    vipCta: 'Découvrir le programme VIP',
    closing:
      'Je reste disponible si vous avez la moindre question. Bienvenue dans le réseau.',
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },

  en: {
    subject: 'Your profile is active on Chefs Talents',
    preheader:
      'Following our conversation, your profile is now visible to the network.',
    eyebrow: 'PROFILE ACTIVATED',
    greeting: (name) => `Hello ${name},`,
    intro:
      'Following our conversation, I am pleased to confirm that your profile is now active on Chefs Talents. From now on, concierges and clients of the network can receive your proposal whenever a mission matches your profile.',
    paragraph2: 'Here is how it works from now on, day to day.',
    overlineHowItWorks: 'WHAT CHANGES FOR YOU',
    bullets: [
      {
        title: 'Missions sent to you',
        body: 'We contact you by email as soon as a request matches your profile and availability.',
      },
      {
        title: 'Up-to-date profile',
        body: 'Remember to keep your availability and photos current. That is what determines your visibility.',
      },
      {
        title: 'Quick response',
        body: 'Concierges place their missions within 24 to 48 hours. Chefs who reply quickly move ahead.',
      },
    ],
    ctaDashboard: 'Open my chef space',
    whatsappEyebrow: 'DIRECT CONTACT',
    whatsappTitle: 'My WhatsApp',
    whatsappBody:
      'You can write to me at any time, to discuss an incoming mission, a positioning question, or any practical matter. I am your direct contact.',
    whatsappCta: 'Message me on WhatsApp',
    whatsappPrefilled:
      'Hello Thomas, I just received the activation of my Chefs Talents profile.',
    vipEyebrow: 'TO GO FURTHER',
    vipTitle: 'The VIP programme',
    vipBody:
      'Chefs who want to receive missions in priority, access the operational library, and benefit from personalised support can join the VIP programme.',
    vipCta: 'Discover the VIP programme',
    closing:
      'I remain available for any question. Welcome to the network.',
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },

  es: {
    subject: 'Su perfil está activo en Chefs Talents',
    preheader:
      'Tras nuestra conversación, su perfil ya es visible para la red.',
    eyebrow: 'PERFIL ACTIVADO',
    greeting: (name) => `Buenos días ${name},`,
    intro:
      'Tras nuestra conversación, tengo el gusto de confirmarle que su perfil ya está activo en Chefs Talents. A partir de ahora, las conciergeries y los clientes de la red pueden recibir su propuesta cuando una misión corresponda a su perfil.',
    paragraph2: 'Esto es lo que cambia en su día a día.',
    overlineHowItWorks: 'LO QUE CAMBIA PARA USTED',
    bullets: [
      {
        title: 'Misiones enviadas',
        body: 'Le contactamos por correo en cuanto una solicitud corresponda a su perfil y a su disponibilidad.',
      },
      {
        title: 'Perfil al día',
        body: 'Acuérdese de actualizar regularmente sus disponibilidades y fotos. Eso determina su visibilidad.',
      },
      {
        title: 'Respuesta rápida',
        body: 'Las conciergeries colocan sus misiones en 24 a 48 horas. Los chefs que responden rápido pasan delante.',
      },
    ],
    ctaDashboard: 'Acceder a mi espacio chef',
    whatsappEyebrow: 'CONTACTO DIRECTO',
    whatsappTitle: 'Mi WhatsApp',
    whatsappBody:
      'Puede escribirme en cualquier momento, para hablar de una misión entrante, una cuestión de posicionamiento o un punto práctico. Soy su contacto directo.',
    whatsappCta: 'Hablar por WhatsApp',
    whatsappPrefilled:
      'Hola Thomas, acabo de recibir la activación de mi perfil Chefs Talents.',
    vipEyebrow: 'PARA IR MÁS LEJOS',
    vipTitle: 'El programa VIP',
    vipBody:
      'Los chefs que deseen recibir las misiones con prioridad, acceder a la biblioteca operacional y beneficiarse de un acompañamiento personalizado pueden unirse al programa VIP.',
    vipCta: 'Descubrir el programa VIP',
    closing:
      'Quedo a su disposición para cualquier pregunta. Bienvenido a la red.',
    signLine1: 'Atentamente,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Burdeos',
    footerRight: 'chefstalents.com',
  },
};

function buildHtml(opts: {
  firstName: string;
  locale: Locale;
  unsubscribeHtml?: string;
}): string {
  const t = T[opts.locale];

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

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.whatsappPrefilled)}`;

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
                    <p style="margin:0 0 16px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:#71717a;">
                      ${t.overlineHowItWorks}
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
            <td align="left" style="padding:0 32px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#09090b;border-radius:999px;">
                    <a href="${SITE_URL}/chef/dashboard" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      ${t.ctaDashboard} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf4f4;border:1px solid #f5dada;border-radius:12px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 6px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:${ACCENT};">
                      ${t.whatsappEyebrow}
                    </p>
                    <h3 style="margin:0 0 8px;font-family:${FONT};font-size:18px;font-weight:700;color:#5a1717;letter-spacing:-0.01em;">
                      ${t.whatsappTitle}
                    </h3>
                    <p style="margin:0 0 14px;font-family:${FONT};font-size:14px;line-height:1.55;color:#5a1717;">
                      ${t.whatsappBody}
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background:${ACCENT};border-radius:999px;">
                          <a href="${whatsappLink}" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                            ${t.whatsappCta} →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f4f4f5;border-bottom:1px solid #f4f4f5;">
                <tr>
                  <td style="padding:18px 0;">
                    <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:#71717a;">
                      ${t.vipEyebrow}
                    </p>
                    <h3 style="margin:0 0 6px;font-family:${FONT};font-size:17px;font-weight:700;color:#09090b;letter-spacing:-0.01em;">
                      ${t.vipTitle}
                    </h3>
                    <p style="margin:0 0 10px;font-family:${FONT};font-size:14px;line-height:1.55;color:#52525b;">
                      ${t.vipBody}
                    </p>
                    <a href="${SITE_URL}/chef/upgrade" style="font-family:${FONT};font-size:13px;font-weight:600;color:${ACCENT};text-decoration:none;">
                      ${t.vipCta} →
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

export async function sendChefActivated(opts: {
  email: string;
  firstName?: string;
  locale?: Locale;
}) {
  const locale: Locale =
    opts.locale === 'fr' || opts.locale === 'en' || opts.locale === 'es'
      ? opts.locale
      : 'fr';
  const t = T[locale];
  const name = (opts.firstName || '').trim() || 'Chef';

  const unsubFooterHtml = unsubscribeFooterHtml(
    opts.email,
    'transactional',
    locale,
  );
  const html = buildHtml({
    firstName: name,
    locale,
    unsubscribeHtml: unsubFooterHtml,
  });
  const text =
    htmlToText(html) +
    unsubscribeFooterText(opts.email, 'transactional', locale);

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.email,
    subject: t.subject,
    html,
    text,
    headers: buildUnsubscribeHeaders(opts.email, 'transactional'),
  });
}
