'use client';

// QuotePanel — gestion du devis lié à une client_request.
// - Si pas de devis : bouton "Générer un devis" (pré-rempli depuis la request)
// - Si devis existe : affiche le statut + boutons (éditer, télécharger PDF, supprimer)
// - Éditeur de sections en modal : intitulé, profils tarifaires, conditions, etc.

import { useEffect, useState, useCallback } from 'react';
import { Loader2, FileText, Download, Eye, PenSquare, Trash2, FilePlus } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

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
};

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
          Aucun devis pour cette demande. Génère-le pré-rempli depuis les infos de la demande, tu pourras éditer les sections après.
        </p>
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        <button
          onClick={generate}
          disabled={creating}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-sky-400 text-sky-950 text-sm font-medium hover:bg-sky-300 disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FilePlus className="w-4 h-4 mr-2" />}
          {creating ? 'Génération…' : 'Générer un devis'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status + ref */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[quote.status]}`}>
          {STATUS_LABEL[quote.status]}
        </span>
        <span className="text-xs text-white/55 font-mono">{quote.reference}</span>
        <span className="text-[10px] text-white/40">émis le {quote.issued_at}</span>
        {quote.validity_date && (
          <span className="text-[10px] text-white/40">· valide jusqu'au {quote.validity_date}</span>
        )}
      </div>

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

      {/* Tariff preview */}
      {Array.isArray(quote.tariff_options) && quote.tariff_options.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-1 text-xs">
          <div className="text-[10px] uppercase tracking-wider text-white/55 mb-1">Options tarifaires</div>
          {quote.tariff_options.map((t, i) => (
            <div key={i} className="flex items-center justify-between text-white/75">
              <span>{t.label}</span>
              <span className="font-mono">
                {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(t.ttc_eur)} EUR TTC
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/admin/quotes/${quote.id}/pdf?format=html`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/85"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Aperçu HTML
        </a>
        <a
          href={`/api/admin/quotes/${quote.id}/pdf?format=pdf`}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 text-xs text-emerald-200"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Télécharger PDF
        </a>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 hover:bg-sky-400/20 text-xs text-sky-200"
        >
          <PenSquare className="w-3.5 h-3.5 mr-1.5" />
          Éditer les sections
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
      const body = {
        ...form,
        validity_date: form.validity_date || null,
        destinataire_adresse: form.destinataire_adresse.trim() || null,
        conditions: form.conditions.split('\n').map((s) => s.trim()).filter(Boolean),
        tariff_options: tariffs,
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

          <Section title="Options tarifaires" right={
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
