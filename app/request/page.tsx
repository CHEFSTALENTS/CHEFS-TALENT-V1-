'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Textarea, Reveal, Marker } from '../../components/ui';
import { submitRequest } from '../../services/actions';
import type { RequestForm } from '../../types';
import { CheckCircle2 } from 'lucide-react';

/* =========================================================
   Types
========================================================= */

type UnifiedRequestFormState = RequestForm & {
  endDate?: string;
  budgetAmount?: number | null;
  budgetUnit?: 'total' | 'per_day';
  missionCategory?: 'single_replacement' | 'single_service' | 'residence' | 'yacht';
  mealPlan?:
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'breakfast_lunch'
    | 'lunch_dinner'
    | 'full_time';
  replacementNeeded?: 'yes' | 'no';
};

/* =========================================================
   Helpers
========================================================= */

function parseNumberOrNull(raw: string): number | null {
  const cleaned = String(raw ?? '').replace(',', '.').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatMoney(v?: number, currency: string = 'EUR') {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${Math.round(v)}€`;
  }
}

function makeEmptyForm(): UnifiedRequestFormState {
  return {
    mode: 'concierge',
    clientType: 'private',
    location: '',
    dateMode: 'single',
    startDate: '',
    endDate: '',

    assignmentType: 'dinner',
    guestCount: 2,
    serviceExpectations: 'chef_only',

    cuisinePreferences: '',
    dietaryRestrictions: '',
    preferredLanguage: '',
    budgetRange: '',
    notes: '',
    fullName: '',
    email: '',
    phone: '',
    companyName: '',

    serviceRhythm: 'daily',
    accommodationProvided: 'yes',
    sailingArea: '',
    crewSize: 0,

    budgetAmount: null,
    budgetUnit: 'total',
    missionCategory: 'single_service',
    mealPlan: 'dinner',
    replacementNeeded: 'no',
  };
}

function humanMissionCategory(v?: UnifiedRequestFormState['missionCategory']) {
  if (v === 'single_replacement') return 'Remplacement ponctuel';
  if (v === 'single_service') return 'Prestation ponctuelle';
  if (v === 'residence') return 'Séjour / résidence';
  if (v === 'yacht') return 'Mission yacht';
  return '—';
}

function humanMealPlan(v?: UnifiedRequestFormState['mealPlan']) {
  if (v === 'breakfast') return 'Petit-déjeuner';
  if (v === 'lunch') return 'Déjeuner';
  if (v === 'dinner') return 'Dîner';
  if (v === 'breakfast_lunch') return 'Petit-déjeuner + déjeuner';
  if (v === 'lunch_dinner') return 'Déjeuner + dîner';
  if (v === 'full_time') return 'Full time';
  return '—';
}

function buildBudgetRange(formData: UnifiedRequestFormState) {
  const amount = Number(formData.budgetAmount || 0);
  if (!amount || amount <= 0) return '';
  return formData.budgetUnit === 'per_day'
    ? `${formatMoney(amount)} / jour`
    : `${formatMoney(amount)} total`;
}

function getAssignmentType(formData: UnifiedRequestFormState) {
  if (formData.missionCategory === 'yacht') return 'yacht';
  if (formData.missionCategory === 'residence') return 'daily';
  if (formData.missionCategory === 'single_replacement') return 'event';
  if (formData.mealPlan === 'dinner') return 'dinner';
  return 'event';
}

function getServiceRhythm(formData: UnifiedRequestFormState) {
  switch (formData.mealPlan) {
    case 'breakfast':
      return 'breakfast_only';
    case 'lunch':
      return 'lunch_only';
    case 'dinner':
      return 'dinner_only';
    case 'breakfast_lunch':
      return 'breakfast_lunch';
    case 'lunch_dinner':
      return 'lunch_dinner';
    case 'full_time':
      return 'full_time';
    default:
      return 'daily';
  }
}

function buildStructuredNotes(formData: UnifiedRequestFormState) {
  const lines = [
    `Type de besoin : ${humanMissionCategory(formData.missionCategory)}`,
    `Remplacement : ${formData.replacementNeeded === 'yes' ? 'Oui' : 'Non'}`,
    `Rythme de service : ${humanMealPlan(formData.mealPlan)}`,
    `Dates : ${formData.startDate || '—'}${formData.dateMode === 'multi' ? ` → ${formData.endDate || '—'}` : ''}`,
    `Convives : ${formData.guestCount ?? '—'}`,
    `Budget : ${buildBudgetRange(formData) || '—'}`,
    formData.notes ? `Notes client : ${formData.notes}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}

/* =========================================================
   UI
========================================================= */

function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white/75 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.2)] ${className}`}>
      {children}
    </div>
  );
}

function SectionBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Surface className="p-6 md:p-7">
      <div className="mb-5">
        <h3 className="text-xl md:text-2xl font-serif text-stone-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
      </div>
      {children}
    </Surface>
  );
}

function ChoiceCard({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        active
          ? 'border-stone-900 bg-stone-900 text-white'
          : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-400 hover:bg-stone-100'
      }`}
    >
      <div className="text-sm font-medium">{title}</div>
      {subtitle ? (
        <div className={`mt-1 text-xs ${active ? 'text-stone-300' : 'text-stone-500'}`}>
          {subtitle}
        </div>
      ) : null}
    </button>
  );
}

function StepBadge({ current, total }: { current: number; total: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">
      <span className="font-medium text-stone-900">Étape {current}</span>
      <span>/ {total}</span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm text-stone-900 text-right">{value || '—'}</span>
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

export default function RequestPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    referenceId?: string;
    mode?: string;
    matchedChef?: string;
  } | null>(null);

  const [formData, setFormData] = useState<UnifiedRequestFormState>(() => makeEmptyForm());

  const totalSteps = 3;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const summaryBudget = useMemo(() => buildBudgetRange(formData), [formData]);

  const requiredState = useMemo(() => {
    const errors: string[] = [];

    const loc = String(formData.location || '').trim();
    const start = String(formData.startDate || '').trim();
    const end = String(formData.endDate || '').trim();
    const name = String(formData.fullName || '').trim();
    const email = String(formData.email || '').trim();
    const phone = String(formData.phone || '').trim();
    const guestCount = Number(formData.guestCount || 0);
    const budgetAmount = Number(formData.budgetAmount || 0);

    if (step === 1) {
      if (loc.length < 2) errors.push('Lieu');
      if (start.length < 8) errors.push('Date de début');
      if (formData.dateMode === 'multi' && end.length < 8) errors.push('Date de fin');
      if (!formData.missionCategory) errors.push('Type de besoin');
    }

    if (step === 2) {
      if (!formData.mealPlan) errors.push('Rythme de service');
      if (!guestCount || guestCount <= 0) errors.push('Nombre de convives');
      if (!budgetAmount || budgetAmount <= 0) errors.push('Budget');
    }

    if (step === 3) {
      if (name.length < 2) errors.push('Nom complet');
      if (!email.includes('@')) errors.push('Email');
      if (phone.length < 6) errors.push('Téléphone');
    }

    return { ok: errors.length === 0, errors };
  }, [formData, step]);

  const handleSubmit = async () => {
  setIsSubmitting(true);

  try {
    const payload: any = {
      ...formData,

      // logique unique
      mode: 'concierge',

      // champs structurés utiles à l’admin + matching
      assignmentType: getAssignmentType(formData),
      serviceRhythm: getServiceRhythm(formData),
      serviceExpectations:
        formData.mealPlan === 'full_time' ? 'full_team' : 'chef_only',

      budgetRange: buildBudgetRange(formData),

      // important : garder les champs natifs bien remplis
      location: formData.location,
      startDate: formData.startDate,
      endDate: formData.dateMode === 'multi' ? formData.endDate : '',
      dateMode: formData.dateMode,
      guestCount: Number(formData.guestCount || 0),

      cuisinePreferences: formData.cuisinePreferences || '',
      dietaryRestrictions: formData.dietaryRestrictions || '',
      preferredLanguage: formData.preferredLanguage || '',

      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName || '',

      // nouveaux champs métier
      missionCategory: formData.missionCategory,
      mealPlan: formData.mealPlan,
      replacementNeeded: formData.replacementNeeded,
      budgetAmount: formData.budgetAmount,
      budgetUnit: formData.budgetUnit,

      // résumé humain lisible
      notes: buildStructuredNotes(formData),
    };

    const response = await submitRequest(payload);
    if (response?.success) setResult(response);
  } catch (error) {
    console.error('Error submitting request', error);
  } finally {
    setIsSubmitting(false);
  }
};

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 px-6">
        <Reveal className="max-w-lg w-full text-center">
          <Marker className="mx-auto mb-8 bg-stone-900" />
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-stone-900" strokeWidth={1} />
          </div>
          <h2 className="text-4xl font-serif font-normal mb-6 text-stone-900">
            Demande enregistrée
          </h2>
          <div className="text-stone-600 mb-12 text-lg font-light space-y-4">
            <p>Votre demande a bien été transmise à notre équipe.</p>
            <p>
              Nous allons analyser le lieu, les dates, le niveau de service et le type de mission
              afin de vous proposer les profils les plus pertinents.
            </p>
            {result.referenceId ? (
              <p className="text-xs uppercase tracking-widest pt-4 text-stone-500">
                Ref: {result.referenceId}
              </p>
            ) : null}
          </div>
          <Link href="/">
            <Button type="button" variant="link">
              Retour à l’accueil
            </Button>
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 pt-28 pb-20 px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Marker className="mb-5 bg-stone-900" />
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900">
              Soumettre une demande
            </h1>
            <p className="mt-3 max-w-2xl text-stone-600 text-base md:text-lg">
              Un seul formulaire pour toutes les situations : remplacement ponctuel, dîner privé,
              séjour, résidence ou mission plus longue.
            </p>
          </div>

          <StepBadge current={step} total={totalSteps} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {step === 1 ? (
              <Reveal>
                <SectionBlock
                  title="Le cadre de la mission"
                  subtitle="Commencez par le lieu, les dates et la nature du besoin."
                >
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Vous êtes</label>
                        <div className="grid grid-cols-2 gap-3">
                          <ChoiceCard
                            active={formData.clientType === 'private'}
                            title="Client privé"
                            onClick={() => setFormData((p) => ({ ...p, clientType: 'private' }))}
                          />
                          <ChoiceCard
                            active={formData.clientType === 'concierge'}
                            title="Conciergerie"
                            onClick={() => setFormData((p) => ({ ...p, clientType: 'concierge' }))}
                          />
                        </div>
                      </div>

                      {formData.clientType === 'concierge' ? (
                        <div>
                          <label className="mb-2 block text-sm text-stone-600">Nom de la structure</label>
                          <Input
                            value={formData.companyName}
                            onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                            placeholder="Agence, conciergerie, family office..."
                          />
                        </div>
                      ) : <div />}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Lieu</label>
                        <Input
                          value={formData.location}
                          onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                          placeholder="Ville, pays, station, port..."
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Type de besoin</label>
                        <div className="grid grid-cols-2 gap-3">
                          <ChoiceCard
                            active={formData.missionCategory === 'single_service'}
                            title="Prestation"
                            subtitle="Date unique"
                            onClick={() =>
                              setFormData((p) => ({ ...p, missionCategory: 'single_service', dateMode: 'single' }))
                            }
                          />
                          <ChoiceCard
                            active={formData.missionCategory === 'single_replacement'}
                            title="Remplacement"
                            subtitle="Ponctuel"
                            onClick={() =>
                              setFormData((p) => ({ ...p, missionCategory: 'single_replacement', dateMode: 'single' }))
                            }
                          />
                          <ChoiceCard
                            active={formData.missionCategory === 'residence'}
                            title="Séjour / résidence"
                            subtitle="Plusieurs jours"
                            onClick={() =>
                              setFormData((p) => ({ ...p, missionCategory: 'residence', dateMode: 'multi' }))
                            }
                          />
                          <ChoiceCard
                            active={formData.missionCategory === 'yacht'}
                            title="Yacht"
                            subtitle="Mission dédiée"
                            onClick={() =>
                              setFormData((p) => ({ ...p, missionCategory: 'yacht', dateMode: 'multi' }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-stone-600">Dates</label>
                      <div className="mb-4 flex gap-3 flex-wrap">
                        <ChoiceCard
                          active={formData.dateMode === 'single'}
                          title="Date unique"
                          onClick={() => setFormData((p) => ({ ...p, dateMode: 'single', endDate: '' }))}
                        />
                        <ChoiceCard
                          active={formData.dateMode === 'multi'}
                          title="Plusieurs jours"
                          onClick={() => setFormData((p) => ({ ...p, dateMode: 'multi' }))}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                        />
                        {formData.dateMode === 'multi' ? (
                          <Input
                            type="date"
                            value={formData.endDate || ''}
                            onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                          />
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  </div>
                </SectionBlock>
              </Reveal>
            ) : null}

            {step === 2 ? (
              <Reveal>
                <SectionBlock
                  title="Le service recherché"
                  subtitle="Précisez le rythme, le volume et les préférences."
                >
                  <div className="grid gap-6">
                    <div>
                      <label className="mb-2 block text-sm text-stone-600">Rythme de service</label>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          ['breakfast', 'Petit-déjeuner'],
                          ['lunch', 'Déjeuner'],
                          ['dinner', 'Dîner'],
                          ['breakfast_lunch', 'Petit-déjeuner + déjeuner'],
                          ['lunch_dinner', 'Déjeuner + dîner'],
                          ['full_time', 'Full time'],
                        ].map(([val, label]) => (
                          <ChoiceCard
                            key={val}
                            active={formData.mealPlan === val}
                            title={label}
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                mealPlan: val as UnifiedRequestFormState['mealPlan'],
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Nombre de convives</label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.guestCount ?? 0}
                          onChange={(e) => {
                            const n = parseNumberOrNull(e.target.value);
                            setFormData((p) => ({
                              ...p,
                              guestCount: n ? Math.max(1, Math.floor(n)) : 0,
                            }));
                          }}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Remplacement</label>
                        <div className="grid grid-cols-2 gap-3">
                          <ChoiceCard
                            active={formData.replacementNeeded === 'no'}
                            title="Non"
                            onClick={() => setFormData((p) => ({ ...p, replacementNeeded: 'no' }))}
                          />
                          <ChoiceCard
                            active={formData.replacementNeeded === 'yes'}
                            title="Oui"
                            onClick={() => setFormData((p) => ({ ...p, replacementNeeded: 'yes' }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Langues</label>
                        <Input
                          value={formData.preferredLanguage}
                          onChange={(e) => setFormData((p) => ({ ...p, preferredLanguage: e.target.value }))}
                          placeholder="FR, EN..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-stone-600">Budget indicatif</label>
                      <div className="grid grid-cols-[1fr_130px] gap-3">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Ex : 1200"
                          value={formData.budgetAmount ?? ''}
                          onChange={(e) => {
                            const n = parseNumberOrNull(e.target.value);
                            setFormData((p) => ({
                              ...p,
                              budgetAmount: n === null ? null : Math.max(0, n),
                            }));
                          }}
                        />
                        <select
                          value={formData.budgetUnit}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              budgetUnit: e.target.value as 'total' | 'per_day',
                            }))
                          }
                          className="h-14 rounded-xl border border-stone-200 bg-white px-4 text-stone-800 focus:outline-none focus:border-stone-900"
                        >
                          <option value="total">Total</option>
                          <option value="per_day">/ jour</option>
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-stone-500">
                        Cette information nous aide à proposer des profils cohérents.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-stone-600">Style culinaire</label>
                      <Textarea
                        value={formData.cuisinePreferences}
                        onChange={(e) => setFormData((p) => ({ ...p, cuisinePreferences: e.target.value }))}
                        className="min-h-[120px]"
                        placeholder="Cuisine méditerranéenne, italienne, healthy, festive..."
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-stone-600">Restrictions / allergies</label>
                      <Input
                        value={formData.dietaryRestrictions}
                        onChange={(e) => setFormData((p) => ({ ...p, dietaryRestrictions: e.target.value }))}
                        placeholder="Sans gluten, allergies, végétarien..."
                      />
                    </div>
                  </div>
                </SectionBlock>
              </Reveal>
            ) : null}

            {step === 3 ? (
              <Reveal>
                <SectionBlock
                  title="Vos coordonnées"
                  subtitle="Dernière étape pour nous permettre de vous recontacter."
                >
                  <div className="grid gap-6">
                    <div>
                      <label className="mb-2 block text-sm text-stone-600">Nom complet</label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Nom complet"
                        autoFocus
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                          placeholder="Email"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-stone-600">Téléphone</label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Téléphone"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-stone-600">Notes complémentaires</label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                        className="min-h-[140px]"
                        placeholder="Timing précis, contexte, niveau d’autonomie attendu, environnement, préférences particulières..."
                      />
                    </div>
                  </div>
                </SectionBlock>
              </Reveal>
            ) : null}

            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                {step > 1 ? (
                  <Button type="button" variant="link" onClick={prevStep} className="text-stone-600 hover:text-stone-900">
                    Revenir
                  </Button>
                ) : null}
              </div>

              <div>
                {step < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Continuer
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !requiredState.ok}
                    className={`h-12 rounded-xl px-6 text-white transition ${
                      isSubmitting || !requiredState.ok
                        ? 'bg-stone-400 cursor-not-allowed'
                        : 'bg-stone-900 hover:bg-black'
                    }`}
                    title={!requiredState.ok ? `Champs requis: ${requiredState.errors.join(', ')}` : undefined}
                  >
                    {isSubmitting ? 'Envoi...' : 'Soumettre la demande'}
                  </button>
                )}
              </div>
            </div>

            {!requiredState.ok ? (
              <p className="text-right text-[11px] text-stone-500">
                Champs requis manquants : {requiredState.errors.join(', ')}
              </p>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Surface className="p-6">
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  Résumé de la demande
                </div>
                <div className="mt-2 text-lg font-serif text-stone-900">
                  {humanMissionCategory(formData.missionCategory)}
                </div>
              </div>

              <div className="divide-y divide-stone-100">
                <SummaryItem label="Type de client" value={formData.clientType === 'concierge' ? 'Conciergerie' : 'Client privé'} />
                <SummaryItem label="Lieu" value={formData.location || '—'} />
                <SummaryItem
                  label="Dates"
                  value={`${formData.startDate || '—'}${formData.dateMode === 'multi' ? ` → ${formData.endDate || '—'}` : ''}`}
                />
                <SummaryItem label="Service" value={humanMealPlan(formData.mealPlan)} />
                <SummaryItem label="Convives" value={String(formData.guestCount ?? '—')} />
                <SummaryItem label="Budget" value={summaryBudget || '—'} />
              </div>

              <div className="mt-6 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
                Une fois envoyée, votre demande sera transmise à notre équipe et reliée à notre système de matching.
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}
