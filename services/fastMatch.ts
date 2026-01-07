import { RequestEntity, ChefUser } from '@/types';
import type { ChefProposalEntity } from './storage';

/* =========================================================
   Helpers: normalization & city extraction
========================================================= */

function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')    // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim();
}

// Ex: "Paris 16, FR" -> "paris"
// Ex: "Saint-Tropez, France" -> "saint tropez"
// Ex: "Marrakech" -> "marrakech"
function extractCity(location: string): string {
  const n = normalize(location);

  // keep only before first comma if exists
  const beforeComma = n.split(',')[0]?.trim() || n;

  // remove french arrondissement patterns (paris 16, lyon 2, marseille 8, etc.)
  // keeps the city name
  const cleaned = beforeComma
    .replace(/\b(\d{1,2})(er|eme|e)?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

function includesLoose(haystack: string, needle: string): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!h || !n) return false;
  return h.includes(n) || n.includes(h);
}

/* =========================================================
   Budget benchmark (Fast Match)
   -> à utiliser côté UI AVANT le champ budget
========================================================= */

export type BudgetBenchmark = {
  currency: 'EUR';
  min: number;
  avg: number;
  max: number;
  recommended: number;
  breakdown: {
    base: number;
    pax: number;
    days: number;
    multipliers: Record<string, number>;
  };
  explanation: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeInt(v: any, fallback = 0) {
  const n = typeof v === 'number' ? v : parseInt(String(v || ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function daysBetweenISO(startISO?: string, endISO?: string): number {
  if (!startISO || !endISO) return 1;
  const s = new Date(startISO);
  const e = new Date(endISO);
  const ms = e.getTime() - s.getTime();
  if (!Number.isFinite(ms)) return 1;
  // +1 car une mission sur 1 jour = start=end (souvent)
  const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  return clamp(days, 1, 30);
}

function monthFromISO(dateISO?: string): number | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  if (!Number.isFinite(d.getTime())) return null;
  return d.getUTCMonth() + 1; // 1..12
}

/**
 * ✅ Budget benchmark simple, robuste, et “orientant”
 * - basé sur guestCount + durée + quelques flags
 * - retourne min/avg/max + bouton “utiliser recommandé”
 *
 * NOTE: ceci ne remplace pas un pricing engine complet, mais
 * c’est parfait pour empêcher les budgets absurdes.
 */
export function getFastMatchBudgetBenchmark(request: RequestEntity): BudgetBenchmark {
  const guestCount = clamp(safeInt((request as any).guestCount, 1), 1, 200);

  const start = (request as any)?.dates?.start ?? (request as any)?.dateStart ?? null;
  const end = (request as any)?.dates?.end ?? (request as any)?.dateEnd ?? null;
  const days = daysBetweenISO(start || undefined, end || undefined);

  const locationRaw = String((request as any)?.location ?? '');
  const loc = normalize(locationRaw);

  // Flags “souples” (pas besoin que ton RequestEntity soit parfaitement normalisé)
  const isInternational =
    (request as any)?.international === true ||
    (request as any)?.internationalMobility === true ||
    loc.includes('switzerland') ||
    loc.includes('suisse') ||
    loc.includes('london') ||
    loc.includes('dubai') ||
    loc.includes('marrakech') ||
    loc.includes('ibiza') ||
    loc.includes('mykonos');

  const isYacht =
    (request as any)?.context === 'yacht' ||
    (request as any)?.service === 'yacht' ||
    loc.includes('yacht') ||
    loc.includes('boat');

  const isResidence =
    (request as any)?.type === 'residence' ||
    (request as any)?.kind === 'residence' ||
    (request as any)?.service === 'residence';

  const month = monthFromISO(start || undefined);
  const isHighSeason =
    month != null && ([12, 1, 2, 6, 7, 8] as number[]).includes(month); // hiver stations + été

  // Base (plancher) : forfait “mise en place / logistique”
  let base = 450;

  // Prix/pax moyen “marché” (Fast Match event)
  let pax = 95; // € / personne / jour

  // Ajustements selon type
  if (isResidence) {
    base = 650;
    pax = 75;
  }

  // Multipliers
  const multipliers: Record<string, number> = {};

  if (isInternational) multipliers.international = 1.25;
  if (isHighSeason) multipliers.highSeason = 1.15;
  if (isYacht) multipliers.yacht = 1.35;

  // Petites corrections “taille”
  // - petit comité = ticket moyen plus élevé/pax
  // - grand volume = légèrement moins/pax
  const sizeFactor =
    guestCount <= 6 ? 1.25 :
    guestCount <= 12 ? 1.10 :
    guestCount <= 25 ? 1.00 :
    guestCount <= 50 ? 0.95 : 0.90;
  multipliers.size = sizeFactor;

  // Calcul
  const mult = Object.values(multipliers).reduce((acc, m) => acc * m, 1);

  const avgRaw = (base + guestCount * pax) * days * mult;

  // Arrondis “propres” (et éviter les budgets à 12 347€)
  const roundTo = (n: number, step: number) => Math.round(n / step) * step;

  const avg = roundTo(avgRaw, 50);
  const min = roundTo(avg * 0.85, 50);
  const max = roundTo(avg * 1.25, 50);
  const recommended = avg;

  const explanationParts: string[] = [];
  explanationParts.push(`Base ${base}€`);
  explanationParts.push(`${guestCount} pers`);
  explanationParts.push(`${days} jour(s)`);

  if (isResidence) explanationParts.push('résidence');
  if (isInternational) explanationParts.push('international');
  if (isHighSeason) explanationParts.push('haute saison');
  if (isYacht) explanationParts.push('yacht');

  return {
    currency: 'EUR',
    min,
    avg,
    max,
    recommended,
    breakdown: {
      base,
      pax,
      days,
      multipliers,
    },
    explanation: `Estimation basée sur: ${explanationParts.join(' • ')}`,
  };
}

/* =========================================================
   Matching + scoring
========================================================= */

type MatchInfo = {
  chef: ChefUser;
  score: number;
};

/**
 * ✅ Determine if a chef is open to international missions
 * Supports:
 * - profile.internationalMobility (legacy)
 * - profile.location.internationalMobility (new)
 * - coverageZones includes "International"
 */
function isChefInternational(profile: any): boolean {
  const intl =
    profile?.internationalMobility === true ||
    profile?.location?.internationalMobility === true;

  const zones = Array.isArray(profile?.coverageZones) ? profile.coverageZones : [];
  const zoneIntl = zones.some((z: string) => normalize(z) === 'international');

  return intl || zoneIntl;
}

function scoreChefForRequest(request: RequestEntity, chef: ChefUser): number {
  const profile = chef.profile;
  if (!profile) return -1;

  const reqCity = extractCity(request.location);
  const baseCity = normalize(profile.baseCity || profile?.location?.baseCity || '');
  const chefIsInternational = isChefInternational(profile);

  // Base filters (hard)
  if (chef.role !== 'chef') return -1;
  if (chef.status !== 'active') return -1;
  if (!chef.profileCompleted) return -1;

  // Guests
  if (profile.maxGuestCount && request.guestCount > profile.maxGuestCount) return -1;

  // Date availability (simple: start date only)
  if (profile.unavailableDates?.includes(request.dates.start)) return -1;

  let score = 0;

  // Location scoring
  const zones = (profile.coverageZones || []).map((z: string) => normalize(z));

  const exactBaseCity = baseCity && reqCity && baseCity === reqCity;
  const zoneExact = reqCity && zones.includes(reqCity);
  const zoneLoose = reqCity && zones.some((z: string) => includesLoose(z, reqCity));
  const baseLoose = baseCity && reqCity && includesLoose(baseCity, reqCity);

  if (exactBaseCity) score += 100;
  else if (zoneExact) score += 70;
  else if (baseLoose) score += 55;
  else if (zoneLoose) score += 45;
  else {
    // ✅ fallback international : on ne jette pas le chef, mais il passe après les locaux
    if (!chefIsInternational) return -1;
    score += 25; // “match international”
  }

  // Optional small bonuses (keep it light)
  if (profile.seniorityLevel === 'senior') score += 6;
  if (profile.seniorityLevel === 'confirmed') score += 3;

  // If chef has more images / portfolio, tiny bonus (proxy for “ready”)
  if ((profile.images || []).length >= 3) score += 2;

  // Tiny bonus if international enabled
  if (chefIsInternational) score += 2;

  return score;
}

/**
 * 🔍 Match FAST V2 (sans GPS)
 * - Normalisation + scoring + tri
 */
export function matchChefsForFastRequest(request: RequestEntity, chefs: ChefUser[]): ChefUser[] {
  const scored: MatchInfo[] = [];

  for (const chef of chefs) {
    const s = scoreChefForRequest(request, chef);
    if (s >= 0) scored.push({ chef, score: s });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.map(x => x.chef);
}

/**
 * ⚡ Auto proposals FAST
 * - Top 5 chefs (après scoring)
 */
export function buildFastMatchProposals(request: RequestEntity, chefs: ChefUser[]): ChefProposalEntity[] {
  const createdAt = new Date().toISOString();

  return chefs.slice(0, 5).map(chef => ({
    id: crypto.randomUUID(),
    requestId: request.id,
    chefId: chef.id,
    status: 'sent',
    createdAt,
  }));
}
