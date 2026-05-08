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

const ADMIN_EMAIL = 'thomas@chef-talents.com';

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

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stripe/diagnostics', {
        headers: { 'x-admin-email': ADMIN_EMAIL },
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.detail || json?.error || `HTTP ${res.status}`);
      } else {
        setRows(json.rows || []);
        setSummary(json.summary || null);
        setLivemode(json.livemode ?? null);
        setGeneratedAt(json.generatedAt || null);
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
