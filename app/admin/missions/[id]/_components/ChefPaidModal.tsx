'use client';

// Modal « Marquer chef payé » sur la fiche mission.
// PATCH /api/admin/missions/[id]/mark-chef-paid

import { useState } from 'react';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';
import { AdminModal } from '@/app/admin/_components/AdminModal';

type Props = {
  missionId: string;
  chefName: string | null;
  defaultAmount: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

const METHOD_LABELS: Record<string, string> = {
  virement: 'Virement bancaire',
  cb_link: 'Lien CB',
  revolut: 'Revolut',
  stripe: 'Stripe',
  especes: 'Espèces',
  cheque: 'Chèque',
  autre: 'Autre',
};

export default function ChefPaidModal({ missionId, chefName, defaultAmount, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(defaultAmount != null ? String(defaultAmount) : '');
  const [method, setMethod] = useState<string>('virement');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}/mark-chef-paid`, {
        method: 'PATCH',
        body: JSON.stringify({
          chefPaidAmount: amount ? Number(amount) : null,
          chefPaidMethod: method,
          chefPaidReference: reference.trim() || null,
          chefPaidAt: paidAt,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const valid = !!amount && Number(amount) > 0 && !!method && !!paidAt;

  return (
    <AdminModal
      title="Marquer chef payé"
      size="md"
      onClose={onClose}
      closeOnBackdrop={!submitting}
      closeOnEscape={!submitting}
      footer={
        <>
          <button onClick={onClose} disabled={submitting} className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!valid || submitting}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <BadgeCheck className="w-3.5 h-3.5 mr-1.5" />}
            Confirmer paiement chef
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-xs text-white/55">
          Chef : <strong className="text-white">{chefName || '—'}</strong>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Montant versé (€)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Date</span>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Méthode</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
          >
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-neutral-900">{v}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-white/45 mb-1">Référence (optionnel)</span>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="n° virement, ID transaction..."
            className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
          />
        </label>

        {error && (
          <div className="text-sm text-red-300 border border-red-400/30 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>
        )}
      </div>
    </AdminModal>
  );
}
