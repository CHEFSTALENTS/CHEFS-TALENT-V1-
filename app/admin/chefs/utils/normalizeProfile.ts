// app/admin/chefs/utils/normalizeProfile.ts

import type { ChefUser } from '@/types';

/* -------------------- types -------------------- */

export type AdminChefLike = ChefUser & {
  user_id?: string;
  profile?: any;
  created_at?: string;
  createdAt?: string;
  status?: any;
  email?: string;
  firstName?: string;
  lastName?: string;
};

/* -------------------- utils safe display -------------------- */

function isPlainObject(v: any) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

export function firstNonEmpty<T>(...vals: T[]): T | undefined {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') {
      if (v.trim()) return v;
      continue;
    }
    if (Array.isArray(v)) {
      if (v.length) return v;
      continue;
    }
    return v;
  }
  return undefined;
}

export function unwrapText(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    const parts = v
      .map((x) => {
        if (x === null || x === undefined) return '';
        if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') return String(x);
        if (isPlainObject(x)) return String((x as any).label ?? (x as any).name ?? (x as any).title ?? (x as any).value ?? (x as any).text ?? (x as any).id ?? '');
        return '';
      })
      .filter(Boolean);
    return parts.join(', ');
  }
  if (isPlainObject(v)) {
    return String((v as any).value ?? (v as any).text ?? (v as any).label ?? (v as any).name ?? (v as any).title ?? '');
  }
  return String(v);
}

function isBrowserLocationObject(v: any) {
  return (
    isPlainObject(v) &&
    typeof (v as any).href === 'string' &&
    typeof (v as any).protocol === 'string' &&
    typeof (v as any).host === 'string'
  );
}

/* -------------------- normalizeProfile -------------------- */

export function normalizeProfile(raw: any) {
  const p = isPlainObject(raw) ? { ...raw } : {};

  const firstName = firstNonEmpty((p as any).firstName, (p as any).first_name);
  const lastName = firstNonEmpty((p as any).lastName, (p as any).last_name);
  const email = firstNonEmpty((p as any).email);

  const profileType = firstNonEmpty((p as any).profileType, (p as any).profile_type, (p as any).type);
  const seniorityLevel = firstNonEmpty(
    (p as any).seniorityLevel,
    (p as any).seniority_level,
    (p as any).seniority,
    (p as any).experienceLevel,
    (p as any).experience_level
  );

  const phone = firstNonEmpty((p as any).phone, (p as any).phoneNumber, (p as any).phone_number, (p as any).tel, (p as any).telephone);

  const languages = firstNonEmpty((p as any).languages, (p as any).langues);
  const specialties = firstNonEmpty((p as any).specialties, (p as any).speciality);
  const cuisines = firstNonEmpty((p as any).cuisines, (p as any).cuisineTypes, (p as any).cuisine_types, (p as any).styles, (p as any).style);

  const bioRaw = firstNonEmpty((p as any).bio, (p as any).about, (p as any).description, (p as any).biography, (p as any).bio_long, (p as any).bioLong);
  const bio = unwrapText(bioRaw);

  const servicesRaw = firstNonEmpty((p as any).services, (p as any).serviceTypes, (p as any).service_types);
  const services = Array.isArray(servicesRaw) ? servicesRaw : unwrapText(servicesRaw);

  const mobilityRaw = firstNonEmpty(
    (p as any).mobility,
    (p as any).travel,
    (p as any).zones,
    (p as any).coverageZones,
    (p as any).coverage_zones,
    (p as any).coverageZonesText,
    (p as any).coverage_zones_text,
    (p as any).radius
  );
  const mobility = Array.isArray(mobilityRaw) ? mobilityRaw : unwrapText(mobilityRaw);

  const images = firstNonEmpty((p as any).photos, (p as any).images, (p as any).gallery);

  const locationRaw = firstNonEmpty((p as any).location, (p as any).baseCity, (p as any).base_city, (p as any).city, (p as any).ville, (p as any).address);
  const location = isBrowserLocationObject(locationRaw)
    ? firstNonEmpty((p as any).baseCity, (p as any).base_city, (p as any).city, (p as any).ville, (p as any).address)
    : locationRaw;

  const created_at = firstNonEmpty((p as any).created_at, (p as any).createdAt);
  const updated_at = firstNonEmpty((p as any).updated_at, (p as any).updatedAt);

  return {
    ...p,
    firstName,
    lastName,
    email,
    phone,
    languages,
    specialties,
    cuisines,
    profileType,
    seniorityLevel,
    bio,
    services,
    mobility,
    images,
    location,
    created_at,
    updated_at,
  };
}

/* -------------------- getNormalizedChef -------------------- */

export function getNormalizedChef(c: AdminChefLike, detail: any | null = null) {
  const raw = (detail?.profile ?? detail ?? (c as any)?.profile ?? c ?? {}) as any;
  const profile = normalizeProfile(raw);

  const email = String(firstNonEmpty(detail?.email, (c as any).email, profile.email, '') || '').trim().toLowerCase();

  const firstName = String(firstNonEmpty(detail?.firstName, (c as any).firstName, profile.firstName, '') || '').trim();
  const lastName = String(firstNonEmpty(detail?.lastName, (c as any).lastName, profile.lastName, '') || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || 'Chef';

  const createdIso = String(
    firstNonEmpty(
      detail?.createdAt,
      detail?.created_at,
      (c as any).createdAt,
      (c as any).created_at,
      (profile as any).createdAt,
      (profile as any).created_at,
      ''
    ) || ''
  );

  const status = String(firstNonEmpty(detail?.status, (c as any).status, (profile as any).status, '') || '');

  return { profile, email, fullName, createdIso, status };
}
