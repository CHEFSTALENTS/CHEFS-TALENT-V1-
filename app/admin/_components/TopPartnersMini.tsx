'use client';

// TopPartnersMini — petit leaderboard des 5 meilleurs apporteurs du mois
// (commission HT confirmée + pipeline HT en cours). Branche-le sur le
// dashboard /admin pour avoir l'info essentielle en un coup d'œil.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserCheck, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type TopPartner = {
  partner_id: string;
  partner: { id: string; name: string; type: string } | null;
  missions_count: number;
  total_commission_ht_eur: number;
  total_client_ht_eur: number;
  quotes_sent: number;
  quotes_accepted: number;
  quotes_pipeline_ht_eur: number;
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function TopPartnersMini() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<TopPartner[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const json = await adminFetch<{
          ok: boolean;
          topPartners: TopPartner[];
          totals: { commission_ht_eur: number; pipeline_ht_eur: number };
        }>('/api/admin/partners/stats?range=30d');
        if (!mounted) return;
        setPartners((json.topPartners || []).slice(0, 5));
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Erreur');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-300" />
          <h3 className="text-sm font-semibold text-white">Top apporteurs · 30j</h3>
        </div>
        <Link
          href="/admin/partners/season-report"
          className="text-[11px] text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
        >
          Rapport saison <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-white/45">
          <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Chargement…
        </div>
      ) : error ? (
        <div className="py-3 text-xs text-red-200">{error}</div>
      ) : partners.length === 0 ? (
        <div className="py-3 text-xs text-white/45 italic">
          Pas encore de commission générée sur les 30 derniers jours.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {partners.map((p, i) => (
            <li key={p.partner_id}>
              <Link
                href={`/admin/partners/${p.partner_id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                <span className="text-[10px] text-white/45 w-4 text-center font-mono">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{p.partner?.name || '—'}</div>
                  <div className="text-[10px] text-white/45 truncate">
                    {p.missions_count} mission{p.missions_count > 1 ? 's' : ''}
                    {p.quotes_sent > 0 && ` · ${p.quotes_sent} devis en cours`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-emerald-200">{fmtEur(p.total_commission_ht_eur)}</div>
                  {p.quotes_pipeline_ht_eur > 0 && (
                    <div className="text-[10px] text-sky-300 font-mono inline-flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" />
                      {fmtEur(p.quotes_pipeline_ht_eur)}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
