'use client';

// /admin/ncc-partner
// Envoi d'un NCC partenaire (2 signataires) à un nouveau client sans
// qu'il y ait de mission/request existante.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, FileSignature, Send, Eye, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';

type Signature = {
  id: string;
  yousign_request_id: string | null;
  yousign_status: string;
  signers: Array<{ name: string; email: string; role: string }>;
  contract_snapshot: any;
  sent_at: string | null;
  completed_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  error_message: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  ongoing: 'En cours',
  done: 'Signé',
  declined: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
  error: 'Erreur',
};

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-white/10 text-white/55 border-white/15',
  ongoing: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  done: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  declined: 'bg-red-400/15 text-red-200 border-red-400/25',
  expired: 'bg-white/10 text-white/55 border-white/15',
  cancelled: 'bg-white/10 text-white/55 border-white/15',
  error: 'bg-red-400/15 text-red-200 border-red-400/25',
};

type FormState = {
  reference: string;
  clientCompany: string;
  clientSiret: string;
  clientRepFirstName: string;
  clientRepLastName: string;
  clientRepRole: string;
  clientAddress: string;
  clientEmail: string;
  customClauses: string;
};

const EMPTY_FORM: FormState = {
  reference: '',
  clientCompany: '',
  clientSiret: '',
  clientRepFirstName: '',
  clientRepLastName: '',
  clientRepRole: '',
  clientAddress: '',
  clientEmail: '',
  customClauses: '',
};

export default function AdminNccPartnerPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; reference: string; yousignId: string } | null>(null);

  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchList = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const json = await adminFetch<{ ok: boolean; signatures: Signature[] }>(
        '/api/admin/ncc-partner/list?limit=100',
      );
      setSignatures(json.signatures || []);
    } catch (e: any) {
      console.error('[ncc-partner] list', e);
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ─── Polling auto pour actualiser les statuts ─────────────
  // Toutes les 15s, on refetch silencieusement la liste tant qu'au moins
  // une signature est en cours (ongoing/draft). Une fois toutes signées
  // ou en état final (done/declined/expired/cancelled), on arrête le poll.
  useEffect(() => {
    const hasPending = signatures.some(
      (s) => s.yousign_status === 'ongoing' || s.yousign_status === 'draft',
    );
    if (!hasPending) return;
    const interval = setInterval(() => fetchList(true), 15_000);
    return () => clearInterval(interval);
  }, [signatures, fetchList]);

  // ─── Refresh on focus ─────────────────────────────────────
  // Quand l'utilisateur revient sur la tab (ex: après avoir signé côté
  // YouSign dans un autre onglet), on refetch tout de suite.
  useEffect(() => {
    const onFocus = () => fetchList(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchList]);

  // ─── Force sync YouSign → DB pour une row ──────────────────
  // Si le webhook YouSign a échoué (réseau, deploy en cours, etc.) ou
  // si le polling n'est pas assez réactif, l'admin peut forcer la synchro
  // d'une row précise.
  async function forceSync(id: string) {
    setSyncingId(id);
    try {
      const r = await adminFetchRaw(
        `/api/admin/signature-requests/${encodeURIComponent(id)}/sync`,
        { method: 'POST' },
      );
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      await fetchList(true);
    } catch (e: any) {
      alert(`Sync impossible : ${e?.message || 'Erreur'}`);
    } finally {
      setSyncingId(null);
    }
  }

  async function call(previewOnly: boolean) {
    setError(null);
    setSuccess(null);
    setPreviewHtml(null);
    if (previewOnly) setPreviewing(true);
    else setSubmitting(true);
    try {
      const r = await adminFetchRaw('/api/admin/ncc-partner/send', {
        method: 'POST',
        body: JSON.stringify({
          ncc: { ...form, reference: form.reference || undefined },
          previewOnly,
        }),
      });
      const text = await r.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {
        throw new Error(`Réponse non-JSON (HTTP ${r.status}). ${text.slice(0, 200)}`);
      }
      if (!r.ok || !json?.ok) {
        throw new Error(json?.error === 'MISSING_FIELDS' ? json.message : (json?.error || `HTTP ${r.status}`));
      }
      if (previewOnly) {
        setPreviewHtml(json.html);
        // Mémorise la référence générée si form.reference vide
        if (!form.reference && json.data?.reference) {
          setForm((f) => ({ ...f, reference: json.data.reference }));
        }
      } else {
        setSuccess({
          id: json.signatureRequest.id,
          reference: json.reference,
          yousignId: json.signatureRequest.yousignId,
        });
        setForm(EMPTY_FORM);
        setPreviewHtml(null);
        await fetchList();
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      if (previewOnly) setPreviewing(false);
      else setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-300" />
          <h1 className="text-xl font-semibold text-white">NCC Partenaire</h1>
        </div>
        <p className="text-sm text-white/55 max-w-3xl">
          Envoyez un Accord de Non-Contournement &amp; Confidentialité à un nouveau partenaire
          (conciergerie, agence villa, family office, etc.) <strong>avant</strong> toute mission.
          Document 2 signataires (Client + Chefs Talents), signature électronique via YouSign.
        </p>
      </header>

      {/* Formulaire d'envoi */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-sky-300" />
          Nouveau NCC partenaire
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Raison sociale *">
            <input
              type="text"
              value={form.clientCompany}
              onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))}
              placeholder="Ex: Villa Mirage Ibiza SARL"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>
          <Field label="SIRET (optionnel)">
            <input
              type="text"
              value={form.clientSiret}
              onChange={(e) => setForm((f) => ({ ...f, clientSiret: e.target.value }))}
              placeholder="14 chiffres"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-mono"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Prénom du représentant *">
            <input
              type="text"
              value={form.clientRepFirstName}
              onChange={(e) => setForm((f) => ({ ...f, clientRepFirstName: e.target.value }))}
              placeholder="Lucas"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>
          <Field label="Nom du représentant *">
            <input
              type="text"
              value={form.clientRepLastName}
              onChange={(e) => setForm((f) => ({ ...f, clientRepLastName: e.target.value }))}
              placeholder="Uchoa"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>
          <Field label="Qualité (optionnel)" hint="ex: Directeur, Gérant, Concierge">
            <input
              type="text"
              value={form.clientRepRole}
              onChange={(e) => setForm((f) => ({ ...f, clientRepRole: e.target.value }))}
              placeholder="Directeur"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Email du représentant *" hint="C'est lui qui signera électroniquement">
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
              placeholder="lucas@villa-mirage.com"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>
          <Field label="Référence (auto-générée si vide)">
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              placeholder="NCC-2026-XXXXXX"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-mono"
            />
          </Field>
        </div>

        <Field label="Adresse (optionnel)">
          <input
            type="text"
            value={form.clientAddress}
            onChange={(e) => setForm((f) => ({ ...f, clientAddress: e.target.value }))}
            placeholder="Carrer de la Mar, 07800 Eivissa, Espagne"
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
          />
        </Field>

        <Field label="Clauses spécifiques (optionnel)" hint="Précisions ad-hoc qui s'ajoutent au contrat standard">
          <textarea
            value={form.customClauses}
            onChange={(e) => setForm((f) => ({ ...f, customClauses: e.target.value }))}
            rows={3}
            placeholder="Optionnel — exemples : périmètre géographique limité, commission spécifique, etc."
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200 whitespace-pre-wrap">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            ✓ NCC envoyé pour signature — <strong>{success.reference}</strong>.
            Le client reçoit un email YouSign immédiatement.
          </div>
        )}

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <div className="text-xs text-white/45 mr-auto">
            Sanction par défaut : 6 mois de commissions sur tarif journalier du Talent. Non-contournement : 24 mois.
          </div>
          <button
            onClick={() => call(true)}
            disabled={previewing || submitting}
            className="inline-flex items-center px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-50"
          >
            {previewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Aperçu
          </button>
          <button
            onClick={() => call(false)}
            disabled={submitting || previewing}
            className="inline-flex items-center px-5 py-2 rounded-xl bg-sky-400 text-sky-950 font-medium hover:bg-sky-300 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {submitting ? 'Envoi en cours…' : 'Envoyer pour signature'}
          </button>
        </div>
      </section>

      {/* Preview HTML inline */}
      {previewHtml && (
        <section className="rounded-2xl border border-white/10 bg-white p-0 overflow-hidden">
          <div className="bg-white/[0.02] px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white inline-flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-300" />
              Aperçu du contrat
            </h3>
            <button
              onClick={() => setPreviewHtml(null)}
              className="text-xs text-white/65 hover:text-white"
            >
              Fermer l'aperçu
            </button>
          </div>
          <iframe
            srcDoc={previewHtml}
            className="w-full bg-white"
            style={{ height: '70vh', border: 0 }}
            title="Aperçu NCC partenaire"
          />
        </section>
      )}

      {/* Liste des NCC envoyés */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-white/55" />
            NCC partenaires envoyés ({signatures.length})
            {signatures.some((s) => s.yousign_status === 'ongoing' || s.yousign_status === 'draft') && (
              <span
                className="inline-flex items-center gap-1 text-[10px] text-amber-200 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full ml-1"
                title="Au moins une signature est en cours — la liste se rafraîchit automatiquement toutes les 15 secondes"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                Auto-refresh actif
              </span>
            )}
          </h2>
          <button
            onClick={() => fetchList()}
            disabled={loadingList}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingList ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </header>

        {loadingList ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : signatures.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            Aucun NCC partenaire envoyé pour le moment.
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {signatures.map((s) => {
              const company = s.contract_snapshot?.clientCompany || '—';
              const ref = s.contract_snapshot?.reference || '—';
              const client = s.signers.find((x) => x.role === 'client');
              const statusKey = STATUS_LABEL[s.yousign_status] ? s.yousign_status : 'draft';
              return (
                <li key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[statusKey]}`}>
                        {STATUS_LABEL[statusKey]}
                      </span>
                      <span className="text-[10px] text-white/45 font-mono">{ref}</span>
                    </div>
                    <div className="text-sm text-white/90 truncate mt-0.5">{company}</div>
                    <div className="text-[11px] text-white/45 mt-0.5">
                      {client ? `${client.name} (${client.email})` : '—'}
                      {' · envoyé '}
                      {s.sent_at
                        ? new Date(s.sent_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                      {s.completed_at && (
                        <>
                          {' · signé '}
                          {new Date(s.completed_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </>
                      )}
                    </div>
                    {s.error_message && (
                      <div className="text-[11px] text-red-200 mt-1">⚠ {s.error_message}</div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {/* Bouton "Force sync" : utile si le webhook YouSign a
                        failed ou si on n'a pas patienté le polling auto.
                        Visible uniquement tant qu'on n'est pas en état final
                        (done/declined/expired/cancelled). */}
                    {(s.yousign_status === 'ongoing' || s.yousign_status === 'draft') && (
                      <button
                        onClick={() => forceSync(s.id)}
                        disabled={syncingId === s.id}
                        className="p-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 disabled:opacity-50"
                        title="Forcer la synchronisation avec YouSign"
                      >
                        {syncingId === s.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {s.signed_pdf_url && (
                      <a
                        href={s.signed_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/85"
                        title="Télécharger PDF signé"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-white/55 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-white/35 mt-0.5">{hint}</span>}
    </label>
  );
}
