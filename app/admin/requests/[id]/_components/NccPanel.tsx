'use client';

// Panneau NCC dans /admin/requests/[id]
//
// Form ultra-court (apporteur + chef exécutant + 2-3 overrides), pré-rempli
// depuis la demande + dernier snapshot NCC envoyé (si existant pour cette
// même request). Cliquer « Envoyer NCC » ouvre le modal de double-vérif
// (réutilise SendForSignatureModal) puis envoie via /api/admin/requests/[id]/send-ncc.
//
// Bandeau status sous le form (idem ContractsPanel).

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  FileText,
  Loader2,
  Send,
  XCircle,
} from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';
import SendForSignatureModal, { type ModalSigner } from '@/app/admin/_components/SendForSignatureModal';
import type { NccData } from '@/lib/contracts/nccTemplate';

type SignatureItem = {
  id: string;
  kind: string;
  status: 'draft' | 'ongoing' | 'done' | 'declined' | 'expired' | 'cancelled' | 'error';
  yousignId: string;
  signers: Array<{ name: string; email: string; role: string }>;
  sentAt: string | null;
  completedAt: string | null;
  signedPdfUrl: string | null;
  errorMessage: string | null;
};

export default function NccPanel({ requestId }: { requestId: string }) {
  // Données NCC éditables (form)
  const [ncc, setNcc] = useState<NccData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal de confirmation
  const [modalOpen, setModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    signers: ModalSigner[];
    missingFields: string[];
    html: string;
    filename: string;
    alreadyPending: boolean;
    canSend: boolean;
  } | null>(null);
  const [sending, setSending] = useState(false);

  // Historique NCC envoyés
  const [sigItems, setSigItems] = useState<SignatureItem[]>([]);
  const [sigLoading, setSigLoading] = useState(false);

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const r = await adminFetchRaw(`/api/admin/requests/${encodeURIComponent(requestId)}/send-ncc`);
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setNcc(json.nccData as NccData);
    } catch (e: any) {
      setLoadError(e?.message || 'Erreur chargement NCC');
    } finally {
      setInitialLoading(false);
    }
  }, [requestId]);

  const loadSignatureRequests = useCallback(async () => {
    setSigLoading(true);
    try {
      const r = await adminFetchRaw(`/api/admin/requests/${encodeURIComponent(requestId)}/signature-requests`);
      const json = await r.json();
      if (r.ok && json.ok) {
        // Garde uniquement les NCC (kind='ncc')
        setSigItems((json.items as SignatureItem[]).filter((i) => i.kind === 'ncc'));
      }
    } catch { /* silent */ }
    finally { setSigLoading(false); }
  }, [requestId]);

  useEffect(() => {
    loadInitial();
    loadSignatureRequests();
  }, [loadInitial, loadSignatureRequests]);

  const currentSig = sigItems[0] || null;

  function patch<K extends keyof NccData>(key: K, value: NccData[K]) {
    setNcc((cur) => (cur ? { ...cur, [key]: value } : cur));
  }

  // Ouvre le modal : appelle POST preview avec les valeurs courantes du form
  async function openSendModal() {
    if (!ncc) return;
    setModalOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    try {
      const r = await adminFetchRaw(`/api/admin/requests/${encodeURIComponent(requestId)}/send-ncc`, {
        method: 'POST',
        body: JSON.stringify({ action: 'preview', nccData: ncc }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.message || json?.error || `HTTP ${r.status}`);
      setPreviewData({
        signers: json.signers as ModalSigner[],
        missingFields: json.missingFields || [],
        html: json.html || '',
        filename: json.filename || '',
        alreadyPending: !!json.alreadyPending,
        canSend: !!json.canSend,
      });
    } catch (e: any) {
      setPreviewError(e?.message || 'Erreur chargement aperçu');
    } finally {
      setPreviewLoading(false);
    }
  }

  // Appelé par le modal quand l'admin clique « Confirmer l'envoi »
  async function confirmSend() {
    if (!ncc) return;
    setSending(true);
    try {
      const r = await adminFetchRaw(`/api/admin/requests/${encodeURIComponent(requestId)}/send-ncc`, {
        method: 'POST',
        body: JSON.stringify({ action: 'send', nccData: ncc }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        const msg = json?.message || json?.error || `HTTP ${r.status}`;
        if (json?.missing?.length) throw new Error(`${msg}\nManque : ${json.missing.join(', ')}`);
        throw new Error(msg);
      }
      await loadSignatureRequests();
      setModalOpen(false);
      alert(`✅ NCC envoyé pour signature à ${json.signatureRequest.signerCount} signataires.`);
    } catch (e: any) {
      alert(e?.message || 'Erreur envoi NCC');
      throw e;
    } finally {
      setSending(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="p-4 text-sm text-white/55 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement du NCC…
      </div>
    );
  }
  if (loadError || !ncc) {
    return (
      <div className="p-4 text-sm text-red-300 flex items-start gap-2">
        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{loadError || 'Impossible de charger le NCC'}</span>
      </div>
    );
  }

  const sendingButtonDisabled = sending || previewLoading || currentSig?.status === 'ongoing';

  return (
    <div className="space-y-4">
      {/* Bandeau status */}
      <NccStatusBanner item={currentSig} loading={sigLoading} />

      {/* Form sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Apporteur */}
        <Section title="Apporteur (Chef Référent ou Concierge)" hint="La personne qui t'a transmis la demande">
          <Field label="Prénom *">
            <Input value={ncc.apporteurFirstName} onChange={(v) => patch('apporteurFirstName', v)} />
          </Field>
          <Field label="Nom *">
            <Input value={ncc.apporteurLastName} onChange={(v) => patch('apporteurLastName', v)} />
          </Field>
          <Field label="Email *">
            <Input type="email" value={ncc.apporteurEmail} onChange={(v) => patch('apporteurEmail', v)} />
          </Field>
          <Field label="Statut (ex: Concierge — Villa Mirage)">
            <Input value={ncc.apporteurStatut} onChange={(v) => patch('apporteurStatut', v)} />
          </Field>
          <Field label="SIRET (optionnel)">
            <Input value={ncc.apporteurSiret} onChange={(v) => patch('apporteurSiret', v)} />
          </Field>
        </Section>

        {/* Chef Exécutant */}
        <Section title="Chef Exécutant" hint="Le chef à qui tu vas confier la mission">
          <Field label="Prénom *">
            <Input value={ncc.chefFirstName} onChange={(v) => patch('chefFirstName', v)} />
          </Field>
          <Field label="Nom *">
            <Input value={ncc.chefLastName} onChange={(v) => patch('chefLastName', v)} />
          </Field>
          <Field label="Email *">
            <Input type="email" value={ncc.chefEmail} onChange={(v) => patch('chefEmail', v)} />
          </Field>
          <Field label="SIRET (optionnel)">
            <Input value={ncc.chefSiret} onChange={(v) => patch('chefSiret', v)} />
          </Field>
        </Section>

        {/* Client (pré-rempli depuis la demande, éditable) */}
        <Section title="Client" hint="Pré-rempli depuis la demande, modifiable">
          <Field label="Civilité">
            <Select
              value={ncc.clientCivilite}
              onChange={(v) => patch('clientCivilite', v as NccData['clientCivilite'])}
              options={[{ value: '', label: '—' }, { value: 'Monsieur', label: 'Monsieur' }, { value: 'Madame', label: 'Madame' }]}
            />
          </Field>
          <Field label="Prénom *">
            <Input value={ncc.clientFirstName} onChange={(v) => patch('clientFirstName', v)} />
          </Field>
          <Field label="Nom">
            <Input value={ncc.clientLastName} onChange={(v) => patch('clientLastName', v)} />
          </Field>
          <Field label="Email *">
            <Input type="email" value={ncc.clientEmail} onChange={(v) => patch('clientEmail', v)} />
          </Field>
          <Field label="Société (optionnel)">
            <Input value={ncc.clientCompany} onChange={(v) => patch('clientCompany', v)} />
          </Field>
        </Section>

        {/* Mission */}
        <Section title="Mission" hint="Référence + lieu + dates + montant (pré-rempli depuis la demande)">
          <Field label="Référence">
            <Input value={ncc.missionRef} onChange={(v) => patch('missionRef', v)} />
          </Field>
          <Field label="Lieu">
            <Input value={ncc.missionLocation} onChange={(v) => patch('missionLocation', v)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Date début">
              <Input type="date" value={ncc.missionStartDate} onChange={(v) => patch('missionStartDate', v)} />
            </Field>
            <Field label="Date fin">
              <Input type="date" value={ncc.missionEndDate} onChange={(v) => patch('missionEndDate', v)} />
            </Field>
          </div>
          <Field label="Montant HT indicatif (€)">
            <Input
              type="number"
              value={ncc.missionAmountHt != null ? String(ncc.missionAmountHt) : ''}
              onChange={(v) => patch('missionAmountHt', v ? Number(v) : null)}
            />
          </Field>
          <Field label="Commission Apporteur (%)" hint="5 % par défaut (CGV)">
            <Input
              type="number"
              value={String(ncc.commissionPct)}
              onChange={(v) => patch('commissionPct', Number(v) || 0)}
            />
          </Field>
        </Section>
      </div>

      <Section title="Clauses spécifiques (optionnel)">
        <Textarea
          rows={3}
          value={ncc.customClauses}
          onChange={(v) => patch('customClauses', v)}
          placeholder="Ex: protection particulière, clause additionnelle, etc."
        />
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
        <div className="text-[11px] text-white/45 flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          Envoi YouSign aux 4 signataires (apporteur, chef exécutant, client, toi).
        </div>
        <button
          onClick={openSendModal}
          disabled={sendingButtonDisabled}
          className="inline-flex items-center px-3 py-2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 text-sm font-medium text-emerald-100 hover:bg-emerald-400/25 transition disabled:opacity-50"
          title={currentSig?.status === 'ongoing' ? 'Un NCC est déjà en cours' : 'Vérifier puis envoyer via YouSign'}
        >
          {(sending || previewLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Envoyer le NCC pour signature
        </button>
      </div>

      <SendForSignatureModal
        isOpen={modalOpen}
        onClose={() => { if (!sending) setModalOpen(false); }}
        onConfirm={confirmSend}
        title="Envoyer le NCC pour signature"
        loading={previewLoading}
        error={previewError}
        signers={previewData?.signers || []}
        missingFields={previewData?.missingFields || []}
        html={previewData?.html || ''}
        filename={previewData?.filename}
        canSend={!!previewData?.canSend}
        blockerMessage={
          previewData?.alreadyPending
            ? 'Un NCC est déjà en cours pour cette demande. Annule-le dans YouSign avant d\'en relancer un.'
            : null
        }
      />
    </div>
  );
}

// ─── Sous-composants UI ────────────────────────────────────

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
      <div>
        <div className="text-xs font-semibold text-white/85 uppercase tracking-wider">{title}</div>
        {hint && <div className="text-[10px] text-white/45 mt-0.5">{hint}</div>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-white/55 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-white/35 mt-0.5">{hint}</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
    />
  );
}

function Textarea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-neutral-900 text-white">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function NccStatusBanner({ item, loading }: { item: SignatureItem | null; loading: boolean }) {
  if (loading && !item) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/45">
        Chargement du statut NCC…
      </div>
    );
  }
  if (!item) return null;

  const dotColor: Record<string, string> = {
    draft: 'bg-white/30',
    ongoing: 'bg-amber-400 animate-pulse',
    done: 'bg-emerald-400',
    declined: 'bg-red-400',
    expired: 'bg-stone-400',
    cancelled: 'bg-stone-400',
    error: 'bg-red-400',
  };
  const label: Record<string, string> = {
    draft: 'Brouillon YouSign',
    ongoing: 'Signature en cours',
    done: 'Signé par les 4 parties',
    declined: 'Refusé',
    expired: 'Expiré',
    cancelled: 'Annulé',
    error: 'Erreur',
  };
  const sentAt = item.sentAt ? new Date(item.sentAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : null;
  const completedAt = item.completedAt ? new Date(item.completedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor[item.status] || 'bg-white/30'}`} />
        <div className="text-sm font-medium text-white">NCC — {label[item.status] || item.status}</div>
        {item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {(item.status === 'declined' || item.status === 'error') && <XCircle className="h-4 w-4 text-red-400" />}
        <div className="ml-auto flex items-center gap-3 text-[11px] text-white/55">
          {sentAt && <span>Envoyé : {sentAt}</span>}
          {completedAt && <span>Signé : {completedAt}</span>}
          <span>{item.signers.length} signataires</span>
        </div>
      </div>
      {item.signers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.signers.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/70"
              title={s.email}
            >
              {s.role} · {s.name}
            </span>
          ))}
        </div>
      )}
      {item.signedPdfUrl && (
        <div className="mt-2">
          <a
            href={item.signedPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-emerald-300 hover:text-emerald-200 underline"
          >
            <FileDown className="mr-1 h-3.5 w-3.5" /> Télécharger le NCC signé
          </a>
        </div>
      )}
      {item.errorMessage && (
        <div className="mt-2 text-[11px] text-red-300 flex items-start gap-1.5">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          {item.errorMessage}
        </div>
      )}
    </div>
  );
}
