'use client';

// ImportPdfQuoteModal — lit un PDF de devis et le reporte sur le devis
// en brouillon de la demande courante.
//
// Flow : upload PDF → extract via Claude → preview + cases à cocher
// par champ → PATCH /api/admin/quotes/[id] avec les champs cochés.
//
// Disponible seulement si le quote est en status='draft' — on n'écrase
// pas un devis envoyé ou accepté.

import { useState } from 'react';
import { Loader2, FileUp, X, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';

type TariffOption = {
  label: string | null;
  ht_eur: number | null;
  tva_eur: number | null;
  ttc_eur: number | null;
  note: string | null;
};

type ExtractedQuote = {
  intitule: string | null;
  destinataire_nom: string | null;
  destinataire_type: string | null;
  lieu: string | null;
  dates_text: string | null;
  convives_text: string | null;
  rythme_text: string | null;
  langues_text: string | null;
  hebergement_text: string | null;
  tariff_options: TariffOption[];
  conditions: string[];
  courses_text: string | null;
  courses_provision_text: string | null;
  notes: string | null;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
};

const SCALAR_FIELDS: { key: keyof ExtractedQuote; label: string }[] = [
  { key: 'intitule', label: 'Intitulé' },
  { key: 'destinataire_nom', label: 'Destinataire' },
  { key: 'destinataire_type', label: 'Type destinataire' },
  { key: 'lieu', label: 'Lieu' },
  { key: 'dates_text', label: 'Dates' },
  { key: 'convives_text', label: 'Convives' },
  { key: 'rythme_text', label: 'Rythme' },
  { key: 'langues_text', label: 'Langues' },
  { key: 'hebergement_text', label: 'Hébergement' },
  { key: 'courses_text', label: 'Courses' },
  { key: 'courses_provision_text', label: 'Provision courses' },
];

const fmtEur = (n: number | null) =>
  n === null || n === undefined
    ? '—'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const CONFIDENCE_TONE: Record<ExtractedQuote['confidence'], string> = {
  high: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  medium: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  low: 'bg-red-400/15 text-red-200 border-red-400/25',
};

const CONFIDENCE_LABEL: Record<ExtractedQuote['confidence'], string> = {
  high: 'Lecture nette',
  medium: 'Quelques choix',
  low: 'Beaucoup d\'incertitudes',
};

export default function ImportPdfQuoteModal({
  quoteId,
  onClose,
  onApplied,
}: {
  quoteId: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedQuote | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await adminFetchRaw(`/api/admin/quotes/${quoteId}/extract-from-pdf`, {
        method: 'POST',
        body: form,
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${r.status}`);
      }
      setExtracted(json.extracted);
      // Par défaut : tout coché sauf si valeur null
      const initSel: Record<string, boolean> = {};
      for (const f of SCALAR_FIELDS) {
        initSel[f.key as string] = json.extracted[f.key] != null;
      }
      initSel.tariff_options = Array.isArray(json.extracted.tariff_options) && json.extracted.tariff_options.length > 0;
      initSel.conditions = Array.isArray(json.extracted.conditions) && json.extracted.conditions.length > 0;
      setSelected(initSel);
    } catch (e: any) {
      setError(e?.message || 'Erreur lecture');
    } finally {
      setExtracting(false);
    }
  };

  const handleApply = async () => {
    if (!extracted) return;
    setApplying(true);
    setError(null);
    try {
      const patch: Record<string, any> = {};
      for (const f of SCALAR_FIELDS) {
        if (selected[f.key as string] && extracted[f.key] != null) {
          patch[f.key as string] = extracted[f.key];
        }
      }
      if (selected.tariff_options && extracted.tariff_options?.length > 0) {
        patch.tariff_options = extracted.tariff_options.map((t) => ({
          label: t.label || 'Option',
          ht_eur: Number(t.ht_eur || 0),
          tva_eur: Number(t.tva_eur || 0),
          ttc_eur: Number(t.ttc_eur || 0),
          note: t.note,
        }));
      }
      if (selected.conditions && extracted.conditions?.length > 0) {
        patch.conditions = extracted.conditions;
      }

      if (Object.keys(patch).length === 0) {
        throw new Error('Rien de coché à appliquer.');
      }

      const r = await adminFetch<{ ok: boolean; quote?: any; error?: string }>(
        `/api/admin/quotes/${quoteId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(patch),
        },
      );
      if (!r.ok) throw new Error(r.error || 'Erreur application');
      onApplied();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0e1116] shadow-2xl flex flex-col max-h-[92vh]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <div>
              <h3 className="text-sm font-semibold text-white">Lire un PDF de devis</h3>
              <p className="text-[11px] text-white/45">
                {extracted
                  ? 'Coche ce que tu veux appliquer au brouillon. Tu pourras encore éditer après.'
                  : 'Le PDF sera lu par Claude et ses chiffres reportés sur ton devis en brouillon.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </header>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
          {!extracted ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                <FileUp className="w-8 h-8 mx-auto mb-2 text-white/45" />
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block mx-auto text-xs text-white/65 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-indigo-400/15 file:text-indigo-200 hover:file:bg-indigo-400/25"
                />
                {file && (
                  <div className="mt-2 text-[11px] text-white/55">
                    {file.name} · {Math.round(file.size / 1024)} KB
                  </div>
                )}
              </div>

              <div className="text-[11px] text-white/45 leading-relaxed">
                Règles : on lit ce qui est <strong>explicitement écrit</strong> dans le PDF. Aucun chiffre inventé.
                Les valeurs non trouvées resteront vides. Le PDF sera sauvegardé dans les documents du devis pour traçabilité.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Confidence + warnings */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CONFIDENCE_TONE[extracted.confidence]}`}>
                  {CONFIDENCE_LABEL[extracted.confidence]}
                </span>
              </div>
              {extracted.warnings?.length > 0 && (
                <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-200 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    À vérifier
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-amber-100/85 list-disc pl-4">
                    {extracted.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Champs scalaires */}
              <div className="space-y-1.5">
                {SCALAR_FIELDS.map((f) => {
                  const value = extracted[f.key];
                  if (value == null || (typeof value === 'string' && !value.trim())) return null;
                  return (
                    <label
                      key={f.key as string}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]"
                    >
                      <input
                        type="checkbox"
                        checked={!!selected[f.key as string]}
                        onChange={(e) =>
                          setSelected((s) => ({ ...s, [f.key as string]: e.target.checked }))
                        }
                        className="mt-1 accent-indigo-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-white/50">{f.label}</div>
                        <div className="text-xs text-white/85 whitespace-pre-wrap">{String(value)}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Tariff options */}
              {extracted.tariff_options?.length > 0 && (
                <label className="flex items-start gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={!!selected.tariff_options}
                    onChange={(e) => setSelected((s) => ({ ...s, tariff_options: e.target.checked }))}
                    className="mt-1 accent-indigo-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                      Options tarifaires ({extracted.tariff_options.length})
                    </div>
                    <ul className="space-y-1">
                      {extracted.tariff_options.map((t, i) => (
                        <li key={i} className="text-xs text-white/85 flex items-center justify-between gap-2">
                          <span>{t.label || `Option ${i + 1}`}{t.note ? ` — ${t.note}` : ''}</span>
                          <span className="font-mono text-emerald-200">
                            {fmtEur(t.ht_eur)} HT
                            {t.ttc_eur != null && ` · ${fmtEur(t.ttc_eur)} TTC`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              )}

              {/* Conditions */}
              {extracted.conditions?.length > 0 && (
                <label className="flex items-start gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    checked={!!selected.conditions}
                    onChange={(e) => setSelected((s) => ({ ...s, conditions: e.target.checked }))}
                    className="mt-1 accent-indigo-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                      Conditions ({extracted.conditions.length})
                    </div>
                    <ul className="space-y-0.5 text-xs text-white/85 list-disc pl-4">
                      {extracted.conditions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </label>
              )}

              {extracted.notes && (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Notes (non appliquées)</div>
                  <div className="text-xs text-white/85">{extracted.notes}</div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            disabled={extracting || applying}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-50"
          >
            {extracted ? 'Annuler' : 'Fermer'}
          </button>
          {!extracted ? (
            <button
              onClick={handleExtract}
              disabled={!file || extracting}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-400 text-indigo-950 text-sm font-medium hover:bg-indigo-300 disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Lecture en cours…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Lire le PDF
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-400 text-emerald-950 text-sm font-medium hover:bg-emerald-300 disabled:opacity-50"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Appliquer au devis
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
