'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type Expected =
  | { type: 'recurring'; interval: 'month' }
  | { type: 'one_time' };

type Row = {
  envName: string;
  label: string;
  priceId: string | null;
  expected: Expected;
  expectedAmountCents: number;
  found: boolean;
  status: 'ok' | 'warning' | 'error';
  issues: string[];
  actualAmountCents?: number | null;
  actualCurrency?: string | null;
  actualType?: 'recurring' | 'one_time' | null;
  actualInterval?: string | null;
  actualIntervalCount?: number | null;
  active?: boolean | null;
  productName?: string | null;
  livemode?: boolean | null;
};

type Summary = {
  total: number;
  ok: number;
  warning: number;
  error: number;
};

type Subscription = {
  id: string;
  customerEmail: string;
  customerId: string;
  planLabel: string;
  priceId: string;
  amountCents: number | null;
  interval: string | null;
  status: string;
  createdAt: string;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  cancelAtDaysFromNow: number | null;
  cancelAtPeriodEnd: boolean;
  hasCancelAt: boolean;
};

type SubsSummary = {
  total: number;
  withCancelAt: number;
  withoutCancelAt: number;
};

function formatEur(cents?: number | null): string {
  if (cents == null) return '—';
  return `${(cents / 100).toFixed(2)} €`;
}

function expectedLabel(e: Expected): string {
  return e.type === 'recurring'
    ? `Récurrent · ${e.interval === 'month' ? 'mensuel' : e.interval}`
    : 'One-time';
}

function actualLabel(r: Row): string {
  if (!r.found) return '—';
  if (r.actualType === 'recurring') {
    const i = r.actualInterval || '?';
    const c = r.actualIntervalCount || 1;
    return c === 1
      ? `Récurrent · ${i === 'month' ? 'mensuel' : i}`
      : `Récurrent · tous les ${c} ${i}s`;
  }
  return 'One-time';
}

export default function StripeDiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [livemode, setLivemode] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [subsSummary, setSubsSummary] = useState<SubsSummary | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetchRaw('/api/admin/stripe/diagnostics');
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.detail || json?.error || `HTTP ${res.status}`);
      } else {
        setRows(json.rows || []);
        setSummary(json.summary || null);
        setLivemode(json.livemode ?? null);
        setGeneratedAt(json.generatedAt || null);
        setSubs(json.subscriptions || []);
        setSubsSummary(json.subsSummary || null);
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Diagnostics Stripe
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Vérification des Price IDs configurés dans Vercel et de leur
            cohérence avec la config attendue (montant, type, interval).
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Rafraîchir
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiSmall label="Total" value={summary.total} tone="stone" />
          <KpiSmall label="OK" value={summary.ok} tone="green" />
          <KpiSmall label="Avertissement" value={summary.warning} tone="amber" />
          <KpiSmall label="Erreur" value={summary.error} tone="rose" />
        </div>
      )}

      {/* Mode banner */}
      {livemode != null && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            livemode
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
          }`}
        >
          {livemode ? (
            <>
              Mode <strong>LIVE</strong> · Les achats des chefs déclencheront
              de vrais paiements.
            </>
          ) : (
            <>
              Mode <strong>TEST</strong> · Les Price IDs configurés sont en
              environnement de test. Pour la production, configure les Prices
              de l'environnement <em>live</em>.
            </>
          )}
          {generatedAt && (
            <span className="ml-2 text-xs opacity-60">
              · Vérifié à {new Date(generatedAt).toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Cards par plan */}
      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((r) => (
            <DiagCard key={r.envName} row={r} />
          ))}
        </div>
      )}

      {loading && !rows.length && (
        <div className="text-sm text-white/60">Chargement…</div>
      )}

      {/* Section Subscriptions actives */}
      <SubscriptionsSection subs={subs} subsSummary={subsSummary} />

      <div className="text-xs text-white/40 leading-relaxed border-l-2 border-white/15 pl-4 max-w-3xl">
        <strong className="text-white/70">Comment lire ce tableau.</strong>{' '}
        Pour chaque plan VIP/Boost, on vérifie que le Price ID configuré
        dans Vercel correspond bien à la config attendue côté Stripe :
        montant en EUR, type (récurrent ou one-time), interval mensuel pour
        les variantes monthly. Si une variante <em>monthly</em> est
        configurée comme <em>one-time</em>, le client paiera une seule fois
        et l'abonnement ne se renouvellera pas — c'est le bug qu'il faut
        attraper avant les premières souscriptions.
      </div>
    </div>
  );
}

function SubscriptionsSection({
  subs,
  subsSummary,
}: {
  subs: Subscription[];
  subsSummary: SubsSummary | null;
}) {
  if (!subsSummary) return null;

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Abonnements actifs
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Liste de toutes les subscriptions Stripe en cours (active /
            past_due / trialing) avec leur date d'annulation programmée.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">
            {subsSummary.total} actives
          </span>
          {subsSummary.withoutCancelAt > 0 && (
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-200">
              {subsSummary.withoutCancelAt} sans cancel_at
            </span>
          )}
        </div>
      </div>

      {subs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
          Aucun abonnement actif pour le moment. Les premières souscriptions
          VIP apparaîtront ici.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-white/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Créé</th>
                  <th className="px-4 py-3 font-medium">Annulation prog.</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Restant
                  </th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const noCancel = !s.hasCancelAt;
                  const isUrgent =
                    s.cancelAtDaysFromNow != null &&
                    s.cancelAtDaysFromNow >= 0 &&
                    s.cancelAtDaysFromNow <= 30;
                  const rowCls = noCancel
                    ? 'border-t border-rose-500/20 bg-rose-500/5'
                    : 'border-t border-white/5';

                  return (
                    <tr key={s.id} className={rowCls}>
                      <td className="px-4 py-3">
                        <div className="text-white truncate max-w-[220px]">
                          {s.customerEmail || s.customerId}
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5 font-mono truncate max-w-[220px]">
                          {s.id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/85">{s.planLabel}</div>
                        <div className="text-[11px] text-white/40 mt-0.5">
                          {s.amountCents != null
                            ? `${(s.amountCents / 100).toFixed(2)} € / ${s.interval || '—'}`
                            : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SubStatus status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {fmtDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {noCancel ? (
                          <span className="text-rose-200 text-xs inline-flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            Pas de cancel_at
                          </span>
                        ) : (
                          <span className="text-white/85">
                            {fmtDate(s.cancelAt)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.cancelAtDaysFromNow == null ? (
                          <span className="text-white/40">—</span>
                        ) : s.cancelAtDaysFromNow < 0 ? (
                          <span className="text-rose-300">expiré</span>
                        ) : (
                          <span
                            className={
                              isUrgent
                                ? 'text-amber-200'
                                : 'text-white/70'
                            }
                          >
                            {s.cancelAtDaysFromNow}j
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {subsSummary.withoutCancelAt > 0 && (
            <div className="px-4 py-3 border-t border-rose-500/20 bg-rose-500/5 text-xs text-rose-200">
              <strong>Attention :</strong> {subsSummary.withoutCancelAt}{' '}
              abonnement{subsSummary.withoutCancelAt > 1 ? 's' : ''} sans{' '}
              <code>cancel_at</code> programmé. Le client sera débité chaque
              mois indéfiniment. Vérifie que le webhook s'est bien exécuté
              au moment de la souscription, ou applique manuellement le
              <code> cancel_at </code>via le dashboard Stripe sur cette
              subscription.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubStatus({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : status === 'past_due'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
        : status === 'trialing'
          ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
          : 'border-white/10 bg-white/5 text-white/70';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] border ${cls}`}
    >
      {status}
    </span>
  );
}

function DiagCard({ row }: { row: Row }) {
  const tone =
    row.status === 'ok'
      ? {
          border: 'border-emerald-500/20',
          bg: 'bg-emerald-500/5',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-300" />,
          label: 'OK',
        }
      : row.status === 'warning'
        ? {
            border: 'border-amber-500/20',
            bg: 'bg-amber-500/5',
            icon: <AlertTriangle className="w-5 h-5 text-amber-300" />,
            label: 'À vérifier',
          }
        : {
            border: 'border-rose-500/20',
            bg: 'bg-rose-500/5',
            icon: <XCircle className="w-5 h-5 text-rose-300" />,
            label: 'Erreur',
          };

  return (
    <div className={`rounded-2xl border ${tone.border} ${tone.bg} p-5`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          {tone.icon}
          <div>
            <div className="text-white font-medium">{row.label}</div>
            <div className="text-xs text-white/50 mt-0.5 font-mono">
              {row.envName}
            </div>
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-widest text-white/60 px-2 py-1 rounded-full border border-white/10 bg-white/5">
          {tone.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
        <Field
          label="Price ID"
          value={row.priceId ? <code className="text-[11px]">{row.priceId}</code> : '—'}
        />
        <Field
          label="Type attendu"
          value={expectedLabel(row.expected)}
        />
        <Field
          label="Type actuel Stripe"
          value={actualLabel(row)}
          tone={
            row.found && row.status !== 'ok' ? 'rose' : 'stone'
          }
        />
        <Field
          label="Montant attendu"
          value={formatEur(row.expectedAmountCents)}
        />
        <Field
          label="Montant Stripe"
          value={formatEur(row.actualAmountCents)}
          tone={
            row.found && row.actualAmountCents !== row.expectedAmountCents
              ? 'rose'
              : 'stone'
          }
        />
        <Field
          label="Statut Stripe"
          value={
            row.found
              ? row.active
                ? 'Actif'
                : 'Archivé'
              : '—'
          }
          tone={row.found && !row.active ? 'rose' : 'stone'}
        />
        {row.productName && (
          <Field label="Produit" value={row.productName} />
        )}
        {row.actualCurrency && (
          <Field
            label="Devise"
            value={row.actualCurrency.toUpperCase()}
            tone={row.actualCurrency !== 'eur' ? 'rose' : 'stone'}
          />
        )}
      </div>

      {row.issues.length > 0 && (
        <div className="space-y-1 mt-3">
          {row.issues.map((issue, i) => (
            <div
              key={i}
              className="text-xs text-white/80 leading-relaxed pl-3 border-l-2 border-rose-500/40"
            >
              {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  tone = 'stone',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'stone' | 'rose';
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div
        className={`text-sm mt-0.5 ${
          tone === 'rose' ? 'text-rose-200' : 'text-white/85'
        }`}
      >
        {value}
      </div>
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
  tone?: 'stone' | 'amber' | 'green' | 'rose';
}) {
  const cls =
    tone === 'amber'
      ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
      : tone === 'green'
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
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
