// lib/sendChefReminder.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Champs requis pour un profil complet
export type MissingField =
  | 'baseCity'
  | 'bio'
  | 'languages'
  | 'specialties'
  | 'phone'
  | 'photo';

const FIELD_LABELS: Record<MissingField, string> = {
  baseCity: 'Votre ville de base',
  bio:        'Votre présentation / biographie',
  languages:  'Vos langues parlées',
  specialties: 'Vos spécialités culinaires',
  phone:      'Votre numéro de téléphone',
  photo:      'Votre photo de profil',
};

const FIELD_HINTS: Record<MissingField, string> = {
  baseCity:   'Indispensable pour être proposé sur les missions proches de chez vous.',
  bio:        'Un profil avec une bio est 3× plus souvent sélectionné par nos clients.',
  languages:  'De nombreux clients cherchent des chefs multilingues.',
  specialties: 'Précisez vos cuisines de prédilection pour des matchings plus précis.',
  phone:      'Nécessaire pour vous contacter rapidement quand une mission se présente.',
  photo:      'Un profil avec photo inspire davantage confiance aux clients.',
};

function buildReminderHtml(params: {
  firstName?: string;
  missingFields: MissingField[];
  dashboardUrl: string;
  supportEmail: string;
}) {
  const name = (params.firstName || '').trim();
  const greeting = name ? `Bonjour ${escapeHtml(name)},` : 'Bonjour,';

  const bg     = '#F7F4EF';
  const paper  = '#FFFFFF';
  const ink    = '#111827';
  const muted  = '#6B7280';
  const line   = '#E5E7EB';
  const gold   = '#B08D57';
  const btn    = '#111827';
  const btnText = '#F7F4EF';
  const amber  = '#FEF3C7';
  const amberBorder = '#FDE68A';

  const fieldRows = params.missingFields.map((f) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${line};">
        <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:13px;color:${ink};font-weight:600;">
          <span style="color:${gold};">●</span>&nbsp; ${escapeHtml(FIELD_LABELS[f])}
        </div>
        <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;color:${muted};margin-top:3px;line-height:1.6;">
          ${escapeHtml(FIELD_HINTS[f])}
        </div>
      </td>
    </tr>
  `).join('');

  return `
  <!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Chefs Talents — Finalisez votre profil</title>
    </head>
    <body style="margin:0;padding:0;background:${bg};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Complétez votre profil pour accéder aux missions — Chef Talents.
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${bg};padding:32px 0;">
        <tr>
          <td align="center" style="padding:0 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:${paper};border:1px solid ${line};">

              <!-- Top bar -->
              <tr>
                <td style="padding:18px 28px;border-bottom:1px solid ${line};">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="left" style="font-family:ui-serif,Georgia,'Times New Roman',Times,serif;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:${ink};">
                        CHEF TALENTS
                      </td>
                      <td align="right" style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;color:${muted};">
                        Espace Chef · Profil
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="padding:36px 28px 10px 28px;">
                  <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${muted};">
                    Action requise
                  </div>
                  <h1 style="margin:14px 0 10px 0;font-family:ui-serif,Georgia,'Times New Roman',Times,serif;font-weight:500;font-size:32px;line-height:1.15;color:${ink};">
                    ${greeting}
                  </h1>
                  <p style="margin:0 0 18px 0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:15px;line-height:1.8;color:${muted};">
                    Votre profil sur Chefs Talents n'est pas encore complet. Un profil finalisé est indispensable pour que vous puissiez être proposé aux clients lors de nos matchings — et décrocher vos premières missions.
                  </p>
                </td>
              </tr>

              <!-- Alerte -->
              <tr>
                <td style="padding:0 28px 18px 28px;">
                  <div style="background:${amber};border:1px solid ${amberBorder};padding:14px 16px;border-radius:4px;">
                    <p style="margin:0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:13px;color:#92400E;line-height:1.7;">
                      <strong>${params.missingFields.length} élément${params.missingFields.length > 1 ? 's' : ''} manquant${params.missingFields.length > 1 ? 's' : ''}</strong> sur votre profil. Prenez 5 minutes pour le compléter.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Champs manquants -->
              <tr>
                <td style="padding:0 28px 10px 28px;">
                  <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${muted};margin-bottom:10px;">
                    À compléter
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    ${fieldRows}
                  </table>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding:18px 28px 10px 28px;">
                  <div style="height:1px;background:${line};width:100%;"></div>
                </td>
              </tr>

              <!-- Valeur -->
              <tr>
                <td style="padding:10px 28px 18px 28px;">
                  <p style="margin:0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:13px;color:${muted};line-height:1.8;">
                    <span style="color:${gold};font-weight:700;">•</span> Un profil complet est proposé en priorité lors des matchings<br/>
                    <span style="color:${gold};font-weight:700;">•</span> Nos clients exigent des profils sérieux et documentés<br/>
                    <span style="color:${gold};font-weight:700;">•</span> Un rendez-vous de suivi peut vous être proposé une fois le profil finalisé
                  </p>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:10px 28px 24px 28px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <a href="${escapeHtml(params.dashboardUrl)}"
                           style="display:inline-block;background:${btn};color:${btnText};text-decoration:none;padding:14px 24px;border-radius:10px;
                                  font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600;">
                          Finaliser mon profil →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:10px 0 0 0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;color:${muted};">
                    Ou copiez ce lien : <span style="color:${ink};">${escapeHtml(params.dashboardUrl)}</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 28px;border-top:1px solid ${line};background:#FBFAF8;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;color:${muted};line-height:1.7;">
                        Chefs Talents · Espace Chef<br/>
                        Contact : <a href="mailto:${escapeHtml(params.supportEmail)}" style="color:${ink};text-decoration:underline;">${escapeHtml(params.supportEmail)}</a>
                      </td>
                      <td align="right" style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:11px;color:${muted};">
                        © ${new Date().getFullYear()} Chef Talents
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>

            <div style="max-width:680px;color:${muted};font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:11px;line-height:1.6;margin-top:12px;padding:0 6px;text-align:center;">
              Vous recevez cet email car vous êtes inscrit sur la plateforme Chefs Talents.
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `.trim();
}

export async function sendChefReminder({
  email,
  firstName,
  missingFields,
}: {
  email: string;
  firstName?: string;
  missingFields: MissingField[];
}) {
  if (!missingFields.length) return { skipped: true };

  const name = (firstName || '').trim();
  const dashboardUrl = 'https://chefstalents.com/chef/dashboard';
  const supportEmail = 'contact@chefstalents.com';

  const fieldList = missingFields
    .map((f) => `- ${FIELD_LABELS[f]}`)
    .join('\n');

  const text = `Bonjour ${name || ''},

Votre profil Chefs Talents n'est pas encore complet.

Éléments manquants :
${fieldList}

Un profil finalisé est indispensable pour être proposé lors de nos matchings.

Complétez votre profil ici :
${dashboardUrl}

Contact : ${supportEmail}
Chefs Talents`;

  const html = buildReminderHtml({
    firstName,
    missingFields,
    dashboardUrl,
    supportEmail,
  });

  return resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: email,
    subject: `Finalisez votre profil Chefs Talents — ${missingFields.length} élément${missingFields.length > 1 ? 's' : ''} manquant${missingFields.length > 1 ? 's' : ''}`,
    text,
    html,
  });
}
