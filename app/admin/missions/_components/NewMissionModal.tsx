'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Sparkles, Search } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type ChefOption = {
  user_id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profile?: any;
  status?: string;
};

interface Props {
  onClose: () => void;
  onSuccess: (missionId: string) => void;
}

/**
 * Modal de création d'une mission spontanée (sans demande client préalable).
 * Cas d'usage : un chef appelle Thomas pour une mission qu'il a déjà
 * négociée hors-app, ou Thomas veut tracker une mission ad-hoc.
 *
 * POST /api/admin/missions accepte déjà requestId=null → on n'a rien à
 * changer côté serveur.
 */
export default function NewMissionModal({ onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Liste des chefs (pour le sélecteur)
  const [chefs, setChefs] = useState<ChefOption[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(true);
  const [chefSearch, setChefSearch] = useState('');
  const [selectedChef, setSelectedChef] = useState<ChefOption | null>(null);

  // Form
  const [form, setForm] = useState({
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    guestCount: '',
    serviceLevel: '',
    notes: '',
    chefAmount: '',
    clientAmount: '',
    contractUrl: '',
  });
  const set = (patch: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  // Fetch chefs au mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingChefs(true);
      try {
        const r = await adminFetchRaw('/api/admin/chefs');
        const json = await r.json();
        if (cancelled) return;
        const list: ChefOption[] = Array.isArray(json?.chefs) ? json.chefs : [];
        // Garder uniquement les chefs actifs
        const active = list.filter(
          (c) => String(c.status || '').toLowerCase() === 'active',
        );
        setChefs(active);
      } catch (e) {
        console.error('[NewMissionModal] fetch chefs failed', e);
        if (!cancelled) setChefs([]);
      } finally {
        if (!cancelled) setLoadingChefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredChefs = useMemo(() => {
    const q = chefSearch.trim().toLowerCase();
    if (!q) return chefs.slice(0, 20);
    return chefs
      .filter((c) => {
        const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        return (
          name.includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [chefs, chefSearch]);

  const commission =
    form.chefAmount && form.clientAmount
      ? Number(form.clientAmount) - Number(form.chefAmount)
      : 0;

  const canSubmit =
    !!selectedChef &&
    !submitting &&
    !!form.location.trim() &&
    !!form.startDate;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedChef) return;
    setSubmitting(true);
    setError(null);
    try {
      const chefName =
        `${selectedChef.firstName || ''} ${selectedChef.lastName || ''}`.trim() ||
        'Chef';

      const r = await adminFetchRaw('/api/admin/missions', {
        method: 'POST',
        body: JSON.stringify({
          requestId: null, // mission spontanée
          chefId: selectedChef.user_id,
          chefEmail: selectedChef.email,
          chefName,
          title: form.title || `Mission — ${form.location || 'spontanée'}`,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate || null,
          guestCount: form.guestCount ? Number(form.guestCount) : null,
          serviceLevel: form.serviceLevel || null,
          notes: form.notes || null,
          chefAmount: form.chefAmount ? Number(form.chefAmount) : null,
          clientAmount: form.clientAmount ? Number(form.clientAmount) : null,
          contractUrl: form.contractUrl || null,
        }),
      });

      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      onSuccess(json.missionId);
    } catch (e: any) {
      console.error('[NewMissionModal] submit failed', e);
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
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h2 className="text-base font-semibold text-white">
                Nouvelle mission spontanée
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Sans demande client préalable. La mission sera créée en
              statut <span className="text-white/80">offered</span>.
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

          {/* Sélection chef */}
          <div>
            <label className={labelCls}>Chef *</label>
            {selectedChef ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <div>
                  <div className="text-sm text-white">
                    {`${selectedChef.firstName || ''} ${selectedChef.lastName || ''}`.trim() ||
                      'Chef'}
                  </div>
                  <div className="text-xs text-white/50">
                    {selectedChef.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChef(null)}
                  className="text-xs text-white/60 hover:text-white underline"
                >
                  Changer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={chefSearch}
                    onChange={(e) => setChefSearch(e.target.value)}
                    placeholder="Rechercher un chef (nom ou email)..."
                    className={`${inputCls} pl-10`}
                    autoFocus
                  />
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 max-h-56 overflow-y-auto">
                  {loadingChefs ? (
                    <div className="p-4 text-sm text-white/50 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Chargement des chefs...
                    </div>
                  ) : filteredChefs.length === 0 ? (
                    <div className="p-4 text-sm text-white/50">
                      {chefSearch
                        ? 'Aucun chef trouvé.'
                        : 'Aucun chef actif.'}
                    </div>
                  ) : (
                    filteredChefs.map((c) => (
                      <button
                        key={c.user_id}
                        type="button"
                        onClick={() => setSelectedChef(c)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition flex items-center justify-between border-b border-white/5 last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate">
                            {`${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                              'Chef'}
                          </div>
                          <div className="text-xs text-white/45 truncate">
                            {c.email}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Champs mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Titre (optionnel)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Ex. Dîner privé Cap Ferrat — anniversaire"
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Lieu *</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="Saint-Tropez, Cap Ferrat, ..."
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Date début *</label>
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
                value={form.guestCount}
                onChange={(e) => set({ guestCount: e.target.value })}
                className={inputCls}
                min={1}
              />
            </div>

            <div>
              <label className={labelCls}>Service / Niveau</label>
              <input
                type="text"
                value={form.serviceLevel}
                onChange={(e) => set({ serviceLevel: e.target.value })}
                placeholder="Premium, Exclusive, ..."
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Rémunération chef (€)</label>
              <input
                type="number"
                value={form.chefAmount}
                onChange={(e) => set({ chefAmount: e.target.value })}
                className={inputCls}
                min={0}
              />
            </div>

            <div>
              <label className={labelCls}>Prix client (€)</label>
              <input
                type="number"
                value={form.clientAmount}
                onChange={(e) => set({ clientAmount: e.target.value })}
                className={inputCls}
                min={0}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Lien contrat (optionnel)</label>
              <input
                type="text"
                value={form.contractUrl}
                onChange={(e) => set({ contractUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
                rows={3}
                placeholder="Briefing, contraintes, infos client..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          {/* Commission */}
          {commission > 0 && (
            <div className="flex justify-between text-xs px-1 pt-1 border-t border-white/10">
              <span className="text-white/50">Commission CT</span>
              <span className="text-amber-300 font-medium">
                {commission.toLocaleString('fr-FR')} €
              </span>
            </div>
          )}

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
                <Sparkles className="w-4 h-4" />
              )}
              {submitting ? 'Création…' : 'Créer la mission + envoyer email chef'}
            </button>

            <p className="text-[10px] text-white/40 text-center leading-relaxed">
              Le chef recevra un email avec les détails de la mission.
              La mission sera créée en statut <strong>offered</strong>.
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
