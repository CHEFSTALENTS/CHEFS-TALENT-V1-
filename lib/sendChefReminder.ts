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

export type MissingField =
  | 'baseCity'
  | 'bio'
  | 'languages'
  | 'specialties'
  | 'phone'
  | 'photo';

// ─────────────────────────────────────────────────────────────
// TRADUCTIONS
// ─────────────────────────────────────────────────────────────
type Lang = 'fr' | 'en';

const TRANSLATIONS: Record<Lang, {
  subject: (count: number) => string;
  topBarRight: string;
  actionRequired: string;
  greeting: (name: string) => string;
  intro: string;
  alertText: (count: number) => string;
  toComplete: string;
  values: string[];
  ctaButton: string;
  ctaLinkLabel: string;
  footerContact: string;
  footnote: string;
  fieldLabels: Record<MissingField, string>;
  fieldHints: Record<MissingField, string>;
}> = {
  fr: {
    subject: (n) => `Finalisez votre profil Chefs Talents — ${n} élément${n > 1 ? 's' : ''} manquant${n > 1 ? 's' : ''}`,
    topBarRight: 'Espace Chef · Profil',
    actionRequired: 'Action requise',
    greeting: (name) => name ? `Bonjour ${name},` : 'Bonjour,',
    intro: "Votre profil sur Chefs Talents n'est pas encore complet. Un profil finalisé est indispensable pour que vous puissiez être proposé aux clients lors de nos matchings — et décrocher vos premières missions.",
    alertText: (n) => `<strong>${n} élément${n > 1 ? 's' : ''} manquant${n > 1 ? 's' : ''}</strong> sur votre profil. Prenez 5 minutes pour le compléter.`,
    toComplete: 'À compléter',
    values: [
      'Un profil complet est proposé en priorité lors des matchings',
      'Nos clients exigent des profils sérieux et documentés',
      'Un rendez-vous de suivi peut vous être proposé une fois le profil finalisé',
    ],
    ctaButton: 'Finaliser mon profil →',
    ctaLinkLabel: 'Ou copiez ce lien :',
    footerContact: 'Chef Talents · Espace Chef<br/>Contact :',
    footnote: 'Vous recevez cet email car vous êtes inscrit sur la plateforme Chefs Talents.',
    fieldLabels: {
      baseCity:   'Votre ville de base',
      bio:        'Votre présentation / biographie',
      languages:  'Vos langues parlées',
      specialties: 'Vos spécialités culinaires',
      phone:      'Votre numéro de téléphone',
      photo:      'Votre photo de profil',
    },
    fieldHints: {
      baseCity:   'Indispensable pour être proposé sur les missions proches de chez vous.',
      bio:        'Un profil avec une bio est 3× plus souvent sélectionné par nos clients.',
      languages:  'De nombreux clients cherchent des chefs multilingues.',
      specialties: 'Précisez vos cuisines de prédilection pour des matchings plus précis.',
      phone:      'Nécessaire pour vous contacter rapidement quand une mission se présente.',
      photo:      'Un profil avec photo inspire davantage confiance aux clients.',
    },
  },

  en: {
    subject: (n) => `Complete your Chefs Talents profile — ${n} missing item${n > 1 ? 's' : ''}`,
    topBarRight: 'Chef Space · Profile',
    actionRequired: 'Action required',
    greeting: (name) => name ? `Hello ${name},` : 'Hello,',
    intro: "Your Chefs Talents profile is not yet complete. A finalised profile is essential for you to be matched with clients and land your first missions.",
    alertText: (n) => `<strong>${n} missing item${n > 1 ? 's' : ''}</strong> on your profile. Take 5 minutes to complete it.`,
    toComplete: 'To complete',
    values: [
      'A complete profile is prioritised during our matching process',
      'Our clients require thorough, well-documented profiles',
      'A follow-up meeting may be offered once your profile is finalised',
    ],
    ctaButton: 'Complete my profile →',
    ctaLinkLabel: 'Or copy this link:',
    footerContact: 'Chef Talents · Chef Space<br/>Contact:',
    footnote: 'You are receiving this email because you are registered on the Chefs Talents platform.',
    fieldLabels: {
      baseCity:   'Your base city',
      bio:        'Your bio / presentation',
      languages:  'Languages you speak',
      specialties: 'Your culinary specialties',
      phone:      'Your phone number',
      photo:      'Your profile photo',
    },
    fieldHints: {
      baseCity:   'Essential to be matched with missions near you.',
      bio:        'Profiles with a bio are selected 3× more often by our clients.',
      languages:  'Many clients specifically look for multilingual chefs.',
      specialties: 'Specify your preferred cuisines for more accurate matching.',
      phone:      'Required so we can reach you quickly when a mission comes up.',
      photo:      'Profiles with a photo inspire significantly more trust from clients.',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// DÉTECTION DE LANGUE
// Retourne 'en' si le chef parle anglais, 'fr' sinon
// ─────────────────────────────────────────────────────────────
function detectLang(chefLanguages?: string | string[] | null): Lang {
  if (!chefLanguages) return 'fr';

  const langs = Array.isArray(chefLanguages)
    ? chefLanguages
    : String(chefLanguages).split(/,|;|\|/).map((s) => s.trim());

  const englishPatterns = ['english', 'en', 'anglais', 'eng'];

  for (const l of langs) {
    const normalized = l.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (englishPatterns.some((p) => normalized === p || normalized.startsWith(p))) {
      return 'en';
    }
  }

  return 'fr';
}

// ─────────────────────────────────────────────────────────────
// CONSTRUCTION HTML
// ─────────────────────────────────────────────────────────────
function buildReminderHtml(params: {
  firstName?: string;
  missingFields: MissingField[];
  dashboardUrl: string;
  supportEmail: string;
  lang: Lang;
}) {
  const t = TRANSLATIONS[params.lang];
  const name = (params.firstName || '').trim();
  const greeting = t.greeting(name);

  const bg          = '#F7F4EF';
  const paper       = '#FFFFFF';
  const ink         = '#111827';
  const muted       = '#6B7280';
  const line        = '#E5E7EB';
  const gold        = '#B08D57';
  const btn         = '#111827';
  const btnText     = '#F7F4EF';
  const amber       = '#FEF3C7';
  const amberBorder = '#FDE68A';

  const fieldRows = params.missingFields.map((f) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${line};">
        <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:13px;color:${ink};font-weight:600;">
          <span style="color:${gold};">●</span>&nbsp; ${escapeHtml(t.fieldLabels[f])}
        </div>
        <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;color:${muted};margin-top:3px;line-height:1.6;">
          ${escapeHtml(t.fieldHints[f])}
        </div>
      </td>
    </tr>
  `).join('');

  const valueRows = t.values.map((v) => `
    <span style="color:${gold};font-weight:700;">●</span> ${escapeHtml(v)}<br/>
  `).join('');

  return `
  <!doctype html>
  <html lang="${params.lang}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Chef Talents</title>
    </head>
    <body style="margin:0;padding:0;background:${bg};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${params.lang === 'fr' ? 'Complétez votre profil pour accéder aux missions' : 'Complete your profile to access missions'} — Chef Talents.
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
                        ${escapeHtml(t.topBarRight)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="padding:36px 28px 10px 28px;">
                  <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${muted};">
                    ${escapeHtml(t.actionRequired)}
                  </div>
                  <h1 style="margin:14px 0 10px 0;font-family:ui-serif,Georgia,'Times New Roman',Times,serif;font-weight:500;font-size:32px;line-height:1.15;color:${ink};">
                    ${escapeHtml(greeting)}
                  </h1>
                  <p style="margin:0 0 18px 0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:15px;line-height:1.8;color:${muted};">
                    ${escapeHtml(t.intro)}
                  </p>
                </td>
              </tr>

              <!-- Alerte -->
              <tr>
                <td style="padding:0 28px 18px 28px;">
                  <div style="background:${amber};border:1px solid ${amberBorder};padding:14px 16px;border-radius:4px;">
                    <p style="margin:0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:13px;color:#92400E;line-height:1.7;">
                      ${t.alertText(params.missingFields.length)}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Champs manquants -->
              <tr>
                <td style="padding:0 28px 10px 28px;">
                  <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${muted};margin-bottom:10px;">
                    ${escapeHtml(t.toComplete)}
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
                  <p style="margin:0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:13px;color:${muted};line-height:1.9;">
                    ${valueRows}
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
                          ${escapeHtml(t.ctaButton)}
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:10px 0 0 0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;color:${muted};">
                    ${escapeHtml(t.ctaLinkLabel)} <span style="color:${ink};">${escapeHtml(params.dashboardUrl)}</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 28px;border-top:1px solid ${line};background:#FBFAF8;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;font-size:12px;color:${muted};line-height:1.7;">
                        ${t.footerContact} <a href="mailto:${escapeHtml(params.supportEmail)}" style="color:${ink};text-decoration:underline;">${escapeHtml(params.supportEmail)}</a>
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
              ${escapeHtml(t.footnote)}
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function sendChefReminder({
  email,
  firstName,
  missingFields,
  chefLanguages,
}: {
  email: string;
  firstName?: string;
  missingFields: MissingField[];
  chefLanguages?: string | string[] | null;
}) {
  if (!missingFields.length) return { skipped: true };

  const lang = detectLang(chefLanguages);
  const t = TRANSLATIONS[lang];
  const name = (firstName || '').trim();
  const dashboardUrl = 'https://chefstalents.com/chef/dashboard';
  const supportEmail = 'contact@chefstalents.com';

  const fieldList = missingFields.map((f) => `- ${t.fieldLabels[f]}`).join('\n');

  const text = lang === 'fr'
    ? `Bonjour ${name || ''},\n\nVotre profil Chefs Talents n'est pas encore complet.\n\nÉléments manquants :\n${fieldList}\n\nComplétez votre profil ici :\n${dashboardUrl}\n\nContact : ${supportEmail}\nChef Talents`
    : `Hello ${name || ''},\n\nYour Chefs Talents profile is not yet complete.\n\nMissing items:\n${fieldList}\n\nComplete your profile here:\n${dashboardUrl}\n\nContact: ${supportEmail}\nChef Talents`;

  const html = buildReminderHtml({
    firstName,
    missingFields,
    dashboardUrl,
    supportEmail,
    lang,
  });

  return resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: email,
    subject: t.subject(missingFields.length),
    text,
    html,
  });
}
