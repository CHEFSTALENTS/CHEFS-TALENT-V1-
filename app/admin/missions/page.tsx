'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/storage';
// TODO: remplace par ton type réel
// import type { MissionEntity } from '@/types';

type MissionEntity = any;

type StatusGroup = 'upcoming' | 'live' | 'done' | 'canceled';

export default function AdminMissionsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MissionEntity[]>([]);
  const [q, setQ] = useState('');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('upcoming');

  const refresh = async () => {
    setLoading(true);
    // TODO: adapte la méthode
    const list = await (api.getMissions?.() ?? Promise.resolve([]));
    setItems(list ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const s = (m: MissionEntity) => String(m.status || '').toLowerCase();
    return {
      upcoming: items.filter(m => ['upcoming', 'scheduled'].includes(s(m))).length,
      live: items.filter(m => ['live', 'in_progress'].includes(s(m))).length,
      done: items.filter(m => ['done', 'completed'].includes(s(m))).length,
      canceled: items.filter(m => ['canceled', 'cancelled'].includes(s(m))).length,
      all: items.length,
    };
  }, [items]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const s = (m: MissionEntity) => String(m.status || '').toLowerCase();

    const matchStatus = (m: MissionEntity) => {
      if (statusGroup === 'upcoming') return ['upcoming', 'scheduled'].includes(s(m));
      if (statusGroup === 'live') return ['live', 'in_progress'].includes(s(m));
      if (statusGroup === 'done') return ['done', 'completed'].includes(s(m));
      return ['canceled', 'cancelled'].includes(s(m));
    };

    const matchSearch = (m: MissionEntity) => {
      if (!needle) return true;
      // TODO: adapte les champs
      const client = String(m.clientName || m.contact?.company || m.contact?.name || '').toLowerCase();
      const location = String(m.location || '').toLowerCase();
      const chef = String(m.chefName || '').toLowerCase();
      const blob = `${client} ${location} ${chef} ${String(m.status || '')}`;
      return blob.includes(needle);
    };

    return [...items]
      .filter(matchStatus)
      .filter(matchSearch)
      .sort((a, b) => {
        // tri par date (start) décroissant
        const da = new Date(a.startAt || a.date || a.createdAt || '').getTime() || 0;
        const db = new Date(b.startAt || b.date || b.createdAt || '').getTime() || 0;
        return db - da;
      });
  }, [items, q, statusGroup]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Missions</h1>
          <p className="text-sm text-white/60 mt-1">
            Suivi des prestations : <span className="text-white/80 font-medium">date</span> •{' '}
            <span className="text-white/80 font-medium">lieu</span> •{' '}
            <span className="text-white/80 font-medium">chef</span>.
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi title="À venir" value={counts.upcoming} hint="scheduled" active={statusGroup === 'upcoming'} onClick={() => setStatusGroup('upcoming')} />
        <Kpi title="En cours" value={counts.live} hint="in_progress" active={statusGroup === 'live'} onClick={() => setStatusGroup('live')} />
        <Kpi title="Terminées" value={counts.done} hint="completed" active={statusGroup === 'done'} onClick={() => setStatusGroup('done')} />
        <Kpi title="Annulées" value={counts.canceled} hint="canceled" active={statusGroup === 'canceled'} onClick={() => setStatusGroup('canceled')} />
      </div>

      {/* Toolbar */}
      <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Recherche (client, chef, lieu, statut)…"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Segment label="À venir" active={statusGroup === 'upcoming'} onClick={() => setStatusGroup('upcoming')} badge={counts.upcoming} />
            <Segment label="En cours" active={statusGroup === 'live'} onClick={() => setStatusGroup('live')} badge={counts.live} />
            <Segment label="Terminées" active={statusGroup === 'done'} onClick={() => setStatusGroup('done')} badge={counts.done} />
            <Segment label="Annulées" active={statusGroup === 'canceled'} onClick={() => setStatusGroup('canceled')} badge={counts.canceled} />
          </div>
        </div>

        <div className="text-xs text-white/45">
          Astuce : vérifie d’abord les <span className="text-white/70 font-medium">missions à venir</span>, puis les{' '}
          <span className="text-white/70 font-medium">en cours</span>.
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
                <th className="text-left p-3 font-medium">Chef</th>
                <th className="text-left p-3 font-medium">Pax</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Chargement…</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Aucune mission.</td></tr>
              ) : (
                view.map(m => (
                  <tr key={m.id} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-3">
                      <div className="text-white font-medium leading-tight">
                        {shortText(String(m.clientName || m.contact?.company || m.contact?.name || 'Client'), 40)}
                      </div>
                      {m.contact?.email ? (
                        <div className="text-xs text-white/45 mt-0.5">{shortText(String(m.contact.email), 50)}</div>
                      ) : null}
                    </td>

                    <td className="p-3 text-white/85">{m.location || '—'}</td>
                    <td className="p-3 text-white/85">{m.chefName || '—'}</td>
                    <td className="p-3 text-white/85">{m.guestCount ?? m.pax ?? '—'}</td>
                    <td className="p-3 text-white/70 whitespace-nowrap">{formatDate(m.startAt || m.date)}</td>

                    <td className="p-3">
                      <StatusBadge status={String(m.status || '')} />
                    </td>

                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/missions/${encodeURIComponent(m.id)}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
                      >
                        Ouvrir <span aria-hidden>→</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-white/10 text-xs text-white/45">
          {view.length} résultat(s) • source : localStorage (MVP)
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI components (same style as Demandes) ---------------- */

function Kpi({
  title,
  value,
  hint,
  active,
  onClick,
}: {
  title: string;
  value: number;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
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
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition',
        active
          ? 'bg-white/15 text-white border-white/15'
          : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      <span className="font-medium">{label}</span>
      {badge !== undefined ? (
        <span
          className={[
            'text-[11px] px-2 py-0.5 rounded-full border',
            active
              ? 'bg-white/10 border-white/15 text-white'
              : 'bg-white/5 border-white/10 text-white/70',
          ].join(' ')}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();

  const cls =
    s === 'upcoming' || s === 'scheduled'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'live' || s === 'in_progress'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : s === 'done' || s === 'completed'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : s === 'canceled' || s === 'cancelled'
      ? 'bg-white/10 text-white/60 border-white/10'
      : 'bg-white/10 text-white/60 border-white/10';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>
      {s || '—'}
    </span>
  );
}

/* ---------------- Helpers ---------------- */

function formatDate(v: any) {
  if (!v) return '—';
  const t = new Date(v).getTime();
  if (!t) return '—';
  return new Date(v).toLocaleDateString('fr-FR');
}

function shortText(s: string, max: number) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
