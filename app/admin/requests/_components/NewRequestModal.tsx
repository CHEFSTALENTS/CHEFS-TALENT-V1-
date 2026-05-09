'use client';

import React, { useState } from 'react';
import { X, Loader2, Inbox } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

interface Props {
  onClose: () => void;
  onSuccess: (requestId: string) => void;
}

/**
 * Modal de création manuelle d'une demande client.
 * Cas d'usage : Thomas reçoit une demande par email/WhatsApp/téléphone
 * (hors formulaire web /request) et veut la consigner dans le tableau
 * de bord pour la traiter comme les autres.
 *
 * La demande sera créée en statut 'new' avec source='admin' pour la
 * distinguer dans les stats des demandes formulaire.
 */
export default function NewRequestModal({ onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    clientType: 'private' as 'private' | 'concierge',
    companyName: '',
    location: '',
    startDate: '',
    endDate: '',
    guestCount: '',
    missionCategory: '' as
      | ''
      | 'single_service'
      | 'single_replacement'
      | 'residence'
      | 'yacht',
    budgetAmount: '',
    notes: '',
  });

  const set = (patch: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const canSubmit =
    !submitting &&
    !!form.email.trim() &&
    /\S+@\S+\.\S+/.test(form.email);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        email: form.email.trim(),
        fullName: form.fullName.trim() || null,
        phone: form.phone.trim() || null,

        matchType: 'concierge', // les demandes admin sont toujours concierge
        clientType: form.clientType,
        companyName:
          form.clientType === 'concierge' ? form.companyName.trim() || null : null,

        location: form.location.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        dateMode: form.endDate ? 'multi' : 'single',

        guestCount: form.guestCount ? Number(form.guestCount) : null,

        missionCategory: form.missionCategory || null,
        assignmentType:
          form.missionCategory === 'yacht'
            ? 'yacht'
            : form.missionCategory === 'residence'
              ? 'daily'
              : 'event',

        budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : null,
        budgetUnit: form.budgetAmount ? 'total' : null,

        notes: form.notes.trim() || null,
        source: 'admin',
      };

      const r = await adminFetchRaw('/api/admin/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      onSuccess(json.requestId);
    } catch (e: any) {
      console.error('[NewRequestModal] submit failed', e);
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
      <div className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-sky-300" />
              <h2 className="text-base font-semibold text-white">
                Nouvelle demande client (manuelle)
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Pour les demandes reçues par email, WhatsApp ou téléphone
              hors formulaire web. Statut initial : <span className="text-white/80">new</span>.
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

          {/* Contact */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
              Contact client
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nom complet</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set({ fullName: e.target.value })}
                  placeholder="Jean Dupont"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="client@example.com"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+33 6 ..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Type client</label>
                <select
                  value={form.clientType}
                  onChange={(e) =>
                    set({
                      clientType: e.target.value as 'private' | 'concierge',
                    })
                  }
                  className={inputCls}
                >
                  <option value="private">Client privé</option>
                  <option value="concierge">Conciergerie / B2B</option>
                </select>
              </div>
              {form.clientType === 'concierge' && (
                <div className="md:col-span-2">
                  <label className={labelCls}>Nom de la conciergerie</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => set({ companyName: e.target.value })}
                    placeholder="Conciergerie XYZ"
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mission */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
              Mission
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className={labelCls}>Lieu</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set({ location: e.target.value })}
                  placeholder="Saint-Tropez, Cap Ferrat, ..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Date début</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set({ startDate: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Date fin (optionnel)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set({ endDate: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Convives</label>
                <input
                  type="number"
                  min={1}
                  value={form.guestCount}
                  onChange={(e) => set({ guestCount: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Type de mission</label>
                <select
                  value={form.missionCategory}
                  onChange={(e) =>
                    set({
                      missionCategory: e.target.value as any,
                    })
                  }
                  className={inputCls}
                >
                  <option value="">— Non précisé —</option>
                  <option value="single_service">Prestation ponctuelle</option>
                  <option value="single_replacement">Remplacement</option>
                  <option value="residence">Séjour / résidence</option>
                  <option value="yacht">Mission yacht</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Budget total estimé (€)</label>
                <input
                  type="number"
                  min={0}
                  value={form.budgetAmount}
                  onChange={(e) => set({ budgetAmount: e.target.value })}
                  placeholder="Ex. 5000"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Notes / contexte</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                  rows={4}
                  placeholder="Reçu par WhatsApp, le client cherche un chef pour anniversaire, préfère cuisine méditerranéenne, ..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
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
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#161616] text-sm font-semibold hover:bg-white/90 transition disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Inbox className="w-4 h-4" />
              )}
              {submitting ? 'Création…' : 'Ajouter au tableau de bord'}
            </button>

            <p className="text-[10px] text-white/40 text-center leading-relaxed">
              Aucun email automatique au client. Tu pourras ensuite la
              traiter normalement (matcher des chefs, confirmer, refuser)
              depuis la liste.
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
