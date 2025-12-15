'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/services/storage';
import type { ChefUser } from '@/types';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type FilterKey = 'all' | 'pending' | 'approved' | 'active';

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [loading, setLoading] = useState(true);
const { score, badges } = auth.computeChefScore(c);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const refresh = async () => {
    setLoading(true);
    const list = await auth.getAllChefs();
    const filtered = list.filter(
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

        const da = new Date(a.createdAt || '').getTime() || 0;
        const db = new Date(b.createdAt || '').getTime() || 0;
        return db - da;
      });
  }, [chefs, q, filter]);

  return (
    <div className="p-6 bg-white border rounded">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold">Admin — Chefs</h1>
          <p className="text-sm text-stone-500">
            Validation obligatoire avant réception de missions.
          </p>
        </div>

        <button onClick={refresh} className="px-3 py-2 rounded border text-sm">
          Rafraîchir
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher (nom ou email)…"
          className="w-full md:max-w-sm px-3 py-2 rounded border text-sm"
        />

        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={`Tous (${counts.all})`}
          />
          <FilterButton
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
            label={`À valider (${counts.pending})`}
          />
          <FilterButton
            active={filter === 'approved'}
            onClick={() => setFilter('approved')}
            label={`Approuvés (${counts.approved})`}
          />
          <FilterButton
            active={filter === 'active'}
            onClick={() => setFilter('active')}
            label={`Actifs (${counts.active})`}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-stone-500">Chargement…</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {view.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="p-3">{c.email}</td>

                  <td className="p-3">
                    <StatusBadge status={String(c.status)} />
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {c.status === 'pending_validation' && (
                        <button
                          onClick={() => approve(c.id)}
                          className="px-2 py-1 rounded border"
                        >
                          Approuver
                        </button>
                      )}

                      {c.status === 'approved' && (
                        <button
                          onClick={() => activate(c.id)}
                          className="px-2 py-1 rounded border"
                        >
                          Activer
                        </button>
                      )}

                      <button
                        onClick={() => remove(c.id)}
                        className="px-2 py-1 rounded border text-red-600"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {view.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={4}>
                    Aucun résultat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-2 rounded border text-sm',
        active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:bg-stone-50',
      ].join(' ')}
    >
      {label}
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

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${cls}`}>
      {s}
    </span>
  );
}
