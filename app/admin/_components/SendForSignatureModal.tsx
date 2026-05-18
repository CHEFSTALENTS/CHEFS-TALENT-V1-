'use client';

// Modal de double-vérification avant envoi YouSign.
//
// Affiche :
//   - Liste signataires avec warnings (email manquant, format invalide, perso
//     vs société, etc.) → highlight rouge si bloquant, jaune si soft
//   - Iframe aperçu PDF (HTML rendu, instantané — exactement ce que YouSign
//     convertira en PDF côté serveur)
//   - Checkbox obligatoire « J'ai vérifié les noms, emails et le contenu »
//   - Récap one-liner (nb signataires, expiration, irréversibilité)
//   - Boutons : Modifier (ferme) + Envoyer pour signature (disabled tant
//     que checkbox pas cochée OU canSend=false)
//
// Réutilisable pour :
//   - Contrats mission (essai/chef/client) — depuis ContractsPanel
//   - NCC concierge — depuis le panneau NCC (PR follow-up)

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';

export type ModalSigner = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  warnings: string[];
};

export type SendForSignatureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Appelée quand l'admin confirme l'envoi (Promise résolue = succès) */
  onConfirm: () => Promise<void>;

  /** Titre humain (ex: « Envoyer le Contrat de mission chef pour signature ») */
  title: string;

  /** Données de la preview (chargées via GET côté caller) */
  loading: boolean;
  error?: string | null;
  signers: ModalSigner[];
  missingFields: string[];
  /** HTML complet du contrat à afficher dans l'iframe */
  html: string;
  /** Nom du fichier PDF qui sera généré (pour info) */
  filename?: string;
  /** Si false : bouton envoyer désactivé même si checkbox cochée (ex: ALREADY_PENDING) */
  canSend: boolean;
  /** Message d'avertissement haut du modal (ex: « Une signature est déjà en cours ») */
  blockerMessage?: string | null;
};

export default function SendForSignatureModal(props: SendForSignatureModalProps) {
  const {
    isOpen,
    onClose,
    onConfirm,
    title,
    loading,
    error,
    signers,
    missingFields,
    html,
    filename,
    canSend,
    blockerMessage,
  } = props;

  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset l'état à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setChecked(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  // ESC ferme le modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const hasBlockingMissing = missingFields.length > 0;
  const canActuallySend = canSend && !hasBlockingMissing && checked && !submitting && !loading;

  async function handleConfirm() {
    if (!canActuallySend) return;
    setSubmitting(true);
    try {
      await onConfirm();
      // Caller ferme le modal en cas de succès (via onClose dans son own .then())
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] flex flex-col bg-[#0f0f10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <h2 className="text-base font-semibold text-white truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Blocker banner (ex: déjà en cours) */}
        {blockerMessage && (
          <div className="px-5 py-3 bg-amber-500/15 border-b border-amber-500/30 text-sm text-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{blockerMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Colonne gauche : signataires + checkbox */}
          <div className="space-y-4 min-w-0">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/45 mb-2">
                Signataires ({signers.length})
              </div>
              {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-2 text-sm text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement…
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {signers.map((s, i) => {
                    const hasErr = s.warnings.some((w) => /manquant|invalide/i.test(w));
                    return (
                      <div
                        key={`${s.email}-${i}`}
                        className={[
                          'rounded-xl border p-3',
                          hasErr
                            ? 'border-red-500/40 bg-red-500/10'
                            : s.warnings.length > 0
                            ? 'border-amber-500/40 bg-amber-500/5'
                            : 'border-white/10 bg-white/5',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {s.firstName} {s.lastName}
                            </div>
                            <div className="text-xs text-white/55 truncate">{s.email}</div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-white/15 bg-white/5 text-white/65">
                            {s.role}
                          </span>
                        </div>
                        {s.warnings.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {s.warnings.map((w, j) => (
                              <li key={j} className={`text-[11px] flex items-start gap-1.5 ${hasErr ? 'text-red-300' : 'text-amber-300'}`}>
                                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {hasBlockingMissing && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <div className="flex items-center gap-2 font-medium mb-1">
                  <XCircle className="h-4 w-4" />
                  Envoi impossible
                </div>
                <div className="text-xs">
                  Données manquantes : {missingFields.join(', ')}.<br />
                  Renseigne ces champs sur la fiche correspondante puis recharge.
                </div>
              </div>
            )}

            {/* Récap */}
            {!loading && !error && !hasBlockingMissing && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-white/55 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Send className="h-3 w-3" />
                  <span>Email envoyé immédiatement aux signataires</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  <span>Délai signature : 90 jours (relance auto J+3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Une fois signé, non modifiable</span>
                </div>
                {filename && (
                  <div className="text-white/40 truncate mt-1">📎 {filename}</div>
                )}
              </div>
            )}

            {/* Checkbox confirmation */}
            {!loading && !error && !hasBlockingMissing && (
              <label className="flex items-start gap-2 cursor-pointer select-none p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-white/85">
                  J'ai vérifié les <strong>noms</strong>, les <strong>emails</strong> et le <strong>contenu du contrat</strong>.
                </span>
              </label>
            )}
          </div>

          {/* Colonne droite : aperçu PDF (iframe HTML) */}
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-white/45 mb-2">Aperçu</div>
            <div className="rounded-xl border border-white/10 bg-white overflow-hidden">
              {loading ? (
                <div className="h-[40vh] md:h-[60vh] flex items-center justify-center text-stone-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <iframe
                  srcDoc={html}
                  title="Aperçu contrat"
                  className="w-full h-[40vh] md:h-[60vh] border-0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition disabled:opacity-50"
          >
            Modifier
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canActuallySend}
            className={[
              'inline-flex items-center px-5 py-2 rounded-xl text-sm font-medium transition',
              canActuallySend
                ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'
                : 'bg-white/10 text-white/40 cursor-not-allowed',
            ].join(' ')}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmer l'envoi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
