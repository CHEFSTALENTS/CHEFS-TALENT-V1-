'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/storage';
// TODO: remplace par ton type réel
// import type { ProposalEntity } from '@/types';

type ProposalEntity = any;

type StatusGroup = 'todo' | 'sent' | 'accepted' | 'closed';

export default function AdminProposalsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProposalEntity[]>([]);
  const [q, setQ] = useState('');
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('todo');

  const refresh = async () => {
    setLoading(true);
    // TODO: adapte la méthode
    const list = await (api.getProposals?.() ?? Promise.resolve([]));
    setItems(list ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const isTodo = (p: ProposalEntity) =>
      ['draft', 'to_send', 'pending'].includes(String(p.status || '').toLowerCase());
    const isSent = (p: ProposalEntity) => String(p.status || '').toLowerCase() === 'sent';
    const isAccepted = (p: ProposalEntity) =>
      ['accepted', 'approved'].includes(String(p.status || '').toLowerCase());
    const isClosed = (p: ProposalEntity) =>
      ['rejected', 'expired', 'closed'].includes(String(p.status || '').toLowerCase());

    return {
      todo: items.filter(isTodo).length,
      sent: items.filter(isSent).length,
      accepted: items.filter(isAccepted).length,
      closed: items.filter(isClosed).length,
      all: items.length,
    };
  }, [items]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const matchStatus = (p: ProposalEntity) => {
      const s = String(p.status || '').toLowerCase();
      if (statusGroup === 'todo') return ['draft', 'to_send', 'pending'].includes(s);
      if (statusGroup === 'sent') return s === 'sent';
      if (statusGroup === 'accepted') return ['accepted', 'approved'].includes(s);
      return ['rejected', 'expired', 'closed'].includes(s);
    };

    const matchSearch = (p: ProposalEntity) => {
      if (!needle) return true;
      // TODO: adapte les champs
      const client = String(p.clientName || p.contact?.company || p.contact?.name || '').toLowerCase();
      const location = String(p.location || '').toLowerCase();
      const chef = String(p.chefName || '').toLowerCase();
      const blob = `${client} ${location} ${chef} ${String(p.status || '')}`;
      return blob.includes(needle);
    };

    const priority = (p: ProposalEntity) => {
      const s = String(p.status || '').toLowerCase();
      if (['draft', 'to_send', 'pending'].includes(s)) return 0;
      if (s === 'sent') return 1;
      if (['accepted', 'approved'].includes(s)) return 2;
      return 3;
    };

    return [...items]
      .filter(matchStatus)
      .filter(matchSearch)
      .sort((a, b) => {
        const pa = priority(a);
        const pb = priority(b);
        if (pa !== pb) return pa - pb;

        const da = new Date(a.createdAt || '').getTime() || 0;
        const db = new Date(b.createdAt || '').getTime() || 0;
        return db - da;
      });
  }, [items, q, statusGroup]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Proposals</h1>
          <p className="text-sm text-white/60 mt-1">
            Suivi des devis envoyés : <span className="text-white/80 font-medium">client</span> •{' '}
            <span className="text-white/80 font-medium">montant</span> •{' '}
            <span className="text-white/80 font-medium">statut</span>.
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
        <Kpi title="À faire" value={counts.todo} hint="draft / pending" active={statusGroup === 'todo'} onClick={() => setStatusGroup('todo')} />
        <Kpi title="Envoyées" value={counts.sent} hint="sent" active={statusGroup === 'sent'} onClick={() => setStatusGroup('sent')} />
        <Kpi title="Acceptées" value={counts.accepted} hint="accepted" active={statusGroup === 'accepted'} onClick={() => setStatusGroup('accepted')} />
        <Kpi title="Closes" value={counts.closed} hint="rejected / expired" active={statusGroup === 'closed'} onClick={() => setStatusGroup('closed')} />
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
            <Segment label="À faire" active={statusGroup === 'todo'} onClick={() => setStatusGroup('todo')} badge={counts.todo} />
            <Segment label="Envoyées" active={statusGroup === 'sent'} onClick={() => setStatusGroup('sent')} badge={counts.sent} />
            <Segment label="Acceptées" active={statusGroup === 'accepted'} onClick={() => setStatusGroup('accepted')} badge={counts.accepted} />
            <Segment label="Closes" active={statusGroup === 'closed'} onClick={() => setStatusGroup('closed')} badge={counts.closed} />
          </div>
        </div>

        <div className="text-xs text-white/45">
          Astuce : garde le focus sur <span className="text-white/70 font-medium">draft</span> →{' '}
          <span className="text-white/70 font-medium">sent</span> →{' '}
          <span className="text-white/70 font-medium">accepted</span>.
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
                <th className="text-left p-3 font-medium">Montant</th>
                <th className="text-left p-3 font-medium">Créé</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Chargement…</td></tr>
              ) : view.length === 0 ? (
                <tr><td className="p-4 text-white/60" colSpan={7}>Aucun devis.</td></tr>
              ) : (
                view.map(p => (
                  <tr key={p.id} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-3">
                      <div className="text-white font-medium leading-tight">
                        {shortText(String(p.clientName || p.contact?.company || p.contact?.name || 'Client'), 40)}
                      </div>
                      {p.contact?.email ? (
                        <div className="text-xs text-white/45 mt-0.5">{shortText(String(p.contact.email), 50)}</div>
                      ) : null}
                    </td>

                    <td className="p-3 text-white/85">{p.location || '—'}</td>
                    <td className="p-3 text-white/85">{p.chefName || '—'}</td>
                    <td className="p-3 text-white/85">{formatMoney(p.total || p.amount || p.price)}</td>
                    <td className="p-3 text-white/70 whitespace-nowrap">{formatDate(p.createdAt)}</td>

                    <td className="p-3">
                      <StatusBadge status={String(p.status || '')} />
                    </td>

                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/proposals/${encodeURIComponent(p.id)}`}
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
    s === 'draft' || s === 'to_send' || s === 'pending'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'sent'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : s === 'accepted' || s === 'approved'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : 'bg-white/10 text-white/60 border-white/10';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>
      {s || '—'}
    </span>
  );
}

/* ---------------- Helpers ---------------- */

function formatMoney(v: any) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

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
