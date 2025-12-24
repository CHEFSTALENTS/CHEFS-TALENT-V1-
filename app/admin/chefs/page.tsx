'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/services/storage';
import { computeChefScore } from '@/lib/chefScore';
import type { ChefProfile } from '@/types';
import { PageTitle, GhostButton, Card, Segment, StatusBadge } from '@/app/admin/_components/ui';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type FilterKey = 'all' | 'pending' | 'approved' | 'active';

/**
 * IMPORTANT:
 * Ta table `profiles` (Supabase) semble stocker les chefs comme une ligne "profil"
 * avec `email` en PK + champs en snake_case.
 * Donc on définit un type API flexible et on mappe vers ChefProfile pour le score.
 */
type ApiChefRow = {
  // identifiers
  id?: string; // si tu as aussi un id
  email: string;

  // basic identity
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;

  // profile classification
  profile_type?: string | null;
  seniority_level?: string | null;

  // experience
  years_experience?: number | null;
  bio?: string | null;

  // arrays
  languages?: string[] | null;
  images?: string[] | null;

  // mobility
  base_city?: string | null;
  coverage_zones?: string[] | null;
  international_mobility?: boolean | null;

  // status
  status?: 'pending_validation' | 'approved' | 'active' | 'paused' | string | null;

  // timestamps
  created_at?: string | null;
  updated_at?: string | null;

  // si tu as d’autres champs
  [k: string]: any;
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function rowToChefProfile(row: ApiChefRow): Partial<ChefProfile> {
  return {
    phone: row.phone ?? undefined,
    languages: (row.languages ?? []) as any,
    bio: row.bio ?? undefined,

    profileType: (row.profile_type ?? undefined) as any,
    seniorityLevel: (row.seniority_level ?? undefined) as any,

    yearsExperience: (row.years_experience ?? undefined) as any,
    images: (row.images ?? []) as any,

    baseCity: row.base_city ?? undefined,
    coverageZones: (row.coverage_zones ?? []) as any,
    internationalMobility: row.international_mobility ?? undefined,
  };
}

function fullName(row: ApiChefRow) {
  const fn = (row.first_name || '').trim();
  const ln = (row.last_name || '').trim();
  const n = `${fn} ${ln}`.trim();
  return n || 'Chef';
}

function normalizeStatus(s?: string | null) {
  const v = String(s || '').toLowerCase();
  if (v === 'pending' || v === 'pending_validation') return 'pending_validation';
  if (v === 'approved') return 'approved';
  if (v === 'active') return 'active';
  if (v === 'paused') return 'paused';
  return v || 'pending_validation';
}

export default function AdminChefsPage() {
  const [rows, setRows] = useState<ApiChefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [source, setSource] = useState<'db' | 'localStorage'>('db');

  const refresh = async () => {
    setLoading(true);
    setErr(null);

    // 1) Try DB via API
    try {
      const json = await fetchJson<any>('/api/admin/chefs', { method: 'GET' });

      // L’API peut renvoyer:
      // - directement un tableau:  [{...}]
      // - ou un objet: { chefs: [...] }
      const list: ApiChefRow[] = Array.isArray(json) ? json : Array.isArray(json?.chefs) ? json.chefs : [];

      const filtered = list.filter(r => (r.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase());
      setRows(filtered);
      setSource('db');
      setLoading(false);
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] DB API failed, fallback to localStorage auth.getAllChefs()', e?.message || e);
    }

    // 2) Fallback localStorage (ancien MVP)
    try {
      const list = await (auth.getAllChefs?.() ?? Promise.resolve([]));

      // Ici list est au format ChefUser -> on convertit en ApiChefRow minimal pour l’affichage
      const mapped: ApiChefRow[] = (list ?? []).map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName,
        status: u.status,
        created_at: u.createdAt,
        // profile
        phone: u.profile?.phone,
        bio: u.profile?.bio,
        years_experience: u.profile?.yearsExperience,
        languages: u.profile?.languages,
        images: u.profile?.images,
        base_city: u.profile?.baseCity,
        coverage_zones: u.profile?.coverageZones,
        international_mobility: u.profile?.internationalMobility,
        profile_type: u.profile?.profileType,
        seniority_level: u.profile?.seniorityLevel,
      }));

      const filtered = mapped.filter(r => (r.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase());
      setRows(filtered);
      setSource('localStorage');
    } catch (e: any) {
      setErr(e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // UX guard only (la vraie sécurité doit être server-side / middleware)
    const u = auth.getCurrentUser?.();
    if (u?.email && u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setErr("Accès admin réservé. (À sécuriser aussi via middleware côté serveur.)");
      setLoading(false);
      return;
    }

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (row: ApiChefRow) => {
    setErr(null);

    // API d’abord
    try {
      await fetchJson('/api/admin/chefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: row.email, status: 'approved' }),
      });
      await refresh();
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] approve via API failed, fallback local', e?.message || e);
    }

    // fallback ancien
    if (row.id && auth.updateChefStatus) {
      await auth.updateChefStatus(row.id, 'approved' as any);
      await refresh();
    }
  };

  const activate = async (row: ApiChefRow) => {
    setErr(null);

    try {
      await fetchJson('/api/admin/chefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: row.email, status: 'active' }),
      });
      await refresh();
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] activate via API failed, fallback local', e?.message || e);
    }

    if (row.id && auth.updateChefStatus) {
      await auth.updateChefStatus(row.id, 'active' as any);
      await refresh();
    }
  };

  const remove = async (row: ApiChefRow) => {
    if (!confirm('Supprimer ce compte chef ?')) return;
    setErr(null);

    try {
      await fetchJson(`/api/admin/chefs?email=${encodeURIComponent(row.email)}`, { method: 'DELETE' });
      await refresh();
      return;
    } catch (e: any) {
      console.warn('[AdminChefs] delete via API failed, fallback local', e?.message || e);
    }

    if (row.id && auth.deleteChefAccount) {
      await auth.deleteChefAccount(row.id);
      await refresh();
    }
  };

  const counts = useMemo(() => {
    const pending = rows.filter(r => normalizeStatus(r.status) === 'pending_validation').length;
    const approved = rows.filter(r => normalizeStatus(r.status) === 'approved').length;
    const active = rows.filter(r => normalizeStatus(r.status) === 'active').length;
    return { pending, approved, active, all: rows.length };
  }, [rows]);

  const view = useMemo(() => {
    const priority: Record<string, number> = {
      pending_validation: 0,
      approved: 1,
      active: 2,
      paused: 3,
    };

    const needle = q.trim().toLowerCase();

    const getScore = (r: ApiChefRow) => {
      const prof = rowToChefProfile(r);
      return computeChefScore(prof as any).score ?? 0;
    };

    return [...rows]
      .filter(r => {
        const s = normalizeStatus(r.status);
        if (filter === 'pending') return s === 'pending_validation';
        if (filter === 'approved') return s === 'approved';
        if (filter === 'active') return s === 'active';
        return true;
      })
      .filter(r => {
        if (!needle) return true;
        const name = fullName(r).toLowerCase();
        const email = (r.email || '').toLowerCase();
        return name.includes(needle) || email.includes(needle);
      })
      .sort((a, b) => {
        const sa = normalizeStatus(a.status);
        const sb = normalizeStatus(b.status);

        const pa = priority[sa] ?? 99;
        const pb = priority[sb] ?? 99;
        if (pa !== pb) return pa - pb;

        const scA = getScore(a);
        const scB = getScore(b);
        if (scA !== scB) return scB - scA;

        const da = new Date(a.created_at || '').getTime() || 0;
        const db = new Date(b.created_at || '').getTime() || 0;
        return db - da;
      });
  }, [rows, q, filter]);

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
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher (nom ou email)…"
            className="w-full lg:max-w-md px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          <div className="text-xs text-white/45">
            Astuce : si tu ne vois pas un chef, check d’abord la source (DB vs localStorage).
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
              {loading ? (
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
                view.map(r => {
                  const prof = rowToChefProfile(r);
                  const score = computeChefScore(prof as any).score ?? 0;
                  const name = fullName(r);
                  const status = normalizeStatus(r.status);

                  return (
                    <tr key={r.id || r.email} className="border-t border-white/10 hover:bg-white/5 transition">
                      <td className="p-3">
                        <div className="text-white font-medium truncate">{name}</div>
                        <div className="text-xs text-white/45 mt-0.5">Inscrit : {formatDate(r.created_at) || '—'}</div>
                      </td>

                      <td className="p-3 text-white/85">{r.email || '—'}</td>

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
                              onClick={() => approve(r)}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
                            >
                              Approuver →
                            </button>
                          ) : null}

                          {status === 'approved' ? (
                            <button
                              onClick={() => activate(r)}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
                            >
                              Activer →
                            </button>
                          ) : null}

                          <button
                            onClick={() => remove(r)}
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-red-200 hover:bg-white/10 transition"
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
    </div>
  );
}

/* ---------- UI local (spécifique chefs) ---------- */

function ChefStatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();

  // Couleurs UI admin (StatusBadge attend des statuts "request-like")
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

function formatDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
