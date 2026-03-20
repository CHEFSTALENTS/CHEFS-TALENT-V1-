// services/matching.ts
import type { ChefUser, RequestEntity } from '@/types';

export type MatchConfidence = 'high' | 'medium' | 'low';

export type MatchedChefV2 = {
  chef: ChefUser;
  fitScore: number;
  confidence: MatchConfidence;
  reasons: string[];
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

  return { baseCity, coverageZones, travelRadiusKm, internationalMobility };
}

function getRequestLocation(req: RequestEntity) {
  const raw = norm((req as any).location ?? '');
  return { raw };
}
function normalizeLocationText(v: any) {
  return norm(
    typeof v === 'string'
      ? v
      : v?.destination || v?.city || v?.region || v?.country || ''
  );
}

function chefMatchesLocation(req: RequestEntity, chef: ChefUser) {
  const chefLoc = getChefLocation(chef);
  const reqLoc = getRequestLocation(req);

  if (!reqLoc.raw) return true;

  const baseMatch =
    chefLoc.baseCity.includes(reqLoc.raw) || reqLoc.raw.includes(chefLoc.baseCity);

  const zoneMatch = chefLoc.coverageZones.some(
    (z) => z.includes(reqLoc.raw) || reqLoc.raw.includes(z)
  );

  const internationalFallback = chefLoc.internationalMobility === true;

  return baseMatch || zoneMatch || internationalFallback;
}

function chefMatchesDates(req: RequestEntity, chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const availability = p.availability ?? p.availableDates ?? p.calendar ?? p.profile?.availability ?? null;

  const reqStart = req?.dates?.start ? new Date(String(req.dates.start)) : null;
  const reqEnd = req?.dates?.end ? new Date(String(req.dates.end)) : reqStart;

  if (!reqStart || Number.isNaN(reqStart.getTime())) return true;

  // si aucune donnée de dispo, on considère "à confirmer" => false pour ton besoin strict
  if (!availability) return false;

  // cas simple string
  if (typeof availability === 'string') {
    return true;
  }

  // cas objet structuré
  const unavailableDates = Array.isArray(availability.unavailableDates)
    ? availability.unavailableDates
    : [];

  const availableNow =
    availability.availableNow === undefined ? true : Boolean(availability.availableNow);

  if (!availableNow) return false;

  const blocked = unavailableDates.some((d: any) => {
    const x = new Date(String(d));
    if (Number.isNaN(x.getTime())) return false;
    if (!reqEnd) return x.toDateString() === reqStart.toDateString();
    return x >= reqStart && x <= reqEnd;
  });

  if (blocked) return false;

  const nextAvailableFrom = availability.nextAvailableFrom
    ? new Date(String(availability.nextAvailableFrom))
    : null;

  if (nextAvailableFrom && !Number.isNaN(nextAvailableFrom.getTime()) && nextAvailableFrom > reqStart) {
    return false;
  }

  return true;
}

export function chefIsEligibleForRequest(req: RequestEntity, chef: ChefUser) {
  const status = String(chef.status || (chef as any)?.profile?.status || '').toLowerCase();

  if (!(status === 'active' || status === 'approved')) return false;
  if (!chefMatchesLocation(req, chef)) return false;
  if (!chefMatchesDates(req, chef)) return false;

  return true;
}
export function scoreChefForRequestV2(
  req: RequestEntity,
  chef: ChefUser
): Omit<MatchedChefV2, 'chef'> {
  let score = 50;
  const reasons: string[] = [];

  const wantCuisines = splitPrefs(req.preferences?.cuisine ?? '');
  const wantLangs = splitPrefs(req.preferences?.languages ?? '');
  const restrictions = String(req.preferences?.allergies ?? '').trim();

  const chefLangs = getChefLanguages(chef);
  const chefCuisines = getChefCuisines(chef);
  const mobility = isMobileEnough(chef);
  const chefLoc = getChefLocation(chef);
  const reqLoc = getRequestLocation(req);

  let strongHits = 0;

  if (wantCuisines.length) {
    const hits = intersectCount(wantCuisines, chefCuisines);
    if (hits > 0) {
      score += 10;
      strongHits++;
      reasons.push(`✅ Cuisine match (${hits})`);
    } else {
      score -= 3;
      reasons.push(`⚠️ Cuisine à confirmer`);
    }
  }

  if (wantLangs.length) {
    const hits = intersectCount(wantLangs, chefLangs);
    if (hits > 0) {
      score += 10;
      strongHits++;
      reasons.push(`✅ Langues match (${hits})`);
    } else {
      score -= 3;
      reasons.push(`⚠️ Langues à confirmer`);
    }
  }

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

  if (reqLoc.raw) {
    const baseMatch =
      chefLoc.baseCity.includes(reqLoc.raw) || reqLoc.raw.includes(chefLoc.baseCity);

    const zoneMatch = chefLoc.coverageZones.some(
      (z) => z.includes(reqLoc.raw) || reqLoc.raw.includes(z)
    );

    if (baseMatch) {
      score += 22;
      strongHits++;
      reasons.push('📍 Base chef compatible');
    } else if (zoneMatch) {
      score += 18;
      strongHits++;
      reasons.push('📍 Zone couverte compatible');
    } else if (chefLoc.internationalMobility) {
      score += 8;
      reasons.push('🌍 Mobilité internationale');
    } else if (chefLoc.travelRadiusKm >= 150) {
      score += 4;
      reasons.push(`🚗 Rayon ${chefLoc.travelRadiusKm} km`);
    } else {
      score -= 4;
      reasons.push('⚠️ Localisation à confirmer');
    }
  }

  if (chef.profileCompleted) {
    score += 5;
    reasons.push(`✅ Profil complet`);
  } else {
    reasons.push(`⚠️ Profil incomplet`);
  }

  if (restrictions) {
    reasons.push(`⚠️ Restrictions: ${restrictions} (à valider)`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const confidence: MatchConfidence =
    strongHits >= 2 ? 'high' : strongHits === 1 ? 'medium' : 'low';

  return { fitScore: score, confidence, reasons };
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
    .sort((a, b) => b.fitScore - a.fitScore);
}
