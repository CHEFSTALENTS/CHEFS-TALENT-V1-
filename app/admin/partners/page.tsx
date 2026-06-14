'use client';

// /admin/partners — Liste des apporteurs (CRM)
// KPIs + filtres + liste cliquable.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Users, Plus, Download, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';
import AddPartnerModal from './_components/AddPartnerModal';

type Partner = {
  id: string;
  name: string;
  type: string;
  status: string;
  destinations: string[] | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company: string | null;
  notes: string | null;
  language: string | null;
  acquisition_source: string | null;
  linked_chef_email: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  created_at: string;
  // Enriched
  missions_count: number;
  total_commission_ht_eur: number;
  total_client_ht_eur: number;
  computed_dormant: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  concierge: 'Conciergerie',
  villa_manager: 'Villa manager',
  yacht_manager: 'Yacht manager',
  travel_planner: 'Travel planner',
  apporteur_indep: 'Apporteur indép.',
  chef: 'Chef partenaire',
  client_direct: 'Client direct',
  other: 'Autre',
};

const TYPE_TONE: Record<string, string> = {
  concierge: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
  villa_manager: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  yacht_manager: 'bg-blue-400/15 text-blue-200 border-blue-400/25',
  travel_planner: 'bg-violet-400/15 text-violet-200 border-violet-400/25',
  apporteur_indep: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  chef: 'bg-orange-400/15 text-orange-200 border-orange-400/25',
  client_direct: 'bg-indigo-400/15 text-indigo-200 border-indigo-400/25',
  other: 'bg-white/10 text-white/65 border-white/15',
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [destinationFilter, setDestinationFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dormantThresholdDays, setDormantThresholdDays] = useState(90);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (destinationFilter) params.set('destination', destinationFilter);
      if (search) params.set('q', search);
      const json = await adminFetch<{ ok: boolean; partners: Partner[]; dormantThresholdDays: number }>(
        `/api/admin/partners?${params.toString()}`,
      );
      setPartners(json.partners || []);
      setDormantThresholdDays(json.dormantThresholdDays || 90);
    } catch (e: any) {
      console.error('[admin/partners] fetch', e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, destinationFilter, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // KPIs agrégés
  const kpis = useMemo(() => {
    const total = partners.length;
    const active = partners.filter((p) => p.status === 'active').length;
    const dormants = partners.filter((p) => p.computed_dormant).length;
    const totalCommission = partners.reduce((s, p) => s + (p.total_commission_ht_eur || 0), 0);
    const totalMissions = partners.reduce((s, p) => s + (p.missions_count || 0), 0);
    return { total, active, dormants, totalCommission, totalMissions };
  }, [partners]);

  // Toutes les destinations connues (pour le filtre)
  const allDestinations = useMemo(() => {
    const set = new Set<string>();
    for (const p of partners) {
      for (const d of p.destinations || []) set.add(d);
    }
    return Array.from(set).sort();
  }, [partners]);

  const handleExport = async (view: 'partners' | 'missions' | 'interactions') => {
    const r = await adminFetchRaw(`/api/admin/partners/export?view=${view}`);
    if (!r.ok) {
      alert('Export échoué');
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${view}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white inline-flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-300" />
            Apporteurs / CRM
          </h1>
          <p className="text-sm text-white/55">
            Annuaire + tracking commissions. Seuil dormant : {dormantThresholdDays} jours.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/partners/season-report"
            className="inline-flex items-center px-3 py-2 rounded-xl border border-indigo-400/30 bg-indigo-400/10 text-xs text-indigo-200 hover:bg-indigo-400/20"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Rapport saison
          </Link>
          <button
            onClick={() => handleExport('partners')}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
            title="Export CSV de tous les apporteurs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3 py-2 rounded-xl bg-indigo-400 text-indigo-950 text-sm font-medium hover:bg-indigo-300"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nouvel apporteur
          </button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total" value={kpis.total} sub="Apporteurs" tone="indigo" />
        <KpiCard label="Actifs" value={kpis.active} sub={`${kpis.total - kpis.active} archivés/dormants`} tone="emerald" />
        <KpiCard
          label="Dormants"
          value={kpis.dormants}
          sub={`> ${dormantThresholdDays}j sans contact`}
          tone={kpis.dormants > 0 ? 'amber' : 'mute'}
        />
        <KpiCard
          label="Missions apportées"
          value={kpis.totalMissions}
          sub="Toutes périodes (hors annulées)"
          tone="sky"
        />
        <KpiCard
          label="Commission HT"
          value={fmtEur(kpis.totalCommission)}
          sub="Cumul tous apporteurs"
          tone="violet"
        />
      </section>

      {/* Filtres */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-3 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white"
        >
          <option value="" className="bg-neutral-900">Tous les types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k} className="bg-neutral-900">{v}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white"
        >
          <option value="" className="bg-neutral-900">Tous les statuts</option>
          <option value="active" className="bg-neutral-900">Actif</option>
          <option value="dormant" className="bg-neutral-900">Dormant</option>
          <option value="archived" className="bg-neutral-900">Archivé</option>
        </select>
        {allDestinations.length > 0 && (
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white"
          >
            <option value="" className="bg-neutral-900">Toutes destinations</option>
            {allDestinations.map((d) => (
              <option key={d} value={d} className="bg-neutral-900">{d}</option>
            ))}
          </select>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email, société)…"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white placeholder:text-white/30"
        />
      </section>

      {/* Liste */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <header className="px-5 py-3 border-b border-white/10 text-sm font-semibold text-white">
          {partners.length} apporteur{partners.length > 1 ? 's' : ''}
        </header>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : partners.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            Aucun apporteur. Crée-en un pour commencer le tracking.
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {partners.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/partners/${encodeURIComponent(p.id)}`}
                  className="block px-5 py-3 hover:bg-white/[0.03] transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_TONE[p.type] || TYPE_TONE.other}`}>
                          {TYPE_LABEL[p.type] || p.type}
                        </span>
                        {p.computed_dormant && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Dormant
                          </span>
                        )}
                        {p.status === 'archived' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/45">
                            Archivé
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white font-medium">{p.name}</div>
                      <div className="text-[11px] text-white/55 mt-0.5">
                        {[
                          p.company,
                          p.email,
                          p.phone,
                          p.destinations && p.destinations.length > 0 ? p.destinations.slice(0, 3).join(', ') : null,
                        ].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm text-emerald-200">
                        {fmtEur(p.total_commission_ht_eur)}
                      </div>
                      <div className="text-[10px] text-white/40 mt-0.5">
                        {p.missions_count} mission{p.missions_count > 1 ? 's' : ''} · {p.last_contact_at ? `contact ${fmtDate(p.last_contact_at)}` : 'jamais contacté'}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showCreateModal && (
        <AddPartnerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

function KpiCard({
  label, value, sub, tone,
}: {
  label: string; value: string | number; sub: string;
  tone: 'indigo' | 'emerald' | 'amber' | 'sky' | 'violet' | 'mute';
}) {
  const toneCls = {
    indigo: 'from-indigo-500/10 to-white/5',
    emerald: 'from-emerald-500/10 to-white/5',
    amber: 'from-amber-500/15 to-white/5',
    sky: 'from-sky-500/10 to-white/5',
    violet: 'from-violet-500/10 to-white/5',
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
