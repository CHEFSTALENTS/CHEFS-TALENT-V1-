// lib/whatsappBrief.ts
import type { RequestEntity } from '@/types';

const nl = '\n';

// ─────────────────────────────────────────────────────────────
// LOGIQUE TARIFAIRE
// Basée sur : TJ chef net / journée de référence 12h
// Frais Chefs Talents : 12% (non visible dans le brief chef)
// ─────────────────────────────────────────────────────────────

const HOURS_PER_MEAL_PLAN: Record<string, number> = {
  breakfast:       3,
  lunch:           5,
  dinner:          6,
  breakfast_lunch: 8,
  lunch_dinner:    10,
  full_time:       12,
  // Alias possibles venant du formulaire
  'petit-déjeuner': 3,
  'déjeuner':        5,
  'dîner':           6,
  'full time':       12,
  'chef_only':       6,  // fallback service level
  'full_team':       12,
};

const DAY_REF_HOURS = 12;
const CT_FEE = 0.12; // 12% frais de coordination

// TJ chef net pour une journée complète (12h)
const CHEF_DAY_RATES: Record<string, { min: number; max: number; label: string }> = {
  essential: { min: 350, max: 450, label: 'Junior' },
  premium:   { min: 450, max: 580, label: 'Medium' },
  exclusive: { min: 600, max: 850, label: 'Senior' },
};

/**
 * Détecte le niveau de profil depuis le budgetRange stocké en base
 * Format possible : "2500" | "5000" | "10000" | "2500€ total" | "essential" | "premium" | "exclusive"
 */
function detectBudgetLevel(budgetRange?: string | null): 'essential' | 'premium' | 'exclusive' {
  if (!budgetRange) return 'premium';
  const s = String(budgetRange).toLowerCase().trim();

  if (s.includes('exclusif') || s.includes('exclusive') || s.includes('10000')) return 'exclusive';
  if (s.includes('essentiel') || s.includes('essential') || s.includes('2500')) return 'essential';
  if (s.includes('premium') || s.includes('5000')) return 'premium';

  // Fallback sur valeur numérique
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    if (num >= 8000) return 'exclusive';
    if (num >= 4000) return 'premium';
    return 'essential';
  }

  return 'premium';
}

/**
 * Détecte les heures/jour depuis le serviceLevel ou les notes
 */
function detectHoursPerDay(r: RequestEntity): number {
  // 1. Depuis serviceLevel
  const sl = String(r.serviceLevel || '').toLowerCase();
  if (HOURS_PER_MEAL_PLAN[sl] !== undefined) return HOURS_PER_MEAL_PLAN[sl];

  // 2. Depuis les notes (le formulaire stocke "Service: dinner" par ex)
  const notes = String(r.notes || '').toLowerCase();
  for (const [key, hours] of Object.entries(HOURS_PER_MEAL_PLAN)) {
    if (notes.includes(`service: ${key}`) || notes.includes(`service:${key}`)) {
      return hours;
    }
  }

  // 3. Depuis missionType
  const mt = String(r.missionType || '').toLowerCase();
  if (mt === 'yacht') return 12;
  if (mt === 'daily' || mt === 'residence') return 10;
  if (mt === 'dinner') return 6;
  if (mt === 'event') return 8;

  return 6; // fallback : dîner
}

/**
 * Calcule le nombre de jours
 */
function calcDays(r: RequestEntity): number {
  const start = r.dates?.start ? new Date(r.dates.start) : null;
  const end = r.dates?.end ? new Date(r.dates.end) : null;
  if (!start) return 1;
  if (!end) return 1;
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

export type TarifCalculation = {
  level: 'essential' | 'premium' | 'exclusive';
  levelLabel: string;
  hoursPerDay: number;
  days: number;
  dayRatio: number;

  // Ce que le chef reçoit (net, sans frais CT)
  chefTJMin: number;   // TJ net chef pour ce ratio d'heures
  chefTJMax: number;
  chefTotalMin: number; // TJ net × jours
  chefTotalMax: number;

  // Ce que le client paie (chef + frais CT)
  clientTotalMin: number;
  clientTotalMax: number;

  // Frais CT
  ctFeesMin: number;
  ctFeesMax: number;
  ctFeePct: number;
};

/**
 * Calcul complet — retourne toutes les valeurs séparées
 */
export function calcTarif(r: RequestEntity): TarifCalculation {
  const level = detectBudgetLevel(r.budgetRange);
  const rate = CHEF_DAY_RATES[level];
  const hoursPerDay = detectHoursPerDay(r);
  const days = calcDays(r);
  const dayRatio = hoursPerDay / DAY_REF_HOURS;

  // TJ chef net pour ce ratio d'heures (ce qu'il reçoit par jour)
  const chefTJMin = Math.round(rate.min * dayRatio);
  const chefTJMax = Math.round(rate.max * dayRatio);

  // Total chef net
  const chefTotalMin = Math.round(chefTJMin * days / 100) * 100;
  const chefTotalMax = Math.round(chefTJMax * days / 100) * 100;

  // Total client (+ frais CT)
  const clientTotalMin = Math.round(chefTotalMin * (1 + CT_FEE) / 100) * 100;
  const clientTotalMax = Math.round(chefTotalMax * (1 + CT_FEE) / 100) * 100;

  // Frais CT
  const ctFeesMin = clientTotalMin - chefTotalMin;
  const ctFeesMax = clientTotalMax - chefTotalMax;

  return {
    level,
    levelLabel: rate.label,
    hoursPerDay,
    days,
    dayRatio,
    chefTJMin,
    chefTJMax,
    chefTotalMin,
    chefTotalMax,
    clientTotalMin,
    clientTotalMax,
    ctFeesMin,
    ctFeesMax,
    ctFeePct: CT_FEE * 100,
  };
}

// ─────────────────────────────────────────────────────────────
// HELPERS TEXTE
// ─────────────────────────────────────────────────────────────

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
  return null;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function humanMissionType(v?: string | null) {
  if (!v) return null;
  const map: Record<string, string> = {
    daily: 'Présence quotidienne',
    event: 'Événement',
    residence: 'Résidence',
    yacht: 'Yacht',
    dinner: 'Dîner privé',
  };
  return map[v] ?? v;
}

function humanServiceLevel(v?: string | null) {
  if (!v) return null;
  if (v === 'chef_only') return 'Chef uniquement';
  if (v === 'full_team') return 'Full time';
  return v;
}

function sanitizeBriefText(input?: string | null) {
  const raw = clean(input);
  if (!raw) return null;

  const lines = raw.split(/\r?\n/);
  const looksLikePhone = (s: string) => /(\+?\d[\d\s().-]{7,}\d)/.test(s);
  const looksLikeEmail = (s: string) =>
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(s);

  const blockedPrefixes = [
    'mode:', 'clienttype:', 'client type:', 'société:', 'societe:', 'company:',
    'contact:', 'email:', 'mail:', 'téléphone:', 'telephone:', 'phone:', 'whatsapp:',
    'lieu:', 'start:', 'end:', 'dates:', 'assignation:', 'mission:', 'service:',
    'rythme:', 'meal plan:', 'replacement:', 'convives:', 'budget:', 'langues:',
    'restrictions:', 'cuisine:', 'type:', 'adultes:', 'enfants:', 'notes client:',
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

  return filtered.join(nl).trim() || null;
}

// ─────────────────────────────────────────────────────────────
// BRIEF CHEF — ne contient QUE le TJ net chef, jamais les frais CT
// ─────────────────────────────────────────────────────────────

export function buildWhatsappBriefForChef(r: RequestEntity): string {
  const tarif = calcTarif(r);

  const header = '👨‍🍳 MISSION CHEF PRIVÉ — CHEFS TALENTS';

  const missionBlock = joinLines([
    line('📍 Lieu :', r.location),
    line('📅 Dates :', formatDates(r)),
    line('🗓 Durée :', tarif.days > 1 ? `${tarif.days} jours` : '1 jour'),
    line('👥 Convives :', r.guestCount ? `${r.guestCount} personnes` : null),
    line('🍽 Mission :', humanMissionType(r.missionType)),
    line('⏱ Service :', tarif.hoursPerDay === 12
      ? `Full time (${tarif.hoursPerDay}h/jour)`
      : `${tarif.hoursPerDay}h/jour`),
  ]);

  const prefsBlock = joinLines([
    line('🥗 Cuisine :', r.preferences?.cuisine || null),
    line('⚠️ Restrictions :', r.preferences?.allergies || null),
    line('🌍 Langues :', r.preferences?.languages || null),
  ]);

  // TJ chef net uniquement — JAMAIS le total client ni les frais CT
  const tarifBlock = joinLines([
    `💰 Rémunération proposée :`,
    `   ${formatMoney(tarif.chefTJMin)} — ${formatMoney(tarif.chefTJMax)} / jour net`,
    tarif.days > 1
      ? `   Soit ${formatMoney(tarif.chefTotalMin)} — ${formatMoney(tarif.chefTotalMax)} pour ${tarif.days} jours`
      : null,
    `   (Base ${tarif.hoursPerDay}h/j · Profil ${tarif.levelLabel})`,
  ]);

  const safeNotes = sanitizeBriefText(r.notes);
  const notesBlock = safeNotes ? `📋 Contexte :\n${safeNotes}` : null;

  const footer = joinLines([
    `Votre profil correspond à cette mission.`,
    ``,
    `✅ Êtes-vous disponible sur ces dates ?`,
    `✅ Cette rémunération vous convient-elle ?`,
    ``,
    `Si oui, nous présentons votre profil au client rapidement.`,
    ``,
    `— Chefs Talents`,
  ]);

  return joinLines([
    header,
    '──────────────────',
    missionBlock,
    prefsBlock ? `──────────────────\n${prefsBlock}` : null,
    `──────────────────\n${tarifBlock}`,
    notesBlock ? `──────────────────\n${notesBlock}` : null,
    '──────────────────',
    footer,
  ]);
}

// ─────────────────────────────────────────────────────────────
// BRIEF INTERNE — décomposition complète avec frais CT
// Usage : admin uniquement, jamais envoyé au chef
// ─────────────────────────────────────────────────────────────

export function buildInternalBrief(r: RequestEntity): string {
  const tarif = calcTarif(r);

  const header = '📊 BRIEF INTERNE — CHEFS TALENTS';

  const missionBlock = joinLines([
    line('Client :', r.contact?.company || r.contact?.name || null),
    line('Email :', r.contact?.email || null),
    line('Téléphone :', r.contact?.phone || null),
    line('Lieu :', r.location),
    line('Dates :', formatDates(r)),
    line('Durée :', tarif.days > 1 ? `${tarif.days} jours` : '1 jour'),
    line('Convives :', r.guestCount ? `${r.guestCount} personnes` : null),
    line('Mission :', humanMissionType(r.missionType)),
    line('Service :', `${tarif.hoursPerDay}h/jour`),
    line('Cuisine :', r.preferences?.cuisine || null),
    line('Restrictions :', r.preferences?.allergies || null),
    line('Langues :', r.preferences?.languages || null),
  ]);

  const tarifBlock = joinLines([
    `── DÉCOMPOSITION TARIFAIRE ──`,
    `Profil cible : ${tarif.levelLabel} (${tarif.level})`,
    `Heures/jour : ${tarif.hoursPerDay}h (ratio ${Math.round(tarif.dayRatio * 100)}% d'une journée 12h)`,
    `Jours : ${tarif.days}`,
    ``,
    `TJ chef net/jour :        ${formatMoney(tarif.chefTJMin)} — ${formatMoney(tarif.chefTJMax)}`,
    `Total chef net :          ${formatMoney(tarif.chefTotalMin)} — ${formatMoney(tarif.chefTotalMax)}`,
    `Frais CT (${tarif.ctFeePct}%) :        ${formatMoney(tarif.ctFeesMin)} — ${formatMoney(tarif.ctFeesMax)}`,
    `────────────────────────────────────`,
    `TOTAL CLIENT :            ${formatMoney(tarif.clientTotalMin)} — ${formatMoney(tarif.clientTotalMax)}`,
  ]);

  const safeNotes = sanitizeBriefText(r.notes);
  const notesBlock = safeNotes ? `── NOTES CLIENT ──\n${safeNotes}` : null;

  return joinLines([
    header,
    '══════════════════════════════════════',
    missionBlock,
    '',
    tarifBlock,
    notesBlock ? `\n${notesBlock}` : null,
  ]);
}

// ─────────────────────────────────────────────────────────────
// EXPORT WHATSAPP
// ─────────────────────────────────────────────────────────────

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
