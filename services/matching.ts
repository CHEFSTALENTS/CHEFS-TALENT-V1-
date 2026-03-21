// services/matching.ts
import type { ChefUser, RequestEntity } from '@/types';

export type MatchConfidence = 'high' | 'medium' | 'low';

export type MatchedChefV2 = {
  chef: ChefUser;
  fitScore: number;
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
 * Priorité lieu :
 * 4 = base chef match exact/proche
 * 3 = zone couverte
 * 2 = mobilité internationale
 * 1 = gros rayon
 * 0 = non compatible
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
 * Priorité dispo :
 * 4 = disponibilité explicite confirmée
 * 3 = calendrier structuré compatible
 * 2 = string / donnée partielle mais exploitable
 * 1 = donnée légère
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

  if (status !== 'active') return false;
  if (!chefMatchesLocation(req, chef)) return false;
  if (!chefMatchesDates(req, chef)) return false;

  return true;
}

export function scoreChefForRequestV2(
  req: RequestEntity,
  chef: ChefUser
): Omit<MatchedChefV2, 'chef'> {
  let score = 0;
  const reasons: string[] = [];

  const wantCuisines = splitPrefs(req.preferences?.cuisine ?? '');
  const wantLangs = splitPrefs(req.preferences?.languages ?? '');
  const restrictions = String(req.preferences?.allergies ?? '').trim();

  const chefLangs = getChefLanguages(chef);
  const chefCuisines = getChefCuisines(chef);
  const chefLoc = getChefLocation(chef);

  const locationPriority = getLocationPriority(req, chef);
  const availabilityPriority = getAvailabilityPriority(req, chef);

  let strongHits = 0;

  // 1) LOCALISATION = priorité absolue
  if (locationPriority === 4) {
    score += 100;
    strongHits++;
    reasons.push('📍 Base chef compatible');
  } else if (locationPriority === 3) {
    score += 80;
    strongHits++;
    reasons.push('📍 Zone couverte compatible');
  } else if (locationPriority === 2) {
    score += 50;
    reasons.push('🌍 Mobilité internationale');
  } else if (locationPriority === 1) {
    score += 30;
    reasons.push(`🚗 Rayon ${chefLoc.travelRadiusKm} km`);
  }

  // 2) DISPONIBILITÉ = 2e priorité absolue
  if (availabilityPriority === 4) {
    score += 60;
    strongHits++;
    reasons.push('✅ Disponible confirmé');
  } else if (availabilityPriority === 3) {
    score += 45;
    strongHits++;
    reasons.push('🗓️ Calendrier compatible');
  } else if (availabilityPriority === 2) {
    score += 25;
    reasons.push('🕓 Disponibilité probable');
  }

  // 3) Le reste seulement ensuite
  if (wantCuisines.length) {
    const hits = intersectCount(wantCuisines, chefCuisines);
    if (hits > 0) {
      score += 8;
      reasons.push(`✅ Cuisine match (${hits})`);
    } else {
      reasons.push('⚠️ Cuisine à confirmer');
    }
  }

  if (wantLangs.length) {
    const hits = intersectCount(wantLangs, chefLangs);
    if (hits > 0) {
      score += 8;
      reasons.push(`✅ Langues match (${hits})`);
    } else {
      reasons.push('⚠️ Langues à confirmer');
    }
  }

  if (chef.profileCompleted) {
    score += 4;
    reasons.push('✅ Profil complet');
  } else {
    reasons.push('⚠️ Profil incomplet');
  }

  if (restrictions) {
    reasons.push(`⚠️ Restrictions: ${restrictions} (à valider)`);
  }

  score = Math.max(0, Math.min(999, Math.round(score)));

  const confidence: MatchConfidence =
    strongHits >= 3 ? 'high' : strongHits >= 2 ? 'medium' : 'low';

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
      // 1. localisation d'abord
      if (b.locationPriority !== a.locationPriority) {
        return b.locationPriority - a.locationPriority;
      }

      // 2. disponibilité ensuite
      if (b.availabilityPriority !== a.availabilityPriority) {
        return b.availabilityPriority - a.availabilityPriority;
      }

      // 3. puis score de pertinence secondaire
      if (b.fitScore !== a.fitScore) {
        return b.fitScore - a.fitScore;
      }

      // 4. jamais d'ordre alphabétique par défaut visible
      return 0;
    });
}
