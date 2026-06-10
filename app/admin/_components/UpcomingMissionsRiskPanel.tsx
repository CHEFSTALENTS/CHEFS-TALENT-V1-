'use client';

// UpcomingMissionsRiskPanel — Missions imminentes (≤ 14j) avec leur niveau
// de risque opérationnel : contrat signé ? NCC signé ?
//
// Affiche un état rouge / ambre / vert par mission, avec lien direct vers
// la fiche. C'est le truc qui empêche Thomas de partir en week-end sans
// savoir qu'une mission part lundi sans contrat.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ArrowRight, Calendar, Loader2, ShieldCheck, FileSignature } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type MissionAtRisk = {
  id: string;
  request_id: string | null;
  chef_name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  client_amount: number | null;
  chef_amount: number | null;
  contract_signed_at?: string | null;
  daysUntilStart: number;
  contractSigned: boolean;
  nccSigned: boolean;
  hasAnyRisk: boolean;
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}`;
}

function urgencyTone(days: number, hasRisk: boolean): {
  border: string; bg: string; text: string; label: string;
} {
  if (!hasRisk) {
    return {
      border: 'border-emerald-400/30',
      bg: 'bg-emerald-400/[0.06]',
      text: 'text-emerald-200',
      label: 'OK',
    };
  }
  if (days <= 3) {
    return {
      border: 'border-red-400/50',
      bg: 'bg-red-400/[0.10]',
      text: 'text-red-200',
      label: `J-${days}`,
    };
  }
  if (days <= 7) {
    return {
      border: 'border-amber-400/40',
      bg: 'bg-amber-400/[0.08]',
      text: 'text-amber-200',
      label: `J-${days}`,
    };
  }
  return {
    border: 'border-white/15',
    bg: 'bg-white/[0.03]',
    text: 'text-white/65',
    label: `J-${days}`,
  };
}

export default function UpcomingMissionsRiskPanel() {
  const [missions, setMissions] = useState<MissionAtRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await adminFetch<{ ok: boolean; missions: MissionAtRisk[] }>(
        '/api/admin/missions/at-risk',
      );
      setMissions(json.missions || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const atRiskCount = missions.filter((m) => m.hasAnyRisk).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <header className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className={`w-4 h-4 ${atRiskCount > 0 ? 'text-red-300' : 'text-white/55'} shrink-0`} />
          <h3 className="text-sm font-semibold text-white">
            Missions imminentes <span className="text-white/45 font-normal">(≤ 14 jours)</span>
          </h3>
          {atRiskCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-red-400/40 bg-red-400/15 text-red-200">
              {atRiskCount} à risque
            </span>
          )}
        </div>
        <Link
          href="/admin/missions?status=upcoming"
          className="text-[11px] text-white/55 hover:text-white inline-flex items-center gap-1"
        >
          Toutes <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {loading ? (
        <div className="px-5 py-6 text-center text-sm text-white/45">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Chargement…
        </div>
      ) : error ? (
        <div className="px-5 py-6 text-center text-sm text-red-200">{error}</div>
      ) : missions.length === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-white/45 inline-flex items-center gap-2 w-full justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          Aucune mission dans les 14 prochains jours.
        </div>
      ) : (
        <ul className="divide-y divide-white/10">
          {missions.map((m) => {
            const tone = urgencyTone(m.daysUntilStart, m.hasAnyRisk);
            const href = `/admin/missions/${encodeURIComponent(m.id)}`;
            return (
              <li key={m.id}>
                <Link href={href} className={`block px-5 py-3 ${tone.bg} hover:bg-white/[0.05] transition border-l-2 ${tone.border}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tone.text} font-semibold`}>
                          {tone.label}
                        </span>
                        <span className="text-xs text-white/65">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {fmtDate(m.start_date)}{m.end_date && m.end_date !== m.start_date ? ` → ${fmtDate(m.end_date)}` : ''}
                        </span>
                        <span className="text-xs text-white/85 truncate">
                          {m.location || '—'} · {m.chef_name || 'Chef non assigné'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className={`inline-flex items-center gap-1 ${m.contractSigned ? 'text-emerald-300' : 'text-red-300'}`}>
                          <FileSignature className="w-3 h-3" />
                          Contrat {m.contractSigned ? '✓ signé' : '✗ NON signé'}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${m.nccSigned ? 'text-emerald-300' : 'text-red-300'}`}>
                          <ShieldCheck className="w-3 h-3" />
                          NCC {m.nccSigned ? '✓ signé' : '✗ NON signé'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/35 shrink-0" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
