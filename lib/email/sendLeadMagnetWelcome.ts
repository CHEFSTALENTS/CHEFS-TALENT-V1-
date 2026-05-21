// lib/email/sendLeadMagnetWelcome.ts
// Email envoyé J0 (immédiatement après le téléchargement du guide).
// Contient le lien vers le guide en ligne + une intro éditoriale.

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
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

type Input = {
  to: string;
  firstName?: string;
  guidePath: string; // ex: '/guide/chef-prive'
};

export async function sendLeadMagnetWelcome(input: Input) {
  const { to, firstName, guidePath } = input;
  const guideUrl = `${SITE_URL}${guidePath}`;
  const requestUrl = `${SITE_URL}/request`;
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Votre guide Chefs Talents</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:${FONT};">
  <div style="display:none;font-size:1px;color:#fafafa;">Votre guide « 7 questions à poser avant d'engager un chef privé » est disponible.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #eee;border-radius:6px;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT};font-weight:600;">CHEFS TALENTS · GUIDE</div>
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;">
          <h1 style="margin:0;font-size:22px;line-height:1.3;color:#111;font-weight:600;">
            Votre guide est prêt
          </h1>
        </td></tr>
        <tr><td style="padding:16px 32px 0 32px;font-size:15px;line-height:1.6;color:#333;">
          <p style="margin:0 0 14px 0;">${greeting}</p>
          <p style="margin:0 0 14px 0;">
            Merci pour votre intérêt. Le guide <strong>« 7 questions à poser avant d'engager un chef privé »</strong> est disponible à la lecture immédiate :
          </p>
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;" align="center">
          <a href="${guideUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:600;font-size:14px;">
            Lire le guide
          </a>
        </td></tr>
        <tr><td style="padding:20px 32px 0 32px;font-size:14px;line-height:1.6;color:#444;">
          <p style="margin:0 0 12px 0;">
            Vous y trouverez les critères que nous appliquons en interne pour sélectionner les chefs que nous plaçons en villa, sur yacht ou en résidence, et les questions qui font la différence entre une mission réussie et un service décevant.
          </p>
          <p style="margin:0 0 12px 0;">
            Si vous avez déjà un projet précis en tête (saison à Saint-Tropez, dîner ponctuel, mariage, chef permanent…), vous pouvez nous soumettre votre demande directement :
          </p>
          <p style="margin:14px 0 0 0;">
            <a href="${requestUrl}" style="color:${ACCENT};text-decoration:none;font-weight:600;">→ Soumettre une demande</a>
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px 8px 32px;font-size:14px;line-height:1.6;color:#444;">
          <p style="margin:0;">Bien à vous,</p>
          <p style="margin:4px 0 0 0;"><strong>Thomas Delcroix</strong><br>Fondateur, Chefs Talents</p>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px;border-top:1px solid #eee;font-size:11px;color:#888;line-height:1.5;">
          <div>Chefs Talents — Agence française de chefs privés haut de gamme</div>
          <div style="margin-top:6px;">${unsubscribeFooterHtml(to, 'broadcast', 'fr')}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const text = `${greeting}

Merci pour votre intérêt.

Votre guide « 7 questions à poser avant d'engager un chef privé » est disponible :
${guideUrl}

Vous y trouverez les critères que nous appliquons en interne pour sélectionner les chefs que nous plaçons en villa, sur yacht ou en résidence, et les questions qui font la différence entre une mission réussie et un service décevant.

Si vous avez déjà un projet précis (saison Saint-Tropez, dîner, mariage, chef permanent…), soumettez votre demande directement :
${requestUrl}

Bien à vous,
Thomas Delcroix
Fondateur, Chefs Talents

${unsubscribeFooterText(to, 'broadcast', 'fr')}`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: 'Votre guide Chefs Talents est prêt',
    html,
    text: htmlToText(html) || text,
    headers: buildUnsubscribeHeaders(to, 'broadcast'),
  });
}
