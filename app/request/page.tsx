'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Reveal, Marker, Label } from '../../components/ui';
import { submitRequest } from '../../services/actions';
import { RequestForm, RequestMode } from '../../types';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { getFastMatchBudgetBenchmark } from '@/services/fastMatch';

function RequestFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<RequestMode | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState<{
    success: boolean;
    referenceId?: string;
    mode?: string;
    matchedChef?: string;
  } | null>(null);

  const [formData, setFormData] = useState<RequestForm>({
    mode: 'fast',
    clientType: 'private',
    location: '',
    dateMode: 'single',
    startDate: '',
    // @ts-ignore (si ton type ne l’a pas encore, ça ne cassera pas le build)
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
  });

  const getTotalSteps = () => (mode === 'fast' ? 2 : 4);
  const nextStep = () => setStep((prev) => Math.min(prev + 1, getTotalSteps()));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const selectMode = (selected: RequestMode) => {
    setMode(selected);
    setStep(1);
    setFormData((prev) => ({ ...prev, mode: selected }));
    router.push(`?mode=${selected}`);
  };

  const resetMode = () => {
    setMode(null);
    setStep(1);
    router.push('/request');
  };

  // Init from URL (mode / type / step)
  useEffect(() => {
    const modeParam = searchParams?.get('mode');
    const typeParam = searchParams?.get('type');
    const stepParamRaw = searchParams?.get('step');
    const stepParam = stepParamRaw ? parseInt(stepParamRaw, 10) : null;

    if (typeParam === 'concierge' || typeParam === 'private') {
      setFormData((prev) => ({ ...prev, clientType: typeParam as any }));
    }

    if (modeParam === 'fast' || modeParam === 'concierge') {
      const m = modeParam as RequestMode;
      setMode(m);

      const total = m === 'fast' ? 2 : 4;
      const desiredStep = stepParam ? Math.max(1, Math.min(stepParam, total)) : 1;
      setStep(desiredStep);

      if (m === 'fast') {
        setFormData((prev) => ({
          ...prev,
          mode: 'fast',
          dateMode: 'single',
          assignmentType: 'dinner',
          clientType: typeParam === 'concierge' ? 'concierge' : prev.clientType,
        }));
      } else {
        setFormData((prev) => ({ ...prev, mode: 'concierge' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await submitRequest(formData);
      if (response?.success) setResult(response);
    } catch (error) {
      console.error('Error submitting', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==============================
     Budget benchmark (premium UI)
  ============================== */

  const canComputeBenchmark = useMemo(() => {
    const hasLocation = !!String(formData.location || '').trim();
    const hasDate = !!String(formData.startDate || '').trim();
    const guestsOk = Number(formData.guestCount || 0) > 0;
    // On déclenche tôt, avant que le client remplisse le budget
    return hasLocation && hasDate && guestsOk;
  }, [formData.location, formData.startDate, formData.guestCount]);

  const budgetBenchmark = useMemo(() => {
    if (!canComputeBenchmark) return null;
    try {
      // On passe le formData complet (la fonction pourra utiliser ce qu’elle veut)
      return getFastMatchBudgetBenchmark(formData as any) as any;
    } catch {
      return null;
    }
  }, [canComputeBenchmark, formData]);

  const benchmarkView = useMemo(() => {
    if (!budgetBenchmark) return null;

    // Supporte plusieurs shapes possibles sans casser
    const min = Number(budgetBenchmark?.min ?? budgetBenchmark?.low ?? 0) || 0;
    const avg = Number(budgetBenchmark?.avg ?? budgetBenchmark?.average ?? 0) || 0;
    const max = Number(budgetBenchmark?.max ?? budgetBenchmark?.high ?? 0) || 0;
    const recommended = Number(budgetBenchmark?.recommended ?? budgetBenchmark?.suggested ?? avg) || 0;
    const explanation =
      String(
        budgetBenchmark?.explanation ??
          budgetBenchmark?.note ??
          "Estimation indicative basée sur la zone, le format et le nombre de convives."
      ) || '';

    if (!min && !avg && !max) return null;

    const fmt = (n: number) =>
      n > 0
        ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)
        : '—';

    return { min, avg, max, recommended, explanation, fmt };
  }, [budgetBenchmark]);

  function BudgetBenchmarkCard({
    contextLabel,
  }: {
    contextLabel: string;
  }) {
    if (!benchmarkView) return null;

    const { min, avg, max, recommended, explanation, fmt } = benchmarkView;

    return (
      <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-stone-100 bg-gradient-to-b from-stone-50 to-white">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Benchmark • {contextLabel}
              </div>
              <div className="text-lg font-serif text-stone-900">
                Budget moyen constaté (estimation)
              </div>
              <p className="text-xs text-stone-500 font-light leading-relaxed max-w-xl">
                {explanation}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Recommandé
              </div>
              <div className="text-2xl font-serif text-stone-900">
                {fmt(recommended)}€
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Bas
              </div>
              <div className="text-lg font-serif text-stone-900 mt-1">
                {fmt(min)}€
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Moyen
              </div>
              <div className="text-lg font-serif text-stone-900 mt-1">
                {fmt(avg)}€
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Haut
              </div>
              <div className="text-lg font-serif text-stone-900 mt-1">
                {fmt(max)}€
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">
            <div className="text-xs text-stone-500 font-light">
              Astuce : un budget aligné au marché augmente fortement la vitesse de matching.
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center px-4 h-11 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 transition-colors text-sm text-stone-900"
              onClick={() => {
                // On remplit le champ budgetRange avec un format simple
                const v =
                  recommended > 0
                    ? `${recommended}€`
                    : '';
                setFormData((prev) => ({ ...prev, budgetRange: v }));
              }}
            >
              Utiliser le recommandé
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SUCCESS SCREEN ---
  if (result) {
    const isFastMode = result.mode === 'instant_match';

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] px-6">
        <Reveal className="max-w-lg w-full text-center">
          <Marker className="mx-auto mb-8 bg-stone-900" />

          <div className="flex justify-center mb-6">
            {isFastMode ? (
              <CheckCircle2 className="w-16 h-16 text-stone-900" strokeWidth={1} />
            ) : (
              <Clock className="w-16 h-16 text-stone-400" strokeWidth={1} />
            )}
          </div>

          <h2 className="text-4xl font-serif font-normal mb-6 text-stone-900">
            {isFastMode ? 'Demande enregistrée' : 'Dossier ouvert'}
          </h2>

          <div className="text-stone-500 mb-12 text-lg font-light space-y-4">
            {isFastMode ? (
              <>
                <p>Votre demande Fast Match a bien été reçue.</p>
                <p>Nous vérifions la disponibilité immédiate de nos chefs et vous confirmerons l’attribution sous 2h.</p>
              </>
            ) : (
              <p>
                Votre demande a été attribuée à notre équipe Concierge. Nous étudions le cahier des charges et reviendrons vers
                vous avec une proposition structurée.
              </p>
            )}

            <p className="text-xs uppercase tracking-widest pt-4 text-stone-400">Ref: {result.referenceId}</p>
          </div>

          <Link href="/">
            <Button variant="link">Retour à l’accueil</Button>
          </Link>
        </Reveal>
      </div>
    );
  }

  // --- MODE SELECTION ---
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24 px-6 md:px-12 flex items-center justify-center">
        <Reveal className="max-w-5xl w-full">
          <div className="text-center mb-16">
            <Marker className="mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">Quel est votre besoin ?</h1>
            <p className="text-stone-500 font-light">Sélectionnez le type d’accompagnement souhaité.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            <button
              type="button"
              onClick={() => selectMode('fast')}
              className="group border border-stone-200 p-10 text-left transition hover:border-stone-900"
            >
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Date unique</p>
              <h3 className="text-3xl font-serif text-stone-900 mb-4">Fast Match</h3>
              <p className="text-stone-500 font-light leading-relaxed">
                Pour une demande simple sur une date précise. Nous identifions rapidement un chef disponible correspondant à votre
                brief.
              </p>
            </button>

            <button
              type="button"
              onClick={() => selectMode('concierge')}
              className="group border border-stone-200 p-10 text-left transition hover:border-stone-900"
            >
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Demande complexe</p>
              <h3 className="text-3xl font-serif text-stone-900 mb-4">Concierge Match</h3>
              <p className="text-stone-500 font-light leading-relaxed">
                Missions longues, sensibles ou à forts enjeux. Traitement accompagné par notre équipe dédiée.
              </p>
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  // --- FORM FLOW ---
  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-24 px-6 md:px-12 font-sans">
      <div className="max-w-4xl mx-auto grid md:grid-cols-12 gap-12">
        {/* SIDEBAR */}
        <div className="md:col-span-3">
          <div className="sticky top-32 space-y-8">
            <Marker className={mode === 'concierge' ? 'bg-stone-900' : 'bg-stone-400'} />

            <div className="space-y-2">
              <button
                type="button"
                onClick={resetMode}
                className="text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors"
              >
                ← Changer de mode
              </button>

              <h1 className="text-2xl font-serif text-stone-900 leading-tight">
                {mode === 'fast' ? 'Fast Match' : 'Concierge Match'}
              </h1>

              <p className="text-xs text-stone-500 font-light leading-relaxed">
                {mode === 'fast' ? 'Pour une demande simple, sur une date précise.' : 'Pour les demandes complexes ou sensibles.'}
              </p>
            </div>

            {/* STEPS */}
            <div className="flex flex-col gap-3 pt-4">
              {Array.from({ length: getTotalSteps() }).map((_, i) => {
                const s = i + 1;
                const isActive = s === step;
                const isPast = s < step;

                return (
                  <div key={s} className="flex items-center gap-3">
                    <div
                      className={`h-px transition-all duration-500 ${
                        isActive ? 'w-8 bg-stone-900' : isPast ? 'w-4 bg-stone-300' : 'w-2 bg-stone-100'
                      }`}
                    />
                    <span
                      className={`text-[10px] uppercase tracking-widest transition-colors ${
                        isActive ? 'text-stone-900' : 'text-stone-300'
                      }`}
                    >
                      {s === 1 && (mode === 'fast' ? 'La demande' : 'Contexte')}
                      {s === 2 && (mode === 'fast' ? 'Coordonnées' : 'La mission')}
                      {s === 3 && 'Détails'}
                      {s === 4 && 'Coordonnées'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="md:col-span-9 min-h-[500px] flex flex-col justify-between border-l border-stone-100 pl-0 md:pl-12">
          <div key={step} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* === FAST MATCH STEP 1 === */}
            {mode === 'fast' && step === 1 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Votre demande</h2>

                  <div className="space-y-6">
                    <Label>Vous êtes :</Label>
                    <div className="flex gap-4">
                      {[
                        { val: 'private', label: 'Client Privé' },
                        { val: 'concierge', label: 'Conciergerie / Agence' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, clientType: opt.val as any })}
                          className={`px-6 py-3 text-sm border transition-colors ${
                            formData.clientType === opt.val
                              ? 'border-stone-900 bg-stone-900 text-white'
                              : 'border-stone-200 text-stone-600 hover:border-stone-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Lieu</Label>
                      <Input
                        placeholder="Ville"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-4">
                      <Label>Date du dîner</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Nombre de convives</Label>
                    <Input
                      type="number"
                      min={1}
                      className="max-w-[140px]"
                      value={formData.guestCount}
                      onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value || '0', 10) })}
                    />
                  </div>

                  {/* ✅ BENCHMARK PREMIUM (FAST) */}
                  <div className="pt-2">
                    <BudgetBenchmarkCard contextLabel="Fast Match" />
                  </div>

                  {/* ✅ CHAMP BUDGET (FAST) */}
                  <div className="space-y-4">
                    <Label>Budget estimatif</Label>
                    <p className="text-xs text-stone-400 italic">
                      Indiquez un ordre de grandeur pour éviter un budget en-dessous du marché.
                    </p>
                    <Input
                      value={formData.budgetRange}
                      onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                      placeholder="Ex: 600€"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Préférences (facultatif)</Label>
                    <Textarea
                      placeholder="Type de cuisine, allergies, ambiance souhaitée..."
                      value={formData.cuisinePreferences}
                      onChange={(e) => setFormData({ ...formData, cuisinePreferences: e.target.value })}
                      className="min-h-[110px]"
                    />
                  </div>
                </div>
              </Reveal>
            )}

            {/* === FAST MATCH STEP 2 === */}
            {mode === 'fast' && step === 2 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Vos coordonnées</h2>

                  <div className="space-y-6">
                    <Label>Nom complet</Label>
                    <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} autoFocus />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Email</Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-4">
                      <Label>Téléphone</Label>
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* === CONCIERGE STEP 1 === */}
            {mode === 'concierge' && step === 1 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Contexte de la demande</h2>

                  <div className="space-y-6">
                    <Label>Type de client</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-stone-200 border border-stone-200">
                      {[
                        { val: 'concierge', label: 'Une conciergerie / Agence' },
                        { val: 'private', label: 'Un client privé' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, clientType: opt.val as any })}
                          className={`h-16 text-left px-6 transition-colors ${
                            formData.clientType === opt.val ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.clientType === 'concierge' && (
                    <div className="space-y-4">
                      <Label>Nom de la structure</Label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Agence, Family Office..."
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <Label>Lieu de la mission</Label>
                    <Input placeholder="Ville, Pays, Station..." value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>

                  <div className="space-y-4">
                    <Label>Durée</Label>

                    <div className="flex gap-8 mb-6">
                      {[
                        { val: 'single', label: 'Date unique' },
                        { val: 'multi', label: 'Séjour prolongé' },
                      ].map((m) => (
                        <label key={m.val} className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-4 h-4 border flex items-center justify-center ${formData.dateMode === m.val ? 'border-stone-900' : 'border-stone-300'}`}>
                            {formData.dateMode === m.val && <div className="w-2 h-2 bg-stone-900" />}
                          </div>
                          <span className="text-stone-600">{m.label}</span>
                          <input type="radio" className="hidden" name="dateMode" checked={formData.dateMode === m.val} onChange={() => setFormData({ ...formData, dateMode: m.val as any })} />
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                      {formData.dateMode === 'multi' && (
                        <Input
                          type="date"
                          // @ts-ignore
                          value={formData.endDate || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              // @ts-ignore
                              endDate: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* === CONCIERGE STEP 2 === */}
            {mode === 'concierge' && step === 2 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">La mission</h2>

                  <div className="space-y-4">
                    <Label>Type d’assignation</Label>
                    <select
                      value={formData.assignmentType}
                      onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value as any })}
                      className="w-full h-14 bg-transparent border-b border-stone-200 text-lg focus:outline-none"
                    >
                      <option value="dinner">Dîner privé</option>
                      <option value="event">Événement</option>
                      <option value="daily">Service quotidien (Villa/Chalet)</option>
                      <option value="yacht">Mission yachting</option>
                    </select>
                  </div>

                  {formData.assignmentType === 'yacht' && (
                    <div className="grid grid-cols-2 gap-8 p-6 bg-stone-50 border border-stone-100">
                      <div className="space-y-2">
                        <Label>Zone de navigation</Label>
                        <Input value={formData.sailingArea} onChange={(e) => setFormData({ ...formData, sailingArea: e.target.value })} placeholder="Ex: Méditerranée" />
                      </div>
                      <div className="space-y-2">
                        <Label>Équipage total</Label>
                        <Input type="number" value={formData.crewSize} onChange={(e) => setFormData({ ...formData, crewSize: parseInt(e.target.value || '0', 10) })} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Label>Convives (principal)</Label>
                    <Input type="number" min={1} value={formData.guestCount} onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value || '0', 10) })} />
                  </div>

                  <div className="space-y-4">
                    <Label>Niveau de staffing</Label>

                    <div className="grid gap-3">
                      {[
                        { id: 'chef_only', title: 'Chef seul', desc: 'Cuisine & dressage simple' },
                        { id: 'chef_service', title: 'Chef + Service', desc: "Avec maître d’hôtel/serveur", disabled: true, note: 'Disponible prochainement' },
                        { id: 'full_team', title: 'Brigade complète', desc: 'Pour grands événements', disabled: true, note: 'Disponible prochainement' },
                      ].map((l) => {
                        const selected = formData.serviceExpectations === l.id;

                        return (
                          <label
                            key={l.id}
                            className={[
                              'flex justify-between items-center p-4 border transition-colors',
                              l.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-stone-900',
                              selected ? 'border-stone-900' : 'border-stone-200',
                            ].join(' ')}
                          >
                            <div>
                              <span className="block font-medium text-stone-900">{l.title}</span>
                              <span className="text-xs text-stone-500">{l.desc}</span>
                              {l.disabled && <span className="mt-1 block text-[11px] italic text-stone-400">{l.note}</span>}
                            </div>

                            <input
                              type="radio"
                              className="hidden"
                              name="service"
                              disabled={!!l.disabled}
                              checked={!l.disabled && selected}
                              onChange={() => {
                                if (l.disabled) return;
                                setFormData({ ...formData, serviceExpectations: l.id as any });
                              }}
                            />

                            <div className={`w-4 h-4 border flex items-center justify-center rounded-full ${selected ? 'border-stone-900' : 'border-stone-300'}`}>
                              {selected && <div className="w-2 h-2 bg-stone-900 rounded-full" />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {formData.dateMode === 'multi' && (
                    <div className="grid grid-cols-2 gap-8 border-t border-stone-100 pt-8">
                      <div className="space-y-4">
                        <Label>Rythme</Label>
                        <select
                          className="w-full h-12 border-b border-stone-200 bg-transparent"
                          value={formData.serviceRhythm}
                          onChange={(e) => setFormData({ ...formData, serviceRhythm: e.target.value as any })}
                        >
                          <option value="daily">3 repas / jour</option>
                          <option value="occasional">Dîner uniquement</option>
                          <option value="ondemand">À la carte</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <Label>Logement Chef</Label>
                        <select
                          className="w-full h-12 border-b border-stone-200 bg-transparent"
                          value={formData.accommodationProvided}
                          onChange={(e) => setFormData({ ...formData, accommodationProvided: e.target.value as any })}
                        >
                          <option value="yes">Fourni sur place</option>
                          <option value="no">Non fourni</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            )}

            {/* === CONCIERGE STEP 3 === */}
            {mode === 'concierge' && step === 3 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Précisions</h2>

                  <div className="space-y-4">
                    <Label>Style culinaire</Label>
                    <Textarea
                      placeholder="Méditerranéen, gastronomique, family style..."
                      value={formData.cuisinePreferences}
                      onChange={(e) => setFormData({ ...formData, cuisinePreferences: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Restrictions / allergies</Label>
                      <Input value={formData.dietaryRestrictions} onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })} placeholder="Sans gluten, etc." />
                    </div>
                    <div className="space-y-4">
                      <Label>Langues parlées</Label>
                      <Input value={formData.preferredLanguage} onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })} placeholder="FR, EN..." />
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-stone-100">
                    <Label>Budget estimatif</Label>
                    <p className="text-xs text-stone-400 italic mb-2">Confidentiel. Permet de calibrer le profil du chef.</p>

                    {/* ✅ BENCHMARK PREMIUM (CONCIERGE) */}
                    <BudgetBenchmarkCard contextLabel="Concierge Match" />

                    <div className="pt-4">
                      <Input
                        value={formData.budgetRange}
                        onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                        placeholder="Ex: 500–800€ / jour ou budget global"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* === CONCIERGE STEP 4 === */}
            {mode === 'concierge' && step === 4 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Finalisation</h2>

                  <div className="space-y-4">
                    <Label>Notes confidentielles</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Protocoles particuliers, confidentialité, accès…"
                      className="min-h-[110px]"
                    />
                  </div>

                  <div className="space-y-6 pt-6">
                    <Label>Vos coordonnées</Label>
                    <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Nom complet" autoFocus />

                    <div className="grid md:grid-cols-2 gap-8">
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Téléphone" />
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          {/* NAV */}
          <div className="pt-16 mt-8 flex items-center justify-end gap-6 border-t border-stone-100">
            {step > 1 && (
              <Button variant="link" onClick={prevStep} className="text-stone-400 hover:text-stone-900">
                Revenir
              </Button>
            )}

            {step < getTotalSteps() ? (
              <Button onClick={nextStep} className="w-40">
                Continuer
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-64">
                {isSubmitting ? <Loader2 className="animate-spin" /> : mode === 'fast' ? 'Envoyer la demande' : 'Soumettre le dossier'}
              </Button>
            )}
          </div>

          {step === getTotalSteps() && (
            <div className="text-right mt-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">{mode === 'fast' ? 'Réponse sous 24h.' : 'Traitement confidentiel.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <RequestFormContent />
    </Suspense>
  );
}
