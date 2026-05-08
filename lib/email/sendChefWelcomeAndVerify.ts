// lib/email/sendChefWelcomeAndVerify.ts
// Email envoyé immédiatement après le signup d'un chef.
// Souhaite la bienvenue + invite à vérifier l'email via lien magique.
// Design : Revolut Business — sans-serif, blanc, accent burgundy.

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
    cta: string;
    expiryNote: string;
    closing: string;
    signLine1: string;
    signTitle: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  fr: {
    subject: 'Confirmez votre email — Chefs Talents',
    preheader:
      'Un dernier clic pour activer votre compte sur Chefs Talents.',
    eyebrow: 'BIENVENUE',
    greeting: (name) => `Bonjour ${name},`,
    intro:
      'Bienvenue sur Chefs Talents. Votre compte est créé. Avant de continuer, je vous invite à vérifier votre adresse email en cliquant sur le bouton ci-dessous. Cela me permet de m’assurer que je peux vous joindre lorsqu’une mission correspond à votre profil.',
    paragraph2: 'Voici les prochaines étapes une fois votre email vérifié.',
    overline: 'PROCHAINES ÉTAPES',
    bullets: [
      {
        title: 'Compléter votre profil',
        body: 'Photos, expérience, mobilité, tarifs. Comptez 15 à 25 minutes.',
      },
      {
        title: 'Échange visio de 30 minutes',
        body: 'Lorsque votre profil est complet, je vous envoie un lien pour réserver un créneau avec moi.',
      },
      {
        title: 'Activation auprès du réseau',
        body: 'Suite à notre échange, je valide votre profil et les conciergeries du réseau peuvent vous contacter.',
      },
    ],
    cta: 'Vérifier mon email',
    expiryNote: 'Ce lien expire dans 48 heures.',
    closing:
      'Si vous n’avez pas créé de compte sur Chefs Talents, ignorez simplement cet email.',
    signLine1: 'Bien à vous,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  en: {
    subject: 'Confirm your email — Chefs Talents',
    preheader: 'One last click to activate your Chefs Talents account.',
    eyebrow: 'WELCOME',
    greeting: (name) => `Hello ${name},`,
    intro:
      'Welcome to Chefs Talents. Your account has been created. Before going further, please verify your email address by clicking the button below. This allows me to make sure I can reach you when a mission matches your profile.',
    paragraph2: 'Here are the next steps once your email is verified.',
    overline: 'NEXT STEPS',
    bullets: [
      {
        title: 'Complete your profile',
        body: 'Photos, experience, mobility, rates. Allow 15 to 25 minutes.',
      },
      {
        title: '30-minute video call',
        body: 'When your profile is complete, I send you a link to book a slot with me.',
      },
      {
        title: 'Network activation',
        body: 'After our call, I approve your profile and concierge partners can reach you.',
      },
    ],
    cta: 'Verify my email',
    expiryNote: 'This link expires in 48 hours.',
    closing:
      'If you did not create an account on Chefs Talents, please ignore this email.',
    signLine1: 'With kind regards,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Bordeaux',
    footerRight: 'chefstalents.com',
  },
  es: {
    subject: 'Confirme su correo — Chefs Talents',
    preheader: 'Un último clic para activar su cuenta en Chefs Talents.',
    eyebrow: 'BIENVENIDO',
    greeting: (name) => `Buenos días ${name},`,
    intro:
      'Bienvenido a Chefs Talents. Su cuenta ya está creada. Antes de continuar, le invito a verificar su dirección de correo haciendo clic en el botón de abajo. Esto me permite asegurarme de que puedo contactarle cuando una misión corresponda a su perfil.',
    paragraph2: 'Estas son las próximas etapas una vez verificado su correo.',
    overline: 'PRÓXIMAS ETAPAS',
    bullets: [
      {
        title: 'Completar su perfil',
        body: 'Fotos, experiencia, movilidad, tarifas. Cuente 15 a 25 minutos.',
      },
      {
        title: 'Conversación en vídeo de 30 minutos',
        body: 'Cuando su perfil esté completo, le envío un enlace para reservar un horario.',
      },
      {
        title: 'Activación en la red',
        body: 'Tras nuestra conversación, valido su perfil y las conciergeries de la red pueden contactarle.',
      },
    ],
    cta: 'Verificar mi correo',
    expiryNote: 'Este enlace expira en 48 horas.',
    closing:
      'Si no ha creado una cuenta en Chefs Talents, simplemente ignore este correo.',
    signLine1: 'Atentamente,',
    signTitle: 'Founder, Chefs Talents',
    footerLeft: 'Chefs Talents — Burdeos',
    footerRight: 'chefstalents.com',
  },
};

function buildHtml(opts: {
  firstName: string;
  verifyUrl: string;
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

  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
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
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:8px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#09090b;border-radius:999px;">
                    <a href="${opts.verifyUrl}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      ${t.cta} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;color:#a1a1aa;font-style:italic;">
                ${t.expiryNote}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 8px;">
              <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:#52525b;">
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
                      ${t.overline}
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

export async function sendChefWelcomeAndVerify(opts: {
  email: string;
  firstName?: string;
  verifyUrl: string;
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
    verifyUrl: opts.verifyUrl,
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
