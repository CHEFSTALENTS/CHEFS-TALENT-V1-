'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminFetchRaw } from '@/lib/adminFetch';
import {
  Loader2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  BadgeCheck,
  Hourglass,
  Clock,
} from 'lucide-react';

type MissionLite = {
  id: string;
  chef_name: string | null;
  chef_email: string | null;
  location: string | null;
  start_date: string | null;
  chef_amount: number | null;
  client_amount: number | null;
  commission_amount: number | null;
  paid_amount: number | null;
  payment_method: string | null;
  paid_at: string | null;
  confirmed_at: string | null;
};

type Pipeline = {
  ok: boolean;
  missingPaymentColumn: boolean;
  confirmedMonth: { count: number; chefTotalEur: number; commissionEur: number };
  paidMonth: { count: number; chefTotalEur: number; commissionEur: number };
  paidPrevMonth: { count: number; chefTotalEur: number; commissionEur: number };
  pendingPayment: { count: number; chefTotalEur: number; commissionEur: number };
  latestPaid: MissionLite[];
  upcomingToCollect: MissionLite[];
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  sepa: 'SEPA',
  wire: 'Virement',
  stripe: 'Stripe',
  cash: 'Cash',
  check: 'Chèque',
  other: 'Autre',
};

/**
 * Panel « Pipeline missions » sur le dashboard /admin.
 * Affiche en un coup d'œil :
 *   - Entonnoir : confirmées ce mois → encaissées ce mois → en attente
 *     encaissement
 *   - Delta vs mois précédent (TrendingUp/Down)
 *   - 5 dernières encaissées (paid_at desc)
 *   - 5 prochaines à encaisser (confirmed + pending, start_date asc)
 *
 * Sémantique : « Encaissée » = le client a réglé Chefs Talents. Le
 * versement au chef est géré séparément hors-app.
 */
export default function MissionsPipelinePanel() {
  const [data, setData] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetchRaw('/api/admin/missions/pipeline');
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      setData(json);
    } catch (e: any) {
      console.error('[MissionsPipelinePanel] fetch failed', e);
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Delta paid commission vs mois précédent
  const commissionDelta = useMemo(() => {
    if (!data) return null;
    const prev = data.paidPrevMonth.commissionEur;
    const cur = data.paidMonth.commissionEur;
    if (prev === 0 && cur === 0) return null;
    if (prev === 0) return { pct: null, sign: 'up' as const, raw: cur };
    const pct = Math.round(((cur - prev) / prev) * 100);
    return {
      pct,
      sign: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
      raw: cur - prev,
    } as { pct: number; sign: 'up' | 'down' | 'flat'; raw: number };
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center gap-3 text-sm text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement du pipeline missions…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        {error || 'Erreur'}
        <button
          onClick={refresh}
          className="ml-2 underline text-red-100 hover:text-white"
        >
          réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Pipeline missions
          </div>
          <div className="text-xs text-white/45 mt-0.5">
            Suivi du chiffre encaissé / à encaisser pour les missions
            confirmées.
          </div>
        </div>
        <Link
          href="/admin/missions"
          className="inline-flex items-center gap-1.5 text-xs text-white/65 hover:text-white"
        >
          Voir toutes <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Entonnoir */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
        {/* Confirmées ce mois */}
        <StageCard
          label="Confirmées ce mois"
          icon={<Clock className="w-3.5 h-3.5" />}
          tone="amber"
          count={data.confirmedMonth.count}
          totalEur={data.confirmedMonth.chefTotalEur}
          totalLabel="à verser au chef"
          subtitle={`${money(data.confirmedMonth.commissionEur)} commission`}
        />

        {/* Encaissées ce mois (avec delta MoM) */}
        <StageCard
          label="Encaissées ce mois"
          icon={<BadgeCheck className="w-3.5 h-3.5" />}
          tone="emerald"
          count={data.paidMonth.count}
          totalEur={data.paidMonth.chefTotalEur}
          totalLabel="encaissé du client"
          subtitle={`${money(data.paidMonth.commissionEur)} commission`}
          delta={commissionDelta}
          deltaLabel="vs mois précédent"
        />

        {/* En attente encaissement (toutes périodes) */}
        <StageCard
          label="En attente encaissement"
          icon={<Hourglass className="w-3.5 h-3.5" />}
          tone="sky"
          count={data.pendingPayment.count}
          totalEur={data.pendingPayment.chefTotalEur}
          totalLabel="à verser au chef"
          subtitle={`${money(data.pendingPayment.commissionEur)} commission à venir`}
          subtitleAccent
        />
      </div>

      {/* Migration warning si la colonne payment_status n'existe pas */}
      {data.missingPaymentColumn && (
        <div className="px-5 py-3 bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-200">
          ⚠️ La colonne <code className="font-mono">payment_status</code> n'est pas encore migrée.
          Exécute <code className="font-mono">migrations/2026-05-mission-payment.sql</code> dans Supabase Studio.
        </div>
      )}

      {/* 2 listes : dernières encaissées + prochaines à encaisser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
        <MissionList
          title="Dernières encaissées"
          subtitle="Triées par date d'encaissement"
          tone="emerald"
          items={data.latestPaid}
          empty="Aucune mission encaissée pour l'instant."
          variant="paid"
        />
        <MissionList
          title="À encaisser bientôt"
          subtitle="Confirmées en attente de paiement"
          tone="amber"
          items={data.upcomingToCollect}
          empty="Aucune mission en attente de paiement."
          variant="pending"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function StageCard({
  label,
  icon,
  tone,
  count,
  totalEur,
  totalLabel = 'net chef',
  subtitle,
  subtitleAccent,
  delta,
  deltaLabel,
}: {
  label: string;
  icon: React.ReactNode;
  tone: 'amber' | 'emerald' | 'sky';
  count: number;
  totalEur: number;
  totalLabel?: string;
  subtitle?: string;
  subtitleAccent?: boolean;
  delta?: { pct: number | null; sign: 'up' | 'down' | 'flat'; raw: number } | null;
  deltaLabel?: string;
}) {
  const toneCls = {
    amber: 'text-amber-200',
    emerald: 'text-emerald-200',
    sky: 'text-sky-200',
  }[tone];

  const iconBg = {
    amber: 'bg-amber-500/15 border-amber-500/20',
    emerald: 'bg-emerald-500/15 border-emerald-500/20',
    sky: 'bg-sky-500/15 border-sky-500/20',
  }[tone];

  return (
    <div className="bg-[#161616] p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full border flex items-center justify-center ${iconBg} ${toneCls}`}
          >
            {icon}
          </div>
          <div className="text-xs text-white/65 uppercase tracking-widest">
            {label}
          </div>
        </div>
        {delta && (
          <div className="flex items-center gap-1 text-xs">
            <DeltaIcon sign={delta.sign} />
            <span
              className={
                delta.sign === 'up'
                  ? 'text-emerald-300'
                  : delta.sign === 'down'
                    ? 'text-red-300'
                    : 'text-white/45'
              }
            >
              {delta.pct != null
                ? `${delta.pct > 0 ? '+' : ''}${delta.pct}%`
                : 'nouveau'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className={`text-3xl font-semibold ${toneCls}`}>
          {count}
        </div>
        <div className="text-sm text-white/55">
          mission{count > 1 ? 's' : ''}
        </div>
      </div>

      <div className="text-sm text-white/80 font-medium">
        {money(totalEur)}{' '}
        <span className="text-xs text-white/45">{totalLabel}</span>
      </div>

      {subtitle && (
        <div
          className={`text-[11px] ${subtitleAccent ? toneCls : 'text-white/45'}`}
        >
          {subtitle}
        </div>
      )}

      {deltaLabel && delta && (
        <div className="text-[10px] text-white/35 mt-0.5">{deltaLabel}</div>
      )}
    </div>
  );
}

function DeltaIcon({ sign }: { sign: 'up' | 'down' | 'flat' }) {
  if (sign === 'up') return <TrendingUp className="w-3 h-3 text-emerald-300" />;
  if (sign === 'down') return <TrendingDown className="w-3 h-3 text-red-300" />;
  return <Minus className="w-3 h-3 text-white/45" />;
}

function MissionList({
  title,
  subtitle,
  tone,
  items,
  empty,
  variant,
}: {
  title: string;
  subtitle: string;
  tone: 'emerald' | 'amber';
  items: MissionLite[];
  empty: string;
  variant: 'paid' | 'pending';
}) {
  return (
    <div className="bg-[#161616] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-[11px] text-white/45 mt-0.5">{subtitle}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-white/45 py-6 text-center">{empty}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
            >
              <Link
                href={`/admin/missions/${encodeURIComponent(m.id)}`}
                className="block"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white font-medium truncate">
                      {m.chef_name || m.chef_email || '—'}
                    </div>
                    <div className="text-xs text-white/55 mt-0.5 flex flex-wrap items-center gap-x-2">
                      {m.location && <span>{m.location}</span>}
                      {variant === 'paid' && m.paid_at && (
                        <>
                          <span className="text-white/25">·</span>
                          <span>{fmtDate(m.paid_at)}</span>
                        </>
                      )}
                      {variant === 'paid' && m.payment_method && (
                        <>
                          <span className="text-white/25">·</span>
                          <span>
                            {PAYMENT_METHOD_LABELS[m.payment_method] ||
                              m.payment_method}
                          </span>
                        </>
                      )}
                      {variant === 'pending' && m.start_date && (
                        <>
                          <span className="text-white/25">·</span>
                          <span>Le {fmtDate(m.start_date)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div
                      className={`text-sm font-semibold ${
                        tone === 'emerald'
                          ? 'text-emerald-200'
                          : 'text-amber-200'
                      }`}
                    >
                      {money(
                        variant === 'paid'
                          ? // Pour les encaissées : montant client encaissé
                            Number(m.paid_amount || m.client_amount || 0)
                          : // Pour les à encaisser : prix client (à recevoir)
                            Number(m.client_amount || m.chef_amount || 0),
                      )}
                    </div>
                    {m.commission_amount != null &&
                      m.commission_amount > 0 && (
                        <div className="text-[10px] text-white/45 mt-0.5">
                          +{money(Number(m.commission_amount))} comm.
                        </div>
                      )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function money(n: number): string {
  if (!Number.isFinite(n)) return '0 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}
