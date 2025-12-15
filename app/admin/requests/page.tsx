'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/storage';
import type { RequestStatus } from '@/types';

export default function AdminRequestsPage() {
  const sp = useSearchParams();
  const type = sp.get('type');     // b2b / b2c
  const status = sp.get('status'); // new / in_review / assigned / closed

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  const refresh = async () => {
    setLoading(true);
    const list = (await api.getRequests?.()) ?? [];
    setRequests(list);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return requests
      .filter(r => (type === 'b2b' ? r.userType === 'b2b' : type === 'b2c' ? r.userType !== 'b2b' : true))
      .filter(r => (status ? r.status === status : true));
  }, [requests, type, status]);

  cconst setStatus = async (id: string, next: RequestStatus) => {
  await api.updateStatus(id, next);
  await refresh();
};

  return (
    <div className="bg-white border rounded p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Demandes entrantes</h1>
          <p className="text-sm text-stone-500">B2B conciergeries + B2C clients privés</p>
        </div>
        <button onClick={refresh} className="px-3 py-2 rounded border text-sm">Rafraîchir</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Filter href="/admin/requests" label="Toutes" />
        <Filter href="/admin/requests?type=b2b" label="B2B" />
        <Filter href="/admin/requests?type=b2c" label="B2C" />
        <span className="mx-2 text-stone-300">|</span>
        <Filter href="/admin/requests?status=new" label="New" />
        <Filter href="/admin/requests?status=in_review" label="In review" />
        <Filter href="/admin/requests?status=assigned" label="Assigned" />
        <Filter href="/admin/requests?status=closed" label="Closed" />
      </div>

      {loading ? (
        <div className="text-sm text-stone-500">Chargement…</div>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Lieu</th>
                <th className="text-left p-3">Dates</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.userType === 'b2b' ? 'B2B' : 'B2C'}</td>
                  <td className="p-3">{r.contact?.name || '—'}<div className="text-xs text-stone-400">{r.contact?.email || ''}</div></td>
                  <td className="p-3">{r.location || '—'}</td>
                  <td className="p-3">
                    {r.dates?.start || '—'} → {r.dates?.end || '—'}
                  </td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <button onClick={() => setStatus(r.id, 'in_review')} className="px-2 py-1 rounded border">Review</button>
                    <button onClick={() => setStatus(r.id, 'assigned')} className="px-2 py-1 rounded border">Assign</button>
                    <button onClick={() => setStatus(r.id, 'closed')} className="px-2 py-1 rounded border">Close</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={6}>Aucune demande.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Filter({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-stone-50">
      {label}
    </Link>
  );
}
