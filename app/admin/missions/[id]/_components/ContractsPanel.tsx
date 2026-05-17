'use client';

// Panneau Contrats sur la fiche mission /admin/missions/[id].
// 3 onglets (essai / chef / client). Champs variables pré-remplis depuis
// la mission + édition + preview HTML + bouton Copier.
//
// Sauvegarde via PATCH /api/admin/missions/[id] avec contractsData JSONB.

import { useEffect, useMemo, useState } from 'react';
import { Copy, Eye, FileDown, Loader2, Save } from 'lucide-react';
import { adminFetchRaw } from '@/lib/adminFetch';
import {
  type ContractKind,
  type ContractsData,
  type EssaiData,
  type ChefContractData,
  type ClientContractData,
  buildEssaiDefaults,
  buildChefDefaults,
  buildClientDefaults,
  renderEssai,
  renderChef,
  renderClient,
} from '../_lib/contracts';

type MissionLike = {
  id: string;
  chef_name?: string | null;
  chef_email?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  guest_count?: number | null;
  service_level?: string | null;
  chef_amount?: number | null;
  client_amount?: number | null;
  contracts_data?: ContractsData | null;
};

type ClientLike = {
  fullName?: string | null;
  companyName?: string | null;
};

export default function ContractsPanel({
  mission,
  client,
}: {
  mission: MissionLike;
  client: ClientLike | null;
}) {
  const [tab, setTab] = useState<ContractKind>('chef');

  const initial = useMemo<{
    essai: EssaiData;
    chef: ChefContractData;
    client: ClientContractData;
  }>(() => {
    const d = mission.contracts_data ?? {};
    return {
      essai: { ...buildEssaiDefaults(mission, client ?? {}), ...(d.essai ?? {}) } as EssaiData,
      chef: { ...buildChefDefaults(mission), ...(d.chef ?? {}) } as ChefContractData,
      client: { ...buildClientDefaults(mission, client ?? {}), ...(d.client ?? {}) } as ClientContractData,
    };
  }, [mission, client]);

  const [essai, setEssai] = useState<EssaiData>(initial.essai);
  const [chef, setChef] = useState<ChefContractData>(initial.chef);
  const [clientData, setClientData] = useState<ClientContractData>(initial.client);

  useEffect(() => {
    setEssai(initial.essai);
    setChef(initial.chef);
    setClientData(initial.client);
  }, [initial]);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const renderedHtml = useMemo(() => {
    if (tab === 'essai') return renderEssai(essai);
    if (tab === 'chef') return renderChef(chef);
    return renderClient(clientData);
  }, [tab, essai, chef, clientData]);

  async function save() {
    setSaving(true);
    try {
      const contractsData: ContractsData = { essai, chef, client: clientData };
      const r = await adminFetchRaw(`/api/admin/missions/${encodeURIComponent(mission.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ contractsData }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      alert(e?.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(renderedHtml);
      setSavedAt(`Copié à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    } catch {
      alert('Impossible de copier dans le presse-papier.');
    }
  }

  // Génération PDF côté client : on ouvre une nouvelle fenêtre avec le HTML
  // rendu et on déclenche window.print(). Le user sauvegarde via la boîte
  // de dialogue d'impression du navigateur (« Save as PDF »).
  // Avantage : pas de Puppeteer côté serveur (lourd sur Vercel serverless),
  // pas de dépendance externe, rend exactement le HTML qu'on a en preview.
  function printPdf() {
    try {
      const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');
      if (!win) {
        alert('Bloqué par le bloqueur de popup. Autorise les popups pour ce site puis réessaie.');
        return;
      }
      win.document.open();
      win.document.write(renderedHtml);
      win.document.close();
      // Attend que le rendu soit prêt avant de print (sinon la boîte de
      // dialogue s'ouvre sur une page blanche dans Chrome).
      const tryPrint = () => {
        try {
          win.focus();
          win.print();
        } catch {
          // ignore — l'utilisateur peut Ctrl/Cmd+P manuellement
        }
      };
      if (win.document.readyState === 'complete') {
        setTimeout(tryPrint, 300);
      } else {
        win.onload = () => setTimeout(tryPrint, 300);
      }
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de l\'ouverture de la fenêtre d\'impression.');
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-sm font-semibold text-white">Contrats</div>
          <div className="text-xs text-white/45 mt-0.5">
            Édite les variables, préviens, copie le HTML pour ton mail/Word.
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedAt ? (
            <span className="text-[11px] text-emerald-300/80">{savedAt}</span>
          ) : null}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['essai', 'chef', 'client'] as ContractKind[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={[
              'flex-1 px-3 py-2 rounded-xl border text-sm transition',
              tab === k
                ? 'border-white/20 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10',
            ].join(' ')}
          >
            {k === 'essai' ? "Essai chef" : k === 'chef' ? 'Mission chef' : 'Prestation client'}
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="grid gap-4">
        {tab === 'essai' && <EssaiForm value={essai} onChange={setEssai} />}
        {tab === 'chef' && <ChefForm value={chef} onChange={setChef} />}
        {tab === 'client' && <ClientForm value={clientData} onChange={setClientData} />}
      </div>

      {/* Preview + copy + PDF */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-white/45">
          Astuce : « Aperçu » pour vérifier le rendu, « Télécharger PDF » pour l'envoyer en pièce jointe, « Copier HTML » pour le coller dans le corps d'un mail.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((o) => !o)}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            <Eye className="mr-2 h-4 w-4" /> {showPreview ? 'Masquer aperçu' : 'Aperçu'}
          </button>
          <button
            onClick={copyHtml}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            <Copy className="mr-2 h-4 w-4" /> Copier HTML
          </button>
          <button
            onClick={printPdf}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white text-sm font-medium text-[#161616] hover:bg-white/90 transition"
          >
            <FileDown className="mr-2 h-4 w-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white overflow-hidden">
          <iframe
            srcDoc={renderedHtml}
            className="w-full"
            style={{ height: 600, border: 0 }}
            title="Aperçu contrat"
          />
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Forms
// ─────────────────────────────────────────────────────────────

function EssaiForm({ value, onChange }: { value: EssaiData; onChange: (v: EssaiData) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* En-tête */}
      <div className="md:col-span-2">
        <Field label="Titre du contrat">
          <Input value={value.contractTypeLabel} onChange={(v) => onChange({ ...value, contractTypeLabel: v })} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Sous-titre" hint="ex: Chef privé résident · Résidence privée Paris 7ème — MAI 2026">
          <Input value={value.contractSubtitle} onChange={(v) => onChange({ ...value, contractSubtitle: v })} />
        </Field>
      </div>
      <Field label="Ville de signature">
        <Input value={value.signatureCity} onChange={(v) => onChange({ ...value, signatureCity: v })} />
      </Field>
      <Field label="Date de signature">
        <Input type="date" value={value.signatureDate} onChange={(v) => onChange({ ...value, signatureDate: v })} />
      </Field>

      {/* Parties */}
      <Field label="Civilité client">
        <Select
          value={value.clientCivilite}
          options={[
            { value: '', label: '—' },
            { value: 'Monsieur', label: 'Monsieur' },
            { value: 'Madame', label: 'Madame' },
          ]}
          onChange={(v) => onChange({ ...value, clientCivilite: v as any })}
        />
      </Field>
      <Field label="Nom client">
        <Input value={value.clientName} onChange={(v) => onChange({ ...value, clientName: v })} />
      </Field>
      <Field label="Société client (optionnel)">
        <Input value={value.clientCompany} onChange={(v) => onChange({ ...value, clientCompany: v })} />
      </Field>
      <Field label="Représentant Agence">
        <Input value={value.agencyRep} onChange={(v) => onChange({ ...value, agencyRep: v })} />
      </Field>
      <Field label="Nom chef (prestataire)">
        <Input value={value.chefName} onChange={(v) => onChange({ ...value, chefName: v })} />
      </Field>
      <Field label="Email chef">
        <Input value={value.chefEmail} onChange={(v) => onChange({ ...value, chefEmail: v })} />
      </Field>

      {/* Article 1 */}
      <div className="md:col-span-2">
        <Field
          label="Contexte du recrutement (Art. 1)"
          hint="ex: un poste de chef privé résident à Paris, 7ème arrondissement"
        >
          <Input value={value.recruitmentContext} onChange={(v) => onChange({ ...value, recruitmentContext: v })} />
        </Field>
      </div>

      {/* Article 2 — Modalités de l'essai */}
      <Field label="Date d'essai">
        <Input type="date" value={value.trialDate} onChange={(v) => onChange({ ...value, trialDate: v })} />
      </Field>
      <Field label="Lieu de l'essai">
        <Input value={value.trialLocation} onChange={(v) => onChange({ ...value, trialLocation: v })} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Service" hint="ex: Déjeuner et dîner pour 2 personnes">
          <Input value={value.trialService} onChange={(v) => onChange({ ...value, trialService: v })} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Style culinaire attendu" hint="ex: Cuisine du quotidien simple et qualitative, française, japonaise, mexicaine">
          <Input value={value.trialStyle} onChange={(v) => onChange({ ...value, trialStyle: v })} />
        </Field>
      </div>
      <Field label="Afficher l'indemnité essai" hint="Décoche pour un essai gratuit non rémunéré.">
        <Toggle value={value.trialAmountShow} onChange={(v) => onChange({ ...value, trialAmountShow: v })} />
      </Field>
      {value.trialAmountShow ? (
        <>
          <Field label="Indemnité essai (€ HT)">
            <NumberInput value={value.trialAmountHt} onChange={(v) => onChange({ ...value, trialAmountHt: v })} />
          </Field>
          <Field label="Frais inclus dans l'indemnité">
            <Toggle value={value.expensesIncluded} onChange={(v) => onChange({ ...value, expensesIncluded: v })} />
          </Field>
        </>
      ) : null}

      {/* Article 3 — Mission envisagée */}
      <Field label="Lieu mission envisagée">
        <Input value={value.missionLocation} onChange={(v) => onChange({ ...value, missionLocation: v })} />
      </Field>
      <Field label="Début mission" hint="ex: Le lendemain de l'essai (lundi)">
        <Input value={value.missionStart} onChange={(v) => onChange({ ...value, missionStart: v })} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Durée mission" hint="ex: 30 ou 45 jours selon les conditions définies dans le contrat de mission">
          <Input value={value.missionDuration} onChange={(v) => onChange({ ...value, missionDuration: v })} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Rythme" hint="ex: 7 jours sur 7, déjeuner et dîner quotidiens">
          <Input value={value.missionRythme} onChange={(v) => onChange({ ...value, missionRythme: v })} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Rémunération chef">
          <Textarea value={value.missionRemuneration} rows={2} onChange={(v) => onChange({ ...value, missionRemuneration: v })} />
        </Field>
      </div>

      {/* Conditions de règlement — toujours éditable */}
      <div className="md:col-span-2">
        <Field
          label="Conditions de règlement ⚠️ à adapter selon la durée"
          hint="Fin de mission par défaut. Pour les missions longues : règlement hebdomadaire (chaque vendredi), à la quinzaine, mensuel… À éditer au cas par cas."
        >
          <Textarea value={value.paymentTerms} rows={2} onChange={(v) => onChange({ ...value, paymentTerms: v })} />
        </Field>
      </div>

      {/* Article 4 */}
      <Field label="Pénalité non-contournement (% mission)">
        <NumberInput value={value.sanctionContournementPct} onChange={(v) => onChange({ ...value, sanctionContournementPct: v ?? 0 })} />
      </Field>

      {/* Article 6 */}
      <Field label="Juridiction">
        <Input value={value.juridiction} onChange={(v) => onChange({ ...value, juridiction: v })} />
      </Field>

      <div className="md:col-span-2">
        <Field label="Clauses spécifiques (optionnel)">
          <Textarea value={value.customClauses} rows={3} onChange={(v) => onChange({ ...value, customClauses: v })} />
        </Field>
      </div>
    </div>
  );
}

function ChefForm({ value, onChange }: { value: ChefContractData; onChange: (v: ChefContractData) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>En-tête</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Référence contrat" hint="ex: 2506_Ibiza_Lucas.U">
          <Input value={value.contractRef} onChange={(v) => onChange({ ...value, contractRef: v })} />
        </Field>
        <Field label="Date d'émission">
          <Input type="date" value={value.emissionDate} onChange={(v) => onChange({ ...value, emissionDate: v })} />
        </Field>
      </div>

      <SectionTitle>Agence (parties)</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Dénomination">
          <Input value={value.agencyDenomination} onChange={(v) => onChange({ ...value, agencyDenomination: v })} />
        </Field>
        <Field label="SIRET">
          <Input value={value.agencySiret} onChange={(v) => onChange({ ...value, agencySiret: v })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Adresse">
            <Input value={value.agencyAddress} onChange={(v) => onChange({ ...value, agencyAddress: v })} />
          </Field>
        </div>
        <Field label="Représentant">
          <Input value={value.agencyRep} onChange={(v) => onChange({ ...value, agencyRep: v })} />
        </Field>
        <Field label="Téléphone">
          <Input value={value.agencyPhone} onChange={(v) => onChange({ ...value, agencyPhone: v })} />
        </Field>
        <Field label="Email">
          <Input value={value.agencyEmail} onChange={(v) => onChange({ ...value, agencyEmail: v })} />
        </Field>
      </div>

      <SectionTitle>Chef</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nom complet (CAPS)">
          <Input value={value.chefName} onChange={(v) => onChange({ ...value, chefName: v })} />
        </Field>
        <Field label="Référence chef" hint="ex: REF.CT_LUCAS.U">
          <Input value={value.chefRef} onChange={(v) => onChange({ ...value, chefRef: v })} />
        </Field>
      </div>

      <SectionTitle>Article 1 — Objet de la mission</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Lieu (générique)">
          <Input value={value.missionLocation} onChange={(v) => onChange({ ...value, missionLocation: v })} />
        </Field>
        <div />
        <Field label="Date début">
          <Input type="date" value={value.startDate} onChange={(v) => onChange({ ...value, startDate: v })} />
        </Field>
        <Field label="Date fin">
          <Input type="date" value={value.endDate} onChange={(v) => onChange({ ...value, endDate: v })} />
        </Field>
      </div>
      <Field label="Engagements chef (une puce par ligne)">
        <Textarea value={value.missionObjectives} rows={6} onChange={(v) => onChange({ ...value, missionObjectives: v })} />
      </Field>

      <SectionTitle>Article 2 — Conditions de la mission</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Lieu détaillé" hint="ex: Finca privée — Ibiza, Espagne">
            <Input value={value.lieu} onChange={(v) => onChange({ ...value, lieu: v })} />
          </Field>
        </div>
        <Field label="Rythme">
          <Input value={value.rythme} onChange={(v) => onChange({ ...value, rythme: v })} />
        </Field>
        <Field label="Jour de repos">
          <Input value={value.jourRepos} onChange={(v) => onChange({ ...value, jourRepos: v })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Logement">
            <Input value={value.logement} onChange={(v) => onChange({ ...value, logement: v })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Véhicule">
            <Input value={value.vehicule} onChange={(v) => onChange({ ...value, vehicule: v })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Approvisionnements">
            <Input value={value.approvisionnements} onChange={(v) => onChange({ ...value, approvisionnements: v })} />
          </Field>
        </div>
      </div>

      <SectionTitle>Article 4 — Rémunération</SectionTitle>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Montant total (€ HT)">
          <NumberInput value={value.amountHt} onChange={(v) => onChange({ ...value, amountHt: v })} />
        </Field>
        <Field label="Acompte (%)" hint="CGV : 15">
          <NumberInput value={value.depositPct} onChange={(v) => onChange({ ...value, depositPct: v ?? 15 })} />
        </Field>
        <Field label="Solde (%)" hint="CGV : 85">
          <NumberInput value={value.balancePct} onChange={(v) => onChange({ ...value, balancePct: v ?? 85 })} />
        </Field>
        <Field label="Solde J+N (jours)" hint="CGV : 4">
          <NumberInput value={value.balanceDays} onChange={(v) => onChange({ ...value, balanceDays: v ?? 4 })} />
        </Field>
      </div>
      <Field label="Clause de rétention du solde (texte fixe)">
        <Textarea value={value.paymentRetentionText} rows={3} onChange={(v) => onChange({ ...value, paymentRetentionText: v })} />
      </Field>

      <SectionTitle>Article 5 — Approvisionnement &amp; dépenses</SectionTitle>
      <Field label="Clauses (une puce par ligne)">
        <Textarea value={value.approvisionnementClauses} rows={4} onChange={(v) => onChange({ ...value, approvisionnementClauses: v })} />
      </Field>

      <SectionTitle>Article 6 — Non-contournement</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Durée exclusivité (mois)">
          <NumberInput value={value.exclusiviteDureeMois} onChange={(v) => onChange({ ...value, exclusiviteDureeMois: v ?? 24 })} />
        </Field>
        <Field label="Type de sanction" hint="CGV = 30 % HT ou 30k€">
          <Select
            value={value.sanctionType}
            options={[
              { value: 'cgv', label: 'CGV : 30 % HT ou 30 000 € (recommandé)' },
              { value: 'six_months_commissions', label: 'Legacy : 6 mois de commissions' },
              { value: 'custom', label: 'Personnalisé…' },
            ]}
            onChange={(v) => onChange({ ...value, sanctionType: v as any })}
          />
        </Field>
        {value.sanctionType === 'custom' ? (
          <div className="md:col-span-2">
            <Field label="Texte personnalisé">
              <Textarea value={value.sanctionTextOverride} rows={3} onChange={(v) => onChange({ ...value, sanctionTextOverride: v })} />
            </Field>
          </div>
        ) : null}
      </div>

      <SectionTitle>Article 7 — Confidentialité</SectionTitle>
      <Field label="Items (une puce par ligne)">
        <Textarea value={value.confidentialiteItems} rows={4} onChange={(v) => onChange({ ...value, confidentialiteItems: v })} />
      </Field>

      <SectionTitle>Article 8 — Standards &amp; obligations</SectionTitle>
      <Field label="Items (une puce par ligne)">
        <Textarea value={value.standardsItems} rows={5} onChange={(v) => onChange({ ...value, standardsItems: v })} />
      </Field>

      <SectionTitle>Article 11 — Résiliation</SectionTitle>
      <Field label="Acompte conservé en cas d'annulation client (%)" hint="CGV : 15">
        <NumberInput value={value.resiliationAcomptePct} onChange={(v) => onChange({ ...value, resiliationAcomptePct: v ?? 15 })} />
      </Field>

      <SectionTitle>Clauses spécifiques (optionnel)</SectionTitle>
      <Textarea value={value.customClauses} rows={3} onChange={(v) => onChange({ ...value, customClauses: v })} />
    </div>
  );
}

function ClientForm({ value, onChange }: { value: ClientContractData; onChange: (v: ClientContractData) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>En-tête</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Titre du contrat">
          <Input value={value.contractTypeLabel} onChange={(v) => onChange({ ...value, contractTypeLabel: v })} />
        </Field>
        <Field label="Sous-titre (lieu + saison)">
          <Input value={value.contractSubtitle} onChange={(v) => onChange({ ...value, contractSubtitle: v })} />
        </Field>
        <Field label="Ville de signature">
          <Input value={value.signatureCity} onChange={(v) => onChange({ ...value, signatureCity: v })} />
        </Field>
        <Field label="Date de signature">
          <Input type="date" value={value.signatureDate} onChange={(v) => onChange({ ...value, signatureDate: v })} />
        </Field>
      </div>

      <SectionTitle>Parties</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Représentant Agence">
          <Input value={value.agencyRep} onChange={(v) => onChange({ ...value, agencyRep: v })} />
        </Field>
        <Field label="SIRET Agence">
          <Input value={value.agencySiret} onChange={(v) => onChange({ ...value, agencySiret: v })} />
        </Field>
        <Field label="Civilité client">
          <Select
            value={value.clientCivilite}
            options={[
              { value: '', label: '—' },
              { value: 'Monsieur', label: 'Monsieur' },
              { value: 'Madame', label: 'Madame' },
            ]}
            onChange={(v) => onChange({ ...value, clientCivilite: v as any })}
          />
        </Field>
        <Field label="Nom client">
          <Input value={value.clientName} onChange={(v) => onChange({ ...value, clientName: v })} />
        </Field>
        <Field label="Société (si B2B)">
          <Input value={value.clientCompany} onChange={(v) => onChange({ ...value, clientCompany: v })} />
        </Field>
      </div>

      <SectionTitle>Article 2 — Conditions de la mission</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Lieu">
          <Input value={value.missionLocation} onChange={(v) => onChange({ ...value, missionLocation: v })} />
        </Field>
        <Field label="Couverts">
          <NumberInput value={value.guestCount} onChange={(v) => onChange({ ...value, guestCount: v })} />
        </Field>
        <Field label="Date début">
          <Input type="date" value={value.startDate} onChange={(v) => onChange({ ...value, startDate: v })} />
        </Field>
        <Field label="Date fin">
          <Input type="date" value={value.endDate} onChange={(v) => onChange({ ...value, endDate: v })} />
        </Field>
        <Field label="Rythme">
          <Input value={value.rythme} onChange={(v) => onChange({ ...value, rythme: v })} />
        </Field>
        <Field label="Jour de repos">
          <Input value={value.jourRepos} onChange={(v) => onChange({ ...value, jourRepos: v })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Logement">
            <Input value={value.logement} onChange={(v) => onChange({ ...value, logement: v })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Véhicule">
            <Input value={value.vehicule} onChange={(v) => onChange({ ...value, vehicule: v })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Approvisionnements">
            <Input value={value.approvisionnements} onChange={(v) => onChange({ ...value, approvisionnements: v })} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Langues de travail">
            <Input value={value.langues} onChange={(v) => onChange({ ...value, langues: v })} />
          </Field>
        </div>
      </div>

      <SectionTitle>Article 3 — Étendue des prestations</SectionTitle>
      <Field label="Prestations incluses (une par ligne)">
        <Textarea value={value.prestationsIncluses} rows={5} onChange={(v) => onChange({ ...value, prestationsIncluses: v })} />
      </Field>
      <Field label="Prestations non incluses (une par ligne)">
        <Textarea value={value.prestationsNonIncluses} rows={3} onChange={(v) => onChange({ ...value, prestationsNonIncluses: v })} />
      </Field>

      <SectionTitle>Article 4 — Conditions financières</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Honoraires Agence (€ HT)">
          <NumberInput value={value.amountHt} onChange={(v) => onChange({ ...value, amountHt: v })} />
        </Field>
        <Field
          label="Régime TVA"
          hint="« Non applicable, art. 259-1 CGI » pour une société hors UE (B2B autoliquidation). Sinon « TVA applicable » par défaut."
        >
          <Select
            value={value.tvaRegime}
            options={[
              { value: 'applicable', label: 'TVA française applicable au taux en vigueur' },
              { value: 'non_applicable', label: 'TVA non applicable, article 259-1 du CGI' },
            ]}
            onChange={(v) => onChange({ ...value, tvaRegime: v as any })}
          />
        </Field>
        <Field label="Modalités de règlement">
          <Select
            value={value.paymentMode}
            options={[
              { value: 'integral_signature', label: 'Intégral à la signature' },
              { value: '60_40', label: '60 % acompte + 40 % solde 48h avant' },
              { value: 'custom', label: 'Personnalisé…' },
            ]}
            onChange={(v) => onChange({ ...value, paymentMode: v as any })}
          />
        </Field>
        {value.paymentMode === 'custom' ? (
          <div className="md:col-span-2">
            <Field label="Texte modalités personnalisé">
              <Textarea value={value.paymentCustomText} rows={3} onChange={(v) => onChange({ ...value, paymentCustomText: v })} />
            </Field>
          </div>
        ) : null}
        <div className="md:col-span-2">
          <Field label="Article 4.3 — Facturation des approvisionnements">
            <Textarea value={value.facturationApprosText} rows={3} onChange={(v) => onChange({ ...value, facturationApprosText: v })} />
          </Field>
        </div>
      </div>

      <SectionTitle>Article 5 — Exclusivité</SectionTitle>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Durée exclusivité (mois)">
          <NumberInput value={value.exclusiviteDureeMois} onChange={(v) => onChange({ ...value, exclusiviteDureeMois: v ?? 24 })} />
        </Field>
        <Field label="Sanction contournement (%)">
          <NumberInput value={value.sanctionContournementPct} onChange={(v) => onChange({ ...value, sanctionContournementPct: v ?? 30 })} />
        </Field>
        <Field label="Délai paiement sanction (jours)">
          <NumberInput value={value.delaiPaiementSanctionJours} onChange={(v) => onChange({ ...value, delaiPaiementSanctionJours: v ?? 15 })} />
        </Field>
      </div>

      <SectionTitle>Article 8 — Annulation</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Retenue ≥ 7j (%)">
          <NumberInput value={value.cancelGte7d} onChange={(v) => onChange({ ...value, cancelGte7d: v ?? 25 })} />
        </Field>
        <Field label="Retenue < 6j / no-show (%)">
          <NumberInput value={value.cancelLt6d} onChange={(v) => onChange({ ...value, cancelLt6d: v ?? 50 })} />
        </Field>
      </div>

      <SectionTitle>Article 10 — Juridiction</SectionTitle>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Juridiction">
          <Input value={value.juridiction} onChange={(v) => onChange({ ...value, juridiction: v })} />
        </Field>
        <Field label="Délai amiable (jours)">
          <NumberInput value={value.delaiAmiableJours} onChange={(v) => onChange({ ...value, delaiAmiableJours: v ?? 30 })} />
        </Field>
        <Field label="Délai remboursement Agence (jours)">
          <NumberInput value={value.delaiRemboursementAgenceJours} onChange={(v) => onChange({ ...value, delaiRemboursementAgenceJours: v ?? 15 })} />
        </Field>
      </div>

      <SectionTitle>Clauses spécifiques (optionnel)</SectionTitle>
      <Textarea value={value.customClauses} rows={3} onChange={(v) => onChange({ ...value, customClauses: v })} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small UI primitives
// ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b08d57] mt-1 mb-2">
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.15em] text-white/45 mb-1.5">
        {label}{hint ? <span className="ml-2 text-white/30 normal-case tracking-normal">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
    />
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '') return onChange(null);
        const n = Number(v);
        onChange(Number.isFinite(n) ? n : null);
      }}
      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
    />
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-neutral-950">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white"
    />
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={[
        'inline-flex items-center justify-center px-3 py-2 rounded-xl border text-xs transition',
        value ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-white/55',
      ].join(' ')}
    >
      {value ? 'Oui' : 'Non'}
    </button>
  );
}
