// lib/whatsappBrief.ts
import type { RequestEntity } from '@/types';

const nl = '\n';

type BuildOptions = {
  brandName?: string;             // default: 'Chef Talents'
  // sécurité: on scrub email/tel dans le brief (au cas où dans notes)
  scrubContacts?: boolean;        // default: true
  // version plus "compréhensible chef"
  chefFriendly?: boolean;         // default: true
};

function clean(s?: string | number | null) {
  const t = String(s ?? '').trim();
  return t ? t : null;
}

function joinLines(lines: Array<string | null | undefined>) {
  return lines.filter(Boolean).join(nl);
}

function formatDates(r: RequestEntity) {
  const start = clean(r.dates?.start);
  const end = clean(r.dates?.end);
  if (start && end) return `${start} → ${end}`;
  return start || end || null;
}

function humanMissionType(v?: string | null) {
  const x = (v || '').toLowerCase();
  if (!x) return null;
  if (x === 'residence') return 'Résidence (plusieurs jours)';
  if (x === 'yacht') return 'Yacht';
  if (x === 'daily') return 'Présence quotidienne';
  if (x === 'event') return 'Événement';
  if (x === 'dinner') return 'Dîner privé';
  return v;
}

function humanServiceLevel(v?: string | null) {
  const x = (v || '').toLowerCase();
  if (!x) return null;
  if (x === 'chef_only') return 'Chef uniquement';
  if (x === 'chef_service') return 'Chef + service';
  if (x === 'full_team') return 'Équipe complète';
  return v;
}

function scrubContactsText(text: string) {
  // emails
  let t = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[contact masqué]');
  // phones (simple)
  t = t.replace(/(\+?\d[\d\s().-]{7,}\d)/g, '[contact masqué]');
  return t;
}

export function buildWhatsappBriefForChef(r: RequestEntity, opts: BuildOptions = {}) {
  const brandName = opts.brandName ?? 'Chef Talents';
  const scrub = opts.scrubContacts ?? true;
  const chefFriendly = opts.chefFriendly ?? true;

  const header = `👨‍🍳 DEMANDE CHEF PRIVÉ — ${brandName}`;

  const top = joinLines([
    clean(r.location) ? `📍 Lieu : ${clean(r.location)}` : null,
    formatDates(r) ? `📅 Dates : ${formatDates(r)}` : null,
    r.guestCount ? `👥 Convives : ${r.guestCount} pers` : null,
    humanMissionType(r.missionType) ? `🎯 Mission : ${humanMissionType(r.missionType)}` : null,
    humanServiceLevel(r.serviceLevel) ? `🧩 Service : ${humanServiceLevel(r.serviceLevel)}` : null,
    clean(r.budgetRange) ? `💰 Budget : ${clean(r.budgetRange)}` : null,
  ]);

  const prefsLines = joinLines([
    clean(r.preferences?.cuisine) ? `🍽️ Style culinaire : ${clean(r.preferences?.cuisine)}` : null,
    clean(r.preferences?.allergies) ? `⚠️ Restrictions : ${clean(r.preferences?.allergies)}` : null,
    clean(r.preferences?.languages) ? `🗣️ Langues : ${clean(r.preferences?.languages)}` : null,
  ]);

  let notes = clean(r.notes) || null;
  if (notes && scrub) notes = scrubContactsText(notes);

  const briefBlock =
    notes && chefFriendly
      ? joinLines([
          `📝 Brief :`,
          notes,
          ``,
          `👉 Réponse attendue : dispo + tarif + éventuelles questions`,
        ])
      : notes
      ? `📝 Brief :${nl}${notes}`
      : null;

  const footer = joinLines([
    `Votre profil a retenu mon attention pour cette demande.`,
    `Seriez-vous disponible sur ces dates ?`,
    `Est-ce que le budget vous convient ?`,
    `Si oui, je présente votre profil au client au plus vite.`,
    `—`,
    `${brandName}`,
  ]);

  return joinLines([
    header,
    '—',
    top,
    prefsLines ? `—${nl}${prefsLines}` : null,
    briefBlock ? `—${nl}${briefBlock}` : null,
    '—',
    footer,
  ]);
}

/**
 * ✅ Ouvrir WhatsApp (deep link) + fallback web.
 * NOTE: iOS/Android peut choisir WhatsApp ou WhatsApp Business selon app par défaut.
 */
export function openWhatsappWithText(text: string, phoneE164?: string | null) {
  const encoded = encodeURIComponent(text);
  const digits = phoneE164 ? phoneE164.replace(/\D/g, '') : '';

  // Deep link (app)
  const appUrl = digits
    ? `whatsapp://send?phone=${digits}&text=${encoded}`
    : `whatsapp://send?text=${encoded}`;

  // Fallback web
  const webUrl = digits
    ? `https://wa.me/${digits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  // tente l'app, puis fallback
  const opened = window.open(appUrl, '_blank');
  // Certains navigateurs bloquent/échouent -> fallback
  setTimeout(() => {
    try {
      if (!opened || opened.closed) window.open(webUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 400);
}

