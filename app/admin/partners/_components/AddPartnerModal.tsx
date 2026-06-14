'use client';

// AddPartnerModal — Création OU édition d'un partner.
// Si `partner` est fourni, on est en édition.

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type PartnerType = 'concierge' | 'villa_manager' | 'yacht_manager' | 'travel_planner' | 'apporteur_indep' | 'chef' | 'client_direct' | 'other';

const TYPE_OPTIONS: { value: PartnerType; label: string }[] = [
  { value: 'concierge', label: 'Conciergerie' },
  { value: 'villa_manager', label: 'Villa manager' },
  { value: 'yacht_manager', label: 'Yacht manager' },
  { value: 'travel_planner', label: 'Travel planner' },
  { value: 'apporteur_indep', label: 'Apporteur indépendant' },
  { value: 'chef', label: 'Chef partenaire' },
  { value: 'client_direct', label: 'Client direct' },
  { value: 'other', label: 'Autre' },
];

export default function AddPartnerModal({
  partner,
  onClose,
  onCreated,
  onUpdated,
}: {
  partner?: any;
  onClose: () => void;
  onCreated?: (partner: any) => void;
  onUpdated?: (partner: any) => void;
}) {
  const isEdit = !!partner;

  const [name, setName] = useState(partner?.name || '');
  const [type, setType] = useState<PartnerType>(partner?.type || 'concierge');
  const [status, setStatus] = useState<string>(partner?.status || 'active');
  const [contactFirst, setContactFirst] = useState(partner?.contact_first_name || '');
  const [contactLast, setContactLast] = useState(partner?.contact_last_name || '');
  const [email, setEmail] = useState(partner?.email || '');
  const [phone, setPhone] = useState(partner?.phone || '');
  const [whatsapp, setWhatsapp] = useState(partner?.whatsapp || '');
  const [company, setCompany] = useState(partner?.company || '');
  const [destinations, setDestinations] = useState(
    partner?.destinations ? (partner.destinations as string[]).join(', ') : '',
  );
  const [language, setLanguage] = useState(partner?.language || '');
  const [linkedChefEmail, setLinkedChefEmail] = useState(partner?.linked_chef_email || '');
  const [acquisitionSource, setAcquisitionSource] = useState(partner?.acquisition_source || '');
  const [firstContactAt, setFirstContactAt] = useState(
    partner?.first_contact_at ? new Date(partner.first_contact_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(partner?.notes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim() !== '' && !saving;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        type,
        status,
        contact_first_name: contactFirst || null,
        contact_last_name: contactLast || null,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        company: company || null,
        destinations: destinations
          .split(',')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean),
        language: language || null,
        linked_chef_email: linkedChefEmail || null,
        acquisition_source: acquisitionSource || null,
        first_contact_at: firstContactAt ? new Date(firstContactAt).toISOString() : undefined,
        notes: notes || null,
      };

      if (isEdit) {
        const json = await adminFetch<{ ok: boolean; partner: any; error?: string }>(
          `/api/admin/partners/${partner.id}`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
        if (!json.ok) throw new Error(json.error || 'Erreur');
        onUpdated?.(json.partner);
      } else {
        const json = await adminFetch<{ ok: boolean; partner: any; error?: string }>(
          '/api/admin/partners',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
        if (!json.ok) throw new Error(json.error || 'Erreur');
        onCreated?.(json.partner);
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e1116] shadow-2xl flex flex-col max-h-[92vh]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-semibold text-white">
            {isEdit ? 'Éditer l\'apporteur' : 'Nouvel apporteur'}
          </h3>
          <button onClick={onClose} disabled={saving} className="p-1 rounded-lg hover:bg-white/10 text-white/55">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Identité */}
          <Section title="Identité">
            <Field label="Nom de l'apporteur *">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Saint-Tropez Concierges / Marie Dupont" className="ct-input" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Type *">
                <select value={type} onChange={(e) => setType(e.target.value as PartnerType)} className="ct-input">
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Statut">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="ct-input">
                  <option value="active" className="bg-neutral-900">Actif</option>
                  <option value="dormant" className="bg-neutral-900">Dormant (forcé)</option>
                  <option value="archived" className="bg-neutral-900">Archivé</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Prénom contact">
                <input value={contactFirst} onChange={(e) => setContactFirst(e.target.value)} className="ct-input" />
              </Field>
              <Field label="Nom contact">
                <input value={contactLast} onChange={(e) => setContactLast(e.target.value)} className="ct-input" />
              </Field>
            </div>
            <Field label="Société / structure">
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nom de la conciergerie / agence" className="ct-input" />
            </Field>
          </Section>

          {/* Contact */}
          <Section title="Coordonnées">
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ct-input" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Téléphone">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="ct-input" />
              </Field>
              <Field label="WhatsApp">
                <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+33 ou international" className="ct-input" />
              </Field>
            </div>
            <Field label="Langue principale (fr / en / es / it)">
              <input value={language} onChange={(e) => setLanguage(e.target.value)} className="ct-input" maxLength={3} />
            </Field>
          </Section>

          {/* Périmètre */}
          <Section title="Périmètre">
            <Field label="Destinations (virgule-séparées)">
              <input value={destinations} onChange={(e) => setDestinations(e.target.value)} placeholder="saint-tropez, ibiza, mykonos, corse" className="ct-input" />
            </Field>
            {type === 'chef' && (
              <Field label="Email du chef du réseau (lien chef_profile)">
                <input value={linkedChefEmail} onChange={(e) => setLinkedChefEmail(e.target.value)} placeholder="chef@example.com" className="ct-input" />
              </Field>
            )}
          </Section>

          {/* Origine */}
          <Section title="Origine">
            <Field label="Comment t'es-tu rencontrés">
              <input value={acquisitionSource} onChange={(e) => setAcquisitionSource(e.target.value)} placeholder="Ex: dîner Cap Ferrat juin 2024 chez X" className="ct-input" />
            </Field>
            <Field label="Date du premier contact">
              <input type="date" value={firstContactAt} onChange={(e) => setFirstContactAt(e.target.value)} className="ct-input" />
            </Field>
          </Section>

          {/* Notes */}
          <Section title="Notes internes">
            <Field label="Anecdotes, prefs, relations">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="ct-input" placeholder="Ex: Préfère WhatsApp. Anglais courant. Aime les chefs créatifs. Gendre de Y." />
            </Field>
          </Section>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 shrink-0">
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-white/75 hover:text-white">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-indigo-400 text-indigo-950 text-sm font-medium hover:bg-indigo-300 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {isEdit ? 'Enregistrer' : 'Créer l\'apporteur'}
          </button>
        </footer>

        <style jsx>{`
          .ct-input { width: 100%; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 13px; }
          .ct-input::placeholder { color: rgba(255,255,255,0.3); }
        `}</style>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.015] p-3 space-y-2.5">
      <div className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] text-white/55 mb-1">{label}</div>
      {children}
    </label>
  );
}
