// services/matching.ts
import type { ChefUser, RequestEntity } from '@/types';

export type MatchConfidence = 'high' | 'medium' | 'low';

export type MatchedChefV2 = {
  chef: ChefUser;
  fitScore: number;            // 0..100 (tri)
  confidence: MatchConfidence; // high/medium/low
  reasons: string[];           // raisons lisibles (admin)
};

function norm(s: any) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function splitPrefs(v?: string | null) {
  const s = String(v ?? '').trim();
  if (!s) return [];
  return s
    .split(/,|\n|;|\|/g)
    .map((x) => norm(x))
    .filter(Boolean);
}

function intersectCount(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  let n = 0;
  for (const x of a) if (setB.has(x)) n++;
  return n;
}

function getChefLanguages(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const arr = p.languages ?? p.profile?.languages ?? [];
  if (Array.isArray(arr)) return arr.map(norm).filter(Boolean);
  return splitPrefs(arr);
}

function getChefCuisines(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const arr = p.cuisines ?? p.profile?.cuisines ?? p.specialties ?? [];
  if (Array.isArray(arr)) return arr.map(norm).filter(Boolean);
  return splitPrefs(arr);
}

function isMobileEnough(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const radius = Number(p.travelRadiusKm ?? p.location?.travelRadiusKm ?? 0) || 0;
  const international = Boolean(p.internationalMobility ?? p.location?.internationalMobility);
  return { radius, international };
}

/**
 * ✅ Soft scoring:
 * - jamais d'exclusion sur cuisine/langues/restrictions
 * - mismatch = petite pénalité (3)
 * - match = bonus
 * - confidence = nb de "strong hits"
 */
export function scoreChefForRequestV2(req: RequestEntity, chef: ChefUser): Omit<MatchedChefV2, 'chef'> {
  let score = 50;
  const reasons: string[] = [];

  // --- Request prefs
  const wantCuisines = splitPrefs(req.preferences?.cuisine ?? '');
  const wantLangs = splitPrefs(req.preferences?.languages ?? '');
  const restrictions = String(req.preferences?.allergies ?? '').trim();

  // --- Chef data
  const chefLangs = getChefLanguages(chef);
  const chefCuisines = getChefCuisines(chef);
  const mobility = isMobileEnough(chef);

  let strongHits = 0;

  // Cuisine
  if (wantCuisines.length) {
    const hits = intersectCount(wantCuisines, chefCuisines);
    if (hits > 0) {
      score += 10;
      strongHits++;
      reasons.push(`✅ Cuisine match (${hits})`);
    } else {
      score -= 3; // 👈 soft
      reasons.push(`⚠️ Cuisine à confirmer`);
    }
  }

  // Langues
  if (wantLangs.length) {
    const hits = intersectCount(wantLangs, chefLangs);
    if (hits > 0) {
      score += 10;
      strongHits++;
      reasons.push(`✅ Langues match (${hits})`);
    } else {
      score -= 3; // 👈 soft
      reasons.push(`⚠️ Langues à confirmer`);
    }
  }

  // Mobilité (soft bonus)
  if (mobility.international) {
    score += 6;
    strongHits++;
    reasons.push(`✅ Mobilité internationale`);
  } else if (mobility.radius >= 150) {
    score += 4;
    strongHits++;
    reasons.push(`✅ Rayon ${mobility.radius} km`);
  } else if (mobility.radius > 0) {
    score += 2;
    reasons.push(`ℹ️ Rayon ${mobility.radius} km`);
  } else {
    reasons.push(`⚠️ Mobilité non renseignée`);
  }

  // Profil complété = bonus
  if (chef.profileCompleted) {
    score += 5;
    reasons.push(`✅ Profil complet`);
  } else {
    reasons.push(`⚠️ Profil incomplet`);
  }

  // Restrictions = pas de pénalité (info)
  if (restrictions) {
    reasons.push(`⚠️ Restrictions: ${restrictions} (à valider)`);
  }

  // Clamp 0..100
  score = Math.max(0, Math.min(100, Math.round(score)));

  const confidence: MatchConfidence =
    strongHits >= 2 ? 'high' : strongHits === 1 ? 'medium' : 'low';

  return { fitScore: score, confidence, reasons };
}

export function matchChefsForRequestV2(req: RequestEntity, chefs: ChefUser[]): MatchedChefV2[] {
  return chefs
    .map((chef) => {
      const scored = scoreChefForRequestV2(req, chef);
      return { chef, ...scored };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}
