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

    // API d’abord
    try {
      await fetchJson('/api/admin/chefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: safeEmail, status }),
      });
      await refresh();
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] update via API failed, fallback localStorage', e?.message || e);
    }

    // fallback legacy
    await auth.updateChefStatus(safeEmail as any, status as any);
    await refresh();
  };

  const removeChef = async (email: string) => {
    if (!confirm('Supprimer ce compte chef ?')) return;
    setErr(null);

    const safeEmail = String(email || '').trim().toLowerCase();
    if (!safeEmail) {
      setErr("Email manquant pour ce chef (impossible de supprimer).");
      return;
    }

    // API d’abord
    try {
      await fetchJson(`/api/admin/chefs?email=${encodeURIComponent(safeEmail)}`, {
        method: 'DELETE',
      });
      await refresh();
      closeDrawer();
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] delete via API failed, fallback localStorage', e?.message || e);
    }

    // fallback legacy
    await auth.deleteChefAccount(safeEmail as any);
    await refresh();
    closeDrawer();
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
const getScore = (c: ApiChef) => computeChefScore((c.profile ?? {}) as any).score ?? 0;
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
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
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

        const da = new Date(String(a.createdAt || a.created_at || '')).getTime() || 0;
        const db = new Date(String(b.createdAt || b.created_at || '')).getTime() || 0;
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
              <span className="ml-2 text-amber-200/80">
                ⚠️ (les nouveaux chefs DB peuvent ne pas apparaître)
              </span>
            ) : null}
          </div>
          {err ? <div className="text-xs text-red-200">{err}</div> : null}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Segment label="Tous" active={filter === 'all'} onClick={() => setFilter('all')} badge={counts.all} />
        <Segment
          label="À valider"
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          badge={counts.pending}
        />
        <Segment
          label="Approuvés"
          active={filter === 'approved'}
          onClick={() => setFilter('approved')}
          badge={counts.approved}
        />
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
            Note : ouvrir <code>/api/admin/chefs</code> dans le navigateur renverra souvent “Unauthorized” (pas de
            header).
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
                  const profile = (c as any).profile ?? {};
                  const score = computeChefScore(profile as any).score ?? 0;
                  const fullName =
                    `${c.firstName || profile.firstName || ''} ${c.lastName || profile.lastName || ''}`.trim() ||
                    'Chef';
                  const createdIso = String(c.createdAt || c.created_at || profile.createdAt || profile.created_at || '');
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

      {/* Drawer */}
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

/* ---------- Drawer component ---------- */

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
  const profile = (detail?.profile ?? selected.profile ?? {}) as any;

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
  const score = computeChefScore(profile).score ?? 0;

  // champs "humains" (adapte à ton schéma Supabase)
  const phone = profile.phone || profile.phoneNumber || '—';
  const languages = Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages || '—';
  const profileType = profile.profileType || profile.type || '—';
  const seniority = profile.seniorityLevel || profile.seniority || '—';
  const updatedAt = profile.updatedAt || detail?.updatedAt || '—';

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

               <div className="mt-6 space-y-5">
          {/* IDENTITÉ */}
          <Section title="Identité">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Nom" value={fullName} />
              <InfoRow label="Email" value={email || '—'} />
              <InfoRow label="Téléphone" value={String(phone || '—')} />
              <InfoRow label="Langues" value={String(languages || '—')} />
              <InfoRow label="Localisation" value={String(location || '—')} />
              <InfoRow label="Inscription" value={formatDate(createdIso) || '—'} />
            </div>
          </Section>

          {/* PROFIL */}
          <Section title="Profil">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Type de profil" value={humanizeProfileType(profileType)} />
              <InfoRow label="Niveau" value={humanizeSeniority(seniority)} />
              <InfoRow label="Spécialités" value={String(specialties || '—')} />
              <InfoRow label="Styles / Cuisines" value={String(cuisines || '—')} />
            </div>

            {bio ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/45">Bio</div>
                <div className="text-sm text-white/85 mt-1 whitespace-pre-wrap">{String(bio)}</div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-white/45">Bio : —</div>
            )}
          </Section>

          {/* PRIX & DISPO */}
          <Section title="Prix & disponibilité">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Tarif" value={String(pricing || 'Non renseigné')} />
              <InfoRow label="Minimum convives" value={String(minGuests || '—')} />
              <InfoRow label="Disponibilité" value={String(availability || '—')} />
              <InfoRow label="Mobilité" value={String(mobility || '—')} />
            </div>
          </Section>

          {/* CHECKLIST */}
          <Section title="Vérifications">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Bio" value={bio ? '✅ OK' : '❌ Manquante'} />
              <InfoRow label="Photos" value={hasPhotos ? '✅ OK' : '❌ Manquantes'} />
              <InfoRow label="Spécialités" value={specialties ? '✅ OK' : '❌ Manquantes'} />
              <InfoRow label="Tarif" value={pricing ? '✅ OK' : '❌ Non renseigné'} />
            </div>

            <div className="mt-3 text-xs text-white/45">
              Dernière mise à jour : {humanizeDateTime(updatedAt)}
            </div>
          </Section>
        </div>
          )}
        </div>

        <div className="mt-6">
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/45">{label}</div>
      <div className="text-sm text-white/85 mt-1 break-words">{value || '—'}</div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function ChefStatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const mapped = s === 'pending_validation' ? 'new' : s === 'approved' ? 'in_review' : s === 'active' ? 'assigned' : 'closed';
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

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-white/85 font-medium mb-3">{title}</div>
      {children}
    </div>
  );
}

function humanizeProfileType(v: string) {
  const s = String(v || '').toLowerCase();
  if (!s) return '—';
  if (s === 'private') return 'Chef privé';
  if (s === 'events' || s === 'event') return 'Événementiel';
  if (s === 'yacht') return 'Yacht';
  if (s === 'chalet') return 'Chalet';
  return v;
}

function humanizeSeniority(v: string) {
  const s = String(v || '').toLowerCase();
  if (!s) return '—';
  if (s === 'confirmed') return 'Confirmé';
  if (s === 'junior') return 'Junior';
  if (s === 'senior') return 'Senior';
  return v;
}

function humanizeDateTime(v: any) {
  if (!v) return '—';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function ChefReadableProfile({ profile }: { profile: any }) {
  const p = profile || {};

  // Helpers de lecture safe
  const get = (...keys: string[]) => keys.map(k => p?.[k]).find(v => v !== undefined && v !== null && v !== '');
  const asStr = (v: any) => (v === undefined || v === null ? '' : String(v));
  const asArr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
  const joinArr = (v: any) => asArr(v).map(String).filter(Boolean).join(', ') || '—';

  const fullName = [get('firstName', 'firstname', 'prenom', 'name'), get('lastName', 'lastname', 'nom')]
    .map(asStr)
    .join(' ')
    .trim();

  const email = asStr(get('email'));
  const phone = asStr(get('phone', 'telephone', 'tel'));
  const languages = joinArr(get('languages', 'langues'));
  const location = asStr(get('city', 'ville', 'location', 'baseCity', 'base'));
  const updatedAt = asStr(get('updatedAt', 'updated_at'));
    const city = profile.city || profile.location?.city || '';
  const country = profile.country || profile.location?.country || '';
  const location = [city, country].filter(Boolean).join(', ');

  const specialties = Array.isArray(profile.specialties)
    ? profile.specialties.join(', ')
    : profile.specialties || '';

  const cuisines = Array.isArray(profile.cuisines)
    ? profile.cuisines.join(', ')
    : profile.cuisines || profile.style || '';

  const bio = profile.bio || profile.about || profile.description || '';

  const dailyRate = profile.dailyRate || profile.rateDay || profile.pricePerDay;
  const pricePerPerson = profile.pricePerPerson || profile.pp || profile.ratePerPerson;
  const pricing =
    dailyRate ? `${dailyRate} €/jour` : pricePerPerson ? `${pricePerPerson} €/pers.` : '';

  const minGuests = profile.minGuests || profile.minimumGuests || '';

  const availability =
    profile.availability || profile.availableFrom || profile.calendarNote || '';

  const mobility =
    profile.mobility || profile.travel || profile.zones || profile.radius || '';

  const photosArr = profile.photos || profile.images || profile.gallery || [];
  const hasPhotos = Array.isArray(photosArr) ? photosArr.length > 0 : Boolean(photosArr);
  const createdAt = asStr(get('createdAt', 'created_at'));

  // Champs “métier” possibles (selon tes formulaires)
  const seniority = asStr(get('seniorityLevel', 'seniority', 'experienceLevel'));
  const specialties = joinArr(get('specialties', 'speciality', 'cuisines', 'cuisineTypes'));
  const services = joinArr(get('services', 'serviceTypes'));
  const maxGuests = asStr(get('maxGuests', 'maxPax', 'capacity'));
  const minRate = asStr(get('minRate', 'dayRate', 'dailyRate', 'pricePerDay'));
  const profileType = asStr(get('profileType', 'type'));

  return (
    <div className="space-y-3">
      <InfoGrid
        items={[
          { label: 'Nom', value: fullName || asStr(get('name')) || '—' },
          { label: 'Email', value: email || '—' },
          { label: 'Téléphone', value: phone || '—' },
          { label: 'Langues', value: languages },
          { label: 'Ville / Base', value: location || '—' },
          { label: 'Niveau', value: seniority || '—' },
          { label: 'Type de profil', value: profileType || '—' },
          { label: 'Spécialités', value: specialties },
          { label: 'Services', value: services },
          { label: 'Capacité', value: maxGuests ? `${maxGuests} pers.` : '—' },
          { label: 'Tarif min', value: minRate ? `${minRate}€` : '—' },
          { label: 'Inscription', value: formatDate(createdAt) || '—' },
          { label: 'Dernière maj', value: formatDate(updatedAt) || '—' },
        ]}
      />

      {/* Si tu as un champ bio/description */}
      {p?.bio || p?.about ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/50 mb-1">Présentation</div>
          <div className="text-sm text-white/80 whitespace-pre-wrap">
            {String(p.bio || p.about)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoGrid({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/45">{it.label}</div>
          <div className="text-sm text-white/85 mt-0.5 break-words">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
