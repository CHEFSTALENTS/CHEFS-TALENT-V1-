'use client';

// ChangeQuoteStatusModal — Workflow complet de changement de statut devis
//
// Permet à Thomas de :
//  - choisir le nouveau statut (sent / accepted / declined / expired / cancelled / draft)
//  - personnaliser la date de l'événement (défaut = aujourd'hui)
//  - écrire un motif libre (raison du refus, contexte de la négo, etc.)
//  - saisir un montant final négocié optionnel (HT + TTC) — utile quand la
//    négo a changé le montant accepté par rapport aux options initiales

import { useState } from 'react';
import { Loader2, X, CheckCircle2, Send, XCircle, Clock, Ban, FileText } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'cancelled';

const STATUS_OPTIONS: Array<{
  value: QuoteStatus;
  label: string;
  icon: typeof CheckCircle2;
  cls: string;
  description: string;
}> = [
  { value: 'sent',      label: 'Envoyé',    icon: Send,        cls: 'sky',     description: 'Devis transmis au client, en attente de réponse' },
  { value: 'accepted',  label: 'Accepté',   icon: CheckCircle2,cls: 'emerald', description: 'Le client a accepté — c\'est un CA gagné' },
  { value: 'declined',  label: 'Refusé',    icon: XCircle,     cls: 'red',     description: 'Le client a refusé la proposition' },
  { value: 'expired',   label: 'Expiré',    icon: Clock,       cls: 'amber',   description: 'Pas de réponse dans le délai de validité' },
  { value: 'cancelled', label: 'Annulé',    icon: Ban,         cls: 'gray',    description: 'Annulé en interne (erreur, doublon, etc.)' },
  { value: 'draft',     label: 'Brouillon', icon: FileText,    cls: 'gray',    description: 'Revenir en brouillon, pas encore envoyé' },
];

const CLS_MAP: Record<string, string> = {
  sky:     'border-sky-400/40 bg-sky-400/10 text-sky-100',
  emerald: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  red:     'border-red-400/40 bg-red-400/10 text-red-100',
  amber:   'border-amber-400/40 bg-amber-400/10 text-amber-100',
  gray:    'border-white/20 bg-white/5 text-white/85',
};

export default function ChangeQuoteStatusModal({
  quoteId,
  currentStatus,
  currentReason,
  currentFinalHt,
  currentFinalTtc,
  onClose,
  onSaved,
}: {
  quoteId: string;
  currentStatus: QuoteStatus;
  currentReason: string | null;
  currentFinalHt: number | null;
  currentFinalTtc: number | null;
  onClose: () => void;
  onSaved: (updatedQuote: any) => void;
}) {
  const [status, setStatus] = useState<QuoteStatus>(currentStatus);
  const [eventDate, setEventDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState(currentReason || '');
  const [finalHt, setFinalHt] = useState<string>(
    currentFinalHt !== null ? String(currentFinalHt) : '',
  );
  const [finalTtc, setFinalTtc] = useState<string>(
    currentFinalTtc !== null ? String(currentFinalTtc) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showAmountFields = status === 'accepted' || status === 'declined';
  const needsReason = status === 'declined' || status === 'cancelled';

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        status,
        eventDate: status === 'draft' ? null : eventDate,
        statusReason: reason || null,
      };
      // On envoie les montants seulement s'ils sont visibles ET remplis,
      // pour éviter d'écraser des valeurs existantes.
      if (showAmountFields) {
        if (finalHt !== '') body.finalAmountHt = finalHt;
        if (finalTtc !== '') body.finalAmountTtc = finalTtc;
      }

      const json = await adminFetch<{ ok: boolean; quote: any; error?: string }>(
        `/api/admin/quotes/${quoteId}/status`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!json.ok) throw new Error(json.error || 'Erreur inconnue');
      onSaved(json.quote);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e1116] shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Changer le statut du devis</h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 rounded-lg hover:bg-white/10 text-white/55"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Choix du statut */}
          <div>
            <label className="block text-xs text-white/55 mb-2">Nouveau statut</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`text-left p-3 rounded-xl border transition ${
                      active ? CLS_MAP[opt.cls] : 'border-white/10 bg-white/[0.02] text-white/65 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                    <div className="text-[10px] mt-1 opacity-80 leading-tight">{opt.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date événement */}
          {status !== 'draft' && (
            <div>
              <label className="block text-xs text-white/55 mb-1.5">
                Date de l'événement
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Par défaut aujourd'hui. Modifie si le statut a changé un autre jour.
              </p>
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="block text-xs text-white/55 mb-1.5">
              Motif {needsReason && <span className="text-amber-300">(conseillé)</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={
                status === 'declined' ? 'Ex: prix trop élevé, dates indisponibles…' :
                status === 'accepted' ? 'Ex: signature contrat mission #M-1234' :
                status === 'cancelled' ? 'Ex: doublon, demande retirée…' :
                'Note libre (optionnel)'
              }
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
            />
          </div>

          {/* Montants finaux */}
          {showAmountFields && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <div className="text-xs text-white/55">
                Montant final négocié <span className="text-white/40">(optionnel)</span>
              </div>
              <p className="text-[10px] text-white/45 leading-snug">
                Si la négo a changé le montant accepté vs les options initiales, saisis-le ici.
                Sinon, laisse vide — le calcul utilisera la moyenne des options.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/45 mb-0.5">HT (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={finalHt}
                    onChange={(e) => setFinalHt(e.target.value)}
                    placeholder="ex: 4500"
                    className="w-full px-3 py-2.5 rounded-md border border-white/10 bg-white/5 text-sm text-white font-mono placeholder:text-white/25"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/45 mb-0.5">TTC (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={finalTtc}
                    onChange={(e) => setFinalTtc(e.target.value)}
                    placeholder="ex: 5400"
                    className="w-full px-3 py-2.5 rounded-md border border-white/10 bg-white/5 text-sm text-white font-mono placeholder:text-white/25"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-sm text-white/75 hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-sky-400 text-sky-950 text-sm font-medium hover:bg-sky-300 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Enregistrer
          </button>
        </footer>
      </div>
    </div>
  );
}
