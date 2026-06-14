'use client';

// /admin/partners/[id] — Fiche complète d'un apporteur.
// Infos contact + KPIs + timeline interactions + missions + quotes.

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ChevronLeft, Mail, Phone, MessageCircle, Pencil, Plus, Trash2, Coffee, Gift, Share2, ArrowRightLeft, StickyNote, AlertTriangle, ExternalLink } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import AddPartnerModal from '../_components/AddPartnerModal';
import AddInteractionModal from '../_components/AddInteractionModal';

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

const KIND_LABEL: Record<string, string> = {
  call: 'Appel',
  whatsapp: 'WhatsApp',
  email: 'Email',
  meeting_irl: 'Rencontre',
  gift: 'Cadeau',
  social: 'Réseaux',
  lead_received: 'Lead reçu',
  note: 'Note',
};

const KIND_ICON: Record<string, typeof Phone> = {
  call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  meeting_irl: Coffee,
  gift: Gift,
  social: Share2,
  lead_received: ArrowRightLeft,
  note: StickyNote,
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminPartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const json = await adminFetch<any>(`/api/admin/partners/${encodeURIComponent(id)}`);
      if (!json.ok) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      console.error('[partner-detail] fetch', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!confirm(`Supprimer l'apporteur ${data?.partner?.name} ?\nLes missions liées seront détachées (partner_id → null).`)) return;
    try {
      await adminFetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
      router.push('/admin/partners');
    } catch (e: any) {
      alert(`Suppression impossible : ${e?.message || 'erreur'}`);
    }
  };

  const handleDeleteInteraction = async (intId: string) => {
    if (!confirm('Supprimer cette interaction ?')) return;
    try {
      await adminFetch(`/api/admin/partners/${id}/interactions/${intId}`, { method: 'DELETE' });
      fetchData();
    } catch (e: any) {
      alert(`Erreur : ${e?.message || 'inconnue'}`);
    }
  };

  if (loading || !data) {
    return (
      <div className="px-6 py-12 text-sm text-white/55 text-center">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        Chargement de l'apporteur…
      </div>
    );
  }

  const { partner, missions, quotes, interactions, requests, stats } = data;

  // Helper local : montant HT d'un devis (final ou première option)
  const quoteHt = (q: any): number => {
    const final = Number(q.final_amount_ht_eur || 0);
    if (final > 0) return final;
    const first = Array.isArray(q.tariff_options) && q.tariff_options[0]
      ? Number(q.tariff_options[0].ht_eur || 0) : 0;
    return first;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/partners"
          className="inline-flex items-center gap-1 text-xs text-white/55 hover:text-white"
        >
          <ChevronLeft className="w-3 h-3" />
          Tous les apporteurs
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap mt-2">
          <div>
            <h1 className="text-xl font-semibold text-white">{partner.name}</h1>
            <div className="text-xs text-white/55 mt-1 flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-[10px]">
                {TYPE_LABEL[partner.type] || partner.type}
              </span>
              <span>{partner.company || '—'}</span>
              {partner.language && <span>· {partner.language.toUpperCase()}</span>}
              {partner.status === 'archived' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/45">Archivé</span>
              )}
              {partner.status !== 'archived' && partner.last_contact_at && (
                <span>· Dernier contact {fmtDate(partner.last_contact_at)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowInteractionModal(true)}
              className="inline-flex items-center px-3 py-2 rounded-xl bg-indigo-400 text-indigo-950 text-xs font-medium hover:bg-indigo-300"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Logger interaction
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Éditer
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 rounded-xl border border-red-400/30 bg-red-400/10 text-xs text-red-200 hover:bg-red-400/20"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Missions apportées" value={stats.missionsCount} sub="hors annulées" />
        <KpiCard label="Commission HT" value={fmtEur(stats.totalCommissionHtEur)} sub="cumul" tone="violet" />
        <KpiCard label="CA client HT" value={fmtEur(stats.totalClientHtEur)} sub="cumul" tone="emerald" />
        <KpiCard label="Pipeline devis HT" value={fmtEur(stats.pipelineHtEur)} sub={`${stats.quotesSent} devis envoyés`} tone="sky" />
      </section>

      {/* Funnel : entrées → devis → acceptés → missions */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="text-xs text-white/55 uppercase tracking-wider font-semibold mb-3">
          Funnel apporteur · {stats.requestsCount} demandes → {stats.quotesCount} devis → {stats.missionsCount} missions
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <FunnelStep label="Demandes" value={stats.funnel.requests} />
          <FunnelStep label="Devis envoyés" value={stats.funnel.quotes_sent_or_more} pct={stats.conversion.request_to_quote} />
          <FunnelStep label="Acceptés" value={stats.funnel.quotes_accepted} pct={stats.conversion.quote_to_accept} />
          <FunnelStep label="Missions confirmées" value={stats.funnel.missions_confirmed} pct={stats.conversion.accept_to_mission} accent />
        </div>
        {(stats.quotesDeclined > 0 || stats.quotesExpired > 0) && (
          <div className="mt-3 text-[10px] text-white/45 text-right">
            {stats.quotesDeclined} refusés · {stats.quotesExpired} expirés
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Colonne gauche : infos contact + destinations */}
        <div className="space-y-4">
          <Panel title="Contact">
            <Row label="Nom contact" value={[partner.contact_first_name, partner.contact_last_name].filter(Boolean).join(' ') || '—'} />
            {partner.email && <Row label="Email" value={<a href={`mailto:${partner.email}`} className="text-sky-200 hover:text-sky-100">{partner.email}</a>} />}
            {partner.phone && <Row label="Téléphone" value={<a href={`tel:${partner.phone}`} className="text-sky-200 hover:text-sky-100">{partner.phone}</a>} />}
            {partner.whatsapp && <Row label="WhatsApp" value={<a href={`https://wa.me/${partner.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-200 hover:text-emerald-100 inline-flex items-center gap-1">{partner.whatsapp} <ExternalLink className="w-3 h-3" /></a>} />}
            {partner.language && <Row label="Langue" value={partner.language.toUpperCase()} />}
          </Panel>

          {partner.destinations && partner.destinations.length > 0 && (
            <Panel title="Destinations">
              <div className="flex flex-wrap gap-1.5">
                {partner.destinations.map((d: string) => (
                  <span key={d} className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/85">
                    {d}
                  </span>
                ))}
              </div>
            </Panel>
          )}

          {partner.linked_chef_email && (
            <Panel title="Chef du réseau lié">
              <div className="text-xs text-white/85">{partner.linked_chef_email}</div>
            </Panel>
          )}

          {partner.acquisition_source && (
            <Panel title="Comment on s'est rencontrés">
              <div className="text-xs text-white/85 italic">« {partner.acquisition_source} »</div>
              {partner.first_contact_at && (
                <div className="text-[10px] text-white/45 mt-1">depuis {fmtDate(partner.first_contact_at)}</div>
              )}
            </Panel>
          )}

          {partner.notes && (
            <Panel title="Notes internes">
              <div className="text-xs text-white/85 whitespace-pre-wrap leading-relaxed">{partner.notes}</div>
            </Panel>
          )}
        </div>

        {/* Colonne milieu/droite : timeline + missions + quotes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timeline interactions */}
          <Panel title={`Timeline (${interactions.length})`}>
            {interactions.length === 0 ? (
              <div className="text-xs text-white/45 italic">Aucune interaction enregistrée. Clique « Logger interaction » pour démarrer l'historique (tu peux mettre une date passée).</div>
            ) : (
              <ul className="space-y-2">
                {interactions.map((it: any) => {
                  const Icon = KIND_ICON[it.kind] || StickyNote;
                  return (
                    <li key={it.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 flex items-start gap-3">
                      <Icon className="w-4 h-4 text-white/55 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider text-white/45 font-medium">
                            {KIND_LABEL[it.kind] || it.kind}
                          </span>
                          <span className="text-[10px] text-white/65 font-mono">{fmtDate(it.occurred_at)}</span>
                        </div>
                        <div className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">{it.summary}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteInteraction(it.id)}
                        className="p-1 rounded hover:bg-red-400/15 text-white/45 hover:text-red-200"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Missions */}
          <Panel title={`Missions apportées (${stats.missionsCount})`}>
            {missions.length === 0 ? (
              <div className="text-xs text-white/45 italic">Aucune mission liée à cet apporteur.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {missions.map((m: any) => (
                  <li key={m.id}>
                    <Link
                      href={`/admin/missions/${encodeURIComponent(m.id)}`}
                      className="flex items-center justify-between gap-3 px-2 py-2 hover:bg-white/[0.03] rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white truncate">{m.location || '—'} · {m.chef_name || '—'}</div>
                        <div className="text-[10px] text-white/45">
                          {fmtDate(m.start_date)}{m.end_date && m.end_date !== m.start_date ? ` → ${fmtDate(m.end_date)}` : ''}
                          {m.status && ` · ${m.status}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-emerald-200">{fmtEur(Number(m.commission_amount || 0))}</div>
                        <div className="text-[10px] text-white/40">commission HT</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Quotes */}
          {quotes && quotes.length > 0 && (
            <Panel title={`Devis liés (${quotes.length})`}>
              <ul className="divide-y divide-white/10">
                {quotes.map((q: any) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                    <div className="min-w-0">
                      <div className="text-white/85 truncate">{q.reference} — {q.destinataire_nom || '—'}</div>
                      <div className="text-[10px] text-white/40">
                        {q.lieu || '—'} · <span className={`px-1.5 py-0.5 rounded ${QUOTE_STATUS_TONE[q.status] || 'bg-white/5 text-white/60'}`}>{q.status}</span>
                        {q.issued_at && ` · ${fmtDate(q.issued_at)}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-200">{fmtEur(quoteHt(q))}</div>
                      <div className="text-[10px] text-white/40">HT</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Demandes liées */}
          {requests && requests.length > 0 && (
            <Panel title={`Demandes apportées (${requests.length})`}>
              <ul className="divide-y divide-white/10">
                {requests.map((r: any) => (
                  <li key={r.id}>
                    <Link
                      href={`/admin/requests/${encodeURIComponent(r.id)}`}
                      className="flex items-center justify-between gap-3 px-2 py-2 hover:bg-white/[0.03] rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white truncate">
                          {r.full_name || r.email} {r.client_type === 'b2b' && r.company_name ? `· ${r.company_name}` : ''}
                        </div>
                        <div className="text-[10px] text-white/45">
                          {fmtDate(r.created_at)}{r.location && ` · ${r.location}`}
                          {r.status && ` · ${r.status}`}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      {showEditModal && (
        <AddPartnerModal
          partner={partner}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => { setShowEditModal(false); fetchData(); }}
        />
      )}

      {showInteractionModal && (
        <AddInteractionModal
          partnerId={partner.id}
          partnerName={partner.name}
          onClose={() => setShowInteractionModal(false)}
          onCreated={() => { setShowInteractionModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}

const QUOTE_STATUS_TONE: Record<string, string> = {
  draft: 'bg-white/5 text-white/65 border border-white/10',
  sent: 'bg-sky-400/15 text-sky-200 border border-sky-400/25',
  accepted: 'bg-emerald-400/15 text-emerald-200 border border-emerald-400/25',
  declined: 'bg-red-400/15 text-red-200 border border-red-400/25',
  expired: 'bg-amber-400/15 text-amber-200 border border-amber-400/25',
  cancelled: 'bg-white/5 text-white/40 border border-white/10',
};

function FunnelStep({
  label, value, pct, accent,
}: {
  label: string; value: number; pct?: number; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="text-[10px] text-white/55 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-semibold mt-0.5 ${accent ? 'text-emerald-200' : 'text-white'}`}>{value}</div>
      {pct !== undefined && (
        <div className="text-[10px] text-white/45 mt-0.5">{pct}% conv.</div>
      )}
    </div>
  );
}

function KpiCard({
  label, value, sub, tone = 'indigo',
}: {
  label: string; value: string | number; sub: string; tone?: 'indigo' | 'emerald' | 'violet' | 'sky';
}) {
  const toneCls = {
    indigo: 'from-indigo-500/10 to-white/5',
    emerald: 'from-emerald-500/10 to-white/5',
    violet: 'from-violet-500/10 to-white/5',
    sky: 'from-sky-500/10 to-white/5',
  }[tone];
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-b ${toneCls} p-4`}>
      <div className="text-xs text-white/55 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
      <div className="text-[11px] text-white/45 mt-1 truncate">{sub}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="text-xs uppercase tracking-wider text-white/45 font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
      <span className="text-white/55">{label}</span>
      <span className="text-white/85 text-right">{value}</span>
    </div>
  );
}
