'use client';

import { useEffect, useMemo, useState } from 'react';
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
    setChefs(
      list.filter(c => (c.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase())
    );
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const approve = async (id: string) => {
    await auth.updateChefStatus(id, 'approved' as any);
    refresh();
  };

  const activate = async (id: string) => {
    await auth.updateChefStatus(id, 'active' as any);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer définitivement ce chef ?')) return;
    await auth.deleteChefAccount(id);
    refresh();
  };

  const counts = useMemo(() => {
    return {
      all: chefs.length,
      pending: chefs.filter(c => c.status === 'pending_validation').length,
      approved: chefs.filter(c => c.status === 'approved').length,
      active: chefs.filter(c => c.status === 'active').length,
    };
  }, [chefs]);

  const view = useMemo(() => {
    const needle = q.toLowerCase().trim();

    return chefs
      .filter(c => {
        if (filter === 'pending') return c.status === 'pending_validation';
        if (filter === 'approved') return c.status === 'approved';
        if (filter === 'active') return c.status === 'active';
        return true;
      })
      .filter(c => {
        if (!needle) return true;
        return (
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(needle) ||
          (c.email || '').toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const sa = auth.computeChefScore(a).score;
        const sb = auth.computeChefScore(b).score;
        return sb - sa;
      });
  }, [chefs, q, filter]);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chefs</h1>
          <p className="text-sm text-stone-500">
            Validation & activation des profils chefs
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-2 rounded border text-sm hover:bg-stone-50"
        >
          Rafraîchir
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2">
        <Filter label={`Tous (${counts.all})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        <Filter label={`À valider (${counts.pending})`} active={filter === 'pending'} onClick={() => setFilter('pending')} />
        <Filter label={`Approuvés (${counts.approved})`} active={filter === 'approved'} onClick={() => setFilter('approved')} />
        <Filter label={`Actifs (${counts.active})`} active={filter === 'active'} onClick={() => setFilter('active')} />
      </div>

      {/* SEARCH */}
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher un chef (nom ou email)…"
        className="w-full max-w-md px-3 py-2 rounded border text-sm"
      />

      {loading ? (
        <div className="text-sm text-stone-500">Chargement…</div>
      ) : view.length === 0 ? (
        <div className="text-sm text-stone-500">Aucun chef trouvé.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {view.map(c => {
            const sc = auth.computeChefScore(c);

            return (
              <div
                key={c.id}
                className="border rounded-xl bg-white p-4 hover:shadow-sm transition"
              >
                {/* TOP */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-xs text-stone-500">{c.email}</div>
                  </div>
                  <StatusBadge status={String(c.status)} />
                </div>

                {/* SCORE */}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-stone-500">Matching score</div>
                    <div className="text-3xl font-semibold">
                      {sc.score}
                      <span className="text-sm text-stone-400"> /100</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sc.badges.map(b => (
                      <span
                        key={b}
                        className="text-[11px] px-2 py-1 rounded-full bg-stone-100 text-stone-700"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.status === 'pending_validation' && (
                    <Action onClick={() => approve(c.id)}>Approuver</Action>
                  )}
                  {c.status === 'approved' && (
                    <Action onClick={() => activate(c.id)}>Activer</Action>
                  )}
                  <Action danger onClick={() => remove(c.id)}>
                    Supprimer
                  </Action>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================= UI ================= */

function Filter({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-2 rounded border text-sm',
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'bg-white hover:bg-stone-50',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function Action({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-2 rounded text-sm border',
        danger
          ? 'text-red-600 border-red-200 hover:bg-red-50'
          : 'hover:bg-stone-50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'pending_validation'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'approved'
      ? 'bg-blue-100 text-blue-800'
      : status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-stone-100 text-stone-700';

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${cls}`}>
      {status}
    </span>
  );
}
