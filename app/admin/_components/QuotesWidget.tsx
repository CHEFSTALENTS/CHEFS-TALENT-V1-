'use client';

// Widget devis pour le dashboard /admin
// Source : /api/admin/quotes/stats?range=90d
//
// Affiche :
//   - Pipeline en vie (draft + sent) en TTC
//   - CA gagné (accepted) en HT
//   - Taux d'acceptation + marge moyenne
//   - Lien vers le dashboard complet /admin/quotes

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type Stats = {
  total: number;
  totalActive?: number;
  truncated?: boolean;
  byStatus: Record<string, number>;
  acceptanceRate: number | null;
  potentialRevenueTtc: number;
  wonRevenueHt: number;
  avgMarginPct: number | null;
};

function fmtEurCompact(n: number): string {
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'EUR',
      notation: 'compact', maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n);
}

export default function QuotesWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await adminFetch<Stats & { ok: boolean }>(
        '/api/admin/quotes/stats?range=90d',
      );
      setStats(json);
    } catch (e: any) {
      console.error('[QuotesWidget] fetch', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const alive = stats ? (stats.byStatus.draft || 0) + (stats.byStatus.sent || 0) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <header className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <FileText className="w-4 h-4 text-sky-300 shrink-0" />
          <h3 className="text-sm font-semibold text-white">Devis (90 derniers jours)</h3>
          {stats?.truncated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-200" title="Plafond atteint — les KPIs sont sous-estimés.">
              ⚠ tronqué
            </span>
          )}
        </div>
        <Link
          href="/admin/quotes"
          className="text-[11px] text-white/55 hover:text-white inline-flex items-center gap-1"
        >
          Dashboard complet <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {loading ? (
        <div className="px-5 py-6 text-center text-sm text-white/45">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Chargement…
        </div>
      ) : !stats ? (
        <div className="px-5 py-6 text-center text-sm text-white/45">
          Données indisponibles
        </div>
      ) : stats.total === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-white/45">
          Aucun devis sur les 90 derniers jours.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-x sm:divide-y-0 divide-white/10">
          <Tile
            label="Pipeline en vie"
            value={`${fmtEurCompact(stats.potentialRevenueTtc)} TTC`}
            sub={`${alive} devis (draft + sent)`}
            tone="sky"
          />
          <Tile
            label="CA gagné"
            value={`${fmtEurCompact(stats.wonRevenueHt)} HT`}
            sub={`${stats.byStatus.accepted || 0} devis acceptés`}
            tone="emerald"
          />
          <Tile
            label="Acceptation"
            value={stats.acceptanceRate !== null ? `${stats.acceptanceRate}%` : '—'}
            sub={`${stats.byStatus.accepted || 0} sur ${(stats.byStatus.accepted || 0) + (stats.byStatus.declined || 0) + (stats.byStatus.expired || 0)} décidés`}
            tone="indigo"
          />
          <Tile
            label="Marge moy."
            value={stats.avgMarginPct !== null ? `${stats.avgMarginPct}%` : '—'}
            sub="sur devis gagnés (HT)"
            tone={
              stats.avgMarginPct === null ? 'mute' :
              stats.avgMarginPct >= 35 ? 'emerald' :
              stats.avgMarginPct >= 25 ? 'amber' : 'red'
            }
          />
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'sky' | 'emerald' | 'indigo' | 'amber' | 'red' | 'mute';
}) {
  const toneCls = {
    sky: 'text-sky-200',
    emerald: 'text-emerald-200',
    indigo: 'text-indigo-200',
    amber: 'text-amber-200',
    red: 'text-red-200',
    mute: 'text-white/55',
  }[tone];
  return (
    <div className="px-5 py-4">
      <div className="text-[10px] text-white/45 uppercase tracking-wider">{label}</div>
      <div className={`text-lg sm:text-xl font-semibold mt-1 ${toneCls}`}>{value}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>
    </div>
  );
}
