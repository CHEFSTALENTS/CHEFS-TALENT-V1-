'use client';

// QuotePanel — gestion du devis lié à une client_request.
// - Si pas de devis : bouton "Générer un devis" (pré-rempli depuis la request)
// - Si devis existe : affiche le statut + boutons (éditer, télécharger PDF, supprimer)
// - Éditeur de sections en modal : intitulé, profils tarifaires, conditions, etc.
// - PHASE 1 AGENT COMMERCIAL : affichage de la marge par option tarifaire

import { useEffect, useState, useCallback } from 'react';
import { Loader2, FileText, Download, Eye, PenSquare, Trash2, FilePlus, TrendingUp, TrendingDown, Sparkles, Paperclip, CheckCircle2 } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';
import { computeMarginsPerOption, computeTotalCosts, getMarginTone, fmtEur } from '@/lib/quotes/margin';
import QuoteAgentChat from './QuoteAgentChat';
import ImportPdfQuoteModal from './ImportPdfQuoteModal';
import ChangeQuoteStatusModal from '@/app/admin/_components/ChangeQuoteStatusModal';
import QuoteDocumentsPanel from '@/app/admin/_components/QuoteDocumentsPanel';

type TariffOption = {
  label: string;
  ht_eur: number;
  tva_eur: number;
  ttc_eur: number;
  note?: string | null;
};

type Quote = {
  id: string;
  reference: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  issued_at: string;
  validity_date: string | null;
  intitule: string | null;
  lieu: string | null;
  dates_text: string | null;
  convives_text: string | null;
  rythme_text: string | null;
  langues_text: string | null;
  hebergement_text: string | null;
  emetteur_nom: string;
  emetteur_ville: string;
  emetteur_siret: string;
  emetteur_tva: string;
  destinataire_nom: string | null;
  destinataire_type: string | null;
  destinataire_adresse: string | null;
  tariff_options: TariffOption[];
  courses_text: string | null;
  courses_provision_text: string | null;
  conditions: string[];
  admin_notes: string | null;
  sent_at: string | null;
  created_at: string;
  // Phase 1 marge — internes
  chef_cost_eur: number | null;
  chef_travel_cost_eur: number | null;
  butler_required: boolean;
  butler_cost_eur: number | null;
  margin_notes: string | null;
  // Workflow / négo
  final_amount_ht_eur?: number | null;
  final_amount_ttc_eur?: number | null;
  status_reason?: string | null;
  is_external?: boolean | null;
  external_origin?: string | null;
};

// ────────────────────────────────────────────────────────────
// Helpers téléchargement — fetchent via adminFetchRaw (Bearer auto)
// puis créent un blob + déclenchent download/open. Un simple <a href>
// ne marche pas car le navigateur n'envoie pas le token Bearer.
// ────────────────────────────────────────────────────────────

async function openQuoteHtml(
  quoteId: string,
  setBusy: (v: 'pdf' | 'html' | null) => void,
): Promise<void> {
  setBusy('html');
  try {
    const r = await adminFetchRaw(`/api/admin/quotes/${quoteId}/pdf?format=html`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    if (!win) alert('Autorisez les popups pour ouvrir l\'aperçu.');
  } catch (e: any) {
    alert(`Impossible d'ouvrir l'aperçu : ${e?.message || 'erreur inconnue'}`);
  } finally {
    setBusy(null);
  }
}

async function downloadQuotePdf(
  quoteId: string,
  reference: string,
  setBusy: (v: 'pdf' | 'html' | null) => void,
): Promise<void> {
  setBusy('pdf');
  try {
    const r = await adminFetchRaw(`/api/admin/quotes/${quoteId}/pdf?format=pdf`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reference || 'devis'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch (e: any) {
    alert(`Impossible de télécharger le PDF : ${e?.message || 'erreur inconnue'}`);
  } finally {
    setBusy(null);
  }
}

const STATUS_LABEL: Record<Quote['status'], string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  declined: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
};

const STATUS_CLASS: Record<Quote['status'], string> = {
  draft: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  sent: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
  accepted: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  declined: 'bg-red-400/15 text-red-200 border-red-400/25',
  expired: 'bg-white/10 text-white/55 border-white/15',
  cancelled: 'bg-white/10 text-white/55 border-white/15',
};

export default function QuotePanel({ requestId }: { requestId: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'html' | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [importingPdf, setImportingPdf] = useState(false);
  // Flag : si true, ouvrir le modal d'import PDF dès que le brouillon
  // est créé (pour le bouton "Lire un PDF" du panneau "pas encore de devis").
  const [pendingPdfImport, setPendingPdfImport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetchRaw(`/api/admin/requests/${encodeURIComponent(requestId)}/quote`);
      if (r.status === 404) {
        setQuote(null);
        return;
      }
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setQuote(json.quote);
    } catch (e: any) {
      console.error('[QuotePanel] fetch', e);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  // Quand un brouillon est créé via le flow "Lire un PDF direct", on
  // ouvre le modal d'import dès que le devis est en place.
  useEffect(() => {
    if (quote && pendingPdfImport) {
      setImportingPdf(true);
      setPendingPdfImport(false);
    }
  }, [quote, pendingPdfImport]);

  async function generate() {
    setError(null);
    setCreating(true);
    try {
      const r = await adminFetchRaw(`/api/admin/requests/${encodeURIComponent(requestId)}/quote`, { method: 'POST' });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${r.status}`);
      }
      setQuote(json.quote);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setCreating(false);
    }
  }

  async function remove() {
    if (!quote) return;
    if (!confirm(`Supprimer / annuler le devis ${quote.reference} ?`)) return;
    try {
      const r = await adminFetchRaw(`/api/admin/quotes/${quote.id}`, { method: 'DELETE' });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await fetchQuote();
    } catch (e: any) {
      alert(`Suppression impossible : ${e?.message}`);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-6 text-sm text-white/45">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        Chargement du devis…
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/65">
          Aucun devis pour cette demande. Génère-le pré-rempli depuis la demande, ou importe directement un PDF que tu as déjà.
        </p>
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generate}
            disabled={creating}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-sky-400 text-sky-950 text-sm font-medium hover:bg-sky-300 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FilePlus className="w-4 h-4 mr-2" />}
            {creating ? 'Génération…' : 'Générer un devis'}
          </button>
          <button
            onClick={async () => {
              setPendingPdfImport(true);
              await generate();
            }}
            disabled={creating}
            className="inline-flex items-center px-4 py-2 rounded-xl border border-indigo-400/30 bg-indigo-400/10 hover:bg-indigo-400/20 text-sm text-indigo-200 disabled:opacity-50"
            title="Crée un brouillon vide et ouvre directement la lecture du PDF. Idéal si tu as déjà rédigé le devis ailleurs."
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Lire un PDF de devis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status + ref + bouton changer statut */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[quote.status]}`}>
          {STATUS_LABEL[quote.status]}
        </span>
        <button
          onClick={() => setChangingStatus(true)}
          className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/65 hover:text-white"
          title="Modifier le statut, la date d'événement, le motif, ou le montant final négocié"
        >
          <CheckCircle2 className="w-3 h-3 inline mr-1" />
          Changer
        </button>
        <span className="text-xs text-white/55 font-mono">{quote.reference}</span>
        {quote.is_external && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-200" title={quote.external_origin || 'Devis importé hors plateforme'}>
            externe
          </span>
        )}
        <span className="text-[10px] text-white/40">émis le {quote.issued_at}</span>
        {quote.validity_date && (
          <span className="text-[10px] text-white/40">· valide jusqu'au {quote.validity_date}</span>
        )}
      </div>

      {/* Motif statut + montant final si renseigné */}
      {(quote.status_reason || quote.final_amount_ht_eur !== null) && (
        <div className="rounded-lg border border-white/10 bg-white/[0.015] p-2.5 text-xs space-y-0.5">
          {quote.final_amount_ht_eur !== null && quote.final_amount_ht_eur !== undefined && (
            <div className="text-white/85">
              <span className="text-white/45">Montant final négocié :</span>{' '}
              <span className="font-mono">{fmtEur(Number(quote.final_amount_ht_eur))} HT</span>
              {quote.final_amount_ttc_eur !== null && quote.final_amount_ttc_eur !== undefined && (
                <> · <span className="font-mono">{fmtEur(Number(quote.final_amount_ttc_eur))} TTC</span></>
              )}
            </div>
          )}
          {quote.status_reason && (
            <div className="text-white/55 italic">« {quote.status_reason} »</div>
          )}
        </div>
      )}

      {/* Résumé infos */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-1 text-sm">
        <div className="text-white/85">{quote.intitule || <em className="text-white/40">Intitulé manquant</em>}</div>
        <div className="text-xs text-white/55">
          {[quote.lieu, quote.dates_text, quote.convives_text].filter(Boolean).join(' · ') || '—'}
        </div>
        <div className="text-xs text-white/55">
          → <strong>{quote.destinataire_nom || '—'}</strong> ({quote.destinataire_type})
        </div>
      </div>

      {/* Tariff preview + marge par option */}
      {Array.isArray(quote.tariff_options) && quote.tariff_options.length > 0 && (
        <MarginPreview quote={quote} />
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void openQuoteHtml(quote.id, setDownloading)}
          disabled={downloading !== null}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/85 disabled:opacity-50"
        >
          {downloading === 'html'
            ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            : <Eye className="w-3.5 h-3.5 mr-1.5" />}
          Aperçu HTML
        </button>
        <button
          onClick={() => void downloadQuotePdf(quote.id, quote.reference, setDownloading)}
          disabled={downloading !== null}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 text-xs text-emerald-200 disabled:opacity-50"
        >
          {downloading === 'pdf'
            ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            : <Download className="w-3.5 h-3.5 mr-1.5" />}
          Télécharger PDF
        </button>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 hover:bg-sky-400/20 text-xs text-sky-200"
        >
          <PenSquare className="w-3.5 h-3.5 mr-1.5" />
          Éditer les sections
        </button>
        <button
          onClick={() => setChatting(true)}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 text-xs text-emerald-200"
          title="Travaille le devis avec l'assistant commercial (Claude). Il pose des questions, propose des valeurs, et apprend de tes choix."
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Discuter avec l'agent
        </button>
        {quote.status === 'draft' && (
          <button
            onClick={() => setImportingPdf(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-indigo-400/30 bg-indigo-400/10 hover:bg-indigo-400/20 text-xs text-indigo-200"
            title="Charge un PDF de devis : Claude le lit et reporte les chiffres dans ce brouillon. Possible uniquement en statut draft."
          >
            <FilePlus className="w-3.5 h-3.5 mr-1.5" />
            Lire un PDF de devis
          </button>
        )}
        <button
          onClick={() => setShowDocs((v) => !v)}
          className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs ${
            showDocs
              ? 'border-indigo-400/40 bg-indigo-400/15 text-indigo-100'
              : 'border-indigo-400/30 bg-indigo-400/10 hover:bg-indigo-400/20 text-indigo-200'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5 mr-1.5" />
          Documents
        </button>
        {quote.status !== 'cancelled' && (
          <button
            onClick={remove}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 text-xs text-red-200 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Supprimer
          </button>
        )}
      </div>

      {/* Panneau Documents (toggle) */}
      {showDocs && (
        <div className="rounded-xl border border-white/10 bg-white/[0.015] p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">
            Documents (devis signé, contre-propositions, échanges, brief…)
          </div>
          <QuoteDocumentsPanel quoteId={quote.id} />
        </div>
      )}

      {editing && (
        <QuoteEditor
          quote={quote}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await fetchQuote();
          }}
        />
      )}

      {chatting && (
        <QuoteAgentChat
          quoteId={quote.id}
          onClose={() => setChatting(false)}
          onQuoteUpdated={fetchQuote}
        />
      )}

      {importingPdf && (
        <ImportPdfQuoteModal
          quoteId={quote.id}
          onClose={() => setImportingPdf(false)}
          onApplied={async () => {
            setImportingPdf(false);
            await fetchQuote();
          }}
        />
      )}

      {changingStatus && (
        <ChangeQuoteStatusModal
          quoteId={quote.id}
          currentStatus={quote.status}
          currentReason={quote.status_reason || null}
          currentFinalHt={quote.final_amount_ht_eur ?? null}
          currentFinalTtc={quote.final_amount_ttc_eur ?? null}
          onClose={() => setChangingStatus(false)}
          onSaved={async () => {
            setChangingStatus(false);
            await fetchQuote();
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Éditeur de sections (modal)
// ────────────────────────────────────────────────────────────

function QuoteEditor({
  quote,
  onClose,
  onSaved,
}: {
  quote: Quote;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    intitule: quote.intitule || '',
    lieu: quote.lieu || '',
    dates_text: quote.dates_text || '',
    convives_text: quote.convives_text || '',
    rythme_text: quote.rythme_text || '',
    langues_text: quote.langues_text || '',
    hebergement_text: quote.hebergement_text || '',
    destinataire_nom: quote.destinataire_nom || '',
    destinataire_type: quote.destinataire_type || '',
    destinataire_adresse: quote.destinataire_adresse || '',
    courses_text: quote.courses_text || '',
    courses_provision_text: quote.courses_provision_text || '',
    conditions: (quote.conditions || []).join('\n'),
    validity_date: quote.validity_date || '',
    status: quote.status,
    // ─── Phase 1 marge — coûts internes ───
    chef_cost_eur: quote.chef_cost_eur != null ? String(quote.chef_cost_eur) : '',
    chef_travel_cost_eur: quote.chef_travel_cost_eur != null ? String(quote.chef_travel_cost_eur) : '',
    butler_required: !!quote.butler_required,
    butler_cost_eur: quote.butler_cost_eur != null ? String(quote.butler_cost_eur) : '',
    margin_notes: quote.margin_notes || '',
  });
  const [tariffs, setTariffs] = useState<TariffOption[]>(quote.tariff_options || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTariff(i: number, field: keyof TariffOption, value: string) {
    setTariffs((prev) => {
      const next = [...prev];
      const numFields: (keyof TariffOption)[] = ['ht_eur', 'tva_eur', 'ttc_eur'];
      if (numFields.includes(field)) {
        const n = Number(value.replace(',', '.'));
        next[i] = { ...next[i], [field]: Number.isFinite(n) ? n : 0 };
      } else {
        next[i] = { ...next[i], [field]: value };
      }
      return next;
    });
  }

  function addTariff() {
    setTariffs([...tariffs, { label: 'Nouveau profil', ht_eur: 0, tva_eur: 0, ttc_eur: 0 }]);
  }
  function removeTariff(i: number) {
    setTariffs(tariffs.filter((_, j) => j !== i));
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      // Convertit les inputs textuels de coûts en numbers (ou null si vide)
      const num = (s: string): number | null => {
        const t = s.trim().replace(',', '.');
        if (!t) return null;
        const n = Number(t);
        return Number.isFinite(n) ? n : null;
      };

      const body = {
        ...form,
        validity_date: form.validity_date || null,
        destinataire_adresse: form.destinataire_adresse.trim() || null,
        conditions: form.conditions.split('\n').map((s) => s.trim()).filter(Boolean),
        tariff_options: tariffs,
        // Coûts internes
        chef_cost_eur: num(form.chef_cost_eur),
        chef_travel_cost_eur: num(form.chef_travel_cost_eur),
        butler_required: form.butler_required,
        butler_cost_eur: form.butler_required ? num(form.butler_cost_eur) : null,
        margin_notes: form.margin_notes.trim() || null,
      };
      const r = await adminFetchRaw(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await onSaved();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="w-full max-w-3xl bg-[#0f0f10] border border-white/10 rounded-2xl shadow-2xl max-h-[96vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0f0f10]/95 backdrop-blur z-10">
          <h3 className="text-base font-semibold text-white inline-flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-300" />
            Éditer le devis — {quote.reference}
          </h3>
          <button onClick={onClose} disabled={saving} className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10">
            Fermer
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <Section title="Statut & validité">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Quote['status'] }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
                >
                  {(Object.keys(STATUS_LABEL) as Quote['status'][]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Validité (date)" hint="Format YYYY-MM-DD">
                <input
                  type="date"
                  value={form.validity_date}
                  onChange={(e) => setForm((f) => ({ ...f, validity_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
                />
              </Field>
            </div>
          </Section>

          <Section title="Détail de la prestation">
            <Field label="Intitulé">
              <input type="text" value={form.intitule} onChange={(e) => setForm((f) => ({ ...f, intitule: e.target.value }))} className={inpCls} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Lieu"><input type="text" value={form.lieu} onChange={(e) => setForm((f) => ({ ...f, lieu: e.target.value }))} className={inpCls} /></Field>
              <Field label="Dates"><input type="text" value={form.dates_text} onChange={(e) => setForm((f) => ({ ...f, dates_text: e.target.value }))} className={inpCls} /></Field>
              <Field label="Convives"><input type="text" value={form.convives_text} onChange={(e) => setForm((f) => ({ ...f, convives_text: e.target.value }))} className={inpCls} /></Field>
              <Field label="Rythme"><input type="text" value={form.rythme_text} onChange={(e) => setForm((f) => ({ ...f, rythme_text: e.target.value }))} className={inpCls} /></Field>
              <Field label="Langues"><input type="text" value={form.langues_text} onChange={(e) => setForm((f) => ({ ...f, langues_text: e.target.value }))} className={inpCls} /></Field>
              <Field label="Hébergement"><input type="text" value={form.hebergement_text} onChange={(e) => setForm((f) => ({ ...f, hebergement_text: e.target.value }))} className={inpCls} /></Field>
            </div>
          </Section>

          <Section title="Destinataire">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nom"><input type="text" value={form.destinataire_nom} onChange={(e) => setForm((f) => ({ ...f, destinataire_nom: e.target.value }))} className={inpCls} /></Field>
              <Field label="Type" hint="ex: Prestation B2B, marque blanche"><input type="text" value={form.destinataire_type} onChange={(e) => setForm((f) => ({ ...f, destinataire_type: e.target.value }))} className={inpCls} /></Field>
            </div>
            <Field label="Adresse (optionnel)"><input type="text" value={form.destinataire_adresse} onChange={(e) => setForm((f) => ({ ...f, destinataire_adresse: e.target.value }))} className={inpCls} /></Field>
          </Section>

          {/* ─── COÛTS INTERNES (Phase 1 marge) ─────────────────
              Données JAMAIS exposées au client dans le PDF.
              Servent à calculer la marge nette par option tarifaire. */}
          <Section title="Coûts internes (marge)" right={
            <span className="text-[10px] text-red-200/70 italic">jamais exposés au client</span>
          }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Coût chef HT (€)" hint="Tarif négocié avec le chef pour la mission">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.chef_cost_eur}
                  onChange={(e) => setForm((f) => ({ ...f, chef_cost_eur: e.target.value }))}
                  placeholder="ex: 2500"
                  className={inpCls + ' font-mono'}
                />
              </Field>
              <Field label="Frais de déplacement chef (€)" hint="Train, avion, essence">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.chef_travel_cost_eur}
                  onChange={(e) => setForm((f) => ({ ...f, chef_travel_cost_eur: e.target.value }))}
                  placeholder="ex: 250"
                  className={inpCls + ' font-mono'}
                />
              </Field>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.butler_required}
                  onChange={(e) => setForm((f) => ({ ...f, butler_required: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <span className="text-sm text-white/85">Butler requis pour cette mission</span>
              </label>
              {form.butler_required && (
                <Field label="Coût butler HT (€)">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.butler_cost_eur}
                    onChange={(e) => setForm((f) => ({ ...f, butler_cost_eur: e.target.value }))}
                    placeholder="ex: 1200"
                    className={inpCls + ' font-mono'}
                  />
                </Field>
              )}
            </div>

            <Field label="Notes internes sur la marge (optionnel)" hint="Négociation, contraintes, contexte — jamais exposé">
              <textarea
                rows={2}
                value={form.margin_notes}
                onChange={(e) => setForm((f) => ({ ...f, margin_notes: e.target.value }))}
                className={inpCls}
              />
            </Field>

            {/* Aperçu de la marge en temps réel pendant l'édition */}
            <LiveMarginPreview
              tariffs={tariffs}
              chefCost={form.chef_cost_eur}
              chefTravel={form.chef_travel_cost_eur}
              butlerRequired={form.butler_required}
              butlerCost={form.butler_cost_eur}
            />
          </Section>

          <Section title="Options tarifaires (prix vendus au client)" right={
            <button onClick={addTariff} className="text-xs text-sky-300 hover:text-sky-200">+ Ajouter</button>
          }>
            <div className="space-y-2">
              {tariffs.map((t, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input type="text" value={t.label} onChange={(e) => updateTariff(i, 'label', e.target.value)} placeholder="Profil Junior" className={inpCls} />
                    <input type="text" value={t.note || ''} onChange={(e) => updateTariff(i, 'note', e.target.value)} placeholder="Note optionnelle" className={inpCls} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="HT (EUR)"><input type="text" value={String(t.ht_eur)} onChange={(e) => updateTariff(i, 'ht_eur', e.target.value)} className={inpCls + ' font-mono'} /></Field>
                    <Field label="TVA (EUR)"><input type="text" value={String(t.tva_eur)} onChange={(e) => updateTariff(i, 'tva_eur', e.target.value)} className={inpCls + ' font-mono'} /></Field>
                    <Field label="TTC (EUR)"><input type="text" value={String(t.ttc_eur)} onChange={(e) => updateTariff(i, 'ttc_eur', e.target.value)} className={inpCls + ' font-mono'} /></Field>
                  </div>
                  <button onClick={() => removeTariff(i)} className="text-[11px] text-red-200 hover:text-red-100">Supprimer cette option</button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Courses et approvisionnement">
            <Field label="Description"><textarea rows={3} value={form.courses_text} onChange={(e) => setForm((f) => ({ ...f, courses_text: e.target.value }))} className={inpCls} /></Field>
            <Field label="Provision indicative"><textarea rows={2} value={form.courses_provision_text} onChange={(e) => setForm((f) => ({ ...f, courses_provision_text: e.target.value }))} className={inpCls} /></Field>
          </Section>

          <Section title="Conditions">
            <Field label="Une condition par ligne">
              <textarea rows={6} value={form.conditions} onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))} className={inpCls} />
            </Field>
          </Section>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-white/[0.02] sticky bottom-0">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10">
            Annuler
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center px-5 py-2 rounded-xl bg-sky-400 text-sky-950 font-medium hover:bg-sky-300 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenSquare className="w-4 h-4 mr-2" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MarginPreview — résumé des coûts internes + marge par option tarifaire
// ────────────────────────────────────────────────────────────

const TONE_CLASS: Record<ReturnType<typeof getMarginTone>, string> = {
  great: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25',
  good: 'bg-sky-500/15 text-sky-200 border-sky-500/25',
  ok: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
  low: 'bg-red-400/15 text-red-200 border-red-400/25',
  loss: 'bg-red-600/25 text-red-100 border-red-500/40 font-semibold',
  unknown: 'bg-white/5 text-white/45 border-white/10',
};

function MarginPreview({ quote }: { quote: Quote }) {
  const totalCosts = computeTotalCosts({
    chefCostEur: quote.chef_cost_eur,
    chefTravelCostEur: quote.chef_travel_cost_eur,
    butlerRequired: quote.butler_required,
    butlerCostEur: quote.butler_cost_eur,
  });
  const margins = computeMarginsPerOption(quote.tariff_options || [], {
    chefCostEur: quote.chef_cost_eur,
    chefTravelCostEur: quote.chef_travel_cost_eur,
    butlerRequired: quote.butler_required,
    butlerCostEur: quote.butler_cost_eur,
  });
  const hasCostsConfigured = totalCosts.totalCostsEur > 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-white/55">
          Options tarifaires {hasCostsConfigured && <span className="text-white/40 normal-case tracking-normal">· marge interne calculée</span>}
        </div>
        {hasCostsConfigured && (
          <div className="text-[10px] text-white/45 font-mono">
            Coûts : {fmtEur(totalCosts.totalCostsEur)}
          </div>
        )}
      </div>
      {!hasCostsConfigured && (
        <div className="text-[11px] text-white/40 italic">
          Renseigne le coût chef pour voir la marge nette par option ↓ (bouton « Éditer les sections »)
        </div>
      )}
      {hasCostsConfigured && (
        <div className="text-[10px] text-white/40 space-x-2 font-mono">
          {quote.chef_cost_eur ? <span>Chef {fmtEur(Number(quote.chef_cost_eur))}</span> : null}
          {quote.chef_travel_cost_eur ? <span>· Déplacement {fmtEur(Number(quote.chef_travel_cost_eur))}</span> : null}
          {quote.butler_required && quote.butler_cost_eur ? <span>· Butler {fmtEur(Number(quote.butler_cost_eur))}</span> : null}
        </div>
      )}
      <div className="divide-y divide-white/[0.04]">
        {margins.map((m, i) => {
          const tone = getMarginTone(m.marginPct);
          return (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-white/80 truncate">{m.label}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="font-mono text-white/75 text-right">
                  <div className="leading-tight">{fmtEur(m.htEur)} <span className="text-white/40 text-[10px]">HT</span></div>
                </div>
                {hasCostsConfigured && (
                  <div className={`font-mono text-[10px] px-2 py-0.5 rounded border ${TONE_CLASS[tone]} text-right min-w-[105px] flex items-center justify-end gap-1`}>
                    {m.marginEur >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {fmtEur(m.marginEur)}
                      {m.marginPct !== null && (
                        <span className="opacity-70"> · {m.marginPct >= 0 ? '+' : ''}{m.marginPct}%</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inpCls = 'w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-white/55 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-white/35 mt-0.5">{hint}</span>}
    </label>
  );
}

// Aperçu live de la marge dans l'éditeur — recalcule à chaque saisie
function LiveMarginPreview({
  tariffs,
  chefCost,
  chefTravel,
  butlerRequired,
  butlerCost,
}: {
  tariffs: TariffOption[];
  chefCost: string;
  chefTravel: string;
  butlerRequired: boolean;
  butlerCost: string;
}) {
  const num = (s: string): number => {
    const t = s.trim().replace(',', '.');
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  };
  const costs = computeTotalCosts({
    chefCostEur: num(chefCost),
    chefTravelCostEur: num(chefTravel),
    butlerRequired,
    butlerCostEur: num(butlerCost),
  });
  if (costs.totalCostsEur === 0 || tariffs.length === 0) return null;

  const margins = computeMarginsPerOption(
    tariffs.map((t) => ({ label: t.label, ht_eur: Number(t.ht_eur) || 0 })),
    {
      chefCostEur: num(chefCost),
      chefTravelCostEur: num(chefTravel),
      butlerRequired,
      butlerCostEur: num(butlerCost),
    },
  );

  return (
    <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 space-y-1.5 text-xs">
      <div className="text-[10px] uppercase tracking-wider text-emerald-200/80 font-semibold">
        Aperçu marge en temps réel
      </div>
      <div className="text-[10px] text-emerald-100/55 font-mono">
        Coût total interne : {fmtEur(costs.totalCostsEur)}
      </div>
      <div className="space-y-1 pt-1">
        {margins.map((m, i) => {
          const tone = getMarginTone(m.marginPct);
          return (
            <div key={i} className="flex items-center justify-between">
              <span className="text-white/75">{m.label}</span>
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${TONE_CLASS[tone]}`}>
                {fmtEur(m.marginEur)}
                {m.marginPct !== null && (
                  <span className="opacity-70"> · {m.marginPct >= 0 ? '+' : ''}{m.marginPct}%</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-white/55 font-semibold">{title}</div>
        {right}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
