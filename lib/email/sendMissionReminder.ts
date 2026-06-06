// lib/email/sendMissionReminder.ts
//
// Email envoyé au chef pour lui rappeler une mission confirmée à
// l'approche : J-30, J-7, J-3, J0.
//
// DA alignée sur les mails de base Chefs Talents :
//   - ACCENT #7f1d1d (bordeaux profond)
//   - Font Inter / Apple system stack
//   - Cards blanches sur fond #f4f4f5
//   - Border-radius 16px sur les cards, 12px sur les boxes, 999px sur les pills
//
// Déclenché par le cron /api/cron/mission-reminders (1×/jour).

import { Resend } from 'resend';
import {
  htmlToText,
  buildUnsubscribeHeaders,
  unsubscribeFooterHtml,
  unsubscribeFooterText,
} from './_helpers';

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = 'Thomas Delcroix <contact@chefstalents.com>';
const REPLY_TO = 'contact@chefstalents.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";
const WHATSAPP = 'https://wa.me/33756827612';
const PHONE_DISPLAY = '+33 7 56 82 76 12';
const SUPPORT_EMAIL = 'contact@chefstalents.com';

export type MissionReminderVariant = '30d' | '7d' | '3d' | 'd_day';

export type MissionReminderInput = {
  to: string;
  variant: MissionReminderVariant;
  chefFirstName?: string | null;
  // Mission
  location?: string | null;
  startDate?: string | null;          // YYYY-MM-DD
  endDate?: string | null;
  guestCount?: number | null;
  serviceLevel?: string | null;
  notes?: string | null;
  // Contact client (optionnel — affiché si présent en mode J-7/J-3/J0)
  clientFirstName?: string | null;
  clientPhone?: string | null;
  // Réf interne
  missionId?: string;
};

function escapeHtml(s: string) {
  return String(s ?? '')
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

// ────────────────────────────────────────────────────────────
// Contenus par variant (subject, eyebrow, titre, intro, checklist, ton)
// ────────────────────────────────────────────────────────────

type VariantCopy = {
  subject: (location: string) => string;
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  paragraph2: string;
  checklist: { title: string; items: string[] };
};

function getCopy(variant: MissionReminderVariant, firstName?: string | null): VariantCopy {
  const g = firstName?.trim() ? firstName.trim() : 'Chef';

  switch (variant) {
    case '30d':
      return {
        subject: (loc) => `Mission dans 30 jours${loc ? ` — ${loc}` : ''}`,
        preheader: 'On est à un mois. Bloque ton agenda et anticipe la logistique.',
        eyebrow: 'J-30 · MISSION À VENIR',
        title: `${g}, c'est dans un mois.`,
        intro:
          "Ta mission est à 30 jours. C'est le bon moment pour caler l'agenda, vérifier ta disponibilité et commencer à anticiper la logistique amont.",
        paragraph2:
          "Si quoi que ce soit a changé de ton côté (planning, conditions, disponibilité), préviens-moi cette semaine pour que j'aie le temps de m'organiser.",
        checklist: {
          title: 'À anticiper dès maintenant',
          items: [
            'Bloquer toutes les dates de la mission dans ton agenda',
            "Vérifier disponibilité du matériel personnel (couteaux, équipement spécifique)",
            "Identifier les fournisseurs / marchés locaux que tu vas utiliser",
            "Lire attentivement le brief client et noter les contraintes (allergies, régimes)",
          ],
        },
      };

    case '7d':
      return {
        subject: (loc) => `Mission dans 7 jours${loc ? ` — ${loc}` : ''}`,
        preheader: 'C\'est la dernière ligne droite. Voici ce qui doit être prêt.',
        eyebrow: 'J-7 · DERNIÈRE LIGNE DROITE',
        title: `${g}, c'est dans une semaine.`,
        intro:
          "On est à 7 jours. Confirme-moi que tu es bien prêt : transport organisé, fournisseurs contactés, brief client digéré.",
        paragraph2:
          "Si tu vois un point bloquant ou un doute sur les conditions, on en parle aujourd'hui ou demain. Pas la veille.",
        checklist: {
          title: 'À vérifier cette semaine',
          items: [
            "Transport / hébergement confirmé (si nécessaire)",
            "Menus définitifs validés et envoyés au client",
            "Commandes ou pré-commandes passées chez les fournisseurs",
            "Matériel et tenue prêts à emporter",
            "Coordonnées du client / contact sur place enregistrées dans ton téléphone",
          ],
        },
      };

    case '3d':
      return {
        subject: (loc) => `Mission dans 3 jours${loc ? ` — ${loc}` : ''}`,
        preheader: 'J-3. Confirmation finale et derniers détails.',
        eyebrow: 'J-3 · CONFIRMATION FINALE',
        title: `${g}, c'est dans trois jours.`,
        intro:
          "Plus que 72h. C'est le moment de boucler les derniers détails et de confirmer ton arrivée au client.",
        paragraph2:
          "Réponds-moi simplement « OK » par WhatsApp pour valider que tout est en ordre de ton côté. En cas de doute ou imprévu, écris-moi immédiatement.",
        checklist: {
          title: 'Last call',
          items: [
            "Envoyer un message au client pour confirmer ton arrivée (heure précise)",
            "Vérifier la météo locale (si villa / extérieur)",
            "Confirmer l'accès au lieu (codes, clés, parking, personnel d'accueil)",
            "Faire la liste de courses complète ou commande finale",
            "Préparer un plan B menu en cas d'imprévu produit",
          ],
        },
      };

    case 'd_day':
    default:
      return {
        subject: (loc) => `C'est aujourd'hui${loc ? ` — ${loc}` : ''}`,
        preheader: 'Bonne mission. Je suis joignable toute la journée si besoin.',
        eyebrow: "JOUR J · C'EST PARTI",
        title: `${g}, c'est le jour J.`,
        intro:
          "Bonne mission. Tu es attendu sur place selon le brief que tu as reçu. Garde mon numéro à portée en cas de pépin.",
        paragraph2:
          "Une fois la mission terminée, envoie-moi un retour rapide WhatsApp (photo d'un plat + mot du client si possible). Ça nous aide à valoriser ton travail.",
        checklist: {
          title: 'Réflexes du jour',
          items: [
            'Arriver 30-45 min avant le service pour briefer / installer',
            "Garder le téléphone sur toi : Thomas joignable WhatsApp",
            "Photo des plats avant service (pour Insta / portfolio si autorisé)",
            "Saluer le client à l'arrivée ET au départ (toujours)",
          ],
        },
      };
  }
}

// ────────────────────────────────────────────────────────────
// Build HTML (DA mails de base)
// ────────────────────────────────────────────────────────────

function buildHtml(input: MissionReminderInput): string {
  const c = getCopy(input.variant, input.chefFirstName);

  // Lignes de la mission
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
  if (input.serviceLevel) rows.push({ label: 'Niveau de service', value: input.serviceLevel });

  // Contact client uniquement en J-7/J-3/J0
  const showClientContact =
    input.variant !== '30d' &&
    (input.clientFirstName || input.clientPhone);
  if (showClientContact) {
    const parts: string[] = [];
    if (input.clientFirstName) parts.push(escapeHtml(input.clientFirstName));
    if (input.clientPhone) parts.push(escapeHtml(input.clientPhone));
    rows.push({ label: 'Contact client', value: parts.join(' · ') });
  }

  const missionRowsHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;width:40%;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:#71717a;text-transform:uppercase;">
            ${escapeHtml(r.label)}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-family:${FONT};font-size:15px;font-weight:500;color:#09090b;">
            ${r.value}
          </td>
        </tr>`,
    )
    .join('');

  const checklistItemsHtml = c.checklist.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px 8px 0;vertical-align:top;width:20px;">
            <div style="width:6px;height:6px;background:${ACCENT};border-radius:50%;margin-top:8px;"></div>
          </td>
          <td style="padding:8px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#27272a;">
            ${escapeHtml(item)}
          </td>
        </tr>`,
    )
    .join('');

  const notesHtml = input.notes?.trim()
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border-radius:12px;border:1px solid #f4f4f5;margin-top:18px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:${ACCENT};text-transform:uppercase;">
              Brief client
            </p>
            <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.7;color:#27272a;white-space:pre-wrap;">
              ${escapeHtml(input.notes.trim())}
            </p>
          </td>
        </tr>
      </table>`
    : '';

  const greeting = input.chefFirstName?.trim()
    ? `Salut ${escapeHtml(input.chefFirstName.trim())},`
    : 'Salut,';

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(c.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;font-family:${FONT};">
  <div style="display:none;font-size:1px;color:#f4f4f5;">${escapeHtml(c.preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;width:100%;max-width:600px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <!-- Header brand + variant pill -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONT};font-size:14px;font-weight:700;color:#09090b;letter-spacing:-0.01em;">
                    Chefs Talents
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.18em;color:${ACCENT};">
                    ${escapeHtml(c.eyebrow)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title + intro -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.5;color:#71717a;">
                ${greeting}
              </p>
              <h1 style="margin:0 0 18px;font-family:${FONT};font-size:26px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.2;">
                ${escapeHtml(c.title)}
              </h1>
              <p style="margin:0 0 14px;font-family:${FONT};font-size:16px;line-height:1.65;color:#27272a;">
                ${escapeHtml(c.intro)}
              </p>
              <p style="margin:0 0 24px;font-family:${FONT};font-size:15px;line-height:1.65;color:#52525b;">
                ${escapeHtml(c.paragraph2)}
              </p>
            </td>
          </tr>

          ${missionRowsHtml ? `
          <!-- La mission (rows clé / valeur) -->
          <tr>
            <td style="padding:0 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border-radius:12px;border:1px solid #f4f4f5;">
                <tr><td style="padding:8px 20px 4px;">
                  <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:#71717a;text-transform:uppercase;">
                    La mission
                  </p>
                </td></tr>
                <tr><td style="padding:0 20px 12px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${missionRowsHtml}
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>` : ''}

          ${notesHtml ? `
          <tr><td style="padding:0 32px 8px;">${notesHtml}</td></tr>` : ''}

          <!-- Checklist -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 14px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:${ACCENT};text-transform:uppercase;">
                ${escapeHtml(c.checklist.title)}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${checklistItemsHtml}
              </table>
            </td>
          </tr>

          <!-- CTA WhatsApp -->
          <tr>
            <td style="padding:24px 32px 12px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#09090b;border-radius:999px;">
                    <a href="${WHATSAPP}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      Me joindre sur WhatsApp →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0 0 2px;font-family:${FONT};font-size:14px;color:#27272a;">Bien à toi,</p>
              <p style="margin:0;font-family:${FONT};font-size:14px;font-weight:600;color:#09090b;">Thomas Delcroix</p>
              <p style="margin:0;font-family:${FONT};font-size:12px;color:#71717a;">Fondateur · Chefs Talents</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px;border-top:1px solid #f4f4f5;background:#fafafa;">
              <p style="margin:0;font-family:${FONT};font-size:11px;color:#71717a;line-height:1.6;">
                WhatsApp ${PHONE_DISPLAY} · <a href="mailto:${SUPPORT_EMAIL}" style="color:${ACCENT};text-decoration:none;">${SUPPORT_EMAIL}</a><br>
                <a href="${SITE_URL}/chef/dashboard" style="color:#71717a;text-decoration:underline;">Mon tableau de bord</a>
              </p>
              <p style="margin:10px 0 0;font-family:${FONT};font-size:10px;color:#a1a1aa;">
                ${unsubscribeFooterHtml(input.to, 'transactional', 'fr')}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ────────────────────────────────────────────────────────────
// Build plain-text fallback
// ────────────────────────────────────────────────────────────

function buildText(input: MissionReminderInput): string {
  const c = getCopy(input.variant, input.chefFirstName);
  const lines: string[] = [];
  lines.push(input.chefFirstName?.trim() ? `Salut ${input.chefFirstName.trim()},` : 'Salut,');
  lines.push('');
  lines.push(c.title);
  lines.push('');
  lines.push(c.intro);
  lines.push('');
  lines.push(c.paragraph2);
  lines.push('');
  lines.push('La mission :');
  if (input.location) lines.push(`  - Lieu : ${input.location}`);
  const dateRange = fmtRange(input.startDate, input.endDate);
  if (dateRange) lines.push(`  - Dates : ${dateRange}`);
  if (input.guestCount && input.guestCount > 0) {
    lines.push(`  - Couverts : ${input.guestCount} personne${input.guestCount > 1 ? 's' : ''}`);
  }
  if (input.serviceLevel) lines.push(`  - Niveau de service : ${input.serviceLevel}`);
  const showClientContact =
    input.variant !== '30d' && (input.clientFirstName || input.clientPhone);
  if (showClientContact) {
    const parts: string[] = [];
    if (input.clientFirstName) parts.push(input.clientFirstName);
    if (input.clientPhone) parts.push(input.clientPhone);
    lines.push(`  - Contact client : ${parts.join(' · ')}`);
  }
  if (input.notes?.trim()) {
    lines.push('');
    lines.push('Brief client :');
    lines.push(input.notes.trim());
  }
  lines.push('');
  lines.push(c.checklist.title + ' :');
  for (const item of c.checklist.items) lines.push(`  - ${item}`);
  lines.push('');
  lines.push(`Me joindre sur WhatsApp : ${WHATSAPP}`);
  lines.push('');
  lines.push('Bien à toi,');
  lines.push('Thomas Delcroix — Fondateur, Chefs Talents');
  lines.push(`WhatsApp ${PHONE_DISPLAY} · ${SUPPORT_EMAIL}`);
  lines.push('');
  lines.push(unsubscribeFooterText(input.to, 'transactional', 'fr'));
  return lines.join('\n');
}

// ────────────────────────────────────────────────────────────
// Send
// ────────────────────────────────────────────────────────────

export async function sendMissionReminder(input: MissionReminderInput) {
  const c = getCopy(input.variant, input.chefFirstName);
  const subject = c.subject(input.location || '');
  const html = buildHtml(input);

  return resend.emails.send({
    from: FROM,
    to: input.to,
    replyTo: REPLY_TO,
    subject,
    html,
    text: htmlToText(html) || buildText(input),
    headers: buildUnsubscribeHeaders(input.to, 'transactional'),
  });
}
