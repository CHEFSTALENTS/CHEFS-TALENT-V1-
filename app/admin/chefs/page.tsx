'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/services/storage';
import type { ChefUser } from '@/types';
import { computeChefScore } from '@/lib/chefScore';
import { PageTitle, GhostButton, Card, Segment, StatusBadge } from '@/app/admin/_components/ui';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type FilterKey = 'all' | 'pending' | 'approved' | 'active';

type ApiChef = ChefUser & {
  user_id?: string;
  profile?: any;
  created_at?: string;
  createdAt?: string;
  status?: any;
  email?: string;
  firstName?: string;
  lastName?: string;
};

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'x-admin-email': ADMIN_EMAIL,
    },
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return (text ? JSON.parse(text) : null) as T;
}

/* -------------------- utils safe display -------------------- */

function isPlainObject(v: any) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function toDisplay(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string') return v.trim() ? v : '—';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? '—' : v.toLocaleString('fr-FR');
  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    const asText = v
      .map((x) => {
        if (x === null || x === undefined) return '';
        if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') return String(x);
        if (isPlainObject(x)) {
          const maybe = (x as any).label ?? (x as any).name ?? (x as any).title ?? (x as any).value ?? (x as any).id;
          return maybe ? String(maybe) : '';
        }
        return '';
      })
      .filter(Boolean);
    return asText.length ? asText.join(', ') : JSON.stringify(v);
  }
  if (isPlainObject(v)) {
    const keys = Object.keys(v);
    if (keys.length === 0) return '—';
    const city = (v as any).city ?? (v as any).baseCity ?? (v as any).ville;
    const country = (v as any).country;
    if (city || country) return [city, country].filter(Boolean).join(', ');
    return JSON.stringify(v);
  }
  return String(v);
}
function firstNonEmpty<T>(...vals: T[]): T | undefined {
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

function unwrapText(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    // array de strings ou d'objets -> join intelligent
    const parts = v
      .map((x) => {
        if (x === null || x === undefined) return '';
        if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') return String(x);
        if (isPlainObject(x)) return String(x.label ?? x.name ?? x.title ?? x.value ?? x.text ?? x.id ?? '');
        return '';
      })
      .filter(Boolean);
    return parts.join(', ');
  }
  if (isPlainObject(v)) {
    // cas typiques: {value:""}, {text:""}, {label:""}
    return String(v.value ?? v.text ?? v.label ?? v.name ?? v.title ?? '');
  }
  return String(v);
}

function isBrowserLocationObject(v: any) {
  // ton bug “Localisation = { href: ..., protocol: ..., host: ... }”
  return (
    isPlainObject(v) &&
    typeof v.href === 'string' &&
    typeof v.protocol === 'string' &&
    typeof v.host === 'string'
  );
}

function normalizeProfile(raw: any) {
  const p = isPlainObject(raw) ? { ...raw } : {};

  // Remap snake_case -> camelCase (sans casser ce que tu as déjà)
  const firstName = firstNonEmpty(p.firstName, p.first_name);
  const lastName = firstNonEmpty(p.lastName, p.last_name);
  const email = firstNonEmpty(p.email);

  const profileType = firstNonEmpty(p.profileType, p.profile_type, p.type);
  const seniorityLevel = firstNonEmpty(p.seniorityLevel, p.seniority_level, p.seniority, p.experienceLevel, p.experience_level);

  const phone = firstNonEmpty(p.phone, p.phoneNumber, p.phone_number, p.tel, p.telephone);

  const languages = firstNonEmpty(p.languages, p.langues);
  const specialties = firstNonEmpty(p.specialties, p.speciality);
  const cuisines = firstNonEmpty(p.cuisines, p.cuisineTypes, p.cuisine_types, p.styles, p.style);

  // BIO : peut être string ou objet {value/text/...}
  const bioRaw = firstNonEmpty(p.bio, p.about, p.description, p.biography, p.bio_long, p.bioLong);
  const bio = unwrapText(bioRaw);

  // SERVICES : peut être services ou service_types etc.
  const servicesRaw = firstNonEmpty(p.services, p.serviceTypes, p.service_types);
  const services = Array.isArray(servicesRaw) ? servicesRaw : unwrapText(servicesRaw);

  // MOBILITÉ : le portail peut stocker coverage_zones / zones / radius / travel...
  const mobilityRaw = firstNonEmpty(
    p.mobility,
    p.travel,
    p.zones,
    p.coverageZones,
    p.coverage_zones,
    p.coverageZonesText,
    p.coverage_zones_text,
    p.radius
  );
  const mobility = Array.isArray(mobilityRaw) ? mobilityRaw : unwrapText(mobilityRaw);

  // PHOTOS
  const images = firstNonEmpty(p.photos, p.images, p.gallery);

  // LOCATION: ignorer l’objet window.location si présent
  const locationRaw = firstNonEmpty(
    p.location,
    p.baseCity,
    p.base_city,
    p.city,
    p.ville,
    p.address
  );

  const location =
    isBrowserLocationObject(locationRaw)
      ? firstNonEmpty(p.baseCity, p.base_city, p.city, p.ville, p.address)
      : locationRaw;

  // Dates
  const created_at = firstNonEmpty(p.created_at, p.createdAt);
  const updated_at = firstNonEmpty(p.updated_at, p.updatedAt);

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
function formatDateTime(iso?: any) {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso?: any) {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatAvailability(v: any): string {
  const fmt = (iso: any) => {
    if (!iso) return '';
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  if (!v) return '—';
  if (typeof v === 'string') return v;

  if (typeof v === 'object' && !Array.isArray(v)) {
    const availableNow = (v as any).availableNow;
    const preferredPeriods = Array.isArray((v as any).preferredPeriods) ? (v as any).preferredPeriods : [];
    const unavailableDates = Array.isArray((v as any).unavailableDates) ? (v as any).unavailableDates : [];
    const nextAvailableFrom = (v as any).nextAvailableFrom;

    const parts: string[] = [];

    if (availableNow === true) parts.push('✅ Disponible maintenant');
    if (availableNow === false) parts.push('⛔️ Pas disponible maintenant');

    if (preferredPeriods.length) {
      const mapPeriod = (p: string) =>
        p === 'season_summer'
          ? 'Été'
          : p === 'season_winter'
          ? 'Hiver'
          : p === 'season_spring'
          ? 'Printemps'
          : p === 'season_autumn'
          ? 'Automne'
          : p;
      parts.push(`Périodes : ${preferredPeriods.map(mapPeriod).join(', ')}`);
    }

    if (nextAvailableFrom) {
      parts.push(`Prochaine dispo : ${fmt(nextAvailableFrom) || String(nextAvailableFrom)}`);
    }

    if (unavailableDates.length) {
      const cleaned = unavailableDates.map((d: any) => fmt(d) || String(d)).slice(0, 6);
      const more = unavailableDates.length > 6 ? ` (+${unavailableDates.length - 6})` : '';
      parts.push(`Indisponible : ${cleaned.join(', ')}${more}`);
    }

    return parts.length ? parts.join(' • ') : '—';
  }

  return String(v);
}

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

/* -------------------- page -------------------- */

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<ApiChef[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [source, setSource] = useState<'db' | 'localStorage'>('db');

  // Drawer / détail chef
  const [selected, setSelected] = useState<ApiChef | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const closeDrawer = () => {
    setSelected(null);
    setDetail(null);
    setDetailLoading(false);
  };

  const openChef = async (c: ApiChef) => {
    setSelected(c);
    setDetail(null);

    const email = String(c?.email || '').trim().toLowerCase();
    if (!email) return;

    setDetailLoading(true);
    try {
      const json = await fetchJson<{ chef: any }>(`/api/admin/chefs/${encodeURIComponent(email)}`);
      setDetail(json?.chef || null);
    } catch (e: any) {
      setErr(`Impossible de charger le détail : ${e?.message || String(e)}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    setErr(null);

    // 1) DB via API
    try {
      const json = await fetchJson<{ chefs: ApiChef[] }>('/api/admin/chefs');
      const list = Array.isArray(json?.chefs) ? json.chefs : [];

      const filtered = (list ?? []).filter((u) => (u.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase());

      setChefs(filtered);
      setSource('db');
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] API failed, fallback localStorage', e?.message || e);
    }

    // 2) fallback localStorage (ancien MVP)
    try {
      const list = await (auth.getAllChefs?.() ?? Promise.resolve([]));
      const filtered = (list ?? []).filter((u: any) => (u.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase());

      setChefs(filtered as any);
      setSource('localStorage');
      setErr('API admin KO (fallback localStorage).');
    } catch (e: any) {
      setChefs([]);
      setSource('localStorage');
      setErr(e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (email: string, status: 'approved' | 'active') => {
    setErr(null);
    const safeEmail = String(email || '').trim().toLowerCase();
    if (!safeEmail) {
      setErr('Email manquant pour ce chef (impossible de mettre à jour).');
      return;
    }

    try {
      await fetchJson('/api/admin/chefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: safeEmail, status }),
      });
      await refresh();
    } catch (e: any) {
      console.warn('[AdminChefs] update via API failed, fallback localStorage', e?.message || e);
      await auth.updateChefStatus(safeEmail as any, status as any);
      await refresh();
    }
  };

  const removeChef = async (email: string) => {
    if (!confirm('Supprimer ce compte chef ?')) return;
    setErr(null);

    const safeEmail = String(email || '').trim().toLowerCase();
    if (!safeEmail) {
      setErr('Email manquant pour ce chef (impossible de supprimer).');
      return;
    }

    try {
      await fetchJson(`/api/admin/chefs?email=${encodeURIComponent(safeEmail)}`, {
        method: 'DELETE',
      });
      await refresh();
      closeDrawer();
    } catch (e: any) {
      console.warn('[AdminChefs] delete via API failed, fallback localStorage', e?.message || e);
      await auth.deleteChefAccount(safeEmail as any);
      await refresh();
      closeDrawer();
    }
  };

  const counts = useMemo(() => {
    const pending = chefs.filter((c) => String(c.status) === 'pending_validation').length;
    const approved = chefs.filter((c) => String(c.status) === 'approved').length;
    const active = chefs.filter((c) => String(c.status) === 'active').length;
    return { pending, approved, active, all: chefs.length };
  }, [chefs]);

  const view = useMemo(() => {
    const priority: Record<string, number> = {
      pending_validation: 0,
      approved: 1,
      active: 2,
    };

    const needle = q.trim().toLowerCase();

   const getScore = (c: ApiChef) => {
  const profile = normalizeProfile((c as any).profile ?? c);
  return computeChefScore(profile as any).score ?? 0;
};

    return [...chefs]
      .filter((c) => {
        const st = String(c.status || '');
        if (filter === 'pending') return st === 'pending_validation';
        if (filter === 'approved') return st === 'approved';
        if (filter === 'active') return st === 'active';
        return true;
      })
      .filter((c) => {
        if (!needle) return true;
        const { profile } = getNormalizedChef(c, null);
        const fn = String((c as any).firstName || profile.firstName || '').trim();
        const ln = String((c as any).lastName || profile.lastName || '').trim();
        const fullName = `${fn} ${ln}`.toLowerCase();
        const email = String((c as any).email || profile.email || '').toLowerCase();
        return fullName.includes(needle) || email.includes(needle);
      })
      .sort((a, b) => {
        const pa = priority[String(a.status)] ?? 99;
        const pb = priority[String(b.status)] ?? 99;
        if (pa !== pb) return pa - pb;

        const sa = getScore(a);
        const sb = getScore(b);
        if (sa !== sb) return sb - sa;

        const { createdIso: ca } = getNormalizedChef(a, null);
        const { createdIso: cb } = getNormalizedChef(b, null);

        const da = new Date(String(ca || '')).getTime() || 0;
        const db = new Date(String(cb || '')).getTime() || 0;
        return db - da;
      });
  }, [chefs, q, filter]);

  return (
    <div className="space-y-4">
      <PageTitle
        title="Chefs"
        subtitle="Pipeline : À valider → Approuvé → Actif (tri : statut → score → date)"
        right={
          <>
            <GhostButton onClick={refresh}>Rafraîchir</GhostButton>
            <GhostButton href="/admin">Dashboard</GhostButton>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="text-xs text-white/60">
            Source :{' '}
            <span className="text-white/85 font-medium">{source === 'db' ? 'DB (API admin)' : 'localStorage (fallback)'}</span>
            {source === 'localStorage' ? (
              <span className="ml-2 text-amber-200/80">⚠️ (les nouveaux chefs DB peuvent ne pas apparaître)</span>
            ) : null}
          </div>
          {err ? <div className="text-xs text-red-200">{err}</div> : null}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Segment label="Tous" active={filter === 'all'} onClick={() => setFilter('all')} badge={counts.all} />
        <Segment label="À valider" active={filter === 'pending'} onClick={() => setFilter('pending')} badge={counts.pending} />
        <Segment label="Approuvés" active={filter === 'approved'} onClick={() => setFilter('approved')} badge={counts.approved} />
        <Segment label="Actifs" active={filter === 'active'} onClick={() => setFilter('active')} badge={counts.active} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom ou email)…"
            className="w-full lg:max-w-md px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          <div className="text-xs text-white/45">
            Note : ouvrir <code>/api/admin/chefs</code> dans le navigateur renverra souvent “Unauthorized” (pas de header).
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-white/70">
                <th className="text-left p-3 font-medium">Chef</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-left p-3 font-medium">Score</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && view.length === 0 ? (
                <tr>
                  <td className="p-4 text-white/60" colSpan={5}>
                    Chargement…
                  </td>
                </tr>
              ) : view.length === 0 ? (
                <tr>
                  <td className="p-4 text-white/60" colSpan={5}>
                    Aucun résultat.
                  </td>
                </tr>
              ) : (
                view.map((c) => {
                  const profile = normalizeProfile((c as any).profile ?? c);
const score = computeChefScore(profile as any).score ?? 0;

                  return (
                    <tr
                      key={String(email || fullName)}
                      className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                      onClick={() => openChef(c)}
                    >
                      <td className="p-3">
                        <div className="text-white font-medium truncate">{fullName}</div>
                        <div className="text-xs text-white/45 mt-0.5">Inscrit : {formatDate(createdIso) || '—'}</div>
                      </td>

                      <td className="p-3 text-white/85">{email || '—'}</td>

                      <td className="p-3">
                        <ChefStatusBadge status={status} />
                      </td>

                      <td className="p-3">
                        <ScorePill score={score} />
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex flex-wrap gap-2 justify-end">
                          {status === 'pending_validation' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(String(email || ''), 'approved');
                              }}
                              disabled={!email}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Approuver →
                            </button>
                          ) : null}

                          {status === 'approved' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(String(email || ''), 'active');
                              }}
                              disabled={!email}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Activer →
                            </button>
                          ) : null}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChef(String(email || ''));
                            }}
                            disabled={!email}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-red-200 hover:bg-white/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-white/10 text-xs text-white/45">{view.length} résultat(s)</div>
      </Card>

      {selected ? (
        <ChefDrawer
          selected={selected}
          detail={detail}
          loading={detailLoading}
          onClose={closeDrawer}
          onApprove={async () => {
            const email = String(selected.email || '').trim().toLowerCase();
            await updateStatus(email, 'approved');
            await openChef(selected);
          }}
          onActivate={async () => {
            const email = String(selected.email || '').trim().toLowerCase();
            await updateStatus(email, 'active');
            await openChef(selected);
          }}
          onDelete={async () => {
            const email = String(selected.email || '').trim().toLowerCase();
            await removeChef(email);
          }}
        />
      ) : null}
    </div>
  );
}

/* -------------------- Drawer -------------------- */

function ChefDrawer({
  selected,
  detail,
  loading,
  onClose,
  onApprove,
  onActivate,
  onDelete,
}: {
  selected: ApiChef;
  detail: any | null;
  loading: boolean;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onActivate: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
const raw = (detail?.profile ?? detail ?? selected.profile ?? selected ?? {}) as any;
const profile = normalizeProfile(raw);

const email = String(firstNonEmpty(selected.email, profile.email, '') || '');
const firstName = String(firstNonEmpty(profile.firstName, selected.firstName, '') || '');
const lastName = String(firstNonEmpty(profile.lastName, selected.lastName, '') || '');
const fullName = `${firstName} ${lastName}`.trim() || 'Chef';

const createdIso = String(
  firstNonEmpty(
    detail?.createdAt,
    detail?.created_at,
    selected.createdAt,
    selected.created_at,
    profile.createdAt,
    profile.created_at,
    profile.created_at,
    ''
  ) || ''
);

const status = String(firstNonEmpty(detail?.status, profile.status, selected.status, '') || '');
const score = computeChefScore(profile as any).score ?? 0;

// champs normalisés
const phone = profile.phone;
const languages = profile.languages;

// Localisation propre (et sans l’objet window.location)
const locationVal = profile.location;
const locationLabel =
  typeof locationVal === 'string'
    ? locationVal
    : locationVal && typeof locationVal === 'object'
    ? [(locationVal as any).baseCity, (locationVal as any).city, (locationVal as any).ville, (locationVal as any).country]
        .filter(Boolean)
        .join(', ')
    : null;

const profileType = profile.profileType;
const seniority = profile.seniorityLevel;

const specialties = profile.specialties;
const cuisines = profile.cuisines;

// 🔥 ici on fixe ton “services/bio/mobility n’apparaissent pas”
const services = profile.services; // déjà normalisé (string ou array)
const bio = profile.bio;           // déjà normalisé en string
const mobility = profile.mobility; // déjà normalisé (string ou array)

const dailyRate = profile.dailyRate ?? profile.rateDay ?? profile.pricePerDay;
const pricePerPerson = profile.pricePerPerson ?? profile.pp ?? profile.ratePerPerson;
const pricing = dailyRate ? `${dailyRate} €/jour` : pricePerPerson ? `${pricePerPerson} €/pers.` : null;

const minGuests = profile.minGuests ?? profile.minimumGuests;
const maxGuests = profile.maxGuests ?? profile.maxPax ?? profile.capacity;

const availability =
  profile.availability ?? profile.availableFrom ?? profile.calendarNote ?? profile.preferredPeriods;

const photosArr = profile.photos ?? profile.images ?? profile.gallery;
const hasPhotos = Array.isArray(photosArr) ? photosArr.length > 0 : Boolean(photosArr);

const updatedAt = profile.updatedAt ?? profile.updated_at ?? detail?.updatedAt ?? detail?.updated_at;

// ✅ Checklist : bio est maintenant une string, donc le test devient fiable
const checklist = {
  identité: Boolean(fullName && email),
  téléphone: Boolean(phone),
  bio: Boolean(bio && String(bio).trim().length > 30),
  langues: Boolean(Array.isArray(languages) ? languages.length : languages),
  spécialités: Boolean(Array.isArray(specialties) ? specialties.length : specialties),
  tarifs: Boolean(dailyRate || pricePerPerson),
  photos: Boolean(hasPhotos),
};

const checklistOk = Object.values(checklist).filter(Boolean).length;
  
  const score = computeChefScore(profile as any).score ?? 0;

  const phone = profile.phone;
  const languages = profile.languages;

  const locationVal = profile.location ?? profile.baseCity ?? null;
  const locationLabel =
    typeof locationVal === 'string'
      ? locationVal
      : locationVal && typeof locationVal === 'object'
      ? [locationVal.baseCity, locationVal.city, locationVal.ville, locationVal.country].filter(Boolean).join(', ')
      : null;

  const profileType = profile.profileType;
  const seniority = profile.seniorityLevel;

  const specialties = profile.specialties;
  const cuisines = profile.cuisines;

  const services = profile.services;
  const servicesDisplay = Array.isArray(services) ? services.join(', ') : services;

  const bio = profile.bio;
  const bioText = String(bio ?? '').trim();

  const dailyRate = profile.dailyRate;
  const pricePerPerson = profile.pricePerPerson;
  const pricing = dailyRate ? `${dailyRate} €/jour` : pricePerPerson ? `${pricePerPerson} €/pers.` : null;

  const minGuests = profile.minGuests;
  const maxGuests = profile.maxGuests;

  const availability = profile.availability;
  const mobility = profile.mobility;
  const mobilityDisplay = Array.isArray(mobility) ? mobility.join(', ') : mobility;

  const photosArr = profile.images ?? [];
  const hasPhotos = Array.isArray(photosArr) ? photosArr.length > 0 : Boolean(photosArr);

  // Checklist utile pour “approuver”
  const checklist = {
    identité: Boolean(fullName && email),
    téléphone: Boolean(phone),
    bio: bioText.length > 30,
    langues: Boolean(Array.isArray(languages) ? languages.length : languages),
    spécialités: Boolean(Array.isArray(specialties) ? specialties.length : specialties),
    tarifs: Boolean(dailyRate || pricePerPerson),
    photos: Boolean(hasPhotos),
  };

  const checklistOk = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-neutral-950 border-l border-white/10 p-5 overflow-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white text-lg font-semibold">{fullName}</div>
            <div className="text-white/60 text-sm">{email || '—'}</div>
            <div className="text-white/40 text-xs mt-1">Inscrit : {formatDate(createdIso) || '—'}</div>
          </div>

          <button
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <ScorePill score={score} />
          <div className="ml-2">
            <ChefStatusBadge status={status} />
          </div>
          <div className="ml-auto text-xs text-white/50">
            Dossier : <span className="text-white/70 font-medium">{checklistOk}/7</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {status === 'pending_validation' ? (
            <button className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15" onClick={onApprove}>
              Approuver →
            </button>
          ) : null}

          {status === 'approved' ? (
            <button className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15" onClick={onActivate}>
              Activer →
            </button>
          ) : null}

          <button className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-red-200 hover:bg-white/10" onClick={onDelete}>
            Supprimer
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Section title="Identité">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Nom" value={fullName} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Téléphone" value={phone} />
              <InfoRow label="Langues" value={languages} />
              <InfoRow label="Localisation" value={locationLabel || toDisplay(locationVal) || '—'} />
              <InfoRow label="Inscription" value={formatDate(createdIso) || '—'} />
            </div>
          </Section>

          <Section title="Profil">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Type de profil" value={humanizeProfileType(profileType)} />
              <InfoRow label="Niveau" value={humanizeSeniority(seniority)} />
              <InfoRow label="Spécialités" value={specialties} />
              <InfoRow label="Cuisines / styles" value={cuisines} />
              <InfoRow label="Services" value={servicesDisplay} />
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/45">Bio</div>
              <div className="text-sm text-white/85 mt-1 whitespace-pre-wrap">{toDisplay(bio)}</div>
            </div>
          </Section>

          <Section title="Prix & disponibilité">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Tarif" value={pricing} />
              <InfoRow label="Min convives" value={minGuests} />
              <InfoRow label="Max convives" value={maxGuests} />
              <InfoRow label="Disponibilité" value={formatAvailability(availability)} />
              <InfoRow label="Mobilité" value={mobilityDisplay} />
              <InfoRow label="Photos" value={hasPhotos ? '✅ Oui' : '❌ Non'} />
            </div>
          </Section>

          <Section title="Vérifications (avant approbation)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Identité" value={checklist.identité ? '✅ OK' : '❌ Incomplète'} />
              <InfoRow label="Téléphone" value={checklist.téléphone ? '✅ OK' : '❌ Manquant'} />
              <InfoRow label="Bio" value={checklist.bio ? '✅ OK' : '❌ Trop courte / absente'} />
              <InfoRow label="Langues" value={checklist.langues ? '✅ OK' : '❌ Manquantes'} />
              <InfoRow label="Spécialités" value={checklist.spécialités ? '✅ OK' : '❌ Manquantes'} />
              <InfoRow label="Tarifs" value={checklist.tarifs ? '✅ OK' : '❌ Non renseignés'} />
              <InfoRow label="Photos" value={checklist.photos ? '✅ OK' : '❌ Manquantes'} />
            </div>

            <div className="mt-3 text-xs text-white/45">
              Dernière mise à jour : {updatedAt ? formatDateTime(updatedAt) : '—'}
              {loading ? <span className="ml-2 text-white/40">(chargement…)</span> : null}
            </div>
          </Section>

          <details className="rounded-xl border border-white/10 bg-white/5">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm text-white/80">Voir JSON (debug)</summary>
            <pre className="text-xs text-white/70 p-3 overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}

/* -------------------- small UI -------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-white/85 font-medium mb-3">{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/45">{label}</div>
      <div className="text-sm text-white/85 mt-1 break-words">{toDisplay(value)}</div>
    </div>
  );
}

function ChefStatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const mapped =
    s === 'pending_validation' ? 'new' : s === 'approved' ? 'in_review' : s === 'active' ? 'assigned' : 'closed';
  return <StatusBadge status={mapped} />;
}

function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 80
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : score >= 60
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : score >= 40
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : 'bg-white/10 text-white/60 border-white/10';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>
      Score {Number(score || 0)}/100
    </span>
  );
}

function humanizeProfileType(v: any) {
  const s = String(v || '').toLowerCase();
  if (!s) return '—';
  if (s === 'private') return 'Chef privé';
  if (s === 'events' || s === 'event') return 'Événementiel';
  if (s === 'yacht') return 'Yacht';
  if (s === 'chalet') return 'Chalet';
  return toDisplay(v);
}

function humanizeSeniority(v: any) {
  const s = String(v || '').toLowerCase();
  if (!s) return '—';
  if (s === 'confirmed') return 'Confirmé';
  if (s === 'junior') return 'Junior';
  if (s === 'senior') return 'Senior';
  return toDisplay(v);
}
