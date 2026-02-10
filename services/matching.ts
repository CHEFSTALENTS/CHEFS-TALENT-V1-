// services/matching.ts
import type { ChefUser, RequestEntity } from '@/types';

type FitResult = { fitScore: number; reasons: string[] };

const norm = (s?: string | null) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

const splitList = (v?: string | null) =>
  norm(v)
    .split(/,|\n|;|\|/g)
    .map((x) => x.trim())
    .filter(Boolean);

const includesOne = (hay: string[], needles: string[]) =>
  needles.some((n) => hay.some((h) => h.includes(n) || n.includes(h)));

function getChefBaseCity(chef: ChefUser) {
  const p = chef.profile || {};
  return (p.baseCity || p.location?.baseCity || p.city || '').toString();
}

function getChefLanguages(chef: ChefUser): string[] {
  const p = chef.profile || {};
  const arr = (p.languages || []) as any[];
  return arr.map((x) => norm(typeof x === 'string' ? x : x?.label ?? x?.value ?? '')).filter(Boolean);
}

function getChefCuisines(chef: ChefUser): string[] {
  const p = chef.profile || {};
  const arr = (p.cuisines || []) as any[];
  return arr.map((x) => norm(typeof x === 'string' ? x : x?.label ?? x?.value ?? '')).filter(Boolean);
}

function getChefMobility(chef: ChefUser) {
  const p = chef.profile || {};
  return {
    travelRadiusKm: Number(p.travelRadiusKm ?? p.location?.travelRadiusKm ?? 0) || 0,
    internationalMobility: Boolean(p.internationalMobility ?? p.location?.internationalMobility ?? false),
  };
}

function requestIsInternational(req: RequestEntity) {
  // v1 simple : si le lieu contient un pays / ville hors FR, on ne peut pas deviner.
  // Donc on ne pénalise pas, on donne juste un bonus si chef "internationalMobility".
  return true;
}

export function scoreChefForRequest(req: RequestEntity, chef: ChefUser): FitResult {
  const reasons: string[] = [];
  let score = 0;

  // 1) Cuisine (0-35)
  const reqCuisines = splitList(req.preferences?.cuisine || '');
  const chefCuisines = getChefCuisines(chef);
  if (reqCuisines.length) {
    const hit = includesOne(chefCuisines, reqCuisines);
    if (hit) {
      score += 35;
      reasons.push(`Cuisine OK (${reqCuisines.join(', ')})`);
    } else {
      score -= 10;
      reasons.push(`Cuisine non match (${reqCuisines.join(', ')})`);
    }
  } else {
    score += 10;
    reasons.push('Cuisine non spécifiée');
  }

  // 2) Langues (0-25)
  const reqLangs = splitList(req.preferences?.languages || '');
  const chefLangs = getChefLanguages(chef);
  if (reqLangs.length) {
    const hit = includesOne(chefLangs, reqLangs);
    if (hit) {
      score += 25;
      reasons.push(`Langues OK (${reqLangs.join(', ')})`);
    } else {
      score -= 10;
      reasons.push(`Langues non match (${reqLangs.join(', ')})`);
    }
  } else {
    score += 5;
    reasons.push('Langues non spécifiées');
  }

  // 3) Restrictions (0-20)
  // v1: si restrictions présentes -> bonus si chef a "healthy/vege/allergies" dans bio/specialties (approx)
  const reqRestr = norm(req.preferences?.allergies || '');
  if (reqRestr) {
    const p = chef.profile || {};
    const blob = norm(
      [
        ...(p.specialties || []),
        ...(p.environments || []),
        p.bio || '',
        (p.certifications?.items || []).join(' '),
      ].join(' ')
    );
    if (blob.includes('sans gluten') || blob.includes('gluten free') || blob.includes('allergen') || blob.includes('healthy') || blob.includes('veget')) {
      score += 20;
      reasons.push(`Restrictions prises en compte (${reqRestr})`);
    } else {
      score += 8; // neutre+ (on ne veut pas trop pénaliser en v1)
      reasons.push(`Restrictions à confirmer (${reqRestr})`);
    }
  }

  // 4) Mission type (0-10)
  const mt = norm(req.missionType || '');
  if (mt) {
    score += 6;
    reasons.push(`Mission: ${mt}`);
  }

  // 5) Mobilité (0-10)
  const mob = getChefMobility(chef);
  if (requestIsInternational(req) && mob.internationalMobility) {
    score += 10;
    reasons.push('Mobilité internationale ✅');
  } else if (mob.travelRadiusKm >= 100) {
    score += 6;
    reasons.push(`Rayon ${mob.travelRadiusKm}km`);
  } else {
    score += 2;
    reasons.push(`Rayon faible (${mob.travelRadiusKm}km)`);
  }

  // Clamp
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return { fitScore: Math.round(score), reasons };
}
