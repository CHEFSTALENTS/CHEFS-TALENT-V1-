// services/matching.ts
import type { ChefUser, RequestEntity } from '@/types';

export type MatchConfidence = 'high' | 'medium' | 'low';

export type MatchedChefV2 = {
  chef: ChefUser;
  fitScore: number; // toujours 0..100
  confidence: MatchConfidence;
  reasons: string[];
  locationPriority: number;
  availabilityPriority: number;
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
  for (const x of a) {
    if (setB.has(x)) n++;
  }
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

function getChefLocation(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const loc = p.location ?? p.profile?.location ?? {};

  const baseCity = norm(loc.baseCity ?? p.baseCity ?? p.city ?? p.ville ?? '');

  const coverageZonesRaw = loc.coverageZones ?? p.coverageZones ?? [];
  const coverageZones = Array.isArray(coverageZonesRaw)
    ? coverageZonesRaw.map(norm).filter(Boolean)
    : splitPrefs(coverageZonesRaw);

  const travelRadiusKm = Number(loc.travelRadiusKm ?? p.travelRadiusKm ?? 0) || 0;
  const internationalMobility = Boolean(
    loc.internationalMobility ?? p.internationalMobility ?? false
  );

  return {
    baseCity,
    coverageZones,
    travelRadiusKm,
    internationalMobility,
  };
}

function getRequestLocation(req: RequestEntity) {
  return {
    raw: norm((req as any).location ?? ''),
  };
}

/**
 * Priorité lieu
 * 4 = base match
 * 3 = zone couverte
 * 2 = mobilité internationale
 * 1 = gros rayon
 * 0 = pas compatible
 */
function getLocationPriority(req: RequestEntity, chef: ChefUser) {
  const chefLoc = getChefLocation(chef);
  const reqLoc = getRequestLocation(req);

  if (!reqLoc.raw) return 0;

  const baseMatch =
    (chefLoc.baseCity && chefLoc.baseCity.includes(reqLoc.raw)) ||
    (chefLoc.baseCity && reqLoc.raw.includes(chefLoc.baseCity));

  const zoneMatch = chefLoc.coverageZones.some(
    (z) => z.includes(reqLoc.raw) || reqLoc.raw.includes(z)
  );

  if (baseMatch) return 4;
  if (zoneMatch) return 3;
  if (chefLoc.internationalMobility) return 2;
  if (chefLoc.travelRadiusKm >= 150) return 1;

  return 0;
}

function chefMatchesLocation(req: RequestEntity, chef: ChefUser) {
  const reqLoc = getRequestLocation(req);
  if (!reqLoc.raw) return true;
  return getLocationPriority(req, chef) > 0;
}

/**
 * Priorité disponibilité
 * 4 = disponible confirmé
 * 3 = calendrier compatible
 * 2 = information partielle compatible
 * 1 = à confirmer
 * 0 = inconnu
 * -1 = indisponible
 */
function getAvailabilityPriority(req: RequestEntity, chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const availability =
    p.availability ?? p.availableDates ?? p.calendar ?? p.profile?.availability ?? null;

  const reqStart = req?.dates?.start ? new Date(String(req.dates.start)) : null;
  const reqEnd = req?.dates?.end ? new Date(String(req.dates.end)) : reqStart;

  if (!availability) return 0;

  if (typeof availability === 'string') {
    return 2;
  }

  if (typeof availability !== 'object') {
    return 0;
  }

  if (availability.availableNow === false) return -1;

  if (!reqStart || Number.isNaN(reqStart.getTime())) {
    return availability.availableNow === true ? 4 : 2;
  }

  const unavailableDates = Array.isArray(availability.unavailableDates)
    ? availability.unavailableDates
    : [];

  const blocked = unavailableDates.some((d: any) => {
    const x = new Date(String(d));
    if (Number.isNaN(x.getTime())) return false;
    if (!reqEnd) return x.toDateString() === reqStart.toDateString();
    return x >= reqStart && x <= reqEnd;
  });

  if (blocked) return -1;

  const nextAvailableFrom = availability.nextAvailableFrom
    ? new Date(String(availability.nextAvailableFrom))
    : null;

  if (
    nextAvailableFrom &&
    !Number.isNaN(nextAvailableFrom.getTime()) &&
    nextAvailableFrom > reqStart
  ) {
    return -1;
  }

  if (availability.availableNow === true) return 4;
  return 3;
}

function chefMatchesDates(req: RequestEntity, chef: ChefUser) {
  return getAvailabilityPriority(req, chef) >= 2;
}

export function chefIsEligibleForRequest(req: RequestEntity, chef: ChefUser) {
  const status = String(chef.status || (chef as any)?.profile?.status || '').toLowerCase();

  // seulement les chefs actifs
  if (status !== 'active') return false;

  // hard filters
  if (!chefMatchesLocation(req, chef)) return false;
  if (!chefMatchesDates(req, chef)) return false;

  return true;
}

export function scoreChefForRequestV2(
  req: RequestEntity,
  chef: ChefUser
): Omit<MatchedChefV2, 'chef'> {
  const reasons: string[] = [];

  const locationPriority = getLocationPriority(req, chef);
  const availabilityPriority = getAvailabilityPriority(req, chef);

  const wantCuisines = splitPrefs(req.preferences?.cuisine ?? '');
  const wantLangs = splitPrefs(req.preferences?.languages ?? '');

  const chefLangs = getChefLanguages(chef);
  const chefCuisines = getChefCuisines(chef);
  const chefLoc = getChefLocation(chef);

  // base score simple et capé
  let score = 0;

  // 1) LIEU = critère principal
  if (locationPriority === 4) {
    score += 55;
    reasons.push('📍 Base chef compatible');
  } else if (locationPriority === 3) {
    score += 45;
    reasons.push('📍 Zone couverte compatible');
  } else if (locationPriority === 2) {
    score += 30;
    reasons.push('🌍 Mobilité internationale');
  } else if (locationPriority === 1) {
    score += 20;
    reasons.push(`🚗 Rayon ${chefLoc.travelRadiusKm} km`);
  }

  // 2) DISPONIBILITÉ = 2e critère principal
  if (availabilityPriority === 4) {
    score += 35;
    reasons.push('✅ Disponible confirmé');
  } else if (availabilityPriority === 3) {
    score += 28;
    reasons.push('🗓️ Calendrier compatible');
  } else if (availabilityPriority === 2) {
    score += 18;
    reasons.push('🕓 Disponibilité probable');
  }

  // 3) Bonus très légers seulement
  if (wantCuisines.length) {
    const hits = intersectCount(wantCuisines, chefCuisines);
    if (hits > 0) {
      score += 5;
      reasons.push(`✅ Cuisine match`);
    }
  }

  if (wantLangs.length) {
    const hits = intersectCount(wantLangs, chefLangs);
    if (hits > 0) {
      score += 5;
      reasons.push(`✅ Langues match`);
    }
  }

  if (chef.profileCompleted) {
    score += 3;
    reasons.push('✅ Profil complet');
  }

  // clamp strict
  score = Math.max(0, Math.min(100, Math.round(score)));

  const confidence: MatchConfidence =
    locationPriority >= 3 && availabilityPriority >= 3
      ? 'high'
      : locationPriority >= 2 && availabilityPriority >= 2
      ? 'medium'
      : 'low';

  return {
    fitScore: score,
    confidence,
    reasons,
    locationPriority,
    availabilityPriority,
  };
}

export function matchChefsForRequestV2(
  req: RequestEntity,
  chefs: ChefUser[]
): MatchedChefV2[] {
  return chefs
    .map((chef) => {
      const scored = scoreChefForRequestV2(req, chef);
      return { chef, ...scored };
    })
    .sort((a, b) => {
      // 1. lieu en priorité absolue
      if (b.locationPriority !== a.locationPriority) {
        return b.locationPriority - a.locationPriority;
      }

      // 2. disponibilité ensuite
      if (b.availabilityPriority !== a.availabilityPriority) {
        return b.availabilityPriority - a.availabilityPriority;
      }

      // 3. puis score secondaire
      if (b.fitScore !== a.fitScore) {
        return b.fitScore - a.fitScore;
      }

      // 4. aucun tri alphabétique parasite
      return 0;
    });
}
