export type ChefProfile = {
  // ✅ compat nom (ancien + nouveau)
  name?: string;
  firstName?: string;
  lastName?: string;

  // ✅ compat contacts
  phone?: string;
  email?: string;

  // ✅ compat localisation
  city?: string;
  baseCity?: string;
  country?: string;

  bio?: string;
  yearsExperience?: number | null;

  cuisines?: string[];
  specialties?: string[];
  languages?: string[];

  // ✅ compat liens
  instagram?: string;
  instagramUrl?: string;
  website?: string;
  websiteUrl?: string;

  portfolioUrl?: string;

  // ✅ compat avatar
  avatarUrl?: string;
  photoUrl?: string;

  images?: string[];

  // ✅ mobilité (nouveau + compat)
  travelRadiusKm?: number | null;
  internationalMobility?: boolean;

  location?: {
    baseCity?: string;
    travelRadiusKm?: number | null;
    internationalMobility?: boolean;
    coverageZones?: string[];
  };
};

function getName(p: ChefProfile) {
  const n = (p.name ?? '').trim();
  if (n) return n;

  const fn = (p.firstName ?? '').trim();
  const ln = (p.lastName ?? '').trim();
  return `${fn} ${ln}`.trim();
}

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

function hasAvatar(p: ChefProfile) {
  return !!(p.avatarUrl || p.photoUrl)?.trim();
}

function hasSocialOrWebsite(p: ChefProfile) {
  const insta = (p.instagramUrl ?? p.instagram ?? '').trim();
  const web = (p.websiteUrl ?? p.website ?? '').trim();
  return !!insta || !!web;
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
    // ✅ name tolérant (name OU first+last)
    { key: 'name', ok: !!getName(p), weight: 1 },

    { key: 'phone', ok: !!p.phone?.trim(), weight: 1 },

    // 🔁 city reste mais tolérant (baseCity/location)
    { key: 'city', ok: !!baseCity, weight: 1 },

    { key: 'bio', ok: (p.bio?.trim()?.length ?? 0) >= 30, weight: 2 },
    { key: 'cuisines', ok: (p.cuisines?.length ?? 0) >= 1, weight: 1 },
    { key: 'specialties', ok: (p.specialties?.length ?? 0) >= 1, weight: 1 },
    { key: 'languages', ok: (p.languages?.length ?? 0) >= 1, weight: 1 },

    // ✅ portfolio = images (>=5)
    { key: 'portfolio', ok: imgCount >= 5, weight: 2 },

    // ✅ mobilité/logistique
    { key: 'mobility', ok: mobilityOk, weight: 1 },

    // (optionnel) tu peux l’activer plus tard si tu veux pousser le premium
    // { key: 'avatar', ok: hasAvatar(p), weight: 1 },
    // { key: 'links', ok: hasSocialOrWebsite(p), weight: 1 },
  ];

  const total = rules.reduce((s, r) => s + r.weight, 0);
  const ok = rules.reduce((s, r) => s + (r.ok ? r.weight : 0), 0);
  const score = total === 0 ? 0 : Math.round((ok / total) * 100);

  return { score, rules, okWeight: ok, totalWeight: total };
}
