'use client';

import React, { useState } from 'react';
import { Loader2, BadgeCheck } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';
import { AdminModal } from '@/app/admin/_components/AdminModal';

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
    <AdminModal
      title="Marquer la mission encaissée"
      subtitle={`Le client a réglé · ${chefName}${location ? ` · ${location}` : ''}`}
      size="md"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5 transition disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BadgeCheck className="w-4 h-4" />
            )}
            {submitting ? 'Enregistrement…' : 'Confirmer l\'encaissement'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
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

        <p className="text-[10px] text-white/40 text-center leading-relaxed pt-1">
          La mission passera en statut <strong>encaissée</strong> et sera
          comptabilisée dans le KPI « Encaissées ce mois ». Le paiement
          au chef se gère séparément hors-app.
        </p>
      </div>
    </AdminModal>
  );
}
