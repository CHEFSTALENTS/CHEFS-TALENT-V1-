export type ChefProfile = {
  name?: string;
  phone?: string;
  city?: string;
  country?: string;
  bio?: string;
  yearsExperience?: number | null;
  cuisines?: string[];
  specialties?: string[];
  languages?: string[];
  instagram?: string;
  website?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
  images?: string[]; 

  // ✅ mobilité (nouveau + compat)
  baseCity?: string;
  travelRadiusKm?: number | null;
  internationalMobility?: boolean;

  location?: {
    baseCity?: string;
    travelRadiusKm?: number | null;
    internationalMobility?: boolean;
    coverageZones?: string[];
  };
};

function getBaseCity(p: ChefProfile) {
  return (
    p.location?.baseCity ??
    p.baseCity ??
    p.city ??
    ''
  ).trim();
}

function getRadius(p: ChefProfile) {
  const v =
    p.location?.travelRadiusKm ??
    p.travelRadiusKm ??
    null;

  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getInternational(p: ChefProfile) {
  return Boolean(
    p.location?.internationalMobility ??
    p.internationalMobility ??
    false
  );
}

function hasCoverageZones(p: ChefProfile) {
  const z = p.location?.coverageZones;
  return Array.isArray(z) && z.filter(Boolean).length > 0;
}

export function computeChefScore(p: ChefProfile) {
  const baseCity = getBaseCity(p);
  const radius = getRadius(p);
  const international = getInternational(p);
const imgCount = (p.images ?? []).filter(Boolean).length;

  const mobilityOk =
    !!baseCity ||
    radius > 0 ||
    international === true ||
    hasCoverageZones(p);

  const rules = [
    { key: 'name', ok: !!p.name?.trim(), weight: 1 },
    { key: 'phone', ok: !!p.phone?.trim(), weight: 1 },

    // 🔁 city reste mais on le rend tolérant (baseCity/location)
    { key: 'city', ok: !!baseCity, weight: 1 },

    { key: 'bio', ok: (p.bio?.trim()?.length ?? 0) >= 30, weight: 2 },
    { key: 'cuisines', ok: (p.cuisines?.length ?? 0) >= 1, weight: 1 },
    { key: 'specialties', ok: (p.specialties?.length ?? 0) >= 1, weight: 1 },
    { key: 'languages', ok: (p.languages?.length ?? 0) >= 1, weight: 1 },
{ key: 'portfolio', ok: imgCount >= 5, weight: 2 },
    // ✅ NOUVEAU : mobilité/logistique
    // poids 1 ou 2 selon l’importance que tu veux lui donner
    { key: 'mobility', ok: mobilityOk, weight: 1 },
  ];

  const total = rules.reduce((s, r) => s + r.weight, 0);
  const ok = rules.reduce((s, r) => s + (r.ok ? r.weight : 0), 0);
  const score = total === 0 ? 0 : Math.round((ok / total) * 100);

  return { score, rules, okWeight: ok, totalWeight: total };
}
