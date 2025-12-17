'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/services/storage';
import type { ChefUser } from '@/types';
import { PageTitle, GhostButton, Card, Segment, StatusBadge } from '@/app/admin/_components/ui';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type FilterKey = 'all' | 'pending' | 'approved' | 'active';

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const refresh = async () => {
    setLoading(true);
    const list = await (auth.getAllChefs?.() ?? Promise.resolve([]));
    const filtered = (list ?? []).filter(
      u => (u.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );
    setChefs(filtered);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id: string) => {
    await auth.updateChefStatus(id, 'approved' as any);
    await refresh();
  };

  const activate = async (id: string) => {
    await auth.updateChefStatus(id, 'active' as any);
    await refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce compte chef ?')) return;
    await auth.deleteChefAccount(id);
    await refresh();
  };

  const counts = useMemo(() => {
    const pending = chefs.filter(c => c.status === 'pending_validation').length;
    const approved = chefs.filter(c => c.status === 'approved').length;
    const active = chefs.filter(c => c.status === 'active').length;
    return { pending, approved, active, all: chefs.length };
  }, [chefs]);

  const view = useMemo(() => {
    const priority: Record<string, number> = {
      pending_validation: 0,
      approved: 1,
      active: 2,
    };

    const needle = q.trim().toLowerCase();

    return [...chefs]
      .filter(c => {
        if (filter === 'pending') return c.status === 'pending_validation';
        if (filter === 'approved') return c.status === 'approved';
        if (filter === 'active') return c.status === 'active';
        return true;
      })
      .filter(c => {
        if (!needle) return true;
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        return fullName.includes(needle) || email.includes(needle);
      })
      .sort((a, b) => {
        const pa = priority[String(a.status)] ?? 99;
        const pb = priority[String(b.status)] ?? 99;
        if (pa !== pb) return pa - pb;

        const sa = auth.computeChefScore(a).score;
        const sb = auth.computeChefScore(b).score;
        if (sa !== sb) return sb - sa;

        const da = new Date(a.createdAt || '').getTime() || 0;
        const db = new Date(b.createdAt || '').getTime() || 0;
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

      {/* KPI quick */}
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
        <Segment
          label="Actifs"
          active={filter === 'active'}
          onClick={() => setFilter('active')}
          badge={counts.active}
        />
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher (nom ou email)…"
            className="w-full lg:max-w-md px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          <div className="text-xs text-white/45">Source : localStorage (MVP)</div>
        </div>
      </Card>

      {/* Table */}
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
                view.map(c => {
                  const sc = auth.computeChefScore(c);
                  const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Chef';

                  return (
                    <tr key={c.id} className="border-t border-white/10 hover:bg-white/5 transition">
                      <td className="p-3">
                        <div className="text-white font-medium truncate">{fullName}</div>
                        <div className="text-xs text-white/45 mt-0.5">
                          Inscrit : {formatDate(c.createdAt) || '—'}
                        </div>
                      </td>

                      <td className="p-3 text-white/85">{c.email || '—'}</td>

                      <td className="p-3">
                        <ChefStatusBadge status={String(c.status)} />
                      </td>

                      <td className="p-3">
                        <ScorePill score={sc.score} />
                      </td>

                      <td className="p-3 text-right">
                        <div className="inline-flex flex-wrap gap-2 justify-end">
                          {c.status === 'pending_validation' ? (
                            <button
                              onClick={() => approve(c.id)}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
                            >
                              Approuver →
                            </button>
                          ) : null}

                          {c.status === 'approved' ? (
                            <button
                              onClick={() => activate(c.id)}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
                            >
                              Activer →
                            </button>
                          ) : null}

                          <button
                            onClick={() => remove(c.id)}
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

        <div className="p-3 border-t border-white/10 text-xs text-white/45">
          {view.length} résultat(s)
        </div>
      </Card>
    </div>
  );
}

/* ---------- UI local (spécifique chefs) ---------- */

function ChefStatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();

  // Couleurs : pending -> new, approved -> in_review, active -> assigned
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

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
