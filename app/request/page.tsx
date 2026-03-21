'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Textarea, Reveal, Marker, Label } from '../../components/ui';
import { submitRequest } from '../../services/actions';
import type { RequestForm } from '../../types';
import { Loader2, CheckCircle2 } from 'lucide-react';

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

function SoftCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200/70 bg-stone-50/70 backdrop-blur-sm p-5 md:p-6 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.25)]">
      {title ? <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-3">{title}</div> : null}
      {children}
    </div>
  );
}

function makeEmptyForm(): UnifiedRequestFormState {
  return {
    mode: 'concierge', // ✅ on garde ça pour ne pas casser l’existant
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

function buildBudgetRange(formData: UnifiedRequestFormState) {
  const amount = Number(formData.budgetAmount || 0);
  if (!amount || amount <= 0) return '';
  return formData.budgetUnit === 'per_day'
    ? `${formatMoney(amount)} / jour`
    : `${formatMoney(amount)} total`;
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

  const summaryBudget = useMemo(() => buildBudgetRange(formData), [formData]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const payload: any = {
        ...formData,

        // ✅ on garde le mode concierge pour compatibilité backend
        mode: 'concierge',

        assignmentType: getAssignmentType(formData),
        serviceRhythm: getServiceRhythm(formData),
        budgetRange: buildBudgetRange(formData),

        notes: buildStructuredNotes(formData),

        // on garde les champs usuels pour Supabase / matching
        serviceExpectations: formData.serviceExpectations || 'chef_only',
      };

      const response = await submitRequest(payload);

      if (response?.success) {
        setResult(response);
      }
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
    <div className="min-h-screen bg-stone-100 pt-32 pb-24 px-6 md:px-12 font-sans">
      <div className="max-w-4xl mx-auto grid md:grid-cols-12 gap-12">
        {/* SIDEBAR */}
        <div className="md:col-span-3">
          <div className="sticky top-32 space-y-8">
            <Marker className="bg-stone-900" />

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Soumettre une demande
              </p>

              <h1 className="text-2xl font-serif text-stone-900 leading-tight">
                Un seul formulaire, tous les cas de figure.
              </h1>

              <p className="text-xs text-stone-600 font-light leading-relaxed">
                Remplacement ponctuel, déjeuner, dîner, full time, séjour prolongé ou yacht.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {[
                'Contexte',
                'Service',
                'Coordonnées',
              ].map((label, index) => {
                const s = index + 1;
                const isActive = s === step;
                const isPast = s < step;

                return (
                  <div key={s} className="flex items-center gap-3">
                    <div
                      className={`h-px transition-all duration-500 ${
                        isActive ? 'w-8 bg-stone-900' : isPast ? 'w-4 bg-stone-400' : 'w-2 bg-stone-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] uppercase tracking-widest transition-colors ${
                        isActive ? 'text-stone-900' : 'text-stone-400'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <SoftCard title="Résumé">
              <div className="space-y-3 text-sm text-stone-700">
                <div>
                  <span className="text-stone-500">Type :</span>{' '}
                  {humanMissionCategory(formData.missionCategory)}
                </div>
                <div>
                  <span className="text-stone-500">Service :</span>{' '}
                  {humanMealPlan(formData.mealPlan)}
                </div>
                <div>
                  <span className="text-stone-500">Lieu :</span>{' '}
                  {formData.location || '—'}
                </div>
                <div>
                  <span className="text-stone-500">Dates :</span>{' '}
                  {formData.startDate || '—'}
                  {formData.dateMode === 'multi' ? ` → ${formData.endDate || '—'}` : ''}
                </div>
                <div>
                  <span className="text-stone-500">Budget :</span>{' '}
                  {summaryBudget || '—'}
                </div>
              </div>
            </SoftCard>
          </div>
        </div>

        {/* FORM */}
        <div className="md:col-span-9 min-h-[500px] flex flex-col justify-between border-l border-stone-200/60 pl-0 md:pl-12">
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* STEP 1 */}
            {step === 1 && (
              <Reveal>
                <div className="space-y-10">
                  <h2 className="text-3xl font-serif text-stone-900">Contexte de la demande</h2>

                  <SoftCard title="Vous êtes">
                    <div className="flex gap-3 flex-wrap mt-3">
                      {[
                        { val: 'private', label: 'Client privé' },
                        { val: 'concierge', label: 'Conciergerie / Agence' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, clientType: opt.val as any }))}
                          className={`px-5 py-3 text-sm rounded-lg border transition-colors ${
                            formData.clientType === opt.val
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 bg-white/70 text-stone-700 hover:border-stone-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </SoftCard>

                  {formData.clientType === 'concierge' ? (
                    <SoftCard title="Nom de la structure">
                      <Input
                        value={formData.companyName}
                        onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                        placeholder="Agence, conciergerie, family office..."
                      />
                    </SoftCard>
                  ) : null}

                  <div className="grid md:grid-cols-2 gap-8">
                    <SoftCard title="Lieu">
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                        placeholder="Ville, pays, station, port..."
                        autoFocus
                      />
                    </SoftCard>

                    <SoftCard title="Type de besoin">
                      <select
                        value={formData.missionCategory}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            missionCategory: e.target.value as UnifiedRequestFormState['missionCategory'],
                          }))
                        }
                        className="w-full h-14 rounded-lg bg-white/70 border border-stone-200 text-stone-800 px-4 focus:outline-none focus:border-stone-900"
                      >
                        <option value="single_service">Prestation ponctuelle</option>
                        <option value="single_replacement">Remplacement ponctuel</option>
                        <option value="residence">Séjour / résidence</option>
                        <option value="yacht">Mission yacht</option>
                      </select>
                    </SoftCard>
                  </div>

                  <SoftCard title="Dates">
                    <div className="flex gap-8 mb-6 flex-wrap">
                      {[
                        { val: 'single', label: 'Date unique' },
                        { val: 'multi', label: 'Plusieurs jours' },
                      ].map((m) => (
                        <label key={m.val} className="flex items-center gap-3 cursor-pointer">
                          <div
                            className={`w-4 h-4 border flex items-center justify-center ${
                              formData.dateMode === m.val ? 'border-stone-900' : 'border-stone-300'
                            }`}
                          >
                            {formData.dateMode === m.val ? <div className="w-2 h-2 bg-stone-900" /> : null}
                          </div>
                          <span className="text-stone-700">{m.label}</span>
                          <input
                            type="radio"
                            className="hidden"
                            checked={formData.dateMode === m.val}
                            onChange={() => setFormData((p) => ({ ...p, dateMode: m.val as any }))}
                          />
                        </label>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
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
                      ) : null}
                    </div>
                  </SoftCard>
                </div>
              </Reveal>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <Reveal>
                <div className="space-y-10">
                  <h2 className="text-3xl font-serif text-stone-900">Le service recherché</h2>

                  <SoftCard title="Rythme de service">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { val: 'breakfast', label: 'Petit-déjeuner' },
                        { val: 'lunch', label: 'Déjeuner' },
                        { val: 'dinner', label: 'Dîner' },
                        { val: 'breakfast_lunch', label: 'Petit-déjeuner + déjeuner' },
                        { val: 'lunch_dinner', label: 'Déjeuner + dîner' },
                        { val: 'full_time', label: 'Full time' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              mealPlan: opt.val as UnifiedRequestFormState['mealPlan'],
                            }))
                          }
                          className={`h-14 text-left px-5 rounded-lg border transition-colors ${
                            formData.mealPlan === opt.val
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white/70 text-stone-700 border-stone-200 hover:border-stone-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </SoftCard>

                  <div className="grid md:grid-cols-2 gap-8">
                    <SoftCard title="Nombre de convives">
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
                    </SoftCard>

                    <SoftCard title="Remplacement">
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { val: 'no', label: 'Non' },
                          { val: 'yes', label: 'Oui' },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                replacementNeeded: opt.val as 'yes' | 'no',
                              }))
                            }
                            className={`px-5 py-3 text-sm rounded-lg border transition-colors ${
                              formData.replacementNeeded === opt.val
                                ? 'border-stone-900 bg-stone-900 text-white'
                                : 'border-stone-200 bg-white/70 text-stone-700 hover:border-stone-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </SoftCard>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <SoftCard title="Langues">
                      <Input
                        value={formData.preferredLanguage}
                        onChange={(e) => setFormData((p) => ({ ...p, preferredLanguage: e.target.value }))}
                        placeholder="FR, EN..."
                      />
                    </SoftCard>

                    <SoftCard title="Budget indicatif">
                      <div className="grid grid-cols-[1fr_auto] gap-3">
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
                          className="h-14 rounded-lg bg-white/70 border border-stone-200 text-stone-800 px-4 focus:outline-none focus:border-stone-900"
                        >
                          <option value="total">Total</option>
                          <option value="per_day">/ jour</option>
                        </select>
                      </div>

                      <p className="text-xs text-stone-500 italic mt-2">
                        Sert à orienter la sélection de chefs. Stocké dans la demande.
                      </p>
                    </SoftCard>
                  </div>

                  <SoftCard title="Style culinaire">
                    <Textarea
                      value={formData.cuisinePreferences}
                      onChange={(e) => setFormData((p) => ({ ...p, cuisinePreferences: e.target.value }))}
                      className="min-h-[110px]"
                      placeholder="Cuisine méditerranéenne, healthy, italienne, festive..."
                    />
                  </SoftCard>

                  <SoftCard title="Restrictions / allergies">
                    <Input
                      value={formData.dietaryRestrictions}
                      onChange={(e) => setFormData((p) => ({ ...p, dietaryRestrictions: e.target.value }))}
                      placeholder="Sans gluten, allergies, végétarien..."
                    />
                  </SoftCard>
                </div>
              </Reveal>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <Reveal>
                <div className="space-y-10">
                  <h2 className="text-3xl font-serif text-stone-900">Vos coordonnées</h2>

                  <SoftCard title="Notes complémentaires">
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      className="min-h-[140px]"
                      placeholder="Décrivez ici tout contexte utile : style attendu, contraintes, résidence, timing précis, environnement, niveau d’autonomie, etc."
                    />
                  </SoftCard>

                  <SoftCard title="Contact principal">
                    <div className="space-y-5">
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Nom complet"
                        autoFocus
                      />

                      <div className="grid md:grid-cols-2 gap-6">
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                          placeholder="Email"
                        />
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Téléphone"
                        />
                      </div>
                    </div>
                  </SoftCard>

                  <SoftCard title="Vérification">
                    <div className="space-y-2 text-sm text-stone-700">
                      <div>
                        <span className="text-stone-500">Type :</span> {humanMissionCategory(formData.missionCategory)}
                      </div>
                      <div>
                        <span className="text-stone-500">Service :</span> {humanMealPlan(formData.mealPlan)}
                      </div>
                      <div>
                        <span className="text-stone-500">Lieu :</span> {formData.location || '—'}
                      </div>
                      <div>
                        <span className="text-stone-500">Dates :</span> {formData.startDate || '—'}
                        {formData.dateMode === 'multi' ? ` → ${formData.endDate || '—'}` : ''}
                      </div>
                      <div>
                        <span className="text-stone-500">Convives :</span> {formData.guestCount ?? '—'}
                      </div>
                      <div>
                        <span className="text-stone-500">Budget :</span> {buildBudgetRange(formData) || '—'}
                      </div>
                    </div>
                  </SoftCard>
                </div>
              </Reveal>
            )}
          </div>

          {/* NAV */}
          <div className="pt-14 mt-10 flex items-center justify-end gap-6 border-t border-stone-200/60">
            {step > 1 ? (
              <Button
                type="button"
                variant="link"
                onClick={prevStep}
                className="text-stone-600 hover:text-stone-900"
              >
                Revenir
              </Button>
            ) : null}

            {step < totalSteps ? (
              <Button type="button" onClick={nextStep} className="w-40">
                Continuer
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !requiredState.ok}
                className={`w-64 h-14 rounded-xl text-white transition ${
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

          {!requiredState.ok && step === totalSteps ? (
            <div className="text-right mt-3">
              <p className="text-[11px] text-stone-500">
                Champs requis manquants : {requiredState.errors.join(', ')}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
