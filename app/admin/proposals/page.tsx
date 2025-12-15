'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/storage';

export default function AdminProposalsPage() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);

    // si tu as api.getAllProposals() ou api.getProposals() on l’utilise
    const fn = (api as any).getAllProposals || (api as any).getProposals;
    if (!fn) {
      setProposals([]);
      setNote("API proposals pas encore branchée. Dis-moi le nom exact de ta fonction (ou je te l’ajoute proprement dans storage.ts) et ça apparaîtra ici.");
      setLoading(false);
      return;
    }

    const list = await fn();
    setProposals(list || []);
    setNote(null);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="bg-white border rounded p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Proposals</h1>
        <button onClick={refresh} className="px-3 py-2 rounded border text-sm">Rafraîchir</button>
      </div>

      {note && <div className="text-sm text-stone-600 mb-4">{note}</div>}

      {loading ? (
        <div className="text-sm text-stone-500">Chargement…</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3">Request</th>
                <th className="text-left p-3">Chef</th>
                <th className="text-left p-3">Prix</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.requestId}</td>
                  <td className="p-3">{p.chefId}</td>
                  <td className="p-3">{p.priceTotal ?? '—'}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3">{p.createdAt || '—'}</td>
                </tr>
              ))}
              {proposals.length === 0 && (
                <tr><td className="p-3" colSpan={5}>Aucune proposal.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
