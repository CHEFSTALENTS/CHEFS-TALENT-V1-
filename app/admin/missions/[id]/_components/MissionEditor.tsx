'use client';

// Modal d'édition des champs principaux de la mission.
// PATCH /api/admin/missions/[id] avec les champs modifiés.
//
// Couvre : titre, lieu, dates, couverts, service_level, chef_amount,
// client_amount, notes, contract_url. Le status / payment_status / contracts_data
// restent gérés via leurs UIs dédiées (boutons header, ContractsPanel, etc.).

import { useState } from 'react';
import { Loader2, PenSquare, X } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';

type Props = {
  missionId: string;
  initial: {
    title: string | null;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    guestCount: number | null;
    serviceLevel: string | null;
    chefAmount: number | null;
    clientAmount: number | null;
    notes: string | null;
    contractUrl: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
};

export default function MissionEditor({ missionId, initial, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    location: initial.location ?? '',
    startDate: initial.startDate ? initial.startDate.slice(0, 10) : '',
    endDate: initial.endDate ? initial.endDate.slice(0, 10) : '',
    guestCount: initial.guestCount != null ? String(initial.guestCount) : '',
    serviceLevel: initial.serviceLevel ?? '',
    chefAmount: initial.chefAmount != null ? String(initial.chefAmount) : '',
    clientAmount: initial.clientAmount != null ? String(initial.clientAmount) : '',
    notes: initial.notes ?? '',
    contractUrl: initial.contractUrl ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('La date de fin doit être ≥ à la date de début.');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        title: form.title.trim() || null,
        location: form.location.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        serviceLevel: form.serviceLevel.trim() || null,
        chefAmount: form.chefAmount ? Number(form.chefAmount) : null,
        clientAmount: form.clientAmount ? Number(form.clientAmount) : null,
        notes: form.notes.trim() || null,
        contractUrl: form.contractUrl.trim() || null,
      };

      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(missionId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-[#0f0f10] border border-white/10 rounded-2xl shadow-2xl max-h-[96vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-semibold text-white inline-flex items-center gap-2">
            <PenSquare className="w-5 h-5 text-sky-300" />
            Modifier la mission
          </h3>
          <button onClick={onClose} disabled={submitting} className="p-1 rounded-lg hover:bg-white/10 text-white/55">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Titre" hint="ex: Villa Mirage — Ibiza 2026">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
              />
            </Field>
            <Field label="Lieu">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Ibiza, Espagne"
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
              />
            </Field>
            <Field label="Date début">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
              />
            </Field>
            <Field label="Date fin">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                min={form.startDate || undefined}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
              />
            </Field>
            <Field label="Couverts moyens">
              <input
                type="number"
                min="0"
                value={form.guestCount}
                onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
                placeholder="6"
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
              />
            </Field>
            <Field label="Niveau de service" hint="ex: residence / yacht / one_shot">
              <input
                type="text"
                value={form.serviceLevel}
                onChange={(e) => setForm((f) => ({ ...f, serviceLevel: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
              />
            </Field>
            <Field label="Montant chef (€ HT)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.chefAmount}
                onChange={(e) => setForm((f) => ({ ...f, chefAmount: e.target.value }))}
                placeholder="2000"
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
              />
            </Field>
            <Field label="Montant client (€ HT)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.clientAmount}
                onChange={(e) => setForm((f) => ({ ...f, clientAmount: e.target.value }))}
                placeholder="2600"
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
              />
            </Field>
          </div>

          <Field label="URL du contrat (lien externe)">
            <input
              type="url"
              value={form.contractUrl}
              onChange={(e) => setForm((f) => ({ ...f, contractUrl: e.target.value }))}
              placeholder="https://yousign.com/..."
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-mono text-xs"
            />
          </Field>

          <Field label="Notes (interne admin)">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Préférences client, contraintes, etc."
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-[11px] text-amber-100/85">
            ⓘ Si tu modifies les <strong>dates</strong> ou le <strong>lieu</strong>, pense à <strong>synchroniser le contrat chef</strong> depuis le contrat client
            via le bouton dédié dans le panneau Contrats, sinon les conditions divergent.
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-white/[0.02]">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={submitting}
            className="inline-flex items-center px-5 py-2 rounded-xl bg-sky-400 text-sky-950 font-medium hover:bg-sky-300 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenSquare className="w-4 h-4 mr-2" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-white/55 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-white/35 mt-0.5">{hint}</span>}
    </label>
  );
}
