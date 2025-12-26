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
                  const score = computeChefScore((c as any).profile ?? {}).score ?? 0;
                  const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Chef';
                  const createdIso = (c.createdAt || c.created_at || '') as string;

                  return (
                    <tr
                      key={String(c.email || fullName)}
                      className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                      onClick={() => openChef(c)}
                    >
                      <td className="p-3">
                        <div className="text-white font-medium truncate">{fullName}</div>
                        <div className="text-xs text-white/45 mt-0.5">
                          Inscrit : {formatDate(createdIso) || '—'}
                        </div>
                      </td>

                      <td className="p-3 text-white/85">{c.email || '—'}</td>

                      <td className="p-3">
                        <ChefStatusBadge status={String(c.status || '')} />
                      </td>

                      <td className="p-3">
                        <ScorePill score={score} />
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex flex-wrap gap-2 justify-end">
                          {String(c.status) === 'pending_validation' ? (
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

                          {String(c.status) === 'approved' ? (
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

          {selected ? (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />

              <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-neutral-950 border-l border-white/10 p-5 overflow-auto">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white text-lg font-semibold">
                      {(detail?.profile?.firstName || selected.firstName || '').toString()}{' '}
                      {(detail?.profile?.lastName || selected.lastName || '').toString()}
                    </div>
                    <div className="text-white/60 text-sm">{selected.email}</div>
                    <div className="text-white/40 text-xs mt-1">
                      Inscrit :{' '}
                      {formatDate(
                        detail?.createdAt || detail?.created_at || selected.createdAt || selected.created_at
                      ) || '—'}
                    </div>
                  </div>

                  <button
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    onClick={closeDrawer}
                  >
                    Fermer
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <ScorePill score={computeChefScore((detail?.profile ?? selected.profile) ?? {}).score ?? 0} />
                  <div className="ml-2">
                    <ChefStatusBadge status={String(detail?.profile?.status || selected.status || '')} />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {String(detail?.profile?.status || selected.status) === 'pending_validation' ? (
                    <button
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
                      onClick={async () => {
                        await updateStatus(String(selected.email || ''), 'approved');
                        await openChef(selected);
                      }}
                    >
                      Approuver →
                    </button>
                  ) : null}

                  {String(detail?.profile?.status || selected.status) === 'approved' ? (
                    <button
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
                      onClick={async () => {
                        await updateStatus(String(selected.email || ''), 'active');
                        await openChef(selected);
                      }}
                    >
                      Activer →
                    </button>
                  ) : null}

                  <button
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-red-200 hover:bg-white/10"
                    onClick={async () => removeChef(String(selected.email || ''))}
                  >
                    Supprimer
                  </button>
                </div>

                <div className="mt-6">
                  <div className="text-white/80 font-medium mb-2">Profil complet</div>

                  {detailLoading ? (
                    <div className="text-white/60 text-sm">Chargement du détail…</div>
                  ) : (
                    <pre className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl p-3 overflow-auto">
{JSON.stringify(detail?.profile ?? selected.profile ?? {}, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-3 border-t border-white/10 text-xs text-white/45">{view.length} résultat(s)</div>
      </Card>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function ChefStatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const mapped =
    s === 'pending_validation'
      ? 'new'
      : s === 'approved'
      ? 'in_review'
      : s === 'active'
      ? 'assigned'
      : 'closed';
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
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
