// lib/whatsappBrief.ts
import type { RequestEntity } from '@/types';

const nl = '\n';

type BriefOptions = {
  /** Si tu veux zéro emoji (ultra safe) */
  noEmoji?: boolean;
};

function clean(v: any): string | null {
  const s = String(v ?? '').trim();
  return s ? s : null;
}

function line(label: string, value?: string | number | null) {
  const v = clean(value);
  return v ? `${label} ${v}` : null;
}

function joinLines(lines: Array<string | null | undefined>) {
  return lines.filter(Boolean).join(nl);
}

function formatDates(r: RequestEntity) {
  const start = clean(r.dates?.start);
  const end = clean(r.dates?.end);

  if (start && end) return `${start} → ${end}`;
  if (start) return start;
  if (end) return end;
  return null;
}

function normalizeCuisine(v?: string | null) {
  const s = clean(v);
  if (!s) return null;
  return s;
}

function normalizeAllergies(v?: string | null) {
  const s = clean(v);
  if (!s) return null;
  return s;
}

function normalizeLanguages(v?: string | null) {
  const s = clean(v);
  if (!s) return null;

  // si c’est déjà "FR, EN" ou "Français, Anglais" => ok
  return s;
}

function normalizeBudget(v?: string | null) {
  const s = clean(v);
  if (!s) return null;
  return s;
}

function normalizeMission(v?: string | null) {
  const s = clean(v);
  if (!s) return null;
  return s;
}

function normalizeService(v?: string | null) {
  const s = clean(v);
  if (!s) return null;
  return s;
}

/**
 * ✅ Message envoyé au Chef (aucun contact, aucun détail sensible)
 */
export function buildWhatsappBriefForChef(r: RequestEntity, opts: BriefOptions = {}) {
  const noEmoji = !!opts.noEmoji;

  const E = {
    header: noEmoji ? 'DEMANDE CHEF PRIVÉ — CHEF TALENTS' : '👨‍🍳 DEMANDE CHEF PRIVÉ — CHEF TALENTS',
    loc: noEmoji ? 'Lieu :' : '📍 Lieu :',
    dates: noEmoji ? 'Dates :' : '📅 Dates :',
    pax: noEmoji ? 'Convives :' : '👥 Convives :',
    mission: noEmoji ? 'Mission :' : '🎯 Mission :',
    service: noEmoji ? 'Service :' : '🧩 Service :',
    budget: noEmoji ? 'Budget :' : '💰 Budget :',
    cuisine: noEmoji ? 'Style culinaire :' : '🍽️ Style culinaire :',
    allergies: noEmoji ? 'Restrictions / allergies :' : '⚠️ Restrictions / allergies :',
    languages: noEmoji ? 'Langues souhaitées :' : '🗣️ Langues souhaitées :',
    brief: noEmoji ? 'Brief :' : '📝 Brief :',
  };

  const top = joinLines([
    line(E.loc, clean(r.location) || null),
    line(E.dates, formatDates(r)),
    line(E.pax, r.guestCount ? `${r.guestCount} pers` : null),
    line(E.mission, normalizeMission(r.missionType)),
    line(E.service, normalizeService(r.serviceLevel)),
    line(E.budget, normalizeBudget(r.budgetRange)),
  ]);

  const prefsBlock = joinLines([
    normalizeCuisine(r.preferences?.cuisine) ? `${E.cuisine}${nl}${normalizeCuisine(r.preferences?.cuisine)}` : null,
    normalizeAllergies(r.preferences?.allergies) ? `${E.allergies}${nl}${normalizeAllergies(r.preferences?.allergies)}` : null,
    normalizeLanguages(r.preferences?.languages) ? `${E.languages}${nl}${normalizeLanguages(r.preferences?.languages)}` : null,
  ]);

  const notes = clean(r.notes)
    ? `${E.brief}${nl}${String(r.notes).trim()}`
    : null;

  const footer = joinLines([
    noEmoji ? `Votre profil a retenu toute notre attention pour cette demande.` : `✨ Votre profil a retenu toute notre attention pour cette demande.`,
    ``,
    `Seriez-vous disponible sur ces dates ?`,
    `Est-ce que le budget vous convient ?`,
    ``,
    `Si oui, nous présenterons votre profil au client au plus vite.`,
    ``,
    `—`,
    `Chef Talents`,
  ]);

  return joinLines([
    E.header,
    '—',
    top,
    prefsBlock ? `—${nl}${prefsBlock}` : null,
    notes ? `—${nl}${notes}` : null,
    '—',
    footer,
  ]);
}

/**
 * Ouvre WhatsApp Business si installé (mobile), sinon fallback WhatsApp classique / web.
 * - iOS/Android: "whatsapp-business://send?text=..."
 * - Fallback: "https://wa.me/?text=..."
 */
export function openWhatsappWithText(text: string, phoneE164?: string | null) {
  const encoded = encodeURIComponent(text);
  const digits = phoneE164 ? phoneE164.replace(/\D/g, '') : null;

  // 1) Tentative WhatsApp Business (mobile)
  const waBusinessUrl = digits
    ? `whatsapp-business://send?phone=${digits}&text=${encoded}`
    : `whatsapp-business://send?text=${encoded}`;

  // 2) Fallback universel
  const waFallback = digits
    ? `https://wa.me/${digits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  // ⚠️ Sur desktop, whatsapp-business:// ne marche pas => on tente puis fallback rapide.
  try {
    // tentative
    window.location.href = waBusinessUrl;

    // fallback (si rien ne s’ouvre)
    setTimeout(() => {
      window.open(waFallback, '_blank', 'noopener,noreferrer');
    }, 400);
  } catch {
    window.open(waFallback, '_blank', 'noopener,noreferrer');
  }
}
