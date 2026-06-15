'use client';

// ImportExternalQuoteModal — Importer un devis traité hors plateforme
//
// Formulaire minimaliste pour tracker dans les KPIs un devis qu'on a fait
// à la main (Word, devis téléphone, ancien outil, etc.) sans repasser par
// l'éditeur sections-par-sections.
//
// Le row créé est marqué is_external=true, ref préfixée 'EXT-', et apparaît
// dans le pipeline /admin/quotes comme n'importe quel devis.

import { useState } from 'react';
import { Loader2, FileUp } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';
import { AdminModal } from '@/app/admin/_components/AdminModal';

type Status = 'sent' | 'accepted' | 'declined' | 'expired' | 'cancelled';

const STATUS_OPTS: Array<{ value: Status; label: string }> = [
  { value: 'sent', label: 'Envoyé (en attente)' },
  { value: 'accepted', label: 'Accepté' },
  { value: 'declined', label: 'Refusé' },
  { value: 'expired', label: 'Expiré' },
  { value: 'cancelled', label: 'Annulé' },
];

export default function ImportExternalQuoteModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (quote: any) => void;
}) {
  const [destinataire, setDestinataire] = useState('');
  const [destinataireType, setDestinataireType] = useState('');
  const [origin, setOrigin] = useState('');
  const [intitule, setIntitule] = useState('');
  const [lieu, setLieu] = useState('');
  const [dates, setDates] = useState('');
  const [convives, setConvives] = useState('');
  const [status, setStatus] = useState<Status>('sent');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [amountHt, setAmountHt] = useState('');
  const [amountTtc, setAmountTtc] = useState('');
  const [chefCost, setChefCost] = useState('');
  const [chefTravel, setChefTravel] = useState('');
  const [butlerRequired, setButlerRequired] = useState(false);
  const [butlerCost, setButlerCost] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = destinataire.trim() !== '' && amountHt.trim() !== '' && !saving;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Crée le devis externe
      const json = await adminFetch<{ ok: boolean; quote: any; error?: string }>(
        '/api/admin/quotes/external',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            destinataire_nom: destinataire,
            destinataire_type: destinataireType || null,
            origin: origin || null,
            intitule: intitule || null,
            lieu: lieu || null,
            dates_text: dates || null,
            convives_text: convives || null,
            status,
            eventDate,
            statusReason: reason || null,
            amountHt,
            amountTtc: amountTtc || null,
            chefCostEur: chefCost || null,
            chefTravelCostEur: chefTravel || null,
            butlerRequired,
            butlerCostEur: butlerRequired ? (butlerCost || null) : null,
            adminNotes: adminNotes || null,
          }),
        },
      );
      if (!json.ok) throw new Error(json.error || 'Erreur création');

      // 2. Si un PDF est joint, on l'upload en tant que document 'external'
      if (pdfFile) {
        const form = new FormData();
        form.append('file', pdfFile);
        form.append('kind', 'external');
        form.append('description', 'PDF d\'origine du devis externe');
        const r = await adminFetchRaw(`/api/admin/quotes/${json.quote.id}/documents`, {
          method: 'POST',
          body: form,
        });
        if (!r.ok) {
          // Non bloquant : on a quand même créé le devis
          console.warn('[ImportExternalQuoteModal] PDF upload échoué', r.status);
        }
      }

      onCreated(json.quote);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      title="Importer un devis traité hors plateforme"
      subtitle="Pour le tracker dans les KPIs sans générer de PDF"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-white/75 hover:text-white">
            Annuler
          </button>
          <button onClick={handleSave} disabled={!canSave}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-amber-400 text-amber-950 text-sm font-medium hover:bg-amber-300 disabled:opacity-50">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Importer le devis
          </button>
        </>
      }
    >
      <div className="space-y-4">
          {/* Identité */}
          <Section title="Destinataire">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nom du destinataire *" required>
                <input value={destinataire} onChange={(e) => setDestinataire(e.target.value)}
                  placeholder="Ex: Conciergerie X / M. Dupont"
                  className="ct-input" />
              </Field>
              <Field label="Type">
                <input value={destinataireType} onChange={(e) => setDestinataireType(e.target.value)}
                  placeholder="B2B, particulier, conciergerie…"
                  className="ct-input" />
              </Field>
              <Field label="Origine">
                <input value={origin} onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Téléphone, ancien Word, WhatsApp…"
                  className="ct-input" />
              </Field>
              <Field label="Intitulé">
                <input value={intitule} onChange={(e) => setIntitule(e.target.value)}
                  placeholder="Chef privé villa Cap Ferret…"
                  className="ct-input" />
              </Field>
            </div>
          </Section>

          {/* Mission */}
          <Section title="Mission">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Lieu">
                <input value={lieu} onChange={(e) => setLieu(e.target.value)} className="ct-input" />
              </Field>
              <Field label="Dates">
                <input value={dates} onChange={(e) => setDates(e.target.value)}
                  placeholder="Du 10 au 15 juillet" className="ct-input" />
              </Field>
              <Field label="Convives">
                <input value={convives} onChange={(e) => setConvives(e.target.value)}
                  placeholder="8 adultes" className="ct-input" />
              </Field>
            </div>
          </Section>

          {/* Statut + date */}
          <Section title="Statut">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Statut actuel *" required>
                <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="ct-input">
                  {STATUS_OPTS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-neutral-900">{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="ct-input" />
              </Field>
            </div>
            <Field label="Motif">
              <input value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Raison du refus, contexte de l'acceptation…" className="ct-input" />
            </Field>
          </Section>

          {/* Montants */}
          <Section title="Montants (utilisés dans les KPIs)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Montant HT (€) *" required>
                <input type="number" step="0.01" value={amountHt} onChange={(e) => setAmountHt(e.target.value)}
                  placeholder="4500" className="ct-input font-mono" />
              </Field>
              <Field label="Montant TTC (€)">
                <input type="number" step="0.01" value={amountTtc} onChange={(e) => setAmountTtc(e.target.value)}
                  placeholder="Auto (HT × 1.20)" className="ct-input font-mono" />
              </Field>
            </div>
          </Section>

          {/* Coûts internes */}
          <Section title="Coûts internes (optionnel — pour la marge)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Rémunération chef (€)">
                <input type="number" step="0.01" value={chefCost} onChange={(e) => setChefCost(e.target.value)}
                  className="ct-input font-mono" />
              </Field>
              <Field label="Déplacement chef (€)">
                <input type="number" step="0.01" value={chefTravel} onChange={(e) => setChefTravel(e.target.value)}
                  className="ct-input font-mono" />
              </Field>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-white/85 mt-2">
              <input type="checkbox" checked={butlerRequired} onChange={(e) => setButlerRequired(e.target.checked)} />
              Butler requis
            </label>
            {butlerRequired && (
              <Field label="Coût butler (€)">
                <input type="number" step="0.01" value={butlerCost} onChange={(e) => setButlerCost(e.target.value)}
                  className="ct-input font-mono" />
              </Field>
            )}
          </Section>

          {/* PDF + notes */}
          <Section title="Pièce jointe & notes">
            <Field label="PDF d'origine (optionnel)">
              <div className="flex items-center gap-2">
                <input type="file" accept="application/pdf,image/*"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="text-xs text-white/85 file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-white/10 file:text-white/85 file:text-xs hover:file:bg-white/15" />
                {pdfFile && (
                  <span className="text-[11px] text-white/55 inline-flex items-center gap-1">
                    <FileUp className="w-3 h-3" /> {pdfFile.name}
                  </span>
                )}
              </div>
            </Field>
            <Field label="Notes internes">
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2}
                placeholder="Contexte, négo, à retenir…"
                className="ct-input" />
            </Field>
          </Section>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

        <style jsx>{`
          .ct-input { width: 100%; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 13px; }
          .ct-input::placeholder { color: rgba(255,255,255,0.3); }
        `}</style>
      </div>
    </AdminModal>
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

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <div className="text-[11px] text-white/55 mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
