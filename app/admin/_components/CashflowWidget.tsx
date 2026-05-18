'use client';

// Widget cashflow agrégé pour le dashboard /admin.
// Source : /api/admin/cashflow (agrège mission_payments status='pending')
//
// Affiche :
//   - KPIs : Reste à recevoir total / 30 jours / 60 jours / En retard
//   - Liste « À relancer » : échéances overdue avec lien vers la mission
//   - Liste « Prochaines échéances » : 10 prochaines pending non overdue

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Calendar, Clock, Loader2, Wallet } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type CashflowItem = {
  id: string;
  missionId: string;
  amountEur: number;
  dueDate: string;
  label: string | null;
  daysOverdue?: number;
  lastRemindedAt: string | null;
  reminderCount: number;
  mission: {
    id: string;
    location: string | null;
    chefName: string | null;
    requestId: string | null;
    status: string | null;
  } | null;
};

type CashflowData = {
  asOf: string;
  upcoming30: { count: number; totalEur: number };
  upcoming60: { count: number; totalEur: number };
  totalRemaining: number;
  overdue: { count: number; totalEur: number; items: CashflowItem[] };
  upcomingNext10: CashflowItem[];
};

function fmtEur(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export default function CashflowWidget() {
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetchRaw('/api/admin/cashflow');
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setData(json as CashflowData);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement cashflow');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/55 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement cashflow…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
      </div>
    );
  }
  if (!data) return null;

  const hasAny = data.totalRemaining > 0 || data.overdue.count > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Cashflow à venir
          </div>
          <p className="text-xs text-white/45 mt-0.5">Échéances de paiement en attente sur toutes les missions</p>
        </div>
        <button onClick={load} className="text-[11px] text-white/55 hover:text-white underline-offset-2 hover:underline">
          Rafraîchir
        </button>
      </div>

      {!hasAny ? (
        <div className="text-sm text-white/45 italic py-2">
          Aucune échéance en attente. Ajoute un plan de paiement sur une mission pour commencer le suivi.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Kpi label="Total à recevoir" value={fmtEur(data.totalRemaining)} tone="neutral" icon={<Wallet className="w-3.5 h-3.5" />} />
            <Kpi label="Dans 30 jours" value={fmtEur(data.upcoming30.totalEur)} subtitle={`${data.upcoming30.count} échéance${data.upcoming30.count > 1 ? 's' : ''}`} tone="success" icon={<Calendar className="w-3.5 h-3.5" />} />
            <Kpi label="Dans 60 jours" value={fmtEur(data.upcoming60.totalEur)} subtitle={`${data.upcoming60.count} échéance${data.upcoming60.count > 1 ? 's' : ''}`} tone="info" icon={<Clock className="w-3.5 h-3.5" />} />
            <Kpi label="En retard" value={fmtEur(data.overdue.totalEur)} subtitle={`${data.overdue.count} à relancer`} tone={data.overdue.count > 0 ? 'danger' : 'neutral'} icon={<AlertTriangle className="w-3.5 h-3.5" />} />
          </div>

          {/* Liste à relancer (overdue) */}
          {data.overdue.items.length > 0 && (
            <div className="border border-red-400/25 bg-red-400/5 rounded-xl p-3">
              <div className="text-xs font-semibold text-red-200 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                À relancer ({data.overdue.count})
              </div>
              <div className="space-y-1.5">
                {data.overdue.items.slice(0, 10).map((it) => (
                  <CashflowRow key={it.id} item={it} overdue />
                ))}
                {data.overdue.items.length > 10 && (
                  <div className="text-[11px] text-white/45 pt-1">
                    + {data.overdue.items.length - 10} autres…
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liste prochaines échéances */}
          {data.upcomingNext10.length > 0 && (
            <div className="border border-white/10 rounded-xl p-3">
              <div className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Prochaines échéances
              </div>
              <div className="space-y-1.5">
                {data.upcomingNext10.map((it) => (
                  <CashflowRow key={it.id} item={it} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function Kpi({
  label, value, subtitle, tone, icon,
}: {
  label: string; value: string; subtitle?: string;
  tone: 'neutral' | 'success' | 'info' | 'danger'; icon: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: 'border-white/10 bg-white/[0.03] text-white',
    success: 'border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-100',
    info: 'border-sky-400/25 bg-sky-400/[0.05] text-sky-100',
    danger: 'border-red-400/30 bg-red-400/[0.08] text-red-100',
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">
        {icon} {label}
      </div>
      <div className="text-base font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-[10px] opacity-65 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function CashflowRow({ item, overdue }: { item: CashflowItem; overdue?: boolean }) {
  const mission = item.mission;
  const missionLink = mission?.id ? `/admin/missions/${encodeURIComponent(mission.id)}` : null;
  const chefName = mission?.chefName || '—';
  const location = mission?.location || '—';

  return (
    <div className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-2 py-2 rounded-lg ${overdue ? 'bg-red-400/[0.04]' : 'bg-white/[0.02]'}`}>
      <div className="text-xs font-mono text-white/70 min-w-[60px]">{fmtDate(item.dueDate)}</div>
      <div className="min-w-0">
        <div className="text-sm text-white truncate">
          {chefName} · <span className="text-white/55">{location}</span>
        </div>
        {item.label && <div className="text-[10px] text-white/40 truncate">{item.label}</div>}
        {overdue && (
          <div className="text-[10px] text-red-300 mt-0.5">
            +{item.daysOverdue}j de retard
            {item.reminderCount > 0 && ` · ${item.reminderCount} relance${item.reminderCount > 1 ? 's' : ''} déjà envoyée${item.reminderCount > 1 ? 's' : ''}`}
          </div>
        )}
      </div>
      <div className={`text-sm font-semibold ${overdue ? 'text-red-200' : 'text-white'}`}>
        {fmtEur(item.amountEur)}
      </div>
      {missionLink && (
        <Link href={missionLink} className="text-[11px] text-white/55 hover:text-white inline-flex items-center gap-0.5">
          Mission <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
