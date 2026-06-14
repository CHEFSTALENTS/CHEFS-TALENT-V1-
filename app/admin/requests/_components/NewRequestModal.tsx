'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X, Loader2, Inbox, UserCheck, Plus, RefreshCw } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';

interface Props {
  onClose: () => void;
  onSuccess: (requestId: string) => void;
}

type ClientMatch = {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string | null;
  phone: string | null;
  companyName: string | null;
  clientType: string | null;
  partnerId: string | null;
  acquisitionChannel: string | null;
  lastRequestAt: string;
};

type PartnerLite = { id: string; name: string; type: string };

const ACQUISITION_OPTIONS = [
  { value: '', label: '— Non précisé —' },
  { value: 'partner', label: 'Apporteur (partner)' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'direct', label: 'Direct (clientèle propre)' },
  { value: 'word_of_mouth', label: 'Bouche-à-oreille' },
  { value: 'press', label: 'Presse' },
  { value: 'other', label: 'Autre' },
];

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
    missionCategory: '' as '' | 'single_service' | 'single_replacement' | 'residence' | 'yacht',
    budgetAmount: '',
    notes: '',
    partnerId: '' as string,
    acquisitionChannel: '' as string,
  });

  const set = (patch: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  // ── Auto-complete client (cherche dans client_requests passées) ──
  const [clientSearch, setClientSearch] = useState('');
  const [clientMatches, setClientMatches] = useState<ClientMatch[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [reusedClientEmail, setReusedClientEmail] = useState<string | null>(null);

  useEffect(() => {
    const q = clientSearch.trim();
    if (q.length < 2) {
      setClientMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      setClientSearchLoading(true);
      try {
        const json = await adminFetch<{ ok: boolean; clients: ClientMatch[] }>(
          `/api/admin/clients/search?q=${encodeURIComponent(q)}`,
        );
        setClientMatches(json.clients || []);
      } catch {
        setClientMatches([]);
      } finally {
        setClientSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [clientSearch]);

  const reuseClient = (c: ClientMatch) => {
    set({
      email: c.email || '',
      fullName: c.fullName || '',
      phone: c.phone || '',
      companyName: c.companyName || '',
      clientType: c.clientType === 'b2b' || c.clientType === 'concierge' ? 'concierge' : 'private',
      partnerId: c.partnerId || '',
      acquisitionChannel: c.acquisitionChannel || '',
    });
    setClientSearch('');
    setClientMatches([]);
    setReusedClientEmail(c.email || null);
  };

  // ── Auto-complete partner (CRM apporteurs) ──
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partners, setPartners] = useState<PartnerLite[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);

  const fetchPartners = useCallback(async (q: string) => {
    setPartnersLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      params.set('limit', '20');
      params.set('status', 'active');
      const json = await adminFetch<{ ok: boolean; partners: PartnerLite[] }>(
        `/api/admin/partners?${params.toString()}`,
      );
      setPartners(json.partners || []);
    } catch {
      setPartners([]);
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPartners(partnerSearch), 250);
    return () => clearTimeout(t);
  }, [partnerSearch, fetchPartners]);

  const selectedPartner = partners.find((p) => p.id === form.partnerId);

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

        partnerId: form.partnerId || null,
        acquisitionChannel: form.acquisitionChannel || null,
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
              Pour les demandes reçues par email, WhatsApp ou téléphone hors formulaire web.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Auto-complete client existant */}
          <div className="rounded-xl border border-sky-400/20 bg-sky-400/[0.04] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-sky-200/80 uppercase tracking-widest">
                Client déjà connu ?
              </p>
              {reusedClientEmail && (
                <span className="text-[10px] text-emerald-300 inline-flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  réutilisé : {reusedClientEmail}
                </span>
              )}
            </div>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Cherche par email, téléphone ou nom…"
              className={inputCls}
            />
            {clientSearchLoading && (
              <div className="text-[11px] text-white/40 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> recherche…
              </div>
            )}
            {clientMatches.length > 0 && (
              <div className="max-h-44 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] divide-y divide-white/5">
                {clientMatches.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => reuseClient(c)}
                    className="w-full text-left px-3 py-2 hover:bg-white/[0.05] text-xs"
                  >
                    <div className="text-white/90 truncate">
                      {c.fullName || c.firstName || c.email}
                    </div>
                    <div className="text-[10px] text-white/45 truncate">
                      {[c.email, c.phone, c.companyName].filter(Boolean).join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

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
                  onChange={(e) => set({ clientType: e.target.value as 'private' | 'concierge' })}
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

          {/* Apporteur + canal d'acquisition */}
          <div className="rounded-xl border border-indigo-400/20 bg-indigo-400/[0.04] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-300" />
              <p className="text-xs text-indigo-200/85 uppercase tracking-widest">
                Apporteur / canal d'acquisition
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Canal d'acquisition</label>
                <select
                  value={form.acquisitionChannel}
                  onChange={(e) => set({ acquisitionChannel: e.target.value })}
                  className={inputCls}
                >
                  {ACQUISITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Apporteur (si applicable)</label>
                <input
                  type="text"
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  placeholder="Rechercher un apporteur…"
                  className={inputCls + ' mb-1.5'}
                />
                {selectedPartner && form.partnerId && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-indigo-400/30 bg-indigo-400/10 text-xs text-indigo-100 mb-1.5">
                    <UserCheck className="w-3 h-3" />
                    <span className="truncate">{selectedPartner.name}</span>
                    <button
                      onClick={() => set({ partnerId: '' })}
                      className="ml-auto text-indigo-200/65 hover:text-red-200"
                      title="Détacher"
                    >×</button>
                  </div>
                )}
                <div className="max-h-32 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02]">
                  {partnersLoading ? (
                    <div className="px-3 py-2 text-[11px] text-white/45">
                      <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                      Recherche…
                    </div>
                  ) : partners.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-white/45">
                      Aucun apporteur. <a href="/admin/partners" target="_blank" className="text-indigo-300 hover:text-indigo-200">Créer →</a>
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {partners.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={() => set({ partnerId: p.id, acquisitionChannel: form.acquisitionChannel || 'partner' })}
                            className={`w-full text-left px-3 py-1.5 hover:bg-white/[0.05] text-xs ${
                              form.partnerId === p.id ? 'bg-indigo-400/10 text-indigo-100' : 'text-white/85'
                            }`}
                          >
                            <div className="truncate">{p.name}</div>
                            <div className="text-[10px] text-white/45">{p.type}</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <a
                  href="/admin/partners"
                  target="_blank"
                  className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-white/55 hover:text-white/85"
                >
                  <Plus className="w-3 h-3" />
                  Nouvel apporteur (nouvel onglet)
                </a>
              </div>
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
                  onChange={(e) => set({ missionCategory: e.target.value as any })}
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Inbox className="w-4 h-4" />}
              {submitting ? 'Création…' : 'Ajouter au tableau de bord'}
            </button>
            <p className="text-[10px] text-white/40 text-center leading-relaxed">
              Aucun email automatique au client. Tu pourras ensuite la traiter normalement depuis la liste.
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
