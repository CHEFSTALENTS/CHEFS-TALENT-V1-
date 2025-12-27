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
};

export function computeChefScore(p: ChefProfile) {
  const rules = [
    { key: 'name', ok: !!p.name?.trim(), weight: 1 },
    { key: 'phone', ok: !!p.phone?.trim(), weight: 1 },
    { key: 'city', ok: !!p.city?.trim(), weight: 1 },
    { key: 'bio', ok: (p.bio?.trim()?.length ?? 0) >= 30, weight: 2 },
    { key: 'cuisines', ok: (p.cuisines?.length ?? 0) >= 1, weight: 1 },
    { key: 'specialties', ok: (p.specialties?.length ?? 0) >= 1, weight: 1 },
    { key: 'languages', ok: (p.languages?.length ?? 0) >= 1, weight: 1 },
    { key: 'portfolio', ok: !!p.portfolioUrl?.trim() || !!p.instagram?.trim() || !!p.website?.trim(), weight: 2 },
  ];

  const total = rules.reduce((s, r) => s + r.weight, 0);
  const ok = rules.reduce((s, r) => s + (r.ok ? r.weight : 0), 0);
  const score = total === 0 ? 0 : Math.round((ok / total) * 100);

  return { score, rules, okWeight: ok, totalWeight: total };
}
