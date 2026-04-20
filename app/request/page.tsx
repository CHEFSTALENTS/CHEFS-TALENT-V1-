'use client';
import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Button, Input, Textarea, Reveal, Marker } from '../../components/ui';
import { submitRequest } from '../../services/actions';
import type { RequestForm } from '../../types';

/* =========================================================
   Types
========================================================= */
type UnifiedRequestFormState = RequestForm & {
  endDate?: string;
  budgetAmount?: number | null;
  budgetUnit?: 'per_person' | 'per_day' | 'total';
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
    return `${Math.round(v)} €`;
  }
}

function daysBetweenInclusive(start?: string, end?: string) {
  if (!start || !end) return 1;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((b.getTime() - a.getTime()) / DAY_MS) + 1);
}

/* FIX: dateMode est désormais dérivé de missionCategory
   pour éviter les états incohérents entre les deux champs. */
function deriveDateMode(
  category?: UnifiedRequestFormState['missionCategory'],
): 'single' | 'multi' {
  if (category === 'residence' || category === 'yacht') return 'multi';
  return 'single';
}

function makeEmptyForm(): UnifiedRequestFormState {
  return {
    mode: 'concierge',
    clientType: 'private',
    location: '',
    dateMode: 'single',
    startDate: '',
    endDate: '',
    assignmentType: 'event',
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
    /* FIX: replacementNeeded est piloté uniquement par missionCategory,
       plus exposé comme champ indépendant à l'étape 2. */
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
  if (formData.budgetUnit === 'per_person') return `${formatMoney(amount)} / pers`;
  if (formData.budgetUnit === 'per_day') return `${formatMoney(amount)} / jour`;
  return `${formatMoney(amount)} total`;
}

function getAssignmentType(formData: UnifiedRequestFormState) {
  if (formData.missionCategory === 'yacht') return 'yacht';
  if (formData.missionCategory === 'residence') return 'daily';
  if (formData.missionCategory === 'single_replacement') return 'event';
  if (formData.mealPlan === 'dinner') return 'dinner';
  return 'event';
}

function getServiceRhythm(_formData: UnifiedRequestFormState) {
  return 'daily';
}

function getServiceExpectations(formData: UnifiedRequestFormState) {
  return formData.mealPlan === 'full_time' ? 'full_team' : 'chef_only';
}

function buildStructuredNotes(formData: UnifiedRequestFormState) {
  const lines = [
    `Type de besoin: ${humanMissionCategory(formData.missionCategory)}`,
    `Remplacement: ${formData.replacementNeeded === 'yes' ? 'Oui' : 'Non'}`,
    `Rythme de service: ${humanMealPlan(formData.mealPlan)}`,
    `Dates: ${formData.startDate || '—'}${formData.dateMode === 'multi' ? ` → ${formData.endDate || '—'}` : ''}`,
    `Convives: ${formData.guestCount ?? '—'}`,
    `Budget: ${buildBudgetRange(formData) || '—'}`,
    formData.notes ? `Notes client: ${formData.notes}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function computeDisplayedEstimate(formData: UnifiedRequestFormState) {
  const amount = Number(formData.budgetAmount || 0);
  if (!amount || amount <= 0) return null;
  if (formData.budgetUnit === 'per_person') {
    const pax = Number(formData.guestCount || 0);
    if (!pax || pax <= 0) return null;
    return amount * pax;
  }
  if (formData.budgetUnit === 'per_day') {
    const days =
      formData.dateMode === 'multi'
        ? daysBetweenInclusive(formData.startDate, formData.endDate)
        : 1;
    return amount * days;
  }
  return amount;
}

/* FIX: Texte de la sidebar dynamique selon le type de mission */
function getSidebarContextText(category?: UnifiedRequestFormState['missionCategory']) {
  if (category === 'yacht')
    return 'Nous sélectionnons des chefs expérimentés en cuisine embarquée, habitués aux contraintes de navigation et aux itinéraires internationaux.';
  if (category === 'residence')
    return 'Pour un séjour ou une résidence, nous proposons des chefs capables de gérer les repas quotidiens sur la durée, en toute autonomie.';
  if (category === 'single_replacement')
    return 'Pour un remplacement ponctuel, nous ciblons des profils disponibles rapidement avec le niveau d\'expérience adapté à votre contexte.';
  return 'Que ce soit pour un dîner, un séjour ou une résidence, nous structurons votre demande et vous proposons les profils les plus pertinents.';
}

/* =========================================================
   Nouveau composant : ProgressBar
   FIX : remplace le badge "Étape X / Y" par une barre
   de progression visuelle avec noms des étapes.
========================================================= */
function ProgressBar({
  current,
  labels,
}: {
  current: number;
  labels: string[];
}) {
  return (
    <nav aria-label="Progression du formulaire">
      <ol className="flex items-center">
        {labels.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isActive = stepNum === current;
          return (
            <React.Fragment key={label}>
              <li className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  aria-current={isActive ? 'step' : undefined}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isCompleted
                      ? 'bg-stone-900 text-white'
                      : isActive
                      ? 'bg-stone-900 text-white ring-4 ring-stone-200'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      viewBox="0 0 12 10"
                      fill="none"
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M1 5l3.5 3.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    isActive ? 'text-stone-900 font-medium' : 'text-stone-400'
                  }`}
                >
                  {label}
                </span>
              </li>
              {i < labels.length - 1 && (
                <div
                  className={`flex-1 h-px mb-5 mx-2 transition-colors ${
                    isCompleted ? 'bg-stone-900' : 'bg-stone-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/* =========================================================
   Nouveau composant : FieldError
   FIX : affiche les erreurs inline sous chaque champ.
========================================================= */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={`${id}-error`}
      className="mt-1.5 text-sm text-red-600"
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

/* =========================================================
   Nouveau composant : Req
   FIX : marqueur visuel pour les champs obligatoires.
========================================================= */
function Req() {
  return (
    <span className="ml-0.5 text-red-500" aria-hidden="true">
      *
    </span>
  );
}

/* =========================================================
   UI existants (conservés, avec améliorations ciblées)
========================================================= */
function Surface({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-white/80 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.2)] ${className}`}
    >
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
        <h2 className="text-xl md:text-2xl font-serif text-stone-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
      </div>
      {children}
    </Surface>
  );
}

/* FIX : aria-pressed ajouté pour l'accessibilité lecteurs d'écran */
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
      aria-pressed={active}
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm text-stone-900 text-right">{value || '—'}</span>
    </div>
  );
}

/* =========================================================
   Content principal
========================================================= */
function RequestFormContent() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    referenceId?: string;
    mode?: string;
    matchedChef?: string;
  } | null>(null);
  const [formData, setFormData] = useState<UnifiedRequestFormState>(() => makeEmptyForm());

  /* FIX : état des erreurs inline par champ */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const totalSteps = 3;
  const stepLabels = ['Contexte', 'Service', 'Contact'];

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  /* FIX : helper pour effacer l'erreur d'un champ lors de la saisie */
  const clearError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const summaryBudget = useMemo(() => buildBudgetRange(formData), [formData]);
  const estimatedTotal = useMemo(() => computeDisplayedEstimate(formData), [formData]);

  /* FIX : "Continuer" valide les champs requis de l'étape courante
     avant d'autoriser la progression. Fini le passage silencieux
     avec des champs vides. */
  const handleContinue = () => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (String(formData.location || '').trim().length < 2)
        errors.location = 'Veuillez indiquer le lieu de la mission.';
      if (String(formData.startDate || '').trim().length < 8)
        errors.startDate = 'Veuillez sélectionner une date de début.';
      const dm = deriveDateMode(formData.missionCategory);
      if (dm === 'multi' && String(formData.endDate || '').trim().length < 8)
        errors.endDate = 'Veuillez sélectionner une date de fin.';
      if (!formData.missionCategory)
        errors.missionCategory = 'Veuillez sélectionner un type de besoin.';
    }

    if (step === 2) {
      if (!formData.mealPlan)
        errors.mealPlan = 'Veuillez sélectionner un rythme de service.';
      if (!Number(formData.guestCount || 0))
        errors.guestCount = 'Veuillez indiquer le nombre de convives.';
      if (!Number(formData.budgetAmount || 0))
        errors.budgetAmount = 'Veuillez indiquer un budget indicatif.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    nextStep();
  };

  const handleSubmit = async () => {
    /* FIX : validation inline avant soumission (étape 3) */
    const errors: Record<string, string> = {};
    if (String(formData.fullName || '').trim().length < 2)
      errors.fullName = 'Veuillez indiquer votre nom complet.';
    if (!String(formData.email || '').includes('@'))
      errors.email = 'Veuillez indiquer une adresse email valide.';
    if (String(formData.phone || '').trim().length < 6)
      errors.phone = 'Veuillez indiquer un numéro de téléphone.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const dm = deriveDateMode(formData.missionCategory);

    try {
      const payload: any = {
        ...formData,
        mode: 'concierge',
        dateMode: dm,
        assignmentType: getAssignmentType(formData),
        serviceRhythm: getServiceRhythm(formData),
        serviceExpectations: getServiceExpectations(formData),
        budgetRange: buildBudgetRange(formData),
        notes: buildStructuredNotes(formData),
        location: formData.location,
        startDate: formData.startDate,
        endDate: dm === 'multi' ? formData.endDate : '',
        guestCount: Number(formData.guestCount || 0),
        cuisinePreferences: formData.cuisinePreferences || '',
        dietaryRestrictions: formData.dietaryRestrictions || '',
        preferredLanguage: formData.preferredLanguage || '',
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName || '',
        missionCategory: formData.missionCategory,
        mealPlan: formData.mealPlan,
        replacementNeeded: formData.replacementNeeded,
        budgetAmount: formData.budgetAmount,
        budgetUnit: formData.budgetUnit,
      };
      const response = await submitRequest(payload);
      if (response?.success) setResult(response);
    } catch (error) {
      console.error('Error submitting request', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Écran de succès ─────────────────────────────────────────────── */
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 px-6">
        <Reveal className="max-w-lg w-full text-center">
          <Marker className="mx-auto mb-8 bg-stone-900" />
          <div className="flex justify-center mb-6">
            <CheckCircle2
              className="w-16 h-16 text-stone-900"
              strokeWidth={1}
              aria-hidden="true"
            />
          </div>
          <h2 className="text-4xl font-serif font-normal mb-6 text-stone-900">
            Demande enregistrée
          </h2>
          <div
            className="text-stone-600 mb-12 text-lg font-light space-y-4"
            aria-live="polite"
          >
            <p>Votre demande a bien été transmise à notre équipe.</p>
            <p>
              Nous allons analyser le lieu, les dates, le niveau de service et le type de mission
              afin de vous proposer les profils les plus pertinents.
            </p>
            {result.referenceId ? (
              <p className="text-xs uppercase tracking-widest pt-4 text-stone-500">
                Ref : {result.referenceId}
              </p>
            ) : null}
          </div>
          <Link href="/">
            <Button type="button" variant="link">
              Retour à l'accueil
            </Button>
          </Link>
        </Reveal>
      </div>
    );
  }

  /* ── dateMode calculé (non exposé en UI) ─────────────────────────── */
  const dateMode = deriveDateMode(formData.missionCategory);

  /* ── Rendu principal ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-stone-100 pt-28 pb-20 px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* ── En-tête ───────────────────────────────────────────────── */}
        <div className="mb-10">
          <Marker className="mb-5 bg-stone-900" />
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900">
            Soumettre une demande
          </h1>
          <p className="mt-3 max-w-2xl text-stone-600 text-base md:text-lg">
            Un seul formulaire pour toutes les situations : remplacement ponctuel, dîner privé,
            déjeuner, séjour, résidence ou mission plus longue.
          </p>

          {/* Indicateur de durée — aligne la promesse du CTA home */}
          <p className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">
            <Clock className="w-3 h-3" aria-hidden="true" />
            Environ 2 minutes · 3 étapes
          </p>

          {/* FIX : barre de progression visuelle */}
          <div className="mt-8 max-w-xs">
            <ProgressBar current={step} labels={stepLabels} />
          </div>
          {/* FIX : légende champs obligatoires */}
          <p className="mt-4 text-xs text-stone-400">
            <span className="text-red-500">*</span> Champ obligatoire
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* ── Colonne principale ──────────────────────────────────── */}
          <div className="space-y-6">

            {/* ════════════════════════════════════════════════════════
                ÉTAPE 1 — Contexte de la mission
            ════════════════════════════════════════════════════════ */}
            {step === 1 ? (
              <Reveal>
                <SectionBlock
                  title="Le cadre de la mission"
                  subtitle="Commencez par le lieu, les dates et la nature du besoin."
                >
                  <div className="grid gap-6">

                    {/* Vous êtes */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm text-stone-600">
                          Vous êtes
                        </label>
                        <div
                          className="grid grid-cols-2 gap-3"
                          role="group"
                          aria-label="Type de client"
                        >
                          <ChoiceCard
                            active={formData.clientType === 'private'}
                            title="Client privé"
                            onClick={() =>
                              setFormData((p) => ({ ...p, clientType: 'private' }))
                            }
                          />
                          <ChoiceCard
                            active={formData.clientType === 'concierge'}
                            title="Conciergerie"
                            onClick={() =>
                              setFormData((p) => ({ ...p, clientType: 'concierge' }))
                            }
                          />
                        </div>
                      </div>

                      {formData.clientType === 'concierge' ? (
                        <div>
                          <label
                            htmlFor="companyName"
                            className="mb-2 block text-sm text-stone-600"
                          >
                            Nom de la structure
                          </label>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => {
                              clearError('companyName');
                              setFormData((p) => ({ ...p, companyName: e.target.value }));
                            }}
                            placeholder="Agence, conciergerie, family office…"
                            autoComplete="organization"
                          />
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Lieu + Type de besoin */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {/* FIX : htmlFor lié à l'id du champ */}
                        <label
                          htmlFor="location"
                          className="mb-2 block text-sm text-stone-600"
                        >
                          Lieu <Req />
                        </label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => {
                            clearError('location');
                            setFormData((p) => ({ ...p, location: e.target.value }));
                          }}
                          placeholder="Ville, pays, station, port…"
                          autoFocus
                          aria-required="true"
                          aria-describedby={
                            fieldErrors.location ? 'location-error' : undefined
                          }
                        />
                        <FieldError id="location" message={fieldErrors.location} />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-stone-600">
                          Type de besoin <Req />
                        </label>
                        {/* FIX : sélectionner le type de besoin définit
                            automatiquement le mode de date (single/multi).
                            Le sélecteur redondant "Date unique / Plusieurs jours"
                            a été supprimé. */}
                        <div
                          className="grid grid-cols-2 gap-3"
                          role="group"
                          aria-label="Type de besoin"
                        >
                          <ChoiceCard
                            active={formData.missionCategory === 'single_service'}
                            title="Prestation"
                            subtitle="Date unique"
                            onClick={() => {
                              clearError('missionCategory');
                              setFormData((p) => ({
                                ...p,
                                missionCategory: 'single_service',
                                dateMode: 'single',
                                replacementNeeded: 'no',
                                endDate: '',
                              }));
                            }}
                          />
                          <ChoiceCard
                            active={formData.missionCategory === 'single_replacement'}
                            title="Remplacement"
                            subtitle="Ponctuel"
                            onClick={() => {
                              clearError('missionCategory');
                              /* FIX : replacementNeeded = 'yes' est automatiquement
                                 déduit du type de besoin, sans toggle séparé à l'étape 2. */
                              setFormData((p) => ({
                                ...p,
                                missionCategory: 'single_replacement',
                                dateMode: 'single',
                                replacementNeeded: 'yes',
                                endDate: '',
                              }));
                            }}
                          />
                          <ChoiceCard
                            active={formData.missionCategory === 'residence'}
                            title="Séjour / résidence"
                            subtitle="Plusieurs jours"
                            onClick={() => {
                              clearError('missionCategory');
                              setFormData((p) => ({
                                ...p,
                                missionCategory: 'residence',
                                dateMode: 'multi',
                                replacementNeeded: 'no',
                              }));
                            }}
                          />
                          <ChoiceCard
                            active={formData.missionCategory === 'yacht'}
                            title="Yacht"
                            subtitle="Mission dédiée"
                            onClick={() => {
                              clearError('missionCategory');
                              setFormData((p) => ({
                                ...p,
                                missionCategory: 'yacht',
                                dateMode: 'multi',
                                replacementNeeded: 'no',
                              }));
                            }}
                          />
                        </div>
                        <FieldError id="missionCategory" message={fieldErrors.missionCategory} />
                      </div>
                    </div>

                    {/* Dates */}
                    <div>
                      <fieldset>
                        <legend className="mb-2 block text-sm text-stone-600">
                          {dateMode === 'multi' ? 'Dates de la mission' : 'Date de la mission'}{' '}
                          <Req />
                        </legend>
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* FIX : label individuel "Date de début" avec htmlFor */}
                          <div>
                            <label
                              htmlFor="startDate"
                              className="mb-1 block text-xs text-stone-400"
                            >
                              {dateMode === 'multi' ? 'Date de début' : 'Date'}
                            </label>
                            <Input
                              id="startDate"
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => {
                                clearError('startDate');
                                setFormData((p) => ({ ...p, startDate: e.target.value }));
                              }}
                              aria-required="true"
                              aria-describedby={
                                fieldErrors.startDate ? 'startDate-error' : undefined
                              }
                            />
                            <FieldError id="startDate" message={fieldErrors.startDate} />
                          </div>

                          {/* FIX : label individuel "Date de fin" visible uniquement
                              si le type de besoin implique plusieurs jours */}
                          {dateMode === 'multi' ? (
                            <div>
                              <label
                                htmlFor="endDate"
                                className="mb-1 block text-xs text-stone-400"
                              >
                                Date de fin
                              </label>
                              <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate || ''}
                                onChange={(e) => {
                                  clearError('endDate');
                                  setFormData((p) => ({ ...p, endDate: e.target.value }));
                                }}
                                aria-required="true"
                                aria-describedby={
                                  fieldErrors.endDate ? 'endDate-error' : undefined
                                }
                              />
                              <FieldError id="endDate" message={fieldErrors.endDate} />
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>
                      </fieldset>
                    </div>

                  </div>
                </SectionBlock>
              </Reveal>
            ) : null}

            {/* ════════════════════════════════════════════════════════
                ÉTAPE 2 — Service recherché
            ════════════════════════════════════════════════════════ */}
            {step === 2 ? (
              <Reveal>
                <SectionBlock
                  title="Le service recherché"
                  subtitle="Précisez le rythme, le volume et les préférences."
                >
                  <div className="grid gap-6">

                    {/* Rythme de service */}
                    <div>
                      <label className="mb-2 block text-sm text-stone-600">
                        Rythme de service <Req />
                      </label>
                      <div
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
                        role="group"
                        aria-label="Rythme de service"
                      >
                        {(
                          [
                            ['breakfast', 'Petit-déjeuner'],
                            ['lunch', 'Déjeuner'],
                            ['dinner', 'Dîner'],
                            ['breakfast_lunch', 'Petit-déjeuner + déjeuner'],
                            ['lunch_dinner', 'Déjeuner + dîner'],
                            ['full_time', 'Full time'],
                          ] as const
                        ).map(([val, label]) => (
                          <ChoiceCard
                            key={val}
                            active={formData.mealPlan === val}
                            title={label}
                            onClick={() => {
                              clearError('mealPlan');
                              setFormData((p) => ({ ...p, mealPlan: val }));
                            }}
                          />
                        ))}
                      </div>
                      <FieldError id="mealPlan" message={fieldErrors.mealPlan} />
                    </div>

                    {/* Convives + Langues */}
                    {/* FIX : le champ "Remplacement" a été supprimé ici.
                        Son état est piloté par la sélection du type de besoin
                        à l'étape 1 (single_replacement → replacementNeeded: 'yes'). */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="guestCount"
                          className="mb-2 block text-sm text-stone-600"
                        >
                          Nombre de convives <Req />
                        </label>
                        <Input
                          id="guestCount"
                          type="number"
                          min={1}
                          value={formData.guestCount ?? 0}
                          onChange={(e) => {
                            clearError('guestCount');
                            const n = parseNumberOrNull(e.target.value);
                            setFormData((p) => ({
                              ...p,
                              guestCount: n ? Math.max(1, Math.floor(n)) : 0,
                            }));
                          }}
                          aria-required="true"
                          aria-describedby={
                            fieldErrors.guestCount ? 'guestCount-error' : undefined
                          }
                        />
                        <FieldError id="guestCount" message={fieldErrors.guestCount} />
                      </div>

                      <div>
                        <label
                          htmlFor="preferredLanguage"
                          className="mb-2 block text-sm text-stone-600"
                        >
                          Langues souhaitées{' '}
                          <span className="text-stone-400 font-normal">(optionnel)</span>
                        </label>
                        <Input
                          id="preferredLanguage"
                          value={formData.preferredLanguage}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, preferredLanguage: e.target.value }))
                          }
                          placeholder="FR, EN, IT…"
                        />
                      </div>
                    </div>

                    {/* Budget indicatif */}
                    <div>
                      <label
                        htmlFor="budgetAmount"
                        className="mb-2 block text-sm text-stone-600"
                      >
                        Budget indicatif <Req />
                      </label>
                      {/* FIX : unité visible en suffixe du champ + select cohérent */}
                      <div className="grid grid-cols-[1fr_140px] gap-3">
                        <div className="relative">
                          <Input
                            id="budgetAmount"
                            type="number"
                            min={0}
                            placeholder="Ex : 1 200"
                            value={formData.budgetAmount ?? ''}
                            onChange={(e) => {
                              clearError('budgetAmount');
                              const n = parseNumberOrNull(e.target.value);
                              setFormData((p) => ({
                                ...p,
                                budgetAmount: n === null ? null : Math.max(0, n),
                              }));
                            }}
                            aria-required="true"
                            aria-describedby={
                              fieldErrors.budgetAmount ? 'budgetAmount-error' : undefined
                            }
                            /* FIX : padding-right pour ne pas déborder sur le "€" */
                            className="pr-8"
                          />
                          {/* FIX : devise affichée en suffixe */}
                          <span
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm select-none"
                            aria-hidden="true"
                          >
                            €
                          </span>
                        </div>
                        {/* FIX : select stylé de façon cohérente avec les autres inputs */}
                        <select
                          id="budgetUnit"
                          value={formData.budgetUnit}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              budgetUnit: e.target.value as UnifiedRequestFormState['budgetUnit'],
                            }))
                          }
                          aria-label="Unité du budget"
                          className="h-14 w-full rounded-xl border border-stone-200 bg-white px-4 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-colors"
                        >
                          <option value="total">Total</option>
                          <option value="per_person">/ pers</option>
                          <option value="per_day">/ jour</option>
                        </select>
                      </div>
                      <FieldError id="budgetAmount" message={fieldErrors.budgetAmount} />
                      <p className="mt-2 text-xs text-stone-500">
                        Cette information nous aide à proposer des profils cohérents.
                      </p>
                    </div>

                    {/* Style culinaire */}
                    <div>
                      <label
                        htmlFor="cuisinePreferences"
                        className="mb-2 block text-sm text-stone-600"
                      >
                        Style culinaire{' '}
                        <span className="text-stone-400 font-normal">(optionnel)</span>
                      </label>
                      <Textarea
                        id="cuisinePreferences"
                        value={formData.cuisinePreferences}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, cuisinePreferences: e.target.value }))
                        }
                        className="min-h-[120px]"
                        placeholder="Cuisine méditerranéenne, italienne, healthy, festive…"
                      />
                    </div>

                    {/* Restrictions */}
                    <div>
                      <label
                        htmlFor="dietaryRestrictions"
                        className="mb-2 block text-sm text-stone-600"
                      >
                        Restrictions / allergies{' '}
                        <span className="text-stone-400 font-normal">(optionnel)</span>
                      </label>
                      <Input
                        id="dietaryRestrictions"
                        value={formData.dietaryRestrictions}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, dietaryRestrictions: e.target.value }))
                        }
                        placeholder="Sans gluten, allergies, végétarien…"
                      />
                    </div>

                  </div>
                </SectionBlock>
              </Reveal>
            ) : null}

            {/* ════════════════════════════════════════════════════════
                ÉTAPE 3 — Coordonnées
            ════════════════════════════════════════════════════════ */}
            {step === 3 ? (
              <Reveal>
                <SectionBlock
                  title="Vos coordonnées"
                  subtitle="Dernière étape pour nous permettre de vous recontacter."
                >
                  <div className="grid gap-6">

                    {/* Nom complet */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-sm text-stone-600"
                      >
                        Nom complet <Req />
                      </label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => {
                          clearError('fullName');
                          setFormData((p) => ({ ...p, fullName: e.target.value }));
                        }}
                        placeholder="Prénom Nom"
                        autoFocus
                        aria-required="true"
                        /* FIX : autocomplete pour le remplissage automatique */
                        autoComplete="name"
                        aria-describedby={
                          fieldErrors.fullName ? 'fullName-error' : undefined
                        }
                      />
                      <FieldError id="fullName" message={fieldErrors.fullName} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className="mb-2 block text-sm text-stone-600"
                        >
                          Email <Req />
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            clearError('email');
                            setFormData((p) => ({ ...p, email: e.target.value }));
                          }}
                          placeholder="prenom@exemple.com"
                          aria-required="true"
                          autoComplete="email"
                          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                        />
                        <FieldError id="email" message={fieldErrors.email} />
                      </div>

                      {/* Téléphone */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="mb-2 block text-sm text-stone-600"
                        >
                          Téléphone <Req />
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            clearError('phone');
                            setFormData((p) => ({ ...p, phone: e.target.value }));
                          }}
                          /* FIX : placeholder avec format international */
                          placeholder="+33 6 XX XX XX XX"
                          aria-required="true"
                          autoComplete="tel"
                          aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                        />
                        <FieldError id="phone" message={fieldErrors.phone} />
                      </div>
                    </div>

                    {/* Notes complémentaires */}
                    <div>
                      <label
                        htmlFor="notes"
                        className="mb-2 block text-sm text-stone-600"
                      >
                        Notes complémentaires{' '}
                        <span className="text-stone-400 font-normal">(optionnel)</span>
                      </label>
                      {/* FIX : placeholder court, aide contextuelle sous le champ */}
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, notes: e.target.value }))
                        }
                        className="min-h-[140px]"
                        placeholder="Contexte, contraintes particulières…"
                        aria-describedby="notes-hint"
                      />
                      <p id="notes-hint" className="mt-1.5 text-xs text-stone-400">
                        Ex : timing précis, niveau d'autonomie attendu, environnement,
                        préférences particulières.
                      </p>
                    </div>

                  </div>
                </SectionBlock>
              </Reveal>
            ) : null}

            {/* ── Navigation bas de formulaire ─────────────────────── */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                {step > 1 ? (
                  /* FIX : "Revenir" avec variant outline pour une
                     hiérarchie visuelle claire (secondaire ≠ lien) */
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFieldErrors({});
                      prevStep();
                    }}
                  >
                    ← Retour
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-2">
                {step < totalSteps ? (
                  /* FIX : handleContinue valide avant d'avancer */
                  <Button type="button" onClick={handleContinue}>
                    Continuer →
                  </Button>
                ) : (
                  /* FIX : utilise le composant Button pour la cohérence visuelle */
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          className="w-4 h-4 animate-spin mr-2 inline"
                          aria-hidden="true"
                        />
                        Envoi en cours…
                      </>
                    ) : (
                      'Soumettre la demande'
                    )}
                  </Button>
                )}

                {/* FIX : mention RGPD à l'étape 3 */}
                {step === totalSteps ? (
                  <p className="text-xs text-stone-400 text-right max-w-xs">
                    En soumettant ce formulaire, vous acceptez notre{' '}
                    <Link
                      href="/privacy"
                      className="underline hover:text-stone-600 transition-colors"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            </div>

          </div>

          {/* ── Sidebar récapitulatif ──────────────────────────────── */}
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
                <SummaryItem
                  label="Type de client"
                  value={formData.clientType === 'concierge' ? 'Conciergerie' : 'Client privé'}
                />
                <SummaryItem label="Lieu" value={formData.location || '—'} />
                <SummaryItem
                  label="Dates"
                  value={
                    formData.startDate
                      ? `${formData.startDate}${
                          dateMode === 'multi' && formData.endDate
                            ? ` → ${formData.endDate}`
                            : ''
                        }`
                      : '—'
                  }
                />
                <SummaryItem label="Service" value={humanMealPlan(formData.mealPlan)} />
                <SummaryItem
                  label="Convives"
                  value={formData.guestCount ? String(formData.guestCount) : '—'}
                />
                <SummaryItem
                  label="Budget"
                  value={
                    summaryBudget
                      ? `${summaryBudget}${
                          estimatedTotal ? ` · env. ${formatMoney(estimatedTotal)}` : ''
                        }`
                      : '—'
                  }
                />
                <SummaryItem
                  label="Remplacement"
                  value={formData.replacementNeeded === 'yes' ? 'Oui' : 'Non'}
                />
              </div>
              {/* FIX : texte dynamique selon le type de mission */}
              <div className="mt-6 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
                {getSidebarContextText(formData.missionCategory)}
              </div>
            </Surface>
          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Export
========================================================= */
export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-100">
          <Loader2 className="animate-spin" aria-label="Chargement…" />
        </div>
      }
    >
      <RequestFormContent />
    </Suspense>
  );
}
