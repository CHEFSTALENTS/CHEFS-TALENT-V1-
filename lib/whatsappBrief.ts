// lib/whatsappBrief.ts
import type { RequestEntity } from '@/types';

const nl = '\n';

type BriefOptions = {
  emojis?: boolean;
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

function humanMissionType(v?: string | null) {
  if (!v) return null;
  if (v === 'daily') return 'Présence quotidienne';
  if (v === 'event') return 'Événement';
  if (v === 'residence') return 'Résidence';
  if (v === 'yacht') return 'Yacht';
  if (v === 'dinner') return 'Dîner privé';
  return v;
}

function humanServiceLevel(v?: string | null) {
  if (!v) return null;
  if (v === 'chef_only') return 'Chef uniquement';
  if (v === 'full_team') return 'Full time';
  return v;
}

/**
 * Extrait uniquement les vraies notes utiles au chef,
 * en supprimant les lignes techniques / doublons / contacts.
 */
function sanitizeBriefText(input?: string | null) {
  const raw = clean(input);
  if (!raw) return null;

  const lines = raw.split(/\r?\n/);

  const looksLikePhone = (s: string) => /(\+?\d[\d\s().-]{7,}\d)/.test(s);
  const looksLikeEmail = (s: string) =>
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(s);

  const blockedPrefixes = [
    'mode:',
    'clienttype:',
    'client type:',
    'société:',
    'societe:',
    'company:',
    'contact:',
    'email:',
    'mail:',
    'téléphone:',
    'telephone:',
    'phone:',
    'whatsapp:',
    'lieu:',
    'start:',
    'end:',
    'dates:',
    'assignation:',
    'mission:',
    'service:',
    'rythme:',
    'meal plan:',
    'replacement:',
    'convives:',
    'budget:',
    'langues:',
    'restrictions:',
    'cuisine:',
  ];

  const filtered = lines.filter((l) => {
    const s = l.trim();
    if (!s) return false;
    const lower = s.toLowerCase();

    if (looksLikeEmail(s)) return false;
    if (looksLikePhone(s)) return false;
    if (blockedPrefixes.some((prefix) => lower.startsWith(prefix))) return false;

    return true;
  });

  const out = filtered.join(nl).trim();
  return out || null;
}

export function buildWhatsappBriefForChef(
  r: RequestEntity,
  opts: BriefOptions = {}
) {
  const emojis = opts.emojis === true;

  const E = {
    header: emojis ? '👨‍🍳 DEMANDE CHEF PRIVÉ — CHEF TALENTS' : 'DEMANDE CHEF PRIVÉ — CHEF TALENTS',
    mission: emojis ? 'Mission :' : 'Mission :',
    loc: emojis ? 'Lieu :' : 'Lieu :',
    dates: emojis ? 'Dates :' : 'Dates :',
    pax: emojis ? 'Convives :' : 'Convives :',
    service: emojis ? 'Service :' : 'Service :',
    budget: emojis ? 'Budget :' : 'Budget :',
    cuisine: emojis ? 'Cuisine :' : 'Cuisine :',
    allergies: emojis ? 'Restrictions :' : 'Restrictions :',
    languages: emojis ? 'Langues :' : 'Langues :',
    notes: emojis ? 'Notes :' : 'Notes :',
  };

  const summaryBlock = joinLines([
    line(E.mission, humanMissionType(r.missionType)),
    line(E.loc, r.location),
    line(E.dates, formatDates(r)),
    line(E.pax, r.guestCount ? `${r.guestCount} pers` : null),
    line(E.service, humanServiceLevel(r.serviceLevel)),
    line(E.budget, r.budgetRange || null),
  ]);

  const prefsBlock = joinLines([
    line(E.cuisine, r.preferences?.cuisine || null),
    line(E.allergies, r.preferences?.allergies || null),
    line(E.languages, r.preferences?.languages || null),
  ]);

  const safeNotes = sanitizeBriefText(r.notes);
  const notesBlock = safeNotes ? `${E.notes}${nl}${safeNotes}` : null;

  const footer = joinLines([
    `Votre profil a retenu toute notre attention pour cette demande.`,
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
    summaryBlock,
    prefsBlock ? `—${nl}${prefsBlock}` : null,
    notesBlock ? `—${nl}${notesBlock}` : null,
    '—',
    footer,
  ]);
}

export function openWhatsappWithText(text: string, phoneE164?: string | null) {
  const encoded = encodeURIComponent(text);
  const digits = phoneE164 ? phoneE164.replace(/\D/g, '') : null;

  const waBusinessUrl = digits
    ? `whatsapp-business://send?phone=${digits}&text=${encoded}`
    : `whatsapp-business://send?text=${encoded}`;

  const waFallback = digits
    ? `https://wa.me/${digits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  try {
    window.location.href = waBusinessUrl;
    setTimeout(() => {
      window.open(waFallback, '_blank', 'noopener,noreferrer');
    }, 400);
  } catch {
    window.open(waFallback, '_blank', 'noopener,noreferrer');
  }
}
