'use client';

// Panneau Contrats sur la fiche mission /admin/missions/[id].
// 3 onglets (essai / chef / client). Champs variables pré-remplis depuis
// la mission + édition + preview HTML + bouton Copier.
//
// Sauvegarde via PATCH /api/admin/missions/[id] avec contractsData JSONB.

import { useEffect, useMemo, useState } from 'react';
import { Copy, Eye, Loader2, Save } from 'lucide-react';
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
      essai: { ...buildEssaiDefaults(mission), ...(d.essai ?? {}) } as EssaiData,
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

      {/* Preview + copy */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-white/45">
          Astuce : clique « Aperçu » pour vérifier le rendu, puis « Copier le HTML » pour le coller dans ton mail.
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
            className="inline-flex items-center px-3 py-2 rounded-xl border border-white/10 bg-white text-sm font-medium text-[#161616] hover:bg-white/90 transition"
          >
            <Copy className="mr-2 h-4 w-4" /> Copier le HTML
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
      <Field label="Nom chef">
        <Input value={value.chefName} onChange={(v) => onChange({ ...value, chefName: v })} />
      </Field>
      <Field label="Email chef">
        <Input value={value.chefEmail} onChange={(v) => onChange({ ...value, chefEmail: v })} />
      </Field>
      <Field label="Date d'essai">
        <Input type="date" value={value.trialDate} onChange={(v) => onChange({ ...value, trialDate: v })} />
      </Field>
      <Field label="Lieu de l'essai">
        <Input value={value.trialLocation} onChange={(v) => onChange({ ...value, trialLocation: v })} />
      </Field>
      <Field label="Durée">
        <Select
          value={value.trialDuration}
          options={[
            { value: '0.5d', label: '½ journée' },
            { value: '1d', label: '1 journée' },
            { value: '2d', label: '2 journées' },
            { value: 'custom', label: 'Autre…' },
          ]}
          onChange={(v) => onChange({ ...value, trialDuration: v as any })}
        />
      </Field>
      {value.trialDuration === 'custom' ? (
        <Field label="Précision durée">
          <Input value={value.trialDurationCustom} onChange={(v) => onChange({ ...value, trialDurationCustom: v })} />
        </Field>
      ) : null}
      <Field label="Indemnité essai (€ HT)">
        <NumberInput value={value.trialAmountHt} onChange={(v) => onChange({ ...value, trialAmountHt: v })} />
      </Field>
      <Field label="Frais inclus">
        <Toggle value={value.expensesIncluded} onChange={(v) => onChange({ ...value, expensesIncluded: v })} />
      </Field>
      <Field label="Clause NDA spécifique" hint="Confidentialité 24 mois.">
        <Toggle value={value.ndaSpecific} onChange={(v) => onChange({ ...value, ndaSpecific: v })} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Critères d'évaluation">
          <Textarea value={value.evaluationCriteria} rows={2} onChange={(v) => onChange({ ...value, evaluationCriteria: v })} />
        </Field>
      </div>
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
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Nom chef">
        <Input value={value.chefName} onChange={(v) => onChange({ ...value, chefName: v })} />
      </Field>
      <Field label="Société chef (optionnel)">
        <Input value={value.chefCompany} onChange={(v) => onChange({ ...value, chefCompany: v })} />
      </Field>
      <Field label="SIRET (optionnel)">
        <Input value={value.chefSiret} onChange={(v) => onChange({ ...value, chefSiret: v })} />
      </Field>
      <Field label="Lieu de mission">
        <Input value={value.missionLocation} onChange={(v) => onChange({ ...value, missionLocation: v })} />
      </Field>
      <Field label="Date début">
        <Input type="date" value={value.startDate} onChange={(v) => onChange({ ...value, startDate: v })} />
      </Field>
      <Field label="Date fin">
        <Input type="date" value={value.endDate} onChange={(v) => onChange({ ...value, endDate: v })} />
      </Field>
      <Field label="Couverts moyens">
        <NumberInput value={value.guestCount} onChange={(v) => onChange({ ...value, guestCount: v })} />
      </Field>
      <Field label="Format de service">
        <Input value={value.serviceFormat} onChange={(v) => onChange({ ...value, serviceFormat: v })} />
      </Field>
      <Field label="Montant chef HT (€)">
        <NumberInput value={value.amountHt} onChange={(v) => onChange({ ...value, amountHt: v })} />
      </Field>
      <Field label="Acompte (%)">
        <NumberInput value={value.depositPct} onChange={(v) => onChange({ ...value, depositPct: v ?? 0 })} />
      </Field>
      <Field label="Solde (%)">
        <NumberInput value={value.balancePct} onChange={(v) => onChange({ ...value, balancePct: v ?? 0 })} />
      </Field>
      <Field label="Solde sous (jours ouvrés)">
        <NumberInput value={value.balanceDays} onChange={(v) => onChange({ ...value, balanceDays: v ?? 0 })} />
      </Field>

      <Field label="Logement">
        <Select
          value={value.perDiemLogement}
          options={[
            { value: 'inclus', label: 'Inclus tarif chef' },
            { value: 'a_charge_client', label: 'À la charge du client' },
            { value: 'forfait', label: 'Forfait' },
          ]}
          onChange={(v) => onChange({ ...value, perDiemLogement: v as any })}
        />
      </Field>
      {value.perDiemLogement === 'forfait' ? (
        <Field label="Forfait logement (€)">
          <NumberInput value={value.perDiemLogementMontant} onChange={(v) => onChange({ ...value, perDiemLogementMontant: v })} />
        </Field>
      ) : null}

      <Field label="Repas">
        <Select
          value={value.perDiemRepas}
          options={[
            { value: 'inclus', label: 'Inclus tarif chef' },
            { value: 'a_charge_client', label: 'À la charge du client' },
            { value: 'forfait', label: 'Forfait' },
          ]}
          onChange={(v) => onChange({ ...value, perDiemRepas: v as any })}
        />
      </Field>
      {value.perDiemRepas === 'forfait' ? (
        <Field label="Forfait repas (€)">
          <NumberInput value={value.perDiemRepasMontant} onChange={(v) => onChange({ ...value, perDiemRepasMontant: v })} />
        </Field>
      ) : null}

      <div className="md:col-span-2">
        <Field label="Déplacement">
          <Input value={value.perDiemDeplacement} onChange={(v) => onChange({ ...value, perDiemDeplacement: v })} />
        </Field>
      </div>

      <Field label="Fonds courses pris en charge par">
        <Select
          value={value.fondsCoursesQuiPaye}
          options={[
            { value: 'client', label: 'Le client' },
            { value: 'chefs_talents', label: 'Chefs Talents' },
            { value: 'avance_chef', label: 'Avance chef, remboursé' },
          ]}
          onChange={(v) => onChange({ ...value, fondsCoursesQuiPaye: v as any })}
        />
      </Field>
      <Field label="Plafond fonds courses (€, optionnel)">
        <NumberInput value={value.fondsCoursesPlafond} onChange={(v) => onChange({ ...value, fondsCoursesPlafond: v })} />
      </Field>

      <div className="md:col-span-2">
        <Field label="Conditions de rupture">
          <Textarea value={value.ruptureConditions} rows={2} onChange={(v) => onChange({ ...value, ruptureConditions: v })} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Clauses spécifiques (optionnel)">
          <Textarea value={value.customClauses} rows={3} onChange={(v) => onChange({ ...value, customClauses: v })} />
        </Field>
      </div>
    </div>
  );
}

function ClientForm({ value, onChange }: { value: ClientContractData; onChange: (v: ClientContractData) => void }) {
  function togglePayment(method: string) {
    const has = value.paymentMethods.includes(method);
    onChange({
      ...value,
      paymentMethods: has ? value.paymentMethods.filter((m) => m !== method) : [...value.paymentMethods, method],
    });
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Nom client">
        <Input value={value.clientName} onChange={(v) => onChange({ ...value, clientName: v })} />
      </Field>
      <Field label="Société (si B2B)">
        <Input value={value.clientCompany} onChange={(v) => onChange({ ...value, clientCompany: v })} />
      </Field>
      <Field label="Lieu de mission">
        <Input value={value.missionLocation} onChange={(v) => onChange({ ...value, missionLocation: v })} />
      </Field>
      <Field label="Niveau de service">
        <Input value={value.serviceLevel} onChange={(v) => onChange({ ...value, serviceLevel: v })} />
      </Field>
      <Field label="Date début">
        <Input type="date" value={value.startDate} onChange={(v) => onChange({ ...value, startDate: v })} />
      </Field>
      <Field label="Date fin">
        <Input type="date" value={value.endDate} onChange={(v) => onChange({ ...value, endDate: v })} />
      </Field>
      <Field label="Couverts">
        <NumberInput value={value.guestCount} onChange={(v) => onChange({ ...value, guestCount: v })} />
      </Field>
      <Field label="Montant TTC (€)">
        <NumberInput value={value.amountTtc} onChange={(v) => onChange({ ...value, amountTtc: v })} />
      </Field>

      <Field label="Mode paiement client">
        <Select
          value={value.acompteMode}
          options={[
            { value: 'auto', label: 'Auto (100 % si <30k€, sinon 60/40)' },
            { value: '100', label: '100 % à la commande' },
            { value: '60_40', label: '60 % acompte + 40 % solde' },
          ]}
          onChange={(v) => onChange({ ...value, acompteMode: v as any })}
        />
      </Field>
      <Field label="Solde N heures avant">
        <NumberInput value={value.soldeDaysBefore} onChange={(v) => onChange({ ...value, soldeDaysBefore: v ?? 0 })} />
      </Field>

      <div className="md:col-span-2">
        <Field label="Moyens de paiement acceptés">
          <div className="flex flex-wrap gap-2">
            {[
              { v: 'virement', l: 'Virement' },
              { v: 'stripe', l: 'Stripe (CB)' },
              { v: 'revolut', l: 'Revolut' },
            ].map((opt) => {
              const active = value.paymentMethods.includes(opt.v);
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => togglePayment(opt.v)}
                  className={[
                    'px-3 py-1.5 rounded-lg border text-xs transition',
                    active
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10',
                  ].join(' ')}
                >
                  {opt.l}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <Field label="Retenue annulation ≥ 7j (%)">
        <NumberInput value={value.cancelGte7d} onChange={(v) => onChange({ ...value, cancelGte7d: v ?? 0 })} />
      </Field>
      <Field label="Retenue annulation < 6j ou no-show (%)">
        <NumberInput value={value.cancelLt6d} onChange={(v) => onChange({ ...value, cancelLt6d: v ?? 0 })} />
      </Field>

      <Field label="Fonds courses">
        <Select
          value={value.fondsCourses}
          options={[
            { value: 'inclus', label: 'Inclus dans le TTC' },
            { value: 'sur_facture', label: 'Sur facture en complément' },
            { value: 'avance', label: 'Avance client en début de mission' },
          ]}
          onChange={(v) => onChange({ ...value, fondsCourses: v as any })}
        />
      </Field>
      <Field label="Plafond fonds courses (€, optionnel)">
        <NumberInput value={value.fondsCoursesPlafond} onChange={(v) => onChange({ ...value, fondsCoursesPlafond: v })} />
      </Field>

      <Field label="Inclure clause NDA">
        <Toggle value={value.ndaInclude} onChange={(v) => onChange({ ...value, ndaInclude: v })} />
      </Field>

      <div className="md:col-span-2">
        <Field label="Clauses spécifiques (optionnel)">
          <Textarea value={value.customClauses} rows={3} onChange={(v) => onChange({ ...value, customClauses: v })} />
        </Field>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small UI primitives
// ─────────────────────────────────────────────────────────────

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
