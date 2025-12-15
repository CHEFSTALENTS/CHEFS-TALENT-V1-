'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/services/storage';
import type { ChefUser } from '@/types';

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const list = await auth.getAllChefs();
    // on masque l’admin dans la liste, optionnel
const ADMIN_EMAIL = 'thomas@chef-talents.com';
...
setChefs(list.filter(u => u.email !== ADMIN_EMAIL));

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Admin — Chefs</h1>
        <button
          onClick={refresh}
          className="px-3 py-2 rounded border text-sm"
        >
          Rafraîchir
        </button>
      </div>

      {loading ? (
        <div>Chargement…</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chefs.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.firstName} {c.lastName}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.status}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => approve(c.id)}
                      className="px-2 py-1 rounded border"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => activate(c.id)}
                      className="px-2 py-1 rounded border"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      className="px-2 py-1 rounded border text-red-600"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {chefs.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={4}>Aucun chef.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
