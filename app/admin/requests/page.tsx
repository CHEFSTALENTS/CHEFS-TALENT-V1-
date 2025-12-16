'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/storage';
import type { RequestEntity } from '@/types';

type TypeFilter = 'all' | 'b2b' | 'b2c';
type StatusGroup = 'todo' | 'active' | 'closed';

export default function AdminRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('todo');

  const refresh = async () => {
    setLoading(true);
    const list = await (api.getRequests?.() ?? Promise.resolve([]));
    setRequests(list ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const isTodo = (r: RequestEntity) => r.status === 'new' || r.status === 'in_review';
    const isActive = (r: RequestEntity) => r.status === 'assigned';
    const isClosed = (r: RequestEntity) => r.status === 'closed';

    const filteredType = (r: RequestEntity) => {
      if (typeFilter === 'b2b') return r.userType === 'b2b';
      if (typeFilter === 'b2c') return r.userType !== 'b2b';
      return true;
    };

    const base = requests.filter(filteredType);

    return {
      todo: base.filter(isTodo).length,
      active: base.filter(isActive).length,
      closed: base.filter(isClosed).length,
      all: base.length,
    };
  }, [requests, typeFilter]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const matchType = (r: RequestEntity) => {
      if (typeFilter === 'b2b') return r.userType === 'b2b';
      if (typeFilter === 'b2c') return r.userType !== 'b2b';
      return true;
    };

    const matchStatusGroup = (r: RequestEntity) => {
      if (statusGroup === 'todo') return r.status === 'new' || r.status === 'in_review';
      if (statusGroup === 'active') return r.status === 'assigned';
      return r.status === 'closed';
    };

    const matchSearch = (r: RequestEntity) => {
      if (!needle) return true;

      const client = (r.contact?.company || r.contact?.name || '').toLowerCase();
      const email = (r.contact?.email || '').toLowerCase();
      const location = (r.location || '').toLowerCase();
      const mission = String(r.missionType || '').toLowerCase();
      const mode = String(r.mode || '').toLowerCase();
      const userType = String(r.userType || '').toLowerCase();

      const blob = `${client} ${email} ${location} ${mission} ${mode} ${userType}`;
      return blob.includes(needle);
    };

    // Priorité: À traiter en haut + plus récent en premier
    const priority = (r: RequestEntity) => {
      if (r.status === 'new') return 0;
      if (r.status === 'in_review') return 1;
      if (r.status === 'assigned') return 2;
      return 3; // closed
    };

    return [...requests]
      .filter(matchType)
      .filter(matchStatusGroup)
      .filter(matchSearch)
      .sort((a, b) => {
        const pa = priority(a);
        const pb = priority(b);
        if (pa !== pb) return pa - pb;

        const da = new Date(a.createdAt || '').getTime() || 0;
        const db = new Date(b.createdAt || '').getTime() || 0;
        return db - da;
      });
  }, [requests, q, typeFilter, statusGroup]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Demandes entrantes</h1>
          <p className="text-sm text-stone-500 mt-1">
            Vue simple : <span className="font-medium text-stone-700">lieu</span> •{' '}
            <span className="font-medium text-stone-700">pax</span> •{' '}
            <span className="font-medium text-stone-700">budget</span>. Clique pour matcher.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-stone-50 transition"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border rounded-xl bg-white p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Recherche (lieu, client, email, type)..."
            className="w-full lg:max-w-md px-3 py-2 rounded-lg border text-sm"
          />

          <div className="flex flex-wrap gap-2">
            {/* Type */}
            <Segment
              label={`Tous`}
              active={typeFilter === 'all'}
              onClick={() => setTypeFilter('all')}
              badge={counts.all}
            />
            <Segment
              label={`B2B`}
              active={typeFilter === 'b2b'}
              onClick={() => setTypeFilter('b2b')}
              badge={requests.filter(r => r.userType === 'b2b').length}
            />
            <Segment
              label={`B2C`}
              active={typeFilter === 'b2c'}
              onClick={() => setTypeFilter('b2c')}
              badge={requests.filter(r => r.userType !== 'b2b').length}
            />

            <div className="w-px bg-stone-200 mx-1 hidden md:block" />

            {/* Status group */}
            <Segment
              label={`À traiter`}
              active={statusGroup === 'todo'}
              onClick={() => setStatusGroup('todo')}
              badge={counts.todo}
            />
            <Segment
              label={`En cours`}
              active={statusGroup === 'active'}
              onClick={() => setStatusGroup('active')}
              badge={counts.active}
            />
            <Segment
              label={`Clos`}
              active={statusGroup === 'closed'}
              onClick={() => setStatusGroup('closed')}
              badge={counts.closed}
            />
          </div>
        </div>

        <div className="text-xs text-stone-500">
          “À traiter” = <span className="font-medium">new</span> +{' '}
          <span className="font-medium">in_review</span>. “En cours” ={' '}
          <span className="font-medium">assigned</span>.
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-white overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3">Demande</th>
                <th className="text-left p-3">Lieu</th>
                <th className="text-left p-3">Pax</th>
                <th className="text-left p-3">Budget</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-stone-500" colSpan={6}>
                    Chargement…
                  </td>
                </tr>
              ) : view.length === 0 ? (
                <tr>
                  <td className="p-4 text-stone-500" colSpan={6}>
                    Aucune demande.
                  </td>
                </tr>
              ) : (
                view.map(r => (
                  <tr key={r.id} className="border-t hover:bg-stone-50/50 transition">
                    {/* Demande */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {r.userType === 'b2b' ? 'B2B' : 'B2C'}
                        </span>
                        <span className="text-stone-400">•</span>
                        <span className="text-stone-700">
                          {r.mode === 'fast' ? 'Fast' : 'Standard'}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 mt-1">
                        {shortText(r.contact?.company || r.contact?.name || 'Client', 34)}
                        {r.contact?.email ? (
                          <>
                            <span className="text-stone-300"> • </span>
                            {shortText(r.contact.email, 38)}
                          </>
                        ) : null}
                      </div>
                    </td>

                    {/* Lieu */}
                    <td className="p-3">{r.location || '—'}</td>

                    {/* Pax */}
                    <td className="p-3">{r.guestCount ?? '—'}</td>

                    {/* Budget */}
                    <td className="p-3">{formatBudget(r.budgetRange)}</td>

                    {/* Type badges */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={r.userType === 'b2b' ? 'dark' : 'stone'}>
                          {r.userType === 'b2b' ? 'B2B' : 'B2C'}
                        </Badge>
                        <Badge tone={r.mode === 'fast' ? 'violet' : 'stone'}>
                          {r.mode === 'fast' ? 'Fast' : 'Standard'}
                        </Badge>
                        {r.status ? (
                          <Badge
                            tone={
                              r.status === 'new'
                                ? 'amber'
                                : r.status === 'in_review'
                                ? 'blue'
                                : r.status === 'assigned'
                                ? 'green'
                                : 'stone'
                            }
                          >
                            {r.status}
                          </Badge>
                        ) : null}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/requests/${encodeURIComponent(r.id)}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm bg-stone-900 text-white hover:bg-stone-800 transition"
                      >
                        Voir & matcher <span aria-hidden>→</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t text-xs text-stone-500">
          Conseil : traite d’abord <span className="font-medium">new</span>, puis{' '}
          <span className="font-medium">in_review</span>.
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI components ---------------- */

function Segment({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition',
        active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:bg-stone-50',
      ].join(' ')}
    >
      <span>{label}</span>
      {badge !== undefined ? (
        <span
          className={[
            'text-[11px] px-2 py-0.5 rounded-full',
            active ? 'bg-white/15 text-white' : 'bg-stone-100 text-stone-700',
          ].join(' ')}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Badge({
  children,
  tone = 'stone',
}: {
  children: React.ReactNode;
  tone?: 'stone' | 'dark' | 'violet' | 'amber' | 'blue' | 'green';
}) {
  const cls =
    tone === 'dark'
      ? 'bg-stone-900 text-white'
      : tone === 'violet'
      ? 'bg-violet-100 text-violet-900'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-900'
      : tone === 'blue'
      ? 'bg-blue-100 text-blue-900'
      : tone === 'green'
      ? 'bg-green-100 text-green-900'
      : 'bg-stone-100 text-stone-700';

  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${cls}`}>{children}</span>;
}

/* ---------------- Helpers ---------------- */

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

function shortText(s: string, max: number) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
