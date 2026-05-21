// lib/email/sendLeadNurture.ts
// Séquence nurture après le téléchargement du guide.
// Step 1 (J+3) : pitch positionnement "agence sélective vs marketplace"
// Step 2 (J+7) : preuve sociale + invitation à soumettre une demande
// Step 3 (J+14) : last touch éditorial (cas pratique) + breakup soft

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

type Step = 1 | 2 | 3;

const STEP_CONTENT: Record<
  Step,
  {
    subject: string;
    eyebrow: string;
    title: string;
    body: (firstName: string) => string;
    cta: string;
    ctaPath: string;
  }
> = {
  1: {
    subject: 'Agence vs marketplace : pourquoi ce choix compte',
    eyebrow: 'CHEFS TALENTS',
    title: 'La différence se joue sur la sélection',
    body: (g) => `
      <p>${g}</p>
      <p>Quelques jours après avoir consulté notre guide, un mot rapide sur ce qui distingue Chefs Talents des plateformes type marketplace.</p>
      <p>Sur les marketplaces ouvertes, n'importe quel chef peut créer un profil. Vous arbitrez seul entre des dizaines de candidats que personne n'a vetté. Le risque : un dîner raté, une saison à Saint-Tropez compromise, ou un chef qui annule à J-3 sans recours.</p>
      <p>Nous fonctionnons en <strong>agence sélective</strong>. Chaque chef que nous présentons a été :</p>
      <ul style="padding-left:20px;margin:8px 0;">
        <li>Vérifié sur son parcours (passages en restaurants étoilés, références vérifiables)</li>
        <li>Testé en mission de probation</li>
        <li>Engagé par contrat avec NDA et clause d'exclusivité 24 mois</li>
      </ul>
      <p>Si un chef devient indisponible, nous le remplaçons. C'est notre engagement contractuel — unique sur le marché à notre connaissance.</p>
      <p>Si vous avez un projet en cours d'arbitrage, nous pouvons vous proposer une short-list en 48h.</p>
    `,
    cta: 'Soumettre une demande',
    ctaPath: '/request',
  },
  2: {
    subject: "Saint-Tropez, Cap-Ferrat, Megève : les saisons se remplissent",
    eyebrow: 'CHEFS TALENTS · SAISONS',
    title: 'Les meilleurs profils se réservent tôt',
    body: (g) => `
      <p>${g}</p>
      <p>Petit rappel sur le calendrier de réservation. Pour les destinations sous tension, les chefs les plus recherchés se positionnent <strong>4 à 6 mois à l'avance</strong> :</p>
      <ul style="padding-left:20px;margin:8px 0;">
        <li><strong>Saint-Tropez, Cap-Ferrat, Cap d'Antibes</strong> — saison été : réserver janvier-février</li>
        <li><strong>Yachts Méditerranée</strong> — semaines juillet-août : ferme dès mars</li>
        <li><strong>Megève, Courchevel, Val d'Isère</strong> — saison hiver : ouvrir le sujet en septembre</li>
        <li><strong>Cannes Festival, Monaco GP</strong> — réservation 6 mois avant</li>
      </ul>
      <p>Si vous savez où vous serez cet été (ou cet hiver), nous pouvons vous positionner sur un chef avant que la haute saison ne se ferme.</p>
      <p>Pour un dîner ponctuel ou un événement à Paris, Londres ou autre, le délai est plus souple : 2 à 4 semaines suffisent généralement.</p>
    `,
    cta: 'Décrire votre projet',
    ctaPath: '/request',
  },
  3: {
    subject: 'Un dernier mot — et je vous laisse tranquille',
    eyebrow: 'CHEFS TALENTS',
    title: 'Disponible quand vous le serez',
    body: (g) => `
      <p>${g}</p>
      <p>C'est ma dernière relance après votre lecture du guide. Si Chefs Talents n'est pas le bon moment ou pas le bon match, aucun souci — je vous laisse tranquille.</p>
      <p>Si en revanche un projet se précise dans les semaines ou mois à venir (saison, dîner, événement, chef permanent), gardez en tête que nous travaillons sur l'ensemble de l'Europe et qu'un échange préliminaire ne vous engage à rien.</p>
      <p>Vous pouvez aussi simplement répondre à cet email avec vos contraintes (lieu, dates, type de mission, budget indicatif) — je vous reviens avec une short-list ou un avis circonstancié.</p>
      <p>Merci pour votre attention,</p>
    `,
    cta: 'Échanger sur votre projet',
    ctaPath: '/request',
  },
};

export async function sendLeadNurture(input: {
  to: string;
  firstName?: string;
  step: Step;
}) {
  const { to, firstName, step } = input;
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  const content = STEP_CONTENT[step];
  const ctaUrl = `${SITE_URL}${content.ctaPath}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${content.subject}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #eee;border-radius:6px;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT};font-weight:600;">${content.eyebrow}</div>
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;">
          <h1 style="margin:0;font-size:22px;line-height:1.3;color:#111;font-weight:600;">${content.title}</h1>
        </td></tr>
        <tr><td style="padding:16px 32px 0 32px;font-size:15px;line-height:1.6;color:#333;">
          ${content.body(greeting)}
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;" align="center">
          <a href="${ctaUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:600;font-size:14px;">
            ${content.cta}
          </a>
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

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: content.subject,
    html,
    text: htmlToText(html),
    headers: buildUnsubscribeHeaders(to, 'broadcast'),
  });
}
