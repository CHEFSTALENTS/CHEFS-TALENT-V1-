'use client';

import React, { useState } from 'react';
import { X, Loader2, BadgeCheck } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

interface Props {
  missionId: string;
  defaultAmount: number | null;
  chefName: string;
  location: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS: Array<{ value: string; label: string }> = [
  { value: 'sepa', label: 'Virement SEPA' },
  { value: 'wire', label: 'Virement bancaire' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'cash', label: 'Espèces' },
  { value: 'check', label: 'Chèque' },
  { value: 'other', label: 'Autre' },
];

/**
 * Modal admin : marquer une mission confirmée comme ENCAISSÉE.
 * « Payée » dans cette UI = le CLIENT a réglé Chefs Talents. Le
 * paiement chef (sortie de cash) est géré séparément hors-app pour
 * l'instant — on n'enregistre ici que l'encaissement.
 *
 * Le montant pré-rempli est donc le prix client (client_amount), pas
 * le chef_amount. L'admin peut le modifier si acompte / écart.
 */
export default function MarkPaidModal({
  missionId,
  defaultAmount,
  chefName,
  location,
  onClose,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    paidAmount: defaultAmount != null ? String(defaultAmount) : '',
    paymentMethod: 'sepa',
    paymentReference: '',
  });

  const set = (patch: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const canSubmit =
    !submitting &&
    !!form.paidAmount &&
    Number(form.paidAmount) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await adminFetchRaw(
        `/api/admin/missions/${encodeURIComponent(missionId)}/mark-paid`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            paymentStatus: 'paid',
            paidAmount: Number(form.paidAmount),
            paymentMethod: form.paymentMethod,
            paymentReference: form.paymentReference.trim() || null,
          }),
        },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      onSuccess();
    } catch (e: any) {
      console.error('[MarkPaidModal] submit failed', e);
      setError(e?.message || 'Erreur serveur');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 border border-white/10 bg-white/5 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30 transition';
  const labelCls =
    'text-xs text-white/50 uppercase tracking-widest mb-1.5 block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-300" />
              <h2 className="text-base font-semibold text-white">
                Marquer la mission encaissée
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-0.5 truncate">
              Le client a réglé · {chefName}{location ? ` · ${location}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          <div>
            <label className={labelCls}>Montant encaissé du client (€) *</label>
            <input
              type="number"
              min={0}
              step={1}
              autoFocus
              value={form.paidAmount}
              onChange={(e) => set({ paidAmount: e.target.value })}
              className={inputCls}
              placeholder="Ex. 2400"
            />
            {defaultAmount != null && (
              <p className="text-[10px] text-white/30 mt-1">
                Prix client initial : {defaultAmount.toLocaleString('fr-FR')} €
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Méthode de paiement</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => set({ paymentMethod: e.target.value })}
              className={inputCls}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Référence (optionnel)</label>
            <input
              type="text"
              value={form.paymentReference}
              onChange={(e) => set({ paymentReference: e.target.value })}
              placeholder="ID Stripe, ref SEPA, n° chèque..."
              className={inputCls}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BadgeCheck className="w-4 h-4" />
              )}
              {submitting ? 'Enregistrement…' : 'Confirmer l\'encaissement'}
            </button>

            <p className="text-[10px] text-white/40 text-center leading-relaxed">
              La mission passera en statut <strong>encaissée</strong> et sera
              comptabilisée dans le KPI « Encaissées ce mois ». Le paiement
              au chef se gère séparément hors-app.
            </p>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full px-5 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition disabled:opacity-40"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
