'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';
import NewMissionModal from './_components/NewMissionModal';

// Type Supabase row de la table missions (snake_case)
type MissionRow = {
  id: string;
  request_id: string | null;
  chef_id: string;
  chef_email: string;
  chef_name: string | null;
  title: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  guest_count: number | null;
  service_level: string | null;
  status: string | null;
  chef_amount: number | null;
  client_amount: number | null;
  commission_amount: number | null;
  contract_url: string | null;
  offered_at: string | null;
  confirmed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// Vue normalisée pour l'UI (camelCase + champs dérivés)
type MissionView = {
  id: string;
  status: string;
  location: string;
  chefName: string;
  chefEmail: string;
  guestCount: number | null;
  startAt: string | null;
  endAt: string | null;
  chefAmount: number | null;
  clientAmount: number | null;
  createdAt: string | null;
};

function normalizeMission(row: MissionRow): MissionView {
  return {
    id: row.id,
    status: String(row.status || '').toLowerCase(),
    location: row.location || '—',
    chefName: row.chef_name || '—',
    chefEmail: row.chef_email || '',
    guestCount: row.guest_count,
    startAt: row.start_date,
    endAt: row.end_date,
    chefAmount: row.chef_amount,
    clientAmount: row.client_amount,
    createdAt: row.created_at,
  };
}

// Buckets de statut. La table `missions` peut contenir des status legacy
// (offered/declined/cancelled) ou modernes (confirmed/in_progress/completed).
type StatusGroup = 'pending' | 'upcoming' | 'live' | 'done' | 'canceled';

function bucket(status: string): StatusGroup {
  const s = (status || '').toLowerCase();
  if (['offered', 'pending', 'pitched'].includes(s)) return 'pending';
  if (['confirmed', 'upcoming', 'scheduled', 'accepted'].includes(s)) return 'upcoming';
  if (['live', 'in_progress'].includes(s)) return 'live';
  if (['done', 'completed'].includes(s)) return 'done';
  if (['canceled', 'cancelled', 'declined', 'expired'].includes(s)) return 'canceled';
  return 'pending';
}

export default function AdminMissionsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MissionView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('upcoming');
  const [showNewModal, setShowNewModal] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetchRaw('/api/admin/missions');
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      const rows: MissionRow[] = Array.isArray(json?.items) ? json.items : [];
      setItems(rows.map(normalizeMission));
    } catch (e: any) {
      console.error('[admin/missions] refresh failed', e);
      setError(e?.message || 'Erreur chargement');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    return {
      pending: items.filter((m) => bucket(m.status) === 'pending').length,
      upcoming: items.filter((m) => bucket(m.status) === 'upcoming').length,
      live: items.filter((m) => bucket(m.status) === 'live').length,
      done: items.filter((m) => bucket(m.status) === 'done').length,
      canceled: items.filter((m) => bucket(m.status) === 'canceled').length,
      all: items.length,
    };
  }, [items]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...items]
      .filter((m) => bucket(m.status) === statusGroup)
      .filter((m) => {
        if (!needle) return true;
        const blob = `${m.chefName} ${m.chefEmail} ${m.location} ${m.status}`.toLowerCase();
        return blob.includes(needle);
      })
      .sort((a, b) => {
        const da = new Date(a.startAt || a.createdAt || '').getTime() || 0;
        const db = new Date(b.startAt || b.createdAt || '').getTime() || 0;
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
            Suivi des prestations confirmées : <span className="text-white/80 font-medium">date</span> •{' '}
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
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-[#161616] text-sm font-semibold hover:bg-white/90 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle mission
          </button>
        </div>
      </div>

      {/* KPI quick */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi title="En attente" value={counts.pending} hint="offered" active={statusGroup === 'pending'} onClick={() => setStatusGroup('pending')} />
        <Kpi title="À venir" value={counts.upcoming} hint="confirmed" active={statusGroup === 'upcoming'} onClick={() => setStatusGroup('upcoming')} />
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
              onChange={(e) => setQ(e.target.value)}
              placeholder="Recherche (chef, lieu, statut)…"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Segment label="En attente" active={statusGroup === 'pending'} onClick={() => setStatusGroup('pending')} badge={counts.pending} />
            <Segment label="À venir" active={statusGroup === 'upcoming'} onClick={() => setStatusGroup('upcoming')} badge={counts.upcoming} />
            <Segment label="En cours" active={statusGroup === 'live'} onClick={() => setStatusGroup('live')} badge={counts.live} />
            <Segment label="Terminées" active={statusGroup === 'done'} onClick={() => setStatusGroup('done')} badge={counts.done} />
            <Segment label="Annulées" active={statusGroup === 'canceled'} onClick={() => setStatusGroup('canceled')} badge={counts.canceled} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-white/70">
                <th className="text-left p-3 font-medium">Chef</th>
                <th className="text-left p-3 font-medium">Lieu</th>
                <th className="text-left p-3 font-medium">Pax</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Montant chef</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Chargement…</td></tr>
              ) : error ? (
                <tr><td className="p-4 text-red-300" colSpan={7}>{error}</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Aucune mission dans cette catégorie.</td></tr>
              ) : (
                view.map((m) => (
                  <tr key={m.id} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-3">
                      <div className="text-white font-medium leading-tight">
                        {shortText(m.chefName, 40)}
                      </div>
                      <div className="text-xs text-white/45 mt-0.5">{shortText(m.chefEmail, 50)}</div>
                    </td>
                    <td className="p-3 text-white/85">{m.location}</td>
                    <td className="p-3 text-white/85">{m.guestCount ?? '—'}</td>
                    <td className="p-3 text-white/70 whitespace-nowrap">{formatDate(m.startAt)}</td>
                    <td className="p-3 text-white/85 whitespace-nowrap">
                      {m.chefAmount != null ? `${m.chefAmount.toLocaleString('fr-FR')} €` : '—'}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={m.status} />
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
          {view.length} résultat(s) · source : Supabase
        </div>
      </div>

      {/* Modal nouvelle mission */}
      {showNewModal && (
        <NewMissionModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

/* ---------------- UI components ---------------- */

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
    s === 'offered' || s === 'pending' || s === 'pitched'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'confirmed' || s === 'upcoming' || s === 'scheduled' || s === 'accepted'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : s === 'live' || s === 'in_progress'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : s === 'done' || s === 'completed'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : s === 'canceled' || s === 'cancelled' || s === 'declined' || s === 'expired'
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
