'use client';

// /admin/leads — Console des leads captés via /guide et autres lead magnets.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Mail, Users } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type Lead = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: 'active' | 'converted' | 'unsubscribed' | 'bounced';
  nurture_step: number;
  last_email_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  created_at: string;
};

type Stats = {
  active: number;
  converted: number;
  unsubscribed: number;
};

const STATUS_LABEL: Record<Lead['status'], string> = {
  active: 'Actif',
  converted: 'Converti',
  unsubscribed: 'Désinscrit',
  bounced: 'Bounce',
};

const STATUS_CLASS: Record<Lead['status'], string> = {
  active: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  converted: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  unsubscribed: 'bg-white/10 text-white/55 border-white/15',
  bounced: 'bg-red-400/15 text-red-200 border-red-400/25',
};

const STEP_LABEL = ['Welcome', 'J+3', 'J+7', 'J+14', 'Fin'];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const json = await adminFetch<{ ok: boolean; leads: Lead[]; stats: Stats }>(
        '/api/admin/leads?limit=200',
      );
      setLeads(json.leads || []);
      setStats(json.stats || null);
    } catch (e: any) {
      console.error('[admin/leads] fetch', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-300" />
          <h1 className="text-xl font-semibold text-white">Leads</h1>
        </div>
        <p className="text-sm text-white/55">
          Prospects captés via /guide et autres lead magnets. Séquence nurture
          automatique : welcome → J+3 → J+7 → J+14.
        </p>
      </header>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Actifs" value={stats.active} className="text-amber-200" />
          <StatCard label="Convertis" value={stats.converted} className="text-emerald-200" />
          <StatCard label="Désinscrits" value={stats.unsubscribed} className="text-white/65" />
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <Mail className="w-4 h-4 text-white/55" />
            Liste ({leads.length})
          </h2>
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </header>

        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : leads.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            Aucun lead pour le moment. Quand quelqu'un téléchargera le guide depuis /guide, il apparaîtra ici.
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {leads.map((l) => (
              <li key={l.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[l.status]}`}>
                      {STATUS_LABEL[l.status]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/65">
                      {l.source}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-400/25 bg-sky-400/15 text-sky-200">
                      {STEP_LABEL[l.nurture_step] || `Step ${l.nurture_step}`}
                    </span>
                    {l.utm_source && (
                      <span className="text-[10px] text-white/45">via {l.utm_source}</span>
                    )}
                  </div>
                  <div className="text-sm text-white/90 truncate mt-0.5">
                    {l.email}
                    {l.name && <span className="text-white/55"> — {l.name}</span>}
                  </div>
                  <div className="text-[11px] text-white/45 mt-0.5">
                    Capté {new Date(l.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    {l.last_email_at && (
                      <>
                        {' · '}dernier email {new Date(l.last_email_at).toLocaleString('fr-FR', { dateStyle: 'short' })}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-white/55 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${className || 'text-white'}`}>{value}</div>
    </div>
  );
}
