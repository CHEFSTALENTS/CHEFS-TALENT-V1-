// lib/whatsappBrief.ts
import type { RequestEntity } from '@/types';

const nl = '\n';

type BriefOptions = {
  /** SAFE par défaut: pas d’emoji */
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

/**
 * Supprime du texte les infos sensibles (tél/email/contacts).
 * -> On retire les lignes qui contiennent des mots-clés ou des patterns.
 */
function sanitizeBriefText(input?: string | null) {
  const raw = clean(input);
  if (!raw) return null;

  const lines = raw.split(/\r?\n/);

  const looksLikePhone = (s: string) =>
    /(\+?\d[\d\s().-]{7,}\d)/.test(s); // pattern simple

  const looksLikeEmail = (s: string) =>
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(s);

  const hasSensitiveKeyword = (s: string) =>
    /tél|tel|téléphone|phone|whatsapp|email|mail|conciergerie|contact|client|société|company/i.test(s);

  const filtered = lines.filter((l) => {
    const s = l.trim();
    if (!s) return true;
    if (looksLikeEmail(s)) return false;
    if (looksLikePhone(s)) return false;
    if (hasSensitiveKeyword(s)) return false;
    return true;
  });

  // Nettoyage: enlever les multiples lignes vides
  const compact: string[] = [];
  for (const l of filtered) {
    const t = l.trimEnd();
    if (!t && compact.length && !compact[compact.length - 1]) continue;
    compact.push(t);
  }

  const out = compact.join(nl).trim();
  return out || null;
}

/**
 * ✅ Message envoyé au Chef (aucun contact, emojis OFF par défaut, notes nettoyées)
 */
export function buildWhatsappBriefForChef(r: RequestEntity, opts: BriefOptions = {}) {
  const emojis = opts.emojis === true; // default false (SAFE)

  const E = {
    header: emojis ? 'DEMANDE CHEF PRIVÉ — CHEF TALENTS' : 'DEMANDE CHEF PRIVÉ — CHEF TALENTS',
    loc: emojis ? 'Lieu :' : 'Lieu :',
    dates: emojis ? 'Dates :' : 'Dates :',
    pax: emojis ? 'Convives :' : 'Convives :',
    mission: emojis ? 'Mission :' : 'Mission :',
    service: emojis ? 'Service :' : 'Service :',
    budget: emojis ? 'Budget :' : 'Budget :',
    cuisine: emojis ? 'Style culinaire :' : 'Style culinaire :',
    allergies: emojis ? 'Restrictions / allergies :' : 'Restrictions / allergies :',
    languages: emojis ? 'Langues souhaitées :' : 'Langues souhaitées :',
    brief: emojis ? 'Brief :' : 'Brief :',
  };

  const top = joinLines([
    line(E.loc, r.location),
    line(E.dates, formatDates(r)),
    line(E.pax, r.guestCount ? `${r.guestCount} pers` : null),
    line(E.mission, r.missionType || null),
    line(E.service, r.serviceLevel || null),
    line(E.budget, r.budgetRange || null),
  ]);

  const prefsBlock = joinLines([
    clean(r.preferences?.cuisine) ? `${E.cuisine}${nl}${r.preferences?.cuisine}` : null,
    clean(r.preferences?.allergies) ? `${E.allergies}${nl}${r.preferences?.allergies}` : null,
    clean(r.preferences?.languages) ? `${E.languages}${nl}${r.preferences?.languages}` : null,
  ]);

  // ✅ notes nettoyées (enlève téléphone/email/conciergerie/etc)
  const safeNotes = sanitizeBriefText(r.notes);

  const notesBlock = safeNotes ? `${E.brief}${nl}${safeNotes}` : null;

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
    top,
    prefsBlock ? `—${nl}${prefsBlock}` : null,
    notesBlock ? `—${nl}${notesBlock}` : null,
    '—',
    footer,
  ]);
}

/**
 * Ouvre WhatsApp Business si possible, sinon fallback.
 * (Sur desktop, business:// ne marche pas => fallback wa.me)
 */
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
