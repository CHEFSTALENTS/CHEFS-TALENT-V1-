'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
    try {
      const r = await fetch('/api/admin/requests', { cache: 'no-store' });
      if (!r.ok) throw new Error(`GET /api/admin/requests failed: ${r.status}`);

      const json = await r.json();

      const mapped: RequestEntity[] = (json.items ?? []).map((x: any) => ({
        id: x.id,
        status: x.status ?? 'new',

        // match_type dans ta table => fast|concierge
        mode: (x.match_type ?? 'concierge') as any,

        // client_type: concierge => b2b sinon b2c
        userType: x.client_type === 'concierge' ? 'b2b' : 'b2c',

        createdAt: x.created_at ?? null,

        location: x.location ?? x.city ?? '—',
        guestCount: x.guest_count ?? x.guests ?? null,
        budgetRange: x.budget_range ?? (x.budget ? String(x.budget) : null),

        dates: {
          start: x.start_date ?? null,
          end: x.end_date ?? null,
        } as any,

        contact: {
          name: x.first_name ?? 'Client',
          company: x.company_name ?? '',
          email: x.email ?? '',
          phone: x.phone ?? '',
        } as any,

        missionType: x.assignment_type ?? '' as any,
      }));

      setRequests(mapped);
    } catch (e) {
      console.error('Admin refresh error', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
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

    const priority = (r: RequestEntity) => {
      if (r.status === 'new') return 0;
      if (r.status === 'in_review') return 1;
      if (r.status === 'assigned') return 2;
      return 3;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Demandes</h1>
          <p className="text-sm text-white/60 mt-1">
            Vue simple : <span className="text-white/80 font-medium">lieu</span> •{' '}
            <span className="text-white/80 font-medium">pax</span> •{' '}
            <span className="text-white/80 font-medium">budget</span>. Clique pour matcher.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {/* KPI quick */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi title="À traiter" value={counts.todo} hint="new + in_review" active={statusGroup === 'todo'} onClick={() => setStatusGroup('todo')} />
        <Kpi title="En cours" value={counts.active} hint="assigned" active={statusGroup === 'active'} onClick={() => setStatusGroup('active')} />
        <Kpi title="Clos" value={counts.closed} hint="closed" active={statusGroup === 'closed'} onClick={() => setStatusGroup('closed')} />
      </div>

      {/* Toolbar */}
      <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Recherche (lieu, client, email, type)..."
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Segment label="Tous" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} badge={counts.all} />
            <Segment label="B2B" active={typeFilter === 'b2b'} onClick={() => setTypeFilter('b2b')} badge={requests.filter(r => r.userType === 'b2b').length} />
            <Segment label="B2C" active={typeFilter === 'b2c'} onClick={() => setTypeFilter('b2c')} badge={requests.filter(r => r.userType !== 'b2b').length} />
          </div>
        </div>

        <div className="text-xs text-white/45">
          Astuce : traite d’abord <span className="text-white/70 font-medium">new</span>, puis{' '}
          <span className="text-white/70 font-medium">in_review</span>.
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-white/70">
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Lieu</th>
                <th className="text-left p-3 font-medium">Pax</th>
                <th className="text-left p-3 font-medium">Budget</th>
                <th className="text-left p-3 font-medium">Dates</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Chargement…</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Aucune demande.</td></tr>
              ) : (
                view.map(r => (
                  <tr key={r.id} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={r.userType === 'b2b' ? 'dark' : 'stone'}>{r.userType === 'b2b' ? 'B2B' : 'B2C'}</Badge>
                        <Badge tone={r.mode === 'fast' ? 'violet' : 'stone'}>{r.mode === 'fast' ? 'Fast' : 'Standard'}</Badge>
                      </div>

                      <div className="mt-2">
                        <div className="text-white font-medium leading-tight">
                          {shortText(r.contact?.company || r.contact?.name || 'Client', 40)}
                        </div>
                        {r.contact?.email ? (
                          <div className="text-xs text-white/45 mt-0.5">{shortText(r.contact.email, 50)}</div>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-3 text-white/85">{r.location || '—'}</td>
                    <td className="p-3 text-white/85">{r.guestCount ?? '—'}</td>
                    <td className="p-3 text-white/85">{formatBudget(r.budgetRange)}</td>
                    <td className="p-3 text-white/70 whitespace-nowrap">{formatDates(r)}</td>

                    <td className="p-3"><StatusBadge status={String(r.status || '')} /></td>

                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/requests/${encodeURIComponent(r.id)}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
                      >
                        Ouvrir & matcher <span aria-hidden>→</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-white/10 text-xs text-white/45">
          {view.length} résultat(s) • source : Supabase
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI components ---------------- */

function Kpi({ title, value, hint, active, onClick }: { title: string; value: number; hint?: string; active?: boolean; onClick?: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={[
        'text-left border rounded-2xl p-4 transition w-full',
        'border-white/10 bg-white/5 hover:bg-white/10',
        active ? 'ring-2 ring-white/10' : '',
      ].join(' ')}
    >
      <div className="text-sm text-white/70">{title}</div>
      <div className="text-3xl font-semibold text-white mt-1">{value}</div>
      {hint ? <div className="text-xs text-white/40 mt-1">{hint}</div> : null}
    </button>
  );
}

function Segment({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number; }) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition',
        active ? 'bg-white/15 text-white border-white/15' : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      <span className="font-medium">{label}</span>
      {badge !== undefined ? (
        <span
          className={[
            'text-[11px] px-2 py-0.5 rounded-full border',
            active ? 'bg-white/10 border-white/15 text-white' : 'bg-white/5 border-white/10 text-white/70',
          ].join(' ')}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Badge({ children, tone = 'stone' }: { children: React.ReactNode; tone?: 'stone' | 'dark' | 'violet'; }) {
  const cls =
    tone === 'dark'
      ? 'bg-white/15 text-white border-white/15'
      : tone === 'violet'
      ? 'bg-violet-500/15 text-violet-200 border-violet-500/20'
      : 'bg-white/10 text-white/75 border-white/10';

  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();

  const cls =
    s === 'new'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'in_review'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : s === 'assigned'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : s === 'closed'
      ? 'bg-white/10 text-white/60 border-white/10'
      : 'bg-white/10 text-white/60 border-white/10';

  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{s || '—'}</span>;
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

function formatDates(r: any) {
  const start = r.dates?.start ? new Date(r.dates.start).toLocaleDateString('fr-FR') : '—';
  const end = r.dates?.end ? new Date(r.dates.end).toLocaleDateString('fr-FR') : '';
  return end ? `${start} → ${end}` : start;
}

function shortText(s: string, max: number) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
