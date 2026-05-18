'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, BadgeCheck, Loader2, RotateCcw } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';
import NewMissionModal from './_components/NewMissionModal';
import MarkPaidModal from './_components/MarkPaidModal';
import {
  computeMissionLifecyclePhase,
  needsChefPaymentValidation,
  PHASE_LABELS,
  type MissionLifecyclePhase,
} from '@/lib/missionLifecycle';

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
  // Champs paiement (migration 2026-05-mission-payment.sql)
  payment_status: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  // Champs paiement CHEF (migration 2026-05-missions-chef-paid.sql)
  chef_paid_at?: string | null;
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
  paymentStatus: string;
  paidAt: string | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  chefPaidAt: string | null;
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
    paymentStatus: String(row.payment_status || 'pending').toLowerCase(),
    paidAt: row.paid_at,
    paidAmount: row.paid_amount,
    paymentMethod: row.payment_method,
    chefPaidAt: row.chef_paid_at || null,
  };
}

// Buckets de statut. Le bucket 'paid' croise mission.status (confirmed)
// avec payment_status='paid' pour ne montrer que ce qui est encaissé.
type StatusGroup = 'pending' | 'upcoming' | 'paid' | 'live' | 'done' | 'canceled';

function bucket(m: MissionView): StatusGroup {
  const s = m.status;
  // Si la mission est confirmée ET encaissée (= client a payé Chefs Talents),
  // elle va dans le bucket 'paid' (= « Encaissées »).
  if (s === 'confirmed' && m.paymentStatus === 'paid') return 'paid';
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

  // Pour la modal "Marquer encaissée"
  const [paidTarget, setPaidTarget] = useState<MissionView | null>(null);
  // Pour le mark-pending (annuler le paiement)
  const [revertingId, setRevertingId] = useState<string | null>(null);

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

  // Annuler le marquage encaissée (cas erreur de saisie / chargeback client)
  const revertPaid = async (id: string) => {
    if (!confirm('Annuler le marquage encaissée ?\nLa mission repassera en statut « confirmée non encaissée ».')) return;
    setRevertingId(id);
    try {
      const r = await adminFetchRaw(
        `/api/admin/missions/${encodeURIComponent(id)}/mark-pending`,
        { method: 'PATCH' },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await refresh();
    } catch (e: any) {
      console.error('[admin/missions] revert paid failed', e);
      alert(e?.message || 'Erreur serveur');
    } finally {
      setRevertingId(null);
    }
  };

  const counts = useMemo(() => {
    return {
      pending: items.filter((m) => bucket(m) === 'pending').length,
      upcoming: items.filter((m) => bucket(m) === 'upcoming').length,
      paid: items.filter((m) => bucket(m) === 'paid').length,
      live: items.filter((m) => bucket(m) === 'live').length,
      done: items.filter((m) => bucket(m) === 'done').length,
      canceled: items.filter((m) => bucket(m) === 'canceled').length,
      all: items.length,
    };
  }, [items]);

  // KPI financiers du bucket courant : utile pour voir au coup d'œil
  // le total à venir / payé / etc.
  const bucketTotals = useMemo(() => {
    const inBucket = items.filter((m) => bucket(m) === statusGroup);
    const totalChef = inBucket.reduce((acc, m) => acc + (m.chefAmount || 0), 0);
    const totalClient = inBucket.reduce((acc, m) => acc + (m.clientAmount || 0), 0);
    const totalPaid = inBucket.reduce((acc, m) => acc + (m.paidAmount || 0), 0);
    return { totalChef, totalClient, totalPaid, count: inBucket.length };
  }, [items, statusGroup]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...items]
      .filter((m) => bucket(m) === statusGroup)
      .filter((m) => {
        if (!needle) return true;
        const blob = `${m.chefName} ${m.chefEmail} ${m.location} ${m.status}`.toLowerCase();
        return blob.includes(needle);
      })
      .sort((a, b) => {
        // Pour le bucket 'paid', tri par paid_at desc
        if (statusGroup === 'paid') {
          const da = new Date(a.paidAt || a.createdAt || '').getTime() || 0;
          const db = new Date(b.paidAt || b.createdAt || '').getTime() || 0;
          return db - da;
        }
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
            <span className="text-white/80 font-medium">chef</span> •{' '}
            <span className="text-white/80 font-medium">paiement</span>.
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

      {/* KPI quick — 6 buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
        <Kpi title="En attente" value={counts.pending} hint="offered" active={statusGroup === 'pending'} onClick={() => setStatusGroup('pending')} />
        <Kpi title="À venir" value={counts.upcoming} hint="confirmed" active={statusGroup === 'upcoming'} onClick={() => setStatusGroup('upcoming')} />
        <Kpi title="Encaissées" value={counts.paid} hint="client a payé" active={statusGroup === 'paid'} onClick={() => setStatusGroup('paid')} accent="emerald" />
        <Kpi title="En cours" value={counts.live} hint="in_progress" active={statusGroup === 'live'} onClick={() => setStatusGroup('live')} />
        <Kpi title="Terminées" value={counts.done} hint="completed" active={statusGroup === 'done'} onClick={() => setStatusGroup('done')} />
        <Kpi title="Annulées" value={counts.canceled} hint="canceled" active={statusGroup === 'canceled'} onClick={() => setStatusGroup('canceled')} />
      </div>

      {/* Toolbar + totaux du bucket sélectionné */}
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
            <Segment label="Encaissées" active={statusGroup === 'paid'} onClick={() => setStatusGroup('paid')} badge={counts.paid} />
            <Segment label="En cours" active={statusGroup === 'live'} onClick={() => setStatusGroup('live')} badge={counts.live} />
            <Segment label="Terminées" active={statusGroup === 'done'} onClick={() => setStatusGroup('done')} badge={counts.done} />
            <Segment label="Annulées" active={statusGroup === 'canceled'} onClick={() => setStatusGroup('canceled')} badge={counts.canceled} />
          </div>
        </div>

        {/* Totaux du bucket courant — utile surtout pour 'paid' et 'upcoming' */}
        {bucketTotals.count > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/55 pt-1 border-t border-white/5">
            <span>{bucketTotals.count} mission{bucketTotals.count > 1 ? 's' : ''}</span>
            {bucketTotals.totalChef > 0 && (
              <span>· Chef : <span className="text-white/85 font-medium">{bucketTotals.totalChef.toLocaleString('fr-FR')} €</span></span>
            )}
            {bucketTotals.totalClient > 0 && (
              <span>· Client : <span className="text-white/85 font-medium">{bucketTotals.totalClient.toLocaleString('fr-FR')} €</span></span>
            )}
            {statusGroup === 'paid' && bucketTotals.totalPaid > 0 && (
              <span>· Encaissé client : <span className="text-emerald-200 font-medium">{bucketTotals.totalPaid.toLocaleString('fr-FR')} €</span></span>
            )}
          </div>
        )}
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
                <th className="text-left p-3 font-medium">Paiement</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-4 text-white/60" colSpan={8}>Chargement…</td></tr>
              ) : error ? (
                <tr><td className="p-4 text-red-300" colSpan={8}>{error}</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="p-4 text-white/60" colSpan={8}>Aucune mission dans cette catégorie.</td></tr>
              ) : (
                view.map((m) => {
                  // Phase auto basée sur les dates (À venir / En cours / Terminée)
                  const phase = computeMissionLifecyclePhase({
                    status: m.status, start_date: m.startAt, end_date: m.endAt, chef_paid_at: m.chefPaidAt,
                  });
                  // Rouge si terminée + chef pas payé
                  const needsChefPay = needsChefPaymentValidation({
                    status: m.status, start_date: m.startAt, end_date: m.endAt, chef_paid_at: m.chefPaidAt,
                  });
                  return (
                  <tr
                    key={m.id}
                    className={`border-t border-white/10 transition ${
                      needsChefPay
                        ? 'bg-red-500/[0.07] hover:bg-red-500/[0.12]'
                        : 'hover:bg-white/5'
                    }`}
                    title={needsChefPay ? '⚠️ Mission terminée — paiement chef à valider' : undefined}
                  >
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
                      {needsChefPay && (
                        <div className="text-[10px] text-red-300 mt-0.5 font-semibold">⚠ Chef non payé</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-start gap-1">
                        <PhaseBadge phase={phase} />
                        <StatusBadge status={m.status} />
                      </div>
                    </td>
                    <td className="p-3">
                      <PaymentBadge status={m.paymentStatus} />
                      {m.paymentStatus === 'paid' && m.paidAmount != null && (
                        <div className="text-[10px] text-white/40 mt-0.5">
                          {m.paidAmount.toLocaleString('fr-FR')} € · {m.paymentMethod || '—'}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Bouton "Marquer encaissée" — visible si confirmed && pending */}
                        {m.status === 'confirmed' && m.paymentStatus === 'pending' && (
                          <button
                            onClick={() => setPaidTarget(m)}
                            title="Marquer comme encaissée (client a réglé)"
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-200 hover:bg-emerald-500/20 transition"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Marquer encaissée
                          </button>
                        )}

                        {/* Bouton "Annuler encaissement" — visible si paid */}
                        {m.paymentStatus === 'paid' && (
                          <button
                            onClick={() => revertPaid(m.id)}
                            disabled={revertingId === m.id}
                            title="Annuler le marquage encaissée"
                            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/55 hover:bg-white/10 transition disabled:opacity-50"
                          >
                            {revertingId === m.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                          </button>
                        )}

                        <Link
                          href={`/admin/missions/${encodeURIComponent(m.id)}`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
                        >
                          Ouvrir <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                  );
                })
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

      {/* Modal marquer encaissée — montant pré-rempli = prix client */}
      {paidTarget && (
        <MarkPaidModal
          missionId={paidTarget.id}
          defaultAmount={paidTarget.clientAmount ?? paidTarget.chefAmount}
          chefName={paidTarget.chefName}
          location={paidTarget.location}
          onClose={() => setPaidTarget(null)}
          onSuccess={() => {
            setPaidTarget(null);
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
  accent,
}: {
  title: string;
  value: number;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  accent?: 'emerald';
}) {
  const ring = active
    ? accent === 'emerald'
      ? 'ring-2 ring-emerald-500/40'
      : 'ring-2 ring-white/10'
    : '';
  const valueCls = accent === 'emerald' ? 'text-emerald-200' : 'text-white';
  return (
    <button
      onClick={onClick}
      className={[
        'text-left border rounded-2xl p-4 transition w-full',
        'border-white/10 bg-white/5 hover:bg-white/10',
        ring,
      ].join(' ')}
    >
      <div className="text-sm text-white/70">{title}</div>
      <div className={`text-3xl font-semibold mt-1 ${valueCls}`}>{value}</div>
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

// Badge phase auto basée sur les dates start/end (À venir / En cours / Terminée)
function PhaseBadge({ phase }: { phase: MissionLifecyclePhase }) {
  const styles: Record<string, string> = {
    draft: 'bg-white/10 text-white/55 border-white/15',
    upcoming: 'bg-sky-500/15 text-sky-200 border-sky-500/30',
    in_progress: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    completed: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    cancelled: 'bg-white/10 text-white/55 border-white/15',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold border ${styles[phase]}`}>
      {PHASE_LABELS[phase]}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const s = (status || 'pending').toLowerCase();

  const cls =
    s === 'paid'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
      : s === 'partial'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'refunded'
      ? 'bg-red-500/10 text-red-200 border-red-500/20'
      : 'bg-white/5 text-white/55 border-white/10';

  const label =
    s === 'paid'
      ? '✓ Encaissée'
      : s === 'partial'
      ? 'Partielle'
      : s === 'refunded'
      ? 'Remboursée'
      : 'Pending';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>
      {label}
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
