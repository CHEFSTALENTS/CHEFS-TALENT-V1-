'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/storage';

export default function AdminMissionsPage() {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);

  const refresh = async () => {
    setLoading(true);
    const list = (await api.getAllMissions?.()) ?? [];
    setMissions(list);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="bg-white border rounded p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Missions</h1>
        <button onClick={refresh} className="px-3 py-2 rounded border text-sm">Rafraîchir</button>
      </div>

      {loading ? (
        <div className="text-sm text-stone-500">Chargement…</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3">Titre</th>
                <th className="text-left p-3">Lieu</th>
                <th className="text-left p-3">Dates</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Montant</th>
              </tr>
            </thead>
            <tbody>
              {missions.map(m => (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{m.title || 'Mission'}</td>
                  <td className="p-3">{m.location || '—'}</td>
                  <td className="p-3">{m.startDate || '—'} → {m.endDate || '—'}</td>
                  <td className="p-3">{m.status}</td>
                  <td className="p-3">{m.estimatedAmount ?? '—'}</td>
                </tr>
              ))}
              {missions.length === 0 && (
                <tr><td className="p-3" colSpan={5}>Aucune mission.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
