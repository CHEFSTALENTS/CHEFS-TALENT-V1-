// lib/sendClientConfirmation.ts
//
// Email de confirmation envoyé au client après soumission du formulaire
// /request (ou /villa). Reprend l'intégralité du brief soumis et utilise
// un délai unifié « sous 6 à 24h ». Plus de notion de Fast/Concierge match.
//
// Le ton positionne Thomas comme l'interlocuteur humain qui va revenir
// vers le client : pas une plateforme automatique, un vrai contact.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export type ClientBriefRecap = {
  // Identité
  firstName?: string | null;
  fullName?: string | null;

  // Localisation et dates
  location?: string | null;
  startDate?: string | null;     // YYYY-MM-DD
  endDate?: string | null;       // YYYY-MM-DD
  dateMode?: string | null;      // 'single' | 'range' | 'flexible'

  // Mission
  missionCategory?: string | null;     // 'punctual' | 'replacement' | 'residence' | 'yacht' …
  assignmentType?: string | null;
  guestCount?: number | null;

  // Service
  serviceExpectations?: string | null; // niveau de service ('standard'|'premium'|'uhnw')
  serviceRhythm?: string | null;
  mealPlan?: string | null;            // 'breakfast'|'lunch'|'dinner'|'full_day'…

  // Préférences
  preferredLanguage?: string | null;
  dietaryRestrictions?: string | null;
  cuisinePreferences?: string | null;

  // Budget
  budgetRange?: string | null;
  budgetAmount?: number | null;
  budgetUnit?: string | null;

  // Libre
  message?: string | null;
};

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  // Date pure YYYY-MM-DD : pas de fuseau horaire à appliquer.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  const monthName = months[Number(mo) - 1] || mo;
  return `${Number(d)} ${monthName} ${y}`;
}

function fmtDateRange(start?: string | null, end?: string | null): string | null {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e) return `du ${s} au ${e}`;
  if (s) return `à partir du ${s}`;
  return null;
}

const MISSION_LABEL: Record<string, string> = {
  punctual: 'Prestation ponctuelle',
  replacement: 'Remplacement',
  residence: 'Séjour / résidence',
  yacht: 'Mission yacht',
  villa: 'Villa',
  event: 'Événement',
};

const SERVICE_LABEL: Record<string, string> = {
  standard: 'Standard — cuisine soignée',
  premium: 'Premium — gastronomique',
  uhnw: 'Exception — standards UHNW',
  unsure: 'À cadrer ensemble',
  essential: 'Essentiel',
  exclusive: 'Exception',
};

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  brunch: 'Brunch',
  full_day: 'Tous les repas (full time)',
  full_time: 'Tous les repas (full time)',
};

function labelOrSelf(map: Record<string, string>, v?: string | null): string | null {
  if (!v) return null;
  return map[v.toLowerCase()] || v;
}

/** Liste les lignes de récap brief à afficher dans le mail (skip vides). */
function buildBriefRows(brief: ClientBriefRecap): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];

  const mission = labelOrSelf(MISSION_LABEL, brief.missionCategory ?? brief.assignmentType);
  if (mission) rows.push({ label: 'Mission', value: mission });

  if (brief.location) rows.push({ label: 'Lieu', value: brief.location });

  const dates = fmtDateRange(brief.startDate, brief.endDate);
  if (dates) rows.push({ label: 'Dates', value: dates });

  if (brief.guestCount && brief.guestCount > 0) {
    rows.push({
      label: 'Couverts',
      value: `${brief.guestCount} personne${brief.guestCount > 1 ? 's' : ''}`,
    });
  }

  const service = labelOrSelf(SERVICE_LABEL, brief.serviceExpectations);
  if (service) rows.push({ label: 'Niveau de service', value: service });

  const meal = labelOrSelf(MEAL_LABEL, brief.mealPlan);
  if (meal) rows.push({ label: 'Repas', value: meal });

  if (brief.preferredLanguage) {
    rows.push({ label: 'Langues souhaitées', value: brief.preferredLanguage });
  }
  if (brief.dietaryRestrictions) {
    rows.push({ label: 'Régimes / allergies', value: brief.dietaryRestrictions });
  }
  if (brief.cuisinePreferences) {
    rows.push({ label: 'Cuisines préférées', value: brief.cuisinePreferences });
  }

  if (brief.budgetRange) {
    rows.push({ label: 'Budget indicatif', value: brief.budgetRange });
  } else if (brief.budgetAmount) {
    const unit = brief.budgetUnit ? ` ${brief.budgetUnit}` : ' €';
    rows.push({
      label: 'Budget indicatif',
      value: `${brief.budgetAmount.toLocaleString('fr-FR')}${unit}`,
    });
  }

  return rows;
}

function formatGreeting(firstName?: string | null) {
  const n = (firstName || '').trim();
  if (!n) return 'Bonjour,';
  return `Bonjour ${n},`;
}

function buildClientHtml(params: {
  brief: ClientBriefRecap;
  requestId?: string;
  supportEmail: string;
  whatsappUrl: string;
  brandUrl: string;
}) {
  const greeting = escapeHtml(formatGreeting(params.brief.firstName));
  const briefRows = buildBriefRows(params.brief);
  const message = params.brief.message ? params.brief.message.trim() : '';
  const requestId = params.requestId ? escapeHtml(params.requestId) : null;

  // Palette sobre
  const bg = '#F7F4EF';
  const paper = '#FFFFFF';
  const ink = '#111827';
  const muted = '#6B7280';
  const line = '#E5E7EB';
  const gold = '#B08D57';
  const btn = '#111827';
  const btnText = '#F7F4EF';

  const briefRowsHtml = briefRows.length
    ? briefRows
        .map(
          (r) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${line};vertical-align:top;width:38%;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${muted};">
              ${escapeHtml(r.label)}
            </td>
            <td style="padding:10px 0;border-bottom:1px solid ${line};vertical-align:top;font-family:ui-serif, Georgia, 'Times New Roman', Times, serif;font-size:16px;color:${ink};">
              ${escapeHtml(r.value)}
            </td>
          </tr>`,
        )
        .join('')
    : '';

  const messageHtml = message
    ? `<div style="margin-top:18px;padding:14px 16px;background:#FBFAF8;border-left:3px solid ${gold};">
         <div style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${muted};margin-bottom:6px;">
           Vos précisions
         </div>
         <div style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:14px;line-height:1.7;color:${ink};white-space:pre-wrap;">
           ${escapeHtml(message)}
         </div>
       </div>`
    : '';

  return `
  <!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Chefs Talents — Demande reçue</title>
    </head>
    <body style="margin:0;padding:0;background:${bg};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Demande reçue. Thomas vous recontacte sous 6 à 24h avec une sélection de chefs.
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
                      <td align="left" style="font-family:ui-serif, Georgia, 'Times New Roman', Times, serif;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:${ink};">
                        CHEFS TALENTS
                      </td>
                      <td align="right" style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};">
                        Confirmation
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="padding:36px 28px 8px 28px;">
                  <div style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${muted};">
                    Demande reçue
                  </div>

                  <h1 style="margin:14px 0 14px 0;font-family:ui-serif, Georgia, 'Times New Roman', Times, serif;font-weight:500;font-size:34px;line-height:1.15;color:${ink};">
                    ${greeting}
                  </h1>

                  <p style="margin:0 0 12px 0;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:15px;line-height:1.8;color:${ink};">
                    Nous avons bien reçu votre demande. Des chefs sont prêts à opérer pour cette mission.
                  </p>
                  <p style="margin:0 0 18px 0;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:15px;line-height:1.8;color:${muted};">
                    Thomas, votre interlocuteur, revient vers vous <strong style="color:${ink};">sous 6 à 24h</strong> avec une sélection ciblée et les profils les plus adaptés à votre brief.
                  </p>

                  ${
                    requestId
                      ? `<p style="margin:14px 0 0 0;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};">
                          Référence : <span style="color:${ink};font-weight:600;letter-spacing:0.06em;">${requestId}</span>
                        </p>`
                      : ''
                  }
                </td>
              </tr>

              ${
                briefRowsHtml || messageHtml
                  ? `<!-- Brief recap -->
                     <tr>
                       <td style="padding:24px 28px 6px 28px;">
                         <div style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${muted};margin-bottom:10px;">
                           Votre brief
                         </div>
                         ${
                           briefRowsHtml
                             ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${line};">
                                 ${briefRowsHtml}
                               </table>`
                             : ''
                         }
                         ${messageHtml}
                       </td>
                     </tr>`
                  : ''
              }

              <!-- Trust bullets -->
              <tr>
                <td style="padding:22px 28px 6px 28px;">
                  <div style="height:1px;background:${line};width:100%;margin-bottom:18px;"></div>
                  <div style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:13px;color:${muted};line-height:1.9;">
                    <span style="color:${gold};font-weight:700;">•</span> Sélection curatée parmi 400 profils, ciblage selon votre brief<br/>
                    <span style="color:${gold};font-weight:700;">•</span> Coordination par Thomas tout au long de la mission<br/>
                    <span style="color:${gold};font-weight:700;">•</span> Aucune réservation effectuée sans votre validation
                  </div>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:18px 28px 6px 28px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding:0 10px 10px 0;">
                        <a href="${escapeHtml(params.whatsappUrl)}"
                           style="display:inline-block;background:${btn};color:${btnText};text-decoration:none;padding:12px 16px;border-radius:10px;
                                  font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">
                          WhatsApp avec Thomas
                        </a>
                      </td>
                      <td style="padding:0 0 10px 0;">
                        <a href="mailto:${escapeHtml(params.supportEmail)}"
                           style="display:inline-block;border:1px solid ${line};color:${ink};text-decoration:none;padding:12px 16px;border-radius:10px;
                                  font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;background:#FBFAF8;">
                          Répondre par email
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:8px 0 0 0;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};line-height:1.7;">
                    Vous pouvez répondre directement à cet email pour ajouter des précisions, ou écrire à ${escapeHtml(params.supportEmail)}.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 28px;border-top:1px solid ${line};background:#FBFAF8;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};line-height:1.7;">
                        Chefs Talents · Europe<br/>
                        Thomas Delcroix · <a href="${escapeHtml(params.whatsappUrl)}" style="color:${ink};text-decoration:underline;">+33 7 56 82 76 12</a><br/>
                        <a href="mailto:${escapeHtml(params.supportEmail)}" style="color:${ink};text-decoration:underline;">${escapeHtml(params.supportEmail)}</a>
                      </td>
                      <td align="right" style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:11px;color:${muted};">
                        © ${new Date().getFullYear()} Chefs Talents
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
  </html>
  `.trim();
}

function buildClientText(
  brief: ClientBriefRecap,
  requestId?: string,
  supportEmail = 'contact@chefstalents.com',
): string {
  const lines: string[] = [];
  lines.push(formatGreeting(brief.firstName));
  lines.push('');
  lines.push("Nous avons bien reçu votre demande. Des chefs sont prêts à opérer pour cette mission.");
  lines.push("Thomas, votre interlocuteur, revient vers vous sous 6 à 24h avec une sélection ciblée.");
  lines.push('');

  const rows = buildBriefRows(brief);
  if (rows.length) {
    lines.push('Votre brief :');
    for (const r of rows) {
      lines.push(`  - ${r.label} : ${r.value}`);
    }
    lines.push('');
  }

  if (brief.message) {
    lines.push('Vos précisions :');
    lines.push(brief.message.trim());
    lines.push('');
  }

  if (requestId) {
    lines.push(`Référence : ${requestId}`);
    lines.push('');
  }

  lines.push('Contact :');
  lines.push('WhatsApp : +33 7 56 82 76 12');
  lines.push(`Email : ${supportEmail}`);
  lines.push('');
  lines.push('Chefs Talents');

  return lines.join('\n');
}

export async function sendClientConfirmation({
  email,
  brief,
  requestId,
}: {
  email: string;
  brief: ClientBriefRecap;
  requestId?: string;
}) {
  const supportEmail = 'contact@chefstalents.com';
  const whatsappUrl = 'https://wa.me/33756827612';
  const brandUrl = 'https://chefstalents.com';

  const subjectLocation = brief.location ? ` — ${brief.location}` : '';
  const subject = `Demande reçue${subjectLocation} | Chefs Talents`;

  const text = buildClientText(brief, requestId, supportEmail);
  const html = buildClientHtml({
    brief,
    requestId,
    supportEmail,
    whatsappUrl,
    brandUrl,
  });

  return resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: email,
    replyTo: supportEmail,
    subject,
    text,
    html,
  });
}
