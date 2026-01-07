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
  const cleaned = beforeComma.replace(/\b(\d{1,2})(er|eme|e)?\b/g, '').replace(/\s+/g, ' ').trim();

  return cleaned;
}

function includesLoose(haystack: string, needle: string): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!h || !n) return false;
  return h.includes(n) || n.includes(h);
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
    score += 25; // “match international” (à ajuster si besoin)
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
