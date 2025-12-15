'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/services/storage';
import type { ChefUser } from '@/types';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  const sortedChefs = useMemo(() => {
    const priority: Record<string, number> = {
      pending_validation: 0,
      approved: 1,
      active: 2,
    };

    return [...chefs].sort((a, b) => {
      const pa = priority[String(a.status)] ?? 99;
      const pb = priority[String(b.status)] ?? 99;
      if (pa !== pb) return pa - pb;

      const da = new Date(a.createdAt || '').getTime() || 0;
      const db = new Date(b.createdAt || '').getTime() || 0;
      return db - da;
    });
  }, [chefs]);

  return (
    <div className="p-6 bg-white border rounded">
      <div className="flex items-center justify-between mb-6">
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
              {sortedChefs.map(c => (
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

              {sortedChefs.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={4}>
                    Aucun chef.
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
    s === 'pending_validation'
      ? 'pending_validation'
      : s === 'approved'
      ? 'approved'
      : s === 'active'
      ? 'active'
      : s;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${cls}`}>
      {label}
    </span>
  );
}
