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
    // arrays d'objets -> on essaye un join intelligent
    const asText = v
      .map((x) => {
        if (x === null || x === undefined) return '';
        if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') return String(x);
        if (isPlainObject(x)) {
          // si l’objet ressemble à {label/name/value}
          const maybe = x.label ?? x.name ?? x.title ?? x.value ?? x.id;
          return maybe ? String(maybe) : '';
        }
        return '';
      })
      .filter(Boolean);
    return asText.length ? asText.join(', ') : JSON.stringify(v);
  }
  if (isPlainObject(v)) {
    // objets "location" etc.
    const keys = Object.keys(v);
    if (keys.length === 0) return '—';
    // si {city,country}
    const city = (v as any).city;
    const country = (v as any).country;
    if (city || country) return [city, country].filter(Boolean).join(', ');
    return JSON.stringify(v);
  }
  return String(v);
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
    const availableNow = v.availableNow;
    const preferredPeriods = Array.isArray(v.preferredPeriods) ? v.preferredPeriods : [];
    const unavailableDates = Array.isArray(v.unavailableDates) ? v.unavailableDates : [];
    const nextAvailableFrom = v.nextAvailableFrom;

    const parts: string[] = [];

    if (availableNow === true) parts.push('✅ Disponible maintenant');
    if (availableNow === false) parts.push('⛔️ Pas disponible maintenant');

    if (preferredPeriods.length) {
      const mapPeriod = (p: string) =>
        p === 'season_summer' ? 'Été'
        : p === 'season_winter' ? 'Hiver'
        : p === 'season_spring' ? 'Printemps'
        : p === 'season_autumn' ? 'Automne'
        : p;
      parts.push(`Périodes : ${preferredPeriods.map(mapPeriod).join(', ')}`);
    }

    if (nextAvailableFrom) {
      parts.push(`Prochaine dispo : ${fmt(nextAvailableFrom) || String(nextAvailableFrom)}`);
    }

    if (unavailableDates.length) {
      const cleaned = unavailableDates
        .map((d: any) => fmt(d) || String(d))
        .slice(0, 6);
      const more = unavailableDates.length > 6 ? ` (+${unavailableDates.length - 6})` : '';
      parts.push(`Indisponible : ${cleaned.join(', ')}${more}`);
    }

    return parts.length ? parts.join(' • ') : '—';
  }

  return String(v);
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

      const filtered = (list ?? []).filter(
        (u) => (u.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()
      );

      setChefs(filtered);
      setSource('db');
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] API failed, fallback localStorage', e?.message || e);
    }

    // 2) fallback localStorage (ancien MVP)
    try {
      const list = await (auth.getAllChefs?.() ?? Promise.resolve([]));
      const filtered = (list ?? []).filter(
        (u: any) => (u.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()
      );

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
      setErr("Email manquant pour ce chef (impossible de mettre à jour).");
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
      // fallback legacy
      await auth.updateChefStatus(safeEmail as any, status as any);
      await refresh();
    }
  };

  const removeChef = async (email: string) => {
    if (!confirm('Supprimer ce compte chef ?')) return;
    setErr(null);

    const safeEmail = String(email || '').trim().toLowerCase();
    if (!safeEmail) {
      setErr("Email manquant pour ce chef (impossible de supprimer).");
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
    const getScore = (c: ApiChef) => computeChefScore(((c as any).profile ?? {}) as any).score ?? 0;

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
        const profile = (c as any).profile ?? {};
        const fullName = `${c.firstName || profile.firstName || ''} ${c.lastName || profile.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        return fullName.includes(needle) || email.includes(needle);
      })
      .sort((a, b) => {
        const pa = priority[String(a.status)] ?? 99;
        const pb = priority[String(b.status)] ?? 99;
        if (pa !== pb) return pa - pb;

        const sa = getScore(a);
        const sb = getScore(b);
        if (sa !== sb) return sb - sa;

        const profileA = (a as any).profile ?? {};
        const profileB = (b as any).profile ?? {};

        const da = new Date(String(a.createdAt || a.created_at || profileA.createdAt || profileA.created_at || '')).getTime() || 0;
        const db = new Date(String(b.createdAt || b.created_at || profileB.createdAt || profileB.created_at || '')).getTime() || 0;
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
            <span className="text-white/85 font-medium">
              {source === 'db' ? 'DB (API admin)' : 'localStorage (fallback)'}
            </span>
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
                  <td className="p-4 text-white/60" colSpan={5}>Chargement…</td>
                </tr>
              ) : view.length === 0 ? (
                <tr>
                  <td className="p-4 text-white/60" colSpan={5}>Aucun résultat.</td>
                </tr>
              ) : (
                view.map((c) => {
                  const profile = (c as any).profile ?? {};
                  const score = computeChefScore(profile as any).score ?? 0;

                  const fullName =
                    `${c.firstName || profile.firstName || ''} ${c.lastName || profile.lastName || ''}`.trim() || 'Chef';

                  const createdIso = String(
                    c.createdAt || c.created_at || profile.createdAt || profile.created_at || ''
                  );

                  const status = String(c.status || profile.status || '');

                  return (
                    <tr
                      key={String(c.email || fullName)}
                      className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                      onClick={() => openChef(c)}
                    >
                      <td className="p-3">
                        <div className="text-white font-medium truncate">{fullName}</div>
                        <div className="text-xs text-white/45 mt-0.5">Inscrit : {formatDate(createdIso) || '—'}</div>
                      </td>

                      <td className="p-3 text-white/85">{c.email || '—'}</td>

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
                                updateStatus(String(c.email || ''), 'approved');
                              }}
                              disabled={!c.email}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Approuver →
                            </button>
                          ) : null}

                          {status === 'approved' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(String(c.email || ''), 'active');
                              }}
                              disabled={!c.email}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Activer →
                            </button>
                          ) : null}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChef(String(c.email || ''));
                            }}
                            disabled={!c.email}
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
            await updateStatus(String(selected.email || ''), 'approved');
            await openChef(selected);
          }}
          onActivate={async () => {
            await updateStatus(String(selected.email || ''), 'active');
            await openChef(selected);
          }}
          onDelete={async () => {
            await removeChef(String(selected.email || ''));
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
  const profile = (detail?.profile ?? detail ?? selected.profile ?? selected ?? {}) as any;

  const email = String(selected.email || profile.email || '');
  const firstName = String(profile.firstName || selected.firstName || '');
  const lastName = String(profile.lastName || selected.lastName || '');
  const fullName = `${firstName} ${lastName}`.trim() || 'Chef';

  const createdIso = String(
    detail?.createdAt ||
      detail?.created_at ||
      selected.createdAt ||
      selected.created_at ||
      profile.createdAt ||
      profile.created_at ||
      ''
  );

  const status = String(detail?.status || profile.status || selected.status || '');

  const score = computeChefScore(profile as any).score ?? 0;

  // champs possibles (selon ton schéma)
const phone = profile.phone ?? profile.phoneNumber ?? profile.tel ?? profile.telephone;
const languages = profile.languages ?? profile.langues;

// Localisation (string ou objet) — UNE SEULE FOIS
const locationVal =
  profile.location ??
  (profile.city || profile.country ? { city: profile.city, country: profile.country } : null) ??
  profile.baseCity ??
  profile.city ??
  profile.ville ??
  profile.address ??
  null;
  const locationLabel =
  typeof locationVal === 'string'
    ? locationVal
    : locationVal && typeof locationVal === 'object'
    ? [
        (locationVal as any).baseCity,
        (locationVal as any).city,
        (locationVal as any).ville,
        (locationVal as any).country,
      ]
        .filter(Boolean)
        .join(', ')
    : null;
  const profileType = profile.profileType ?? profile.type;
  const seniority = profile.seniorityLevel ?? profile.seniority ?? profile.experienceLevel;

  const specialties = profile.specialties ?? profile.speciality;
  const cuisines = profile.cuisines ?? profile.cuisineTypes ?? profile.styles ?? profile.style;
  const services = profile.services ?? profile.serviceTypes;

  const bio = profile.bio ?? profile.about ?? profile.description;

  const dailyRate = profile.dailyRate ?? profile.rateDay ?? profile.pricePerDay;
  const pricePerPerson = profile.pricePerPerson ?? profile.pp ?? profile.ratePerPerson;
  const pricing = dailyRate ? `${dailyRate} €/jour` : pricePerPerson ? `${pricePerPerson} €/pers.` : null;

  const minGuests = profile.minGuests ?? profile.minimumGuests;
  const maxGuests = profile.maxGuests ?? profile.maxPax ?? profile.capacity;

  const availability = profile.availability ?? profile.availableFrom ?? profile.calendarNote ?? profile.preferredPeriods;
  const mobility = profile.mobility ?? profile.travel ?? profile.zones ?? profile.radius;

  const photosArr = profile.photos ?? profile.images ?? profile.gallery;
  const hasPhotos = Array.isArray(photosArr) ? photosArr.length > 0 : Boolean(photosArr);

  const updatedAt = profile.updatedAt ?? profile.updated_at ?? detail?.updatedAt ?? detail?.updated_at;

  // Checklist utile pour “approuver”
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
            <button
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
              onClick={onApprove}
            >
              Approuver →
            </button>
          ) : null}

          {status === 'approved' ? (
            <button
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
              onClick={onActivate}
            >
              Activer →
            </button>
          ) : null}

          <button
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-red-200 hover:bg-white/10"
            onClick={onDelete}
          >
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
              <InfoRow label="Services" value={services} />
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
              <InfoRow label="Mobilité" value={mobility} />
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
            <summary className="cursor-pointer select-none px-3 py-2 text-sm text-white/80">
              Voir JSON (debug)
            </summary>
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
