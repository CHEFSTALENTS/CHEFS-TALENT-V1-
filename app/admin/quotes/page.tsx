'use client';

// /admin/quotes — Dashboard pipeline commercial des devis.
// KPIs en haut + table filtrable + lien vers la fiche request de chaque devis.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, FileText, Sparkles, TrendingUp, Filter, Brain, Plus, MoreHorizontal } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import { computeMarginsPerOption, computeTotalCosts, getMarginTone, fmtEur } from '@/lib/quotes/margin';
import ChangeQuoteStatusModal from '@/app/admin/_components/ChangeQuoteStatusModal';
import ImportExternalQuoteModal from '@/app/admin/_components/ImportExternalQuoteModal';

type QuoteListItem = {
  id: string;
  reference: string;
  request_id: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  issued_at: string;
  validity_date: string | null;
  intitule: string | null;
  lieu: string | null;
  dates_text: string | null;
  convives_text: string | null;
  destinataire_nom: string | null;
  destinataire_type: string | null;
  tariff_options: Array<{ label: string; ht_eur: number; tva_eur: number; ttc_eur: number }> | null;
  chef_cost_eur: number | null;
  chef_travel_cost_eur: number | null;
  butler_required: boolean;
  butler_cost_eur: number | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  // Workflow / négo
  final_amount_ht_eur?: number | null;
  final_amount_ttc_eur?: number | null;
  status_reason?: string | null;
  is_external?: boolean | null;
  external_origin?: string | null;
};

type Stats = {
  total: number;
  byStatus: Record<string, number>;
  acceptanceRate: number | null;
  potentialRevenueTtc: number;
  wonRevenueHt: number;
  wonRevenueTtc: number;
  avgMarginEur: number | null;
  avgMarginPct: number | null;
  avgResponseDays: number | null;
  monthly: Record<string, { created: number; accepted: number; revenueHt: number }>;
  topDestinataires: Array<{ name: string; count: number; won: number; revenueHt: number }>;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  declined: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
};

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  sent: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
  accepted: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  declined: 'bg-red-400/15 text-red-200 border-red-400/25',
  expired: 'bg-white/10 text-white/55 border-white/15',
  cancelled: 'bg-white/10 text-white/55 border-white/15',
};

const TONE_CLASS: Record<ReturnType<typeof getMarginTone>, string> = {
  great: 'text-emerald-200',
  good: 'text-sky-200',
  ok: 'text-amber-200',
  low: 'text-red-200',
  loss: 'text-red-100 font-semibold',
  unknown: 'text-white/45',
};

const RANGES = [
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'ytd', label: 'Année' },
  { value: 'all', label: 'Tout' },
];

export default function AdminQuotesDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<string>('90d');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [importingExternal, setImportingExternal] = useState(false);
  const [statusEditFor, setStatusEditFor] = useState<QuoteListItem | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const statsJson = await adminFetch<{ ok: boolean; stats?: any } & Stats>(
        `/api/admin/quotes/stats?range=${encodeURIComponent(range)}`,
      );
      setStats(statsJson as any);

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchInput) params.set('q', searchInput);
      params.set('limit', '200');
      const listJson = await adminFetch<{ ok: boolean; quotes: QuoteListItem[] }>(
        `/api/admin/quotes?${params.toString()}`,
      );
      setQuotes(listJson.quotes || []);
    } catch (e: any) {
      console.error('[admin/quotes] fetch', e);
    } finally {
      setLoading(false);
    }
  }, [range, statusFilter, searchInput]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Petit bar chart "volume par mois" : on calcule le max pour normaliser.
  const monthlyEntries = useMemo(() => {
    if (!stats?.monthly) return [];
    return Object.entries(stats.monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
  }, [stats]);
  const monthlyMax = useMemo(
    () => Math.max(1, ...monthlyEntries.map(([, m]) => m.created)),
    [monthlyEntries],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white inline-flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-300" />
            Devis
          </h1>
          <p className="text-sm text-white/55">Pipeline commercial, KPIs et historique</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs ${
                  range === r.value
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/55 hover:text-white/85'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setImportingExternal(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 text-xs text-amber-200 hover:bg-amber-400/20"
            title="Tracker dans les KPIs un devis traité hors plateforme (Word, téléphone, etc.)"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Importer un devis externe
          </button>
          <Link
            href="/admin/quotes/memories"
            className="inline-flex items-center px-3 py-1.5 rounded-xl border border-indigo-400/30 bg-indigo-400/10 text-xs text-indigo-200 hover:bg-indigo-400/20"
            title="Voir ce que l'agent commercial a appris"
          >
            <Brain className="w-3.5 h-3.5 mr-1.5" />
            Mémoires agent
          </Link>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </div>
      </header>

      {/* KPIs */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Pipeline en vie"
            value={fmtEurCompact(stats.potentialRevenueTtc)}
            sub={`${(stats.byStatus.draft || 0) + (stats.byStatus.sent || 0)} devis (draft+sent)`}
            tone="sky"
          />
          <KpiCard
            label="CA gagné"
            value={fmtEurCompact(stats.wonRevenueHt)}
            sub={`${stats.byStatus.accepted || 0} devis acceptés (HT)`}
            tone="emerald"
          />
          <KpiCard
            label="Taux d'acceptation"
            value={stats.acceptanceRate !== null ? `${stats.acceptanceRate}%` : '—'}
            sub={`${stats.byStatus.accepted || 0} sur ${(stats.byStatus.accepted || 0) + (stats.byStatus.declined || 0) + (stats.byStatus.expired || 0)} décidés`}
            tone="indigo"
          />
          <KpiCard
            label="Marge moyenne"
            value={stats.avgMarginPct !== null ? `${stats.avgMarginPct}%` : '—'}
            sub={stats.avgMarginEur !== null ? `≈ ${fmtEurCompact(stats.avgMarginEur)} / devis gagné` : 'Pas de données'}
            tone={
              stats.avgMarginPct === null ? 'mute' :
              stats.avgMarginPct >= 35 ? 'emerald' :
              stats.avgMarginPct >= 25 ? 'amber' : 'red'
            }
          />
        </section>
      )}

      {/* Sous-KPIs : temps réponse + statut counts */}
      {stats && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-1">
            <div className="text-xs text-white/55 uppercase tracking-wider">Temps moyen de réponse client</div>
            <div className="text-2xl font-semibold text-white">
              {stats.avgResponseDays !== null ? `${stats.avgResponseDays} j` : '—'}
            </div>
            <div className="text-xs text-white/40">Envoyé → accepté (basé sur devis acceptés)</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-xs text-white/55 uppercase tracking-wider mb-3">Répartition par statut</div>
            <div className="space-y-1.5">
              {(['draft', 'sent', 'accepted', 'declined', 'expired'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/5 ${
                    statusFilter === s ? 'bg-white/5' : ''
                  }`}
                >
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[s]}`}>
                    {STATUS_LABEL[s]}
                  </span>
                  <span className="text-white/75 font-mono">{stats.byStatus[s] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Volume par mois (mini bar chart) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-xs text-white/55 uppercase tracking-wider mb-3">Volume par mois</div>
            <div className="flex items-end gap-1 h-20">
              {monthlyEntries.length === 0 ? (
                <div className="text-xs text-white/40 italic">Pas de données</div>
              ) : (
                monthlyEntries.map(([month, m]) => {
                  const totalH = Math.round((m.created / monthlyMax) * 100);
                  const acceptedH = Math.round((m.accepted / monthlyMax) * 100);
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-0.5" title={`${month} : ${m.created} créés / ${m.accepted} acceptés / ${fmtEurCompact(m.revenueHt)} HT`}>
                      <div className="w-full flex-1 flex items-end relative">
                        <div
                          className="w-full bg-white/15 rounded-t-sm absolute bottom-0"
                          style={{ height: `${totalH}%` }}
                        />
                        <div
                          className="w-full bg-emerald-400/65 rounded-t-sm absolute bottom-0"
                          style={{ height: `${acceptedH}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-white/40 font-mono">{month.slice(5)}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="text-[10px] text-white/40 mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-white/30 rounded-sm" /> Créés
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400/65 rounded-sm" /> Acceptés
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Top destinataires */}
      {stats && stats.topDestinataires.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
          <header className="px-5 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white/55" />
              Top destinataires (par CA gagné)
            </h2>
          </header>
          <ul className="divide-y divide-white/10">
            {stats.topDestinataires.map((d, i) => (
              <li key={i} className="px-5 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white/85 truncate">{d.name}</div>
                  <div className="text-[11px] text-white/45">
                    {d.count} devis · {d.won} gagnés ({d.count > 0 ? Math.round((d.won / d.count) * 100) : 0}%)
                  </div>
                </div>
                <div className="font-mono text-sm text-emerald-200">{fmtEurCompact(d.revenueHt)} HT</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Liste devis avec filtres */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <header className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/55" />
            Devis ({quotes.length}{statusFilter ? ` · ${STATUS_LABEL[statusFilter]}` : ''})
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher (réf, destinataire, lieu, intitulé)…"
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white placeholder:text-white/30 w-64"
            />
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="text-xs text-white/55 hover:text-white underline underline-offset-2"
              >
                Effacer filtre statut
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : quotes.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            Aucun devis sur cette plage.
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {quotes.map((q) => (
              <QuoteRow key={q.id} q={q} onChangeStatus={() => setStatusEditFor(q)} />
            ))}
          </ul>
        )}
      </section>

      {/* Modal : changer statut */}
      {statusEditFor && (
        <ChangeQuoteStatusModal
          quoteId={statusEditFor.id}
          currentStatus={statusEditFor.status}
          currentReason={statusEditFor.status_reason || null}
          currentFinalHt={statusEditFor.final_amount_ht_eur ?? null}
          currentFinalTtc={statusEditFor.final_amount_ttc_eur ?? null}
          onClose={() => setStatusEditFor(null)}
          onSaved={() => {
            setStatusEditFor(null);
            fetchAll();
          }}
        />
      )}

      {/* Modal : importer un devis externe */}
      {importingExternal && (
        <ImportExternalQuoteModal
          onClose={() => setImportingExternal(false)}
          onCreated={() => {
            setImportingExternal(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Composants
// ────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone: 'sky' | 'emerald' | 'indigo' | 'amber' | 'red' | 'mute';
}) {
  const toneCls = {
    sky: 'from-sky-500/10 to-white/5',
    emerald: 'from-emerald-500/10 to-white/5',
    indigo: 'from-indigo-500/10 to-white/5',
    amber: 'from-amber-500/10 to-white/5',
    red: 'from-red-500/10 to-white/5',
    mute: 'from-white/5 to-white/5',
  }[tone];
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-b ${toneCls} p-4`}>
      <div className="text-xs text-white/55 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
      {sub && <div className="text-[11px] text-white/45 mt-1 truncate">{sub}</div>}
    </div>
  );
}

function QuoteRow({ q, onChangeStatus }: { q: QuoteListItem; onChangeStatus: () => void }) {
  const margins = useMemo(() => {
    return computeMarginsPerOption(q.tariff_options || [], {
      chefCostEur: q.chef_cost_eur,
      chefTravelCostEur: q.chef_travel_cost_eur,
      butlerRequired: q.butler_required,
      butlerCostEur: q.butler_cost_eur,
    });
  }, [q]);
  const costs = computeTotalCosts({
    chefCostEur: q.chef_cost_eur,
    chefTravelCostEur: q.chef_travel_cost_eur,
    butlerRequired: q.butler_required,
    butlerCostEur: q.butler_cost_eur,
  });
  const avgMargin = margins.length > 0
    ? margins.reduce((s, m) => s + (m.marginPct ?? 0), 0) / margins.length
    : null;
  const tone = getMarginTone(avgMargin);

  // Montant à afficher : final négocié si dispo, sinon moyenne TTC tariff_options
  const displayAmount = q.final_amount_ttc_eur ?? (
    q.tariff_options && q.tariff_options.length > 0
      ? q.tariff_options.reduce((s, o) => s + (Number(o.ttc_eur) || 0), 0) / q.tariff_options.length
      : null
  );
  const amountLabel = q.final_amount_ttc_eur !== null && q.final_amount_ttc_eur !== undefined ? 'TTC final' : 'TTC moy.';

  const detailHref = q.request_id ? `/admin/requests/${encodeURIComponent(q.request_id)}#quote` : null;

  return (
    <li className="px-5 py-3 hover:bg-white/[0.03] transition">
      <div className="flex items-center justify-between gap-3">
        {/* Bloc texte (cliquable → fiche request) */}
        {detailHref ? (
          <Link href={detailHref} className="min-w-0 flex-1 space-y-0.5">
            <RowContent q={q} />
          </Link>
        ) : (
          <div className="min-w-0 flex-1 space-y-0.5">
            <RowContent q={q} />
          </div>
        )}

        {/* Montant + marge */}
        <div className="shrink-0 text-right">
          {displayAmount !== null && (
            <div className="font-mono text-xs text-white/75">
              {fmtEurCompact(displayAmount)}
              <span className="text-white/40 text-[10px] ml-1">{amountLabel}</span>
            </div>
          )}
          {costs.totalCostsEur > 0 && avgMargin !== null && (
            <div className={`font-mono text-[10px] ${TONE_CLASS[tone]} mt-0.5`}>
              marge {Math.round(avgMargin * 10) / 10}%
            </div>
          )}
        </div>

        {/* Bouton changer statut */}
        <button
          onClick={onChangeStatus}
          className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/55 hover:text-white"
          title="Changer le statut"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}

function RowContent({ q }: { q: QuoteListItem }) {
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[q.status]}`}>
          {STATUS_LABEL[q.status]}
        </span>
        <span className="text-[10px] text-white/45 font-mono">{q.reference}</span>
        {q.is_external && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-200" title={q.external_origin || 'Devis importé hors plateforme'}>
            ext.
          </span>
        )}
        <span className="text-[10px] text-white/40">
          {new Date(q.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
      <div className="text-sm text-white/85 truncate">{q.intitule || '—'}</div>
      <div className="text-[11px] text-white/55">
        {[q.destinataire_nom, q.lieu, q.dates_text, q.convives_text].filter(Boolean).join(' · ') || '—'}
      </div>
      {q.status_reason && (
        <div className="text-[10px] text-white/45 italic mt-0.5 truncate" title={q.status_reason}>
          « {q.status_reason} »
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function fmtEurCompact(n: number): string {
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'EUR',
      notation: 'compact', maximumFractionDigits: 1,
    }).format(n);
  }
  return fmtEur(n);
}
