'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/services/storage';
import type { ChefUser } from '@/types';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type FilterKey = 'all' | 'pending' | 'approved' | 'active';

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const refresh = async () => {
    setLoading(true);
    const list = await auth.getAllChefs();
    const filtered = (list ?? []).filter(
      u => (u.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );
    setChefs(filtered);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
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
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Admin — Chefs</h1>
          <p className="text-sm text-stone-500">
            Pipeline de validation : À valider → Approuvé → Actif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded border text-sm bg-white hover:bg-stone-50"
          >
            Rafraîchir
          </button>
          <Link
            href="/admin"
            className="px-3 py-2 rounded border text-sm bg-white hover:bg-stone-50"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* KPI / Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <PipelineCard
          title="Tous"
          value={counts.all}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          tone="stone"
        />
        <PipelineCard
          title="À valider"
          value={counts.pending}
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          tone="yellow"
        />
        <PipelineCard
          title="Approuvés"
          value={counts.approved}
          active={filter === 'approved'}
          onClick={() => setFilter('approved')}
          tone="blue"
        />
        <PipelineCard
          title="Actifs"
          value={counts.active}
          active={filter === 'active'}
          onClick={() => setFilter('active')}
          tone="green"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher (nom ou email)…"
          className="w-full md:max-w-md px-3 py-2 rounded border text-sm bg-white"
        />

        <div className="text-xs text-stone-500">
          Tri : statut → score → date d’inscription
        </div>
      </div>

      {/* List */}
      <div className="bg-white border rounded overflow-hidden">
        <div className="px-4 py-3 border-b bg-stone-50 flex items-center justify-between">
          <div className="text-sm font-medium">Chefs</div>
          <div className="text-xs text-stone-500">{view.length} résultat(s)</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-stone-500">Chargement…</div>
        ) : view.length === 0 ? (
          <div className="p-4 text-sm text-stone-500">Aucun résultat.</div>
        ) : (
          <div className="divide-y">
            {view.map(c => {
              const sc = auth.computeChefScore(c);

              return (
                <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">
                        {c.firstName} {c.lastName}
                      </div>
                      <StatusBadge status={String(c.status)} />
                      <ScorePill score={sc.score} />
                    </div>

                    <div className="text-sm text-stone-500 truncate">{c.email}</div>

                    {sc.badges?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {sc.badges.map(b => (
                          <span
                            key={b}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-stone-100 text-stone-700"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {c.status === 'pending_validation' && (
                      <button
                        onClick={() => approve(c.id)}
                        className="px-3 py-2 rounded border text-sm bg-yellow-50 hover:bg-yellow-100"
                      >
                        Approuver →
                      </button>
                    )}

                    {c.status === 'approved' && (
                      <button
                        onClick={() => activate(c.id)}
                        className="px-3 py-2 rounded border text-sm bg-blue-50 hover:bg-blue-100"
                      >
                        Activer →
                      </button>
                    )}

                    <button
                      onClick={() => remove(c.id)}
                      className="px-3 py-2 rounded border text-sm text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function PipelineCard({
  title,
  value,
  active,
  onClick,
  tone,
}: {
  title: string;
  value: number;
  active: boolean;
  onClick: () => void;
  tone: 'stone' | 'yellow' | 'blue' | 'green';
}) {
  const toneCls =
    tone === 'yellow'
      ? 'border-yellow-200 bg-yellow-50'
      : tone === 'blue'
      ? 'border-blue-200 bg-blue-50'
      : tone === 'green'
      ? 'border-green-200 bg-green-50'
      : 'border-stone-200 bg-white';

  const activeCls = active ? 'ring-2 ring-stone-900 border-stone-900' : 'hover:bg-stone-50';

  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded border transition ${toneCls} ${activeCls}`}
    >
      <div className="text-sm text-stone-600">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="text-xs text-stone-500 mt-1">Ouvrir</div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status || 'unknown';

  const cls =
    s === 'pending_validation'
      ? 'bg-yellow-100 text-yellow-800'
      : s === 'approved'
      ? 'bg-blue-100 text-blue-800'
      : s === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-stone-100 text-stone-700';

  const label =
    s === 'pending_validation' ? 'À valider' : s === 'approved' ? 'Approuvé' : s === 'active' ? 'Actif' : s;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${cls}`}>
      {label}
    </span>
  );
}

function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 80 ? 'bg-green-100 text-green-800'
    : score >= 60 ? 'bg-blue-100 text-blue-800'
    : score >= 40 ? 'bg-yellow-100 text-yellow-800'
    : 'bg-stone-100 text-stone-700';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${cls}`}>
      Score {score}/100
    </span>
  );
}
