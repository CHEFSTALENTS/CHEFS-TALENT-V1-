// lib/email/sendMissionReminder.ts
//
// Email envoyé au chef pour lui rappeler une mission confirmée à
// approche : J-30, J-7, J0. Variant unique avec ton adapté à l'horizon.
//
// Déclenché par le cron /api/cron/mission-reminders (1×/jour).

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export type MissionReminderVariant = '30d' | '7d' | 'd_day';

export type MissionReminderInput = {
  to: string;                       // chef email
  variant: MissionReminderVariant;
  chefFirstName?: string | null;
  // Mission
  location?: string | null;
  startDate?: string | null;        // YYYY-MM-DD
  endDate?: string | null;
  guestCount?: number | null;
  serviceLevel?: string | null;
  notes?: string | null;
  // Réf interne (optionnel)
  missionId?: string;
};

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${Number(d)} ${months[Number(mo) - 1] || mo} ${y}`;
}

function fmtRange(start?: string | null, end?: string | null): string | null {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e && s !== e) return `du ${s} au ${e}`;
  if (s) return s;
  return null;
}

function getCopy(variant: MissionReminderVariant) {
  switch (variant) {
    case '30d':
      return {
        subjectPrefix: 'J-30',
        title: 'Mission dans 30 jours',
        intro: "C'est dans un mois. Bloque ton agenda et commence à anticiper la logistique : approvisionnement local, équipement disponible sur place, contraintes spécifiques.",
        cta: "Si quoi que ce soit a changé de ton côté (disponibilité, conditions), préviens-moi cette semaine pour que j'aie le temps de m'organiser.",
      };
    case '7d':
      return {
        subjectPrefix: 'J-7',
        title: 'Mission dans 7 jours',
        intro: "C'est la dernière ligne droite. Confirme-moi que tu es bien prêt : transport organisé, fournisseurs contactés, brief client digéré.",
        cta: "Si tu vois un point bloquant, on en parle aujourd'hui ou demain. Pas la veille.",
      };
    case 'd_day':
    default:
      return {
        subjectPrefix: "Aujourd'hui",
        title: "C'est le jour J",
        intro: "Bonne mission. Tu es attendu sur place selon le brief. N'hésite pas à m'écrire en cours de mission si quoi que ce soit dérape.",
        cta: "Je suis joignable WhatsApp tout au long de la journée.",
      };
  }
}

function buildHtml(input: MissionReminderInput) {
  const c = getCopy(input.variant);
  const greeting = input.chefFirstName?.trim()
    ? `Salut ${escapeHtml(input.chefFirstName.trim())},`
    : 'Salut,';

  // Lignes brief
  const rows: { label: string; value: string }[] = [];
  if (input.location) rows.push({ label: 'Lieu', value: input.location });
  const dateRange = fmtRange(input.startDate, input.endDate);
  if (dateRange) rows.push({ label: 'Dates', value: dateRange });
  if (input.guestCount && input.guestCount > 0) {
    rows.push({
      label: 'Couverts',
      value: `${input.guestCount} personne${input.guestCount > 1 ? 's' : ''}`,
    });
  }
  if (input.serviceLevel) {
    rows.push({ label: 'Niveau de service', value: input.serviceLevel });
  }

  const briefRowsHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;vertical-align:top;width:38%;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6B7280;">
            ${escapeHtml(r.label)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #E5E7EB;vertical-align:top;font-family:ui-serif,Georgia,'Times New Roman',Times,serif;font-size:16px;color:#111827;">
            ${escapeHtml(r.value)}
          </td>
        </tr>`,
    )
    .join('');

  const notesHtml = input.notes?.trim()
    ? `<div style="margin-top:18px;padding:14px 16px;background:#FBFAF8;border-left:3px solid #B08D57;">
         <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6B7280;margin-bottom:6px;">
           Brief client
         </div>
         <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:14px;line-height:1.7;color:#111827;white-space:pre-wrap;">
           ${escapeHtml(input.notes.trim())}
         </div>
       </div>`
    : '';

  const whatsapp = 'https://wa.me/33756827612';
  const supportEmail = 'contact@chefstalents.com';

  return `
  <!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Chefs Talents — Rappel mission</title>
    </head>
    <body style="margin:0;padding:0;background:#F7F4EF;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(c.title)} — ${escapeHtml(input.location || 'mission')}
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F4EF;padding:32px 0;">
        <tr>
          <td align="center" style="padding:0 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#FFFFFF;border:1px solid #E5E7EB;">

              <tr>
                <td style="padding:18px 28px;border-bottom:1px solid #E5E7EB;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="left" style="font-family:ui-serif,Georgia,'Times New Roman',Times,serif;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:#111827;">
                        CHEFS TALENTS
                      </td>
                      <td align="right" style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:12px;color:#6B7280;">
                        Rappel · ${escapeHtml(c.subjectPrefix)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:36px 28px 8px 28px;">
                  <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#6B7280;">
                    ${escapeHtml(c.title)}
                  </div>

                  <h1 style="margin:14px 0 14px 0;font-family:ui-serif,Georgia,'Times New Roman',Times,serif;font-weight:500;font-size:32px;line-height:1.15;color:#111827;">
                    ${greeting}
                  </h1>

                  <p style="margin:0 0 14px 0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:15px;line-height:1.8;color:#111827;">
                    ${escapeHtml(c.intro)}
                  </p>
                  <p style="margin:0 0 18px 0;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:15px;line-height:1.8;color:#6B7280;">
                    ${escapeHtml(c.cta)}
                  </p>
                </td>
              </tr>

              ${
                briefRowsHtml || notesHtml
                  ? `<tr>
                       <td style="padding:18px 28px 6px 28px;">
                         <div style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6B7280;margin-bottom:10px;">
                           La mission
                         </div>
                         ${
                           briefRowsHtml
                             ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #E5E7EB;">${briefRowsHtml}</table>`
                             : ''
                         }
                         ${notesHtml}
                       </td>
                     </tr>`
                  : ''
              }

              <tr>
                <td style="padding:22px 28px 6px 28px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding:0 10px 10px 0;">
                        <a href="${whatsapp}"
                           style="display:inline-block;background:#111827;color:#F7F4EF;text-decoration:none;padding:12px 16px;border-radius:10px;
                                  font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">
                          WhatsApp Thomas
                        </a>
                      </td>
                      <td style="padding:0 0 10px 0;">
                        <a href="mailto:${supportEmail}"
                           style="display:inline-block;border:1px solid #E5E7EB;color:#111827;text-decoration:none;padding:12px 16px;border-radius:10px;
                                  font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;background:#FBFAF8;">
                          Répondre par email
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:18px 28px;border-top:1px solid #E5E7EB;background:#FBFAF8;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:12px;color:#6B7280;line-height:1.7;">
                        Chefs Talents · Europe<br/>
                        Thomas Delcroix · <a href="${whatsapp}" style="color:#111827;text-decoration:underline;">+33 7 56 82 76 12</a><br/>
                        <a href="mailto:${supportEmail}" style="color:#111827;text-decoration:underline;">${supportEmail}</a>
                      </td>
                      <td align="right" style="font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial;font-size:11px;color:#6B7280;">
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

function buildText(input: MissionReminderInput) {
  const c = getCopy(input.variant);
  const lines: string[] = [];
  lines.push(input.chefFirstName ? `Salut ${input.chefFirstName},` : 'Salut,');
  lines.push('');
  lines.push(c.intro);
  lines.push('');
  lines.push(c.cta);
  lines.push('');
  lines.push('La mission :');
  if (input.location) lines.push(`  - Lieu : ${input.location}`);
  const dateRange = fmtRange(input.startDate, input.endDate);
  if (dateRange) lines.push(`  - Dates : ${dateRange}`);
  if (input.guestCount && input.guestCount > 0) {
    lines.push(`  - Couverts : ${input.guestCount} personne${input.guestCount > 1 ? 's' : ''}`);
  }
  if (input.serviceLevel) lines.push(`  - Niveau de service : ${input.serviceLevel}`);
  if (input.notes) {
    lines.push('');
    lines.push('Brief client :');
    lines.push(input.notes.trim());
  }
  lines.push('');
  lines.push('Thomas — WhatsApp +33 7 56 82 76 12 — contact@chefstalents.com');
  return lines.join('\n');
}

export async function sendMissionReminder(input: MissionReminderInput) {
  const c = getCopy(input.variant);
  const subjectLocation = input.location ? ` — ${input.location}` : '';
  const subject = `[${c.subjectPrefix}] ${c.title}${subjectLocation}`;

  return resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: input.to,
    replyTo: 'contact@chefstalents.com',
    subject,
    text: buildText(input),
    html: buildHtml(input),
  });
}
