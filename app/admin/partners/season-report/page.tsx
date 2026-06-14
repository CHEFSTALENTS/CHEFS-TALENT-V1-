'use client';

// /admin/partners/season-report — Rapport fin de saison
// Classement apporteurs + répartition source/destination + dormants

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ChevronLeft, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';

type TopPartner = {
  partner_id: string;
  partner: { id: string; name: string; type: string } | null;
  missions_count: number;
  total_commission_ht_eur: number;
  total_client_ht_eur: number;
};

type BySource = { source: string; count: number; total_commission_ht_eur: number; total_client_ht_eur: number };
type ByDestination = { destination: string; count: number; total_commission_ht_eur: number };
type Dormant = { id: string; name: string; type: string; last_contact_at: string | null; days_since_last_contact: number | null };

type Stats = {
  range: string;
  fromIso: string | null;
  toIso: string | null;
  dormantThresholdDays: number;
  totals: { missions: number; cancelled: number; commission_ht_eur: number; client_ht_eur: number };
  topPartners: TopPartner[];
  bySource: BySource[];
  byDestination: ByDestination[];
  dormants: Dormant[];
};

const SOURCE_LABEL: Record<string, string> = {
  partner: 'Apporteur',
  google_ads: 'Google Ads',
  direct: 'Direct',
  word_of_mouth: 'Bouche-à-oreille',
  press: 'Presse',
  other: 'Autre',
  unknown: 'Non renseigné',
};

const RANGES = [
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'ytd', label: 'Année en cours' },
  { value: 'all', label: 'Tout' },
];

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

export default function SeasonReportPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('ytd');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const json = await adminFetch<Stats & { ok: boolean }>(`/api/admin/partners/stats?range=${range}`);
      setStats(json);
    } catch (e: any) {
      console.error('[season-report]', e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExport = async (view: 'partners' | 'missions' | 'interactions') => {
    const r = await adminFetchRaw(`/api/admin/partners/export?view=${view}&range=${range}`);
    if (!r.ok) {
      alert('Export échoué');
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${view}-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link href="/admin/partners" className="inline-flex items-center gap-1 text-xs text-white/55 hover:text-white">
            <ChevronLeft className="w-3 h-3" />
            Tous les apporteurs
          </Link>
          <h1 className="text-xl font-semibold text-white inline-flex items-center gap-2 mt-2">
            <TrendingUp className="w-5 h-5 text-indigo-300" />
            Rapport saison
          </h1>
          <p className="text-sm text-white/55">Classement apporteurs · source · destination · dormants. Commission HT.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs ${range === r.value ? 'bg-white/10 text-white font-medium' : 'text-white/55 hover:text-white/85'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleExport('partners')}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            CSV apporteurs
          </button>
          <button
            onClick={() => handleExport('missions')}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            CSV missions
          </button>
        </div>
      </header>

      {loading || !stats ? (
        <div className="text-sm text-white/55 text-center py-8">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Chargement…
        </div>
      ) : (
        <>
          {/* Totaux */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Missions" value={stats.totals.missions} sub={`${stats.totals.cancelled} annulées exclues`} />
            <Kpi label="Commission HT" value={fmtEur(stats.totals.commission_ht_eur)} sub="cumul période" tone="violet" />
            <Kpi label="CA client HT" value={fmtEur(stats.totals.client_ht_eur)} sub="cumul période" tone="emerald" />
            <Kpi label="Dormants" value={stats.dormants.length} sub={`apporteurs > ${stats.dormantThresholdDays}j`} tone={stats.dormants.length > 0 ? 'amber' : 'mute'} />
          </section>

          {/* Top apporteurs */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <header className="px-5 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Top apporteurs (commission HT)</h2>
            </header>
            {stats.topPartners.length === 0 ? (
              <div className="px-5 py-6 text-sm text-white/45 text-center">Aucun apporteur n'a généré de mission sur cette période.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {stats.topPartners.map((p, i) => (
                  <li key={p.partner_id}>
                    <Link
                      href={`/admin/partners/${encodeURIComponent(p.partner_id)}`}
                      className="block px-5 py-3 hover:bg-white/[0.03] transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg font-serif text-white/55 w-6 text-center">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate">{p.partner?.name || '(inconnu)'}</div>
                            <div className="text-[10px] text-white/45">
                              {p.missions_count} mission{p.missions_count > 1 ? 's' : ''} · CA client {fmtEur(p.total_client_ht_eur)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm text-emerald-200">{fmtEur(p.total_commission_ht_eur)}</div>
                          <div className="text-[10px] text-white/40">commission HT</div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Répartitions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Par source */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <header className="px-5 py-3 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white">Par canal d'acquisition</h2>
              </header>
              {stats.bySource.length === 0 ? (
                <div className="px-5 py-6 text-sm text-white/45 text-center">Aucune mission sur la période.</div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {stats.bySource.map((s) => (
                    <li key={s.source} className="px-5 py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-white">{SOURCE_LABEL[s.source] || s.source}</div>
                        <div className="text-[10px] text-white/45">{s.count} mission{s.count > 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-emerald-200">{fmtEur(s.total_commission_ht_eur)}</div>
                        <div className="text-[10px] text-white/40">commission HT</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Par destination */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
              <header className="px-5 py-3 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white">Par destination</h2>
              </header>
              {stats.byDestination.length === 0 ? (
                <div className="px-5 py-6 text-sm text-white/45 text-center">—</div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {stats.byDestination.slice(0, 10).map((d) => (
                    <li key={d.destination} className="px-5 py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-white">{d.destination}</div>
                        <div className="text-[10px] text-white/45">{d.count} mission{d.count > 1 ? 's' : ''}</div>
                      </div>
                      <div className="font-mono text-sm text-emerald-200">{fmtEur(d.total_commission_ht_eur)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Dormants */}
          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04]">
            <header className="px-5 py-3 border-b border-amber-400/20 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-amber-100 inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Apporteurs dormants
              </h2>
              <span className="text-[11px] text-amber-200/65">
                Ayant déjà apporté mais sans contact depuis &gt; {stats.dormantThresholdDays} jours
              </span>
            </header>
            {stats.dormants.length === 0 ? (
              <div className="px-5 py-6 text-sm text-amber-200/75 text-center">Aucun apporteur dormant. 🎉</div>
            ) : (
              <ul className="divide-y divide-amber-400/15">
                {stats.dormants.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/partners/${encodeURIComponent(d.id)}`}
                      className="block px-5 py-2.5 hover:bg-amber-400/[0.06] transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm text-white">{d.name}</div>
                        <div className="text-[10px] text-amber-200/65">
                          {d.last_contact_at ? `dernier contact il y a ${d.days_since_last_contact}j` : 'jamais contacté en interaction loguée'}
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-200/85 underline">À relancer →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({
  label, value, sub, tone = 'indigo',
}: {
  label: string; value: string | number; sub: string; tone?: 'indigo' | 'emerald' | 'violet' | 'sky' | 'amber' | 'mute';
}) {
  const toneCls = {
    indigo: 'from-indigo-500/10 to-white/5',
    emerald: 'from-emerald-500/10 to-white/5',
    violet: 'from-violet-500/10 to-white/5',
    sky: 'from-sky-500/10 to-white/5',
    amber: 'from-amber-500/15 to-white/5',
    mute: 'from-white/5 to-white/5',
  }[tone];
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-b ${toneCls} p-4`}>
      <div className="text-xs text-white/55 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
      <div className="text-[11px] text-white/45 mt-1 truncate">{sub}</div>
    </div>
  );
}
