'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetchRaw } from '@/lib/adminFetch';
import MarkPaidModal from '../_components/MarkPaidModal';
import ClientEditor from './_components/ClientEditor';
import {
  Loader2,
  ArrowLeft,
  BadgeCheck,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  FileText,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  XCircle,
  PenSquare,
  MessageCircle,
  Building2,
} from 'lucide-react';

type MissionRow = {
  id: string;
  request_id: string | null;
  chef_id: string;
  chef_email: string;
  chef_name: string | null;
  title: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  guest_count: number | null;
  service_level: string | null;
  notes: string | null;
  status: string | null;
  chef_amount: number | null;
  client_amount: number | null;
  commission_amount: number | null;
  contract_url: string | null;
  contract_signed_at: string | null;
  offered_at: string | null;
  offer_email_sent_at: string | null;
  confirmed_at: string | null;
  confirmation_email_sent_at: string | null;
  payment_status: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ChefInfo = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  phone: string | null;
  baseCity: string | null;
  avatarUrl: string | null;
  status: string | null;
};

type ClientRequest = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  clientType: string | null;
  companyName: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string | null;
  budgetRange: string | null;
  budgetAmount: number | null;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  sepa: 'Virement SEPA',
  wire: 'Virement bancaire',
  stripe: 'Stripe',
  cash: 'Espèces',
  check: 'Chèque',
  other: 'Autre',
};

export default function AdminMissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || '');

  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<MissionRow | null>(null);
  const [chef, setChef] = useState<ChefInfo | null>(null);
  const [client, setClient] = useState<ClientRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showClientEditor, setShowClientEditor] = useState(false);

  // Form édition contrat
  const [editingContract, setEditingContract] = useState(false);
  const [contractDraft, setContractDraft] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetchRaw(
        `/api/admin/missions/${encodeURIComponent(id)}`,
      );
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      setMission(json.mission);
      setChef(json.chef);
      setClient(json.clientRequest);
      setContractDraft(json.mission?.contract_url || '');
    } catch (e: any) {
      console.error('[admin/missions/[id]] fetch failed', e);
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) refresh();
  }, [id, refresh]);

  // ---------- Actions ----------

  async function patch(body: Record<string, any>, key: string) {
    setActionLoading(key);
    try {
      const r = await adminFetchRaw(
        `/api/admin/missions/${encodeURIComponent(id)}`,
        { method: 'PATCH', body: JSON.stringify(body) },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await refresh();
    } catch (e: any) {
      alert(e?.message || 'Erreur serveur');
    } finally {
      setActionLoading(null);
    }
  }

  const confirmMission = async () => {
    if (!mission) return;
    setActionLoading('confirm');
    try {
      const r = await adminFetchRaw(
        `/api/admin/missions/${encodeURIComponent(id)}/confirm`,
        {
          method: 'PATCH',
          body: JSON.stringify({ contractUrl: mission.contract_url }),
        },
      );
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await refresh();
    } catch (e: any) {
      alert(e?.message || 'Erreur serveur');
    } finally {
      setActionLoading(null);
    }
  };

  const revertPayment = async () => {
    if (!confirm('Annuler le marquage encaissée ?')) return;
    setActionLoading('revert-paid');
    try {
      const r = await adminFetchRaw(
        `/api/admin/missions/${encodeURIComponent(id)}/mark-pending`,
        { method: 'PATCH' },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await refresh();
    } catch (e: any) {
      alert(e?.message || 'Erreur serveur');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelMission = async () => {
    if (!confirm('Annuler définitivement cette mission ?')) return;
    await patch({ status: 'cancelled' }, 'cancel');
  };

  const markCompleted = async () => {
    await patch({ status: 'completed' }, 'completed');
  };

  const toggleContractSigned = async () => {
    if (!mission) return;
    if (mission.contract_signed_at) {
      if (!confirm('Annuler la signature du contrat ?')) return;
      await patch({ contractSignedAt: null }, 'contract-signed');
    } else {
      await patch({ contractSignedAt: true }, 'contract-signed');
    }
  };

  const saveContractUrl = async () => {
    await patch({ contractUrl: contractDraft.trim() || null }, 'contract-url');
    setEditingContract(false);
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-sm text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error || 'Mission introuvable'}
        </div>
        <Link
          href="/admin/missions"
          className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux missions
        </Link>
      </div>
    );
  }

  const status = String(mission.status || '').toLowerCase();
  const paymentStatus = String(mission.payment_status || 'pending').toLowerCase();
  const canConfirm = ['offered', 'accepted'].includes(status);
  const canMarkPaid = status === 'confirmed' && paymentStatus === 'pending';
  const canRevertPaid = paymentStatus === 'paid';
  const canCancel = !['cancelled', 'declined', 'completed'].includes(status);
  const canMarkCompleted = status === 'confirmed' && paymentStatus === 'paid';
  const contractSigned = !!mission.contract_signed_at;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <Link
            href="/admin/missions"
            className="inline-flex items-center gap-1 text-sm text-white/55 hover:text-white mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Toutes les missions
          </Link>
          <h1 className="text-2xl font-semibold text-white">
            {mission.title || `Mission ${mission.location || ''}`}
          </h1>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <StatusBadge status={status} />
            <PaymentBadge status={paymentStatus} />
            <ContractBadge signed={contractSigned} hasUrl={!!mission.contract_url} />
            <span className="text-xs text-white/45">
              Créée le {fmtDate(mission.created_at)}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <ActionBtn
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label="Confirmer la mission"
              variant="primary"
              loading={actionLoading === 'confirm'}
              onClick={confirmMission}
            />
          )}
          {canMarkPaid && (
            <ActionBtn
              icon={<BadgeCheck className="w-3.5 h-3.5" />}
              label="Marquer encaissée"
              variant="success"
              loading={actionLoading === 'mark-paid'}
              onClick={() => setShowPaidModal(true)}
            />
          )}
          {canRevertPaid && (
            <ActionBtn
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              label="Annuler encaissement"
              variant="muted"
              loading={actionLoading === 'revert-paid'}
              onClick={revertPayment}
            />
          )}
          {canMarkCompleted && (
            <ActionBtn
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="Marquer terminée"
              variant="muted"
              loading={actionLoading === 'completed'}
              onClick={markCompleted}
            />
          )}
          {canCancel && (
            <ActionBtn
              icon={<XCircle className="w-3.5 h-3.5" />}
              label="Annuler la mission"
              variant="danger"
              loading={actionLoading === 'cancel'}
              onClick={cancelMission}
            />
          )}
        </div>
      </div>

      {/* Grid 2 colonnes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Colonne gauche : 2/3 */}
        <div className="xl:col-span-2 space-y-5">
          {/* Bloc Mission */}
          <Panel title="Mission" subtitle="Détails de la prestation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Field label="Lieu" icon={<MapPin className="w-3 h-3" />}>
                {mission.location || '—'}
              </Field>
              <Field label="Convives" icon={<Users className="w-3 h-3" />}>
                {mission.guest_count ?? '—'}
              </Field>
              <Field label="Début" icon={<Calendar className="w-3 h-3" />}>
                {fmtDateLong(mission.start_date)}
              </Field>
              <Field label="Fin" icon={<Calendar className="w-3 h-3" />}>
                {mission.end_date ? fmtDateLong(mission.end_date) : '—'}
              </Field>
              <Field label="Service / Niveau">
                {mission.service_level || '—'}
              </Field>
              <Field label="ID Mission">
                <code className="text-xs text-white/60">{mission.id}</code>
              </Field>
            </div>

            {mission.notes && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs uppercase tracking-widest text-white/45 mb-2">
                  Notes
                </div>
                <p className="text-sm text-white/85 whitespace-pre-line">
                  {mission.notes}
                </p>
              </div>
            )}
          </Panel>

          {/* Bloc Financier */}
          <Panel title="Financier" subtitle="Rémunérations et commission">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat
                label="Rémunération chef"
                value={money(mission.chef_amount)}
                tone="emerald"
              />
              <Stat
                label="Prix client"
                value={money(mission.client_amount)}
                tone="default"
              />
              <Stat
                label="Commission CT"
                value={money(mission.commission_amount)}
                tone="amber"
              />
              <Stat
                label="Encaissé du client"
                value={
                  paymentStatus === 'paid'
                    ? money(mission.paid_amount)
                    : '—'
                }
                tone={paymentStatus === 'paid' ? 'emerald' : 'muted'}
              />
            </div>

            {paymentStatus === 'paid' && (
              <div className="mt-4 pt-4 border-t border-white/10 text-sm space-y-1.5">
                <Row label="Date encaissement">
                  {fmtDateLong(mission.paid_at)}
                </Row>
                {mission.payment_method && (
                  <Row label="Méthode">
                    {PAYMENT_METHOD_LABELS[mission.payment_method] ||
                      mission.payment_method}
                  </Row>
                )}
                {mission.payment_reference && (
                  <Row label="Référence">
                    <code className="text-xs">{mission.payment_reference}</code>
                  </Row>
                )}
              </div>
            )}
          </Panel>

          {/* Bloc Contrat */}
          <Panel
            title="Contrat"
            subtitle="Lien et statut de signature"
            right={
              <button
                onClick={toggleContractSigned}
                disabled={actionLoading === 'contract-signed'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  contractSigned
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {actionLoading === 'contract-signed' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : contractSigned ? (
                  <BadgeCheck className="w-3.5 h-3.5" />
                ) : (
                  <PenSquare className="w-3.5 h-3.5" />
                )}
                {contractSigned
                  ? `Signé le ${fmtDate(mission.contract_signed_at)}`
                  : 'Marquer signé'}
              </button>
            }
          >
            {editingContract ? (
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={contractDraft}
                  onChange={(e) => setContractDraft(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={saveContractUrl}
                  disabled={actionLoading === 'contract-url'}
                  className="px-4 py-2 rounded-lg bg-white text-[#161616] text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50"
                >
                  {actionLoading === 'contract-url' ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setEditingContract(false);
                    setContractDraft(mission.contract_url || '');
                  }}
                  className="px-3 py-2 rounded-lg border border-white/10 text-white/55 text-sm hover:bg-white/5 transition"
                >
                  Annuler
                </button>
              </div>
            ) : mission.contract_url ? (
              <div className="flex items-center justify-between gap-3">
                <a
                  href={mission.contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-sky-200 hover:text-sky-100 truncate flex-1"
                >
                  <FileText className="w-4 h-4 flex-none" />
                  <span className="truncate">{mission.contract_url}</span>
                  <ExternalLink className="w-3 h-3 flex-none" />
                </a>
                <button
                  onClick={() => setEditingContract(true)}
                  className="text-xs text-white/55 hover:text-white underline whitespace-nowrap"
                >
                  Modifier
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-white/45 italic">
                  Aucun lien contrat fourni
                </span>
                <button
                  onClick={() => setEditingContract(true)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
                >
                  Ajouter un lien
                </button>
              </div>
            )}
          </Panel>

          {/* Bloc Timeline */}
          <Panel title="Historique" subtitle="Cycle de vie de la mission">
            <Timeline events={buildTimeline(mission)} />
          </Panel>
        </div>

        {/* Colonne droite : 1/3 — Sidebar */}
        <div className="space-y-5">
          {/* Chef */}
          <Panel title="Chef" subtitle="Profil et contact">
            {chef ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {chef.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chef.avatarUrl}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {chef.name || mission.chef_name || mission.chef_email}
                    </div>
                    {chef.baseCity && (
                      <div className="text-xs text-white/55 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {chef.baseCity}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <ContactLine
                    icon={<Mail className="w-3.5 h-3.5" />}
                    value={chef.email || mission.chef_email}
                    href={`mailto:${chef.email || mission.chef_email}`}
                  />
                  {chef.phone && (
                    <ContactLine
                      icon={<Phone className="w-3.5 h-3.5" />}
                      value={chef.phone}
                      href={`tel:${chef.phone.replace(/\s/g, '')}`}
                    />
                  )}
                  {chef.phone && (
                    <ContactLine
                      icon={<MessageCircle className="w-3.5 h-3.5" />}
                      value="WhatsApp"
                      href={`https://wa.me/${chef.phone.replace(/[^0-9]/g, '')}`}
                      external
                    />
                  )}
                </div>

                <Link
                  href={`/admin/chefs/${encodeURIComponent(chef.userId)}`}
                  className="block w-full text-center px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
                >
                  Voir fiche complète →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="text-white/85">
                  {mission.chef_name || 'Chef inconnu'}
                </div>
                <div className="text-white/55 text-xs">
                  {mission.chef_email}
                </div>
                <div className="text-xs text-white/45 italic mt-2">
                  Profil chef introuvable en base.
                </div>
              </div>
            )}
          </Panel>

          {/* Client */}
          <Panel title="Client" subtitle="Demande à l'origine">
            {client ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {client.fullName || client.email}
                    </div>
                    {client.companyName && (
                      <div className="text-xs text-white/55 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" /> {client.companyName}
                      </div>
                    )}
                    {client.clientType && (
                      <div className="text-[11px] uppercase tracking-widest text-white/45 mt-1">
                        {client.clientType === 'concierge' ? 'B2B' : 'B2C'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowClientEditor(true)}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-[11px] uppercase tracking-widest text-white/70 hover:bg-white/10 transition"
                    title="Modifier les coordonnées client"
                  >
                    <PenSquare className="w-3 h-3" /> Modifier
                  </button>
                </div>

                <div className="space-y-1.5 text-sm">
                  <ContactLine
                    icon={<Mail className="w-3.5 h-3.5" />}
                    value={client.email}
                    href={`mailto:${client.email}`}
                  />
                  {client.phone && (
                    <ContactLine
                      icon={<Phone className="w-3.5 h-3.5" />}
                      value={client.phone}
                      href={`tel:${client.phone.replace(/\s/g, '')}`}
                    />
                  )}
                  {client.phone && (
                    <ContactLine
                      icon={<MessageCircle className="w-3.5 h-3.5" />}
                      value="WhatsApp"
                      href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                      external
                    />
                  )}
                </div>

                {client.budgetRange && (
                  <div className="text-xs text-white/55 border-t border-white/10 pt-2.5">
                    Budget annoncé : <span className="text-white/85">{client.budgetRange}</span>
                  </div>
                )}

                <Link
                  href={`/admin/requests/${encodeURIComponent(client.id)}`}
                  className="block w-full text-center px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
                >
                  Voir la demande →
                </Link>
              </div>
            ) : (
              <div className="text-xs text-white/45 italic">
                {mission.request_id
                  ? 'Demande introuvable.'
                  : 'Mission spontanée (sans demande client préalable).'}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Modal Marquer encaissée — montant pré-rempli = prix client */}
      {showPaidModal && (
        <MarkPaidModal
          missionId={mission.id}
          defaultAmount={mission.client_amount ?? mission.chef_amount}
          chefName={mission.chef_name || mission.chef_email}
          location={mission.location || ''}
          onClose={() => setShowPaidModal(false)}
          onSuccess={() => {
            setShowPaidModal(false);
            refresh();
          }}
        />
      )}

      {/* Modal édition client */}
      {showClientEditor && client && (
        <ClientEditor
          client={{
            id: client.id,
            email: client.email,
            fullName: client.fullName,
            phone: client.phone,
            companyName: client.companyName,
            clientType: client.clientType,
          }}
          onClose={() => setShowClientEditor(false)}
          onSaved={(next) => {
            setClient((prev) =>
              prev
                ? {
                    ...prev,
                    email: next.email,
                    fullName: next.fullName,
                    phone: next.phone,
                    companyName: next.companyName,
                  }
                : prev,
            );
          }}
        />
      )}
    </div>
  );
}

/* ================================================================
   Subcomponents
   ================================================================ */

function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle && (
            <div className="text-xs text-white/45 mt-0.5">{subtitle}</div>
          )}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-white/45 mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-white/90">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'default' | 'muted';
}) {
  const cls = {
    emerald: 'text-emerald-200',
    amber: 'text-amber-200',
    default: 'text-white',
    muted: 'text-white/45',
  }[tone];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-widest text-white/45">
        {label}
      </div>
      <div className={`text-lg font-semibold mt-0.5 ${cls}`}>{value}</div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-white/55">{label}</span>
      <span className="text-white/90 text-right">{children}</span>
    </div>
  );
}

function ContactLine({
  icon,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-2 text-white/85 hover:text-white text-sm truncate"
    >
      <span className="text-white/45">{icon}</span>
      <span className="truncate">{value}</span>
      {external && <ExternalLink className="w-3 h-3 text-white/35 flex-none" />}
    </a>
  );
}

function ActionBtn({
  icon,
  label,
  variant,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'success' | 'muted' | 'danger';
  loading?: boolean;
  onClick: () => void;
}) {
  const cls = {
    primary: 'bg-white text-[#161616] hover:bg-white/90 border-white/15',
    success:
      'bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 border-emerald-500/30',
    muted:
      'bg-white/5 text-white/70 hover:bg-white/10 border-white/10',
    danger:
      'bg-red-500/5 text-red-200 hover:bg-red-500/10 border-red-500/20',
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition disabled:opacity-50 ${cls}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'offered' || status === 'pending'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : status === 'confirmed' || status === 'accepted' || status === 'scheduled'
        ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
        : status === 'in_progress' || status === 'live'
          ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
          : status === 'completed' || status === 'done'
            ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
            : status === 'cancelled' || status === 'declined' || status === 'expired'
              ? 'bg-white/10 text-white/55 border-white/10'
              : 'bg-white/10 text-white/55 border-white/10';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border ${cls}`}
    >
      {status || '—'}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  if (status === 'paid')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
        <BadgeCheck className="w-3 h-3" /> Encaissée
      </span>
    );
  if (status === 'partial')
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-amber-500/15 text-amber-200 border border-amber-500/20">
        Paiement partiel
      </span>
    );
  if (status === 'refunded')
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-red-500/15 text-red-200 border border-red-500/20">
        Remboursée
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-white/5 text-white/55 border border-white/10">
      En attente encaissement
    </span>
  );
}

function ContractBadge({
  signed,
  hasUrl,
}: {
  signed: boolean;
  hasUrl: boolean;
}) {
  if (signed)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
        <BadgeCheck className="w-3 h-3" /> Contrat signé
      </span>
    );
  if (hasUrl)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-sky-500/15 text-sky-200 border border-sky-500/20">
        <FileText className="w-3 h-3" /> Contrat à signer
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-white/5 text-white/55 border border-white/10">
      Pas de contrat
    </span>
  );
}

/* ================================================================
   Timeline
   ================================================================ */

type TimelineEvent = {
  label: string;
  date: string | null;
  done: boolean;
};

function buildTimeline(m: MissionRow): TimelineEvent[] {
  return [
    { label: 'Mission créée', date: m.created_at, done: true },
    {
      label: m.offered_at ? 'Offre envoyée au chef' : 'Pas encore proposée',
      date: m.offered_at,
      done: !!m.offered_at,
    },
    {
      label: m.offer_email_sent_at ? 'Email envoyé au chef' : 'Pas d\'email auto',
      date: m.offer_email_sent_at,
      done: !!m.offer_email_sent_at,
    },
    {
      label: m.confirmed_at ? 'Mission confirmée' : 'En attente confirmation',
      date: m.confirmed_at,
      done: !!m.confirmed_at,
    },
    {
      label: m.contract_signed_at
        ? 'Contrat signé'
        : 'Contrat pas encore signé',
      date: m.contract_signed_at,
      done: !!m.contract_signed_at,
    },
    {
      label: m.paid_at ? 'Encaissement client' : 'En attente encaissement',
      date: m.paid_at,
      done: !!m.paid_at,
    },
  ];
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-3">
      {events.map((e, i) => (
        <li key={i} className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-none border ${
              e.done
                ? 'bg-emerald-400 border-emerald-300'
                : 'bg-white/10 border-white/20'
            }`}
          />
          <div className="flex-1 flex items-center justify-between gap-3">
            <span
              className={`text-sm ${e.done ? 'text-white' : 'text-white/45'}`}
            >
              {e.label}
            </span>
            <span className="text-xs text-white/45 whitespace-nowrap">
              {e.date ? fmtDateLong(e.date) : '—'}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ================================================================
   Helpers
   ================================================================ */

function money(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

function fmtDateLong(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
