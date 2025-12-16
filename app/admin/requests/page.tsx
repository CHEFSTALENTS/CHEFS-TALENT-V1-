'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/storage';
import type { RequestEntity } from '@/types';

type TypeFilter = 'all' | 'b2b' | 'b2c';
type StatusFilter = 'all' | 'new' | 'in_review' | 'assigned' | 'closed';

export default function AdminRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestEntity[]>([]);

  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const refresh = async () => {
    setLoading(true);
    const list = await (api.getRequests?.() ?? Promise.resolve([]));
    setRequests(list ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return [...requests]
      .filter(r => {
        if (type === 'b2b') return r.userType === 'b2b';
        if (type === 'b2c') return r.userType !== 'b2b';
        return true;
      })
      .filter(r => {
        if (status === 'all') return true;
        return String(r.status) === status;
      })
      .filter(r => {
        if (!needle) return true;
        const hay = [
          r.location,
          r.contact?.name,
          r.contact?.company,
          r.contact?.email,
          r.missionType,
          r.mode,
          r.userType,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [requests, q, type, status]);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Demandes</h1>
          <p className="text-sm text-stone-500">
            Vue simple : lieu • pax • budget. Clique pour matcher.
          </p>
        </div>

        <button
          onClick={refresh}
          className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-stone-50"
        >
          Rafraîchir
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Recherche (lieu, client, email, type)…"
          className="w-full md:max-w-md px-3 py-2 rounded-lg border text-sm"
        />

        <div className="flex flex-wrap gap-2">
          <Pill active={type === 'all'} onClick={() => setType('all')}>Toutes</Pill>
          <Pill active={type === 'b2b'} onClick={() => setType('b2b')}>B2B</Pill>
          <Pill active={type === 'b2c'} onClick={() => setType('b2c')}>B2C</Pill>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill active={status === 'all'} onClick={() => setStatus('all')}>Tous statuts</Pill>
          <Pill active={status === 'new'} onClick={() => setStatus('new')}>New</Pill>
          <Pill active={status === 'in_review'} onClick={() => setStatus('in_review')}>In review</Pill>
          <Pill active={status === 'assigned'} onClick={() => setStatus('assigned')}>Assigned</Pill>
          <Pill active={status === 'closed'} onClick={() => setStatus('closed')}>Closed</Pill>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-stone-500">Chargement…</div>
      ) : (
        <div className="overflow-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Lieu</th>
                <th className="text-left p-3">Pax</th>
                <th className="text-left p-3">Budget</th>
                <th className="text-left p-3">Dates</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {view.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.userType === 'b2b' ? 'B2B' : 'B2C'}</div>
                    <div className="text-xs text-stone-500">{r.mode === 'fast' ? 'Fast' : 'Standard'}</div>
                  </td>

                  <td className="p-3">
                    <div className="font-medium">
                      {r.contact?.company || r.contact?.name || '—'}
                    </div>
                    <div className="text-xs text-stone-500">{r.contact?.email || ''}</div>
                  </td>

                  <td className="p-3">{r.location || '—'}</td>
                  <td className="p-3">{r.guestCount ?? '—'}</td>
                  <td className="p-3">{formatBudget(r.budgetRange)}</td>
                  <td className="p-3">{formatDates(r)}</td>

                  <td className="p-3">
                    <StatusBadge status={String(r.status)} />
                  </td>

                  <td className="p-3">
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="px-3 py-2 rounded-lg border text-sm hover:bg-stone-50"
                    >
                      Ouvrir & matcher →
                    </Link>
                  </td>
                </tr>
              ))}

              {view.length === 0 && (
                <tr>
                  <td className="p-3 text-stone-500" colSpan={8}>
                    Aucune demande.
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

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-2 rounded-full border text-sm',
        active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:bg-stone-50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status || 'unknown';
  const cls =
    s === 'new'
      ? 'bg-amber-100 text-amber-900'
      : s === 'in_review'
      ? 'bg-violet-100 text-violet-900'
      : s === 'assigned'
      ? 'bg-blue-100 text-blue-900'
      : s === 'closed'
      ? 'bg-stone-200 text-stone-800'
      : 'bg-stone-100 text-stone-700';

  return <span className={`inline-flex px-2 py-1 rounded text-xs ${cls}`}>{s}</span>;
}

function formatDates(r: RequestEntity) {
  const start = r.dates?.start ? new Date(r.dates.start).toLocaleDateString('fr-FR') : '—';
  const end = r.dates?.end ? new Date(r.dates.end).toLocaleDateString('fr-FR') : '';
  return end ? `${start} → ${end}` : start;
}

function formatBudget(b: any) {
  if (!b) return '—';
  if (typeof b === 'string') return b;
  const min = b?.min ?? b?.from;
  const max = b?.max ?? b?.to;
  if (min && max) return `${min}–${max}`;
  if (min) return `≥ ${min}`;
  if (max) return `≤ ${max}`;
  return '—';
}
