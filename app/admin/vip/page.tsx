'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type VipChef = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  planStatus: string;
  planKey?: string;
  paymentMode?: string;
  planEndsAt?: string | null;
  complimentary: boolean;
  complimentaryGrantedAt?: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  daysLeft: number | null;
  createdAt?: string | null;
};

type Breakdown = {
  total: number;
  paid: number;
  complimentary: number;
  activePlan: number;
  pastDue: number;
  cancelled: number;
  expiringSoon: number;
};

type Filter = 'all' | 'paid' | 'complimentary' | 'expiring' | 'past_due' | 'cancelled';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Tous',
  paid: 'Payants',
  complimentary: 'Offerts',
  expiring: 'Expire ≤ 30j',
  past_due: 'Past due',
  cancelled: 'Cancelled',
};

const PLAN_KEY_LABEL: Record<string, string> = {
  vip_3m: 'VIP 3m',
  vip_6m: 'VIP 6m',
  vip_12m: 'VIP 12m',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminVipPage() {
  const [loading, setLoading] = useState(true);
  const [chefs, setChefs] = useState<VipChef[]>([]);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/vip-chefs', {
        headers: { 'x-admin-email': ADMIN_EMAIL },
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.detail || json?.error || `HTTP ${res.status}`);
      } else {
        setChefs(json.chefs || []);
        setBreakdown(json.breakdown || null);
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    let arr = chefs.slice();
    switch (filter) {
      case 'paid':
        arr = arr.filter((c) => !c.complimentary);
        break;
      case 'complimentary':
        arr = arr.filter((c) => c.complimentary);
        break;
      case 'expiring':
        arr = arr.filter(
          (c) => c.daysLeft != null && c.daysLeft >= 0 && c.daysLeft <= 30,
        );
        break;
      case 'past_due':
        arr = arr.filter((c) => c.planStatus === 'past_due');
        break;
      case 'cancelled':
        arr = arr.filter((c) => c.planStatus === 'cancelled');
        break;
      default:
        break;
    }
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (c) =>
          c.email.includes(q) ||
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q),
      );
    }
    return arr;
  }, [chefs, filter, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Chefs VIP</h1>
          <p className="text-sm text-white/50 mt-1">
            Tous les chefs avec un plan pro (payants ou offerts), triés par
            date d’expiration.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Breakdown KPIs */}
      {breakdown && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiSmall label="Total" value={breakdown.total} />
          <KpiSmall label="Payants" value={breakdown.paid} tone="amber" />
          <KpiSmall label="Offerts" value={breakdown.complimentary} tone="green" />
          <KpiSmall label="Actifs" value={breakdown.activePlan} tone="blue" />
          <KpiSmall label="Past due" value={breakdown.pastDue} tone="rose" />
          <KpiSmall label="Cancelled" value={breakdown.cancelled} tone="stone" />
          <KpiSmall label="Expire ≤ 30j" value={breakdown.expiringSoon} tone="amber" />
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                filter === f
                  ? 'border-white/40 bg-white/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="search"
            placeholder="Rechercher email ou nom"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-white/60">Chargement…</div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-white/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Chef</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Fin</th>
                  <th className="px-4 py-3 font-medium">Restant</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-white/50">
                      Aucun chef VIP dans ce filtre.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.userId}
                      className="border-t border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="text-white font-medium flex items-center gap-2">
                          {c.firstName} {c.lastName}
                          {c.complimentary && (
                            <span className="text-[10px] uppercase tracking-widest text-emerald-200 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              ★ Offert
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5 truncate max-w-[260px]">
                          {c.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white">
                          {c.planKey
                            ? PLAN_KEY_LABEL[c.planKey] || c.planKey
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={c.planStatus} />
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {c.complimentary
                          ? '—'
                          : c.paymentMode === 'upfront'
                            ? 'Upfront'
                            : c.paymentMode === 'monthly'
                              ? 'Mensuel'
                              : '—'}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {formatDate(c.planEndsAt)}
                      </td>
                      <td className="px-4 py-3">
                        <DaysLeft days={c.daysLeft} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/chefs/${encodeURIComponent(c.userId)}`}
                          className="text-xs text-white/80 underline-offset-4 hover:underline"
                        >
                          Profil →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-white/5 bg-white/5 px-4 py-2 text-xs text-white/50">
            {filtered.length} chef{filtered.length > 1 ? 's' : ''} affiché
            {filtered.length > 1 ? 's' : ''}{' '}
            {filtered.length !== chefs.length &&
              `(sur ${chefs.length} au total)`}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiSmall({
  label,
  value,
  tone = 'stone',
}: {
  label: string;
  value: number;
  tone?: 'stone' | 'amber' | 'green' | 'blue' | 'rose';
}) {
  const cls =
    tone === 'amber'
      ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
      : tone === 'green'
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
        : tone === 'blue'
          ? 'border-sky-500/20 bg-sky-500/10 text-sky-200'
          : tone === 'rose'
            ? 'border-rose-500/20 bg-rose-500/10 text-rose-200'
            : 'border-white/10 bg-white/5 text-white/80';
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${cls}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">
        {label}
      </div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status || 'unknown';
  const cls =
    s === 'active'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : s === 'past_due'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
        : s === 'cancelled'
          ? 'border-stone-500/30 bg-stone-500/10 text-stone-200'
          : 'border-white/10 bg-white/5 text-white/70';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] border ${cls}`}
    >
      {s}
    </span>
  );
}

function DaysLeft({ days }: { days: number | null }) {
  if (days == null) return <span className="text-white/40">—</span>;
  if (days < 0) return <span className="text-rose-300">expiré</span>;
  const tone =
    days <= 7
      ? 'text-rose-200'
      : days <= 30
        ? 'text-amber-200'
        : 'text-white/70';
  return <span className={tone}>{days}j</span>;
}
