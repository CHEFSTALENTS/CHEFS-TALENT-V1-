/* -------------------- NORMALIZATION (fix score + champs manquants) -------------------- */

function asArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    // "Français, Anglais" => ["Français","Anglais"]
    if (val.includes(',')) return val.split(',').map((s) => s.trim()).filter(Boolean);
    if (val.trim()) return [val.trim()];
    return [];
  }
  return [val];
}

function normalizeProfile(raw: any) {
  const r = raw ?? {};

  const firstName = r.firstName ?? r.first_name ?? r.firstname ?? '';
  const lastName = r.lastName ?? r.last_name ?? r.lastname ?? '';

  const phone =
    r.phone ?? r.phone_number ?? r.phoneNumber ?? r.tel ?? r.telephone ?? r.mobile ?? r.mobilePhone ?? null;

  const languages = r.languages ?? r.langues ?? r.language ?? r.lang ?? [];
  const images = r.images ?? r.photos ?? r.gallery ?? r.pictures ?? [];

  const bio =
    r.bio ??
    r.bio_text ??
    r.about ??
    r.description ??
    r.presentation ??
    r.summary ??
    r.biography ??
    null;

  const services = r.services ?? r.service_types ?? r.serviceTypes ?? r.service ?? null;

  // Mobilité : souvent coverage_zones / base_city / radius…
  const mobility = r.mobility ?? r.coverage_zones ?? r.coverageZones ?? r.zones ?? r.radius ?? r.travel ?? null;

  // Localisation : parfois base_city, city, country…
  const location =
    r.location ??
    (r.city || r.country || r.base_city || r.baseCity
      ? {
          city: r.city ?? r.base_city ?? r.baseCity ?? r.ville ?? null,
          country: r.country ?? null,
        }
      : null) ??
    r.address ??
    null;

  const baseCity = r.baseCity ?? r.base_city ?? r.city ?? r.ville ?? null;

  const profileType = r.profileType ?? r.profile_type ?? r.type ?? null;
  const seniorityLevel = r.seniorityLevel ?? r.seniority_level ?? r.seniority ?? r.experienceLevel ?? null;

  const specialties = r.specialties ?? r.speciality ?? r.specialisations ?? r.skills ?? null;
  const cuisines = r.cuisines ?? r.cuisineTypes ?? r.styles ?? r.style ?? null;

  const dailyRate = r.dailyRate ?? r.rateDay ?? r.pricePerDay ?? r.day_rate ?? null;
  const pricePerPerson = r.pricePerPerson ?? r.pp ?? r.ratePerPerson ?? r.price_per_person ?? null;

  const minGuests = r.minGuests ?? r.minimumGuests ?? r.min_guests ?? null;
  const maxGuests = r.maxGuests ?? r.maxPax ?? r.capacity ?? r.max_guests ?? null;

  const availability =
    r.availability ?? r.availableFrom ?? r.calendarNote ?? r.preferredPeriods ?? r.available_from ?? null;

  const status = r.status ?? null;
  const created_at = r.created_at ?? r.createdAt ?? null;
  const updated_at = r.updated_at ?? r.updatedAt ?? null;

  return {
    ...r,
    firstName,
    lastName,
    phone,
    languages: asArray(languages),
    images: asArray(images),
    bio: typeof bio === 'string' ? bio : bio ? String(bio) : null,
    services,
    mobility,
    location,
    baseCity,
    profileType,
    seniorityLevel,
    specialties,
    cuisines,
    dailyRate,
    pricePerPerson,
    minGuests,
    maxGuests,
    availability,
    status,
    created_at,
    updated_at,
  };
}

function getNormalizedChef(c: ApiChef, detail?: any | null) {
  // On garde EXACTEMENT ta logique: detail > selected.profile > selected
  const raw = (detail?.profile ?? detail ?? (c as any).profile ?? c) as any;
  const profile = normalizeProfile(raw);

  const email = String((c as any).email ?? profile.email ?? '').trim().toLowerCase();

  const firstName = String(profile.firstName || (c as any).firstName || '').trim();
  const lastName = String(profile.lastName || (c as any).lastName || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || 'Chef';

  const status = String(profile.status ?? (c as any).status ?? '').trim();

  const createdIso = String(
    (detail as any)?.createdAt ||
      (detail as any)?.created_at ||
      (c as any).createdAt ||
      (c as any).created_at ||
      profile.createdAt ||
      profile.created_at ||
      ''
  );

  const updatedAt = profile.updatedAt ?? profile.updated_at ?? (detail as any)?.updatedAt ?? (detail as any)?.updated_at;

  return { profile, email, fullName, status, createdIso, updatedAt };
}
