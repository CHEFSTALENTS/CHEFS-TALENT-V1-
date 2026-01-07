'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Textarea, Reveal, Marker, Label } from '../../components/ui';
import { submitRequest } from '../../services/actions';
import { RequestForm, RequestMode } from '../../types';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { getMarketBudgetRange } from '@/lib/budgetBenchmark';
import type { BudgetContext, RequestKind } from '@/lib/budgetBenchmark';

/* =========================================================
   Money + dates helpers (safe)
========================================================= */

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

function parseISODate(s?: string) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function diffDaysInclusive(start?: string, end?: string) {
  const a = parseISODate(start);
  const b = parseISODate(end);
  if (!a || !b) return 1;

  const ms = b.getTime() - a.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

function isHighSeasonFromStartDate(startDate?: string) {
  const d = parseISODate(startDate);
  if (!d) return false;
  const m = d.getMonth() + 1; // 1..12
  // summer + christmas/new year
  return (m >= 6 && m <= 9) || m === 12;
}

function isInternationalFromLocation(location?: string) {
  const s = String(location || '').toLowerCase();
  if (!s) return false;

  // heuristique simple (à raffiner plus tard)
  const hintsNonFR = [
    'ibiza',
    'spain',
    'espagne',
    'italy',
    'italie',
    'greece',
    'grece',
    'uk',
    'london',
    'switzerland',
    'suisse',
    'marrakech',
    'morocco',
    'maroc',
    'dubai',
  ];
  const hintsFR = [
    'france',
    'paris',
    'lyon',
    'marseille',
    'nice',
    'cannes',
    'saint tropez',
    'courchevel',
    'megeve',
    'bordeaux',
  ];

  const nonfr = hintsNonFR.some((x) => s.includes(x));
  const fr = hintsFR.some((x) => s.includes(x));

  return nonfr && !fr;
}

/**
 * ✅ Ta règle métier (IMPORTANT) :
 * - Ponctuel (date unique / single) => EVENT => €/pers (déjeuner/dîner/évènement ponctuel)
 * - Résidence = uniquement si MULTI + >= 2 jours => RESIDENCE => €/jour (villa / yacht / chalet)
 *
 * => Le nombre de personnes n’impacte JAMAIS le prix “résidence / jour”.
 */
function getBudgetKindFromForm(formData: RequestForm): RequestKind {
  const days = diffDaysInclusive(formData.startDate, (formData as any).endDate);
  const isMulti = formData.dateMode === 'multi';
  return isMulti && days >= 2 ? 'residence' : 'event';
}

function buildBudgetContextFromForm(formData: RequestForm): BudgetContext | null {
  const assignment = String((formData as any).assignmentType || 'dinner');
  const kind = getBudgetKindFromForm(formData);

  const days = kind === 'residence' ? diffDaysInclusive(formData.startDate, (formData as any).endDate) : null;
  const guests = kind === 'event' ? Math.max(1, Number((formData as any).guestCount ?? 1)) : null;

  const yacht = assignment === 'yacht';
  const brigade =
    String((formData as any).serviceExpectations || '') === 'full_team' ||
    String((formData as any).serviceExpectations || '') === 'brigade';

  const highSeason = isHighSeasonFromStartDate(formData.startDate);
  const international = isInternationalFromLocation(formData.location);

  // ✅ IMPORTANT : on ne force PAS premium.
  // On laisse le lib renvoyer sa référence marché, sans prétendre que c’est “le choix du client”.
  const tier: BudgetContext['tier'] = null;

  if (kind === 'event' && (!guests || guests <= 0)) return null;
  if (kind === 'residence' && (!days || days <= 0)) return null;

  return {
    kind,
    days,
    guests,
    locationCountry: null,
    tier,
    flags: {
      highSeason,
      international,
      yacht,
      brigade,
    },
  };
}

/* =========================================================
   Budget helpers
========================================================= */

function calcPerUnit(data: ReturnType<typeof getMarketBudgetRange> | null) {
  if (!data) return null;

  if (data.kind === 'event') {
    const guests = Number(data.meta?.guests ?? 0) || 0;
    return {
      unitLabel: '€/pers',
      min: data.perUnit.min,
      max: data.perUnit.max,
      recommended: data.perUnit.recommended,
      totalRecommended: data.recommended,
      totalMin: data.min,
      totalMax: data.max,
      qtyLabel: `${guests} pers.`,
    };
  }

  const days = Number(data.meta?.days ?? 0) || 0;
  return {
    unitLabel: '€/jour',
    min: data.perUnit.min,
    max: data.perUnit.max,
    recommended: data.perUnit.recommended,
    totalRecommended: data.recommended,
    totalMin: data.min,
    totalMax: data.max,
    qtyLabel: `${days} jour${days > 1 ? 's' : ''}`,
  };
}

/**
 * Convertit un champ "budget/pers" (number) en verdict lisible vs référence marché.
 * (Pas d’hypothèse de tier = premium : on compare à la référence calculée.)
 */
function getBudgetVerdict(params: {
  budgetPerPerson?: number | null;
  marketPerPersonMin?: number | null;
  marketPerPersonMax?: number | null;
}) {
  const b = typeof params.budgetPerPerson === 'number' ? params.budgetPerPerson : null;
  const min = typeof params.marketPerPersonMin === 'number' ? params.marketPerPersonMin : null;
  const max = typeof params.marketPerPersonMax === 'number' ? params.marketPerPersonMax : null;

  if (!b || !min || !max) return null;

  if (b < min) return { tone: 'warn' as const, label: 'Budget en dessous du marché', desc: 'Possible, mais choix de chefs plus restreint.' };
  if (b > max) return { tone: 'ok' as const, label: 'Budget confortable', desc: 'Très bon niveau : accès à des profils premium.' };
  return { tone: 'ok' as const, label: 'Budget cohérent', desc: 'Aligné avec la référence marché pour votre demande.' };
}

function BudgetBenchmarkCard({
  loading,
  data,
  note,
  onUseRecommended,
  onUseRange,
}: {
  loading: boolean;
  data: ReturnType<typeof getMarketBudgetRange> | null;
  note?: React.ReactNode;
  onUseRecommended: () => void;
  onUseRange: () => void;
}) {
  const per = useMemo(() => calcPerUnit(data), [data]);
  const currency = data?.currency || 'EUR';

  const headerTitle =
    data?.kind === 'residence'
      ? `Référence marché · Résidence (${per?.qtyLabel ?? '—'})`
      : `Référence marché · Prestation ponctuelle (${per?.qtyLabel ?? '—'})`;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] overflow-hidden">
      <div className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-stone-400">Référence marché</div>

              {typeof data?.multiplier === 'number' ? (
                <span className="text-[10px] uppercase tracking-[0.22em] text-stone-500 border border-stone-200 px-2 py-1 rounded-full">
                  ×{Number(data.multiplier).toFixed(2)}
                </span>
              ) : null}
            </div>

            <div className="text-xl md:text-2xl font-serif text-stone-900 leading-tight">{headerTitle}</div>

            <p className="text-sm text-stone-500 font-light leading-relaxed max-w-2xl">
              Estimation indicative. Le budget final dépend du chef, du menu, de la logistique et de la destination.
            </p>

            {note ? <div className="text-xs text-stone-500">{note}</div> : null}
          </div>

          <div className="shrink-0 text-right">
            {loading ? (
              <div className="inline-flex items-center gap-2 text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs uppercase tracking-widest">Calcul…</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-stone-400">Recommandé</div>

                <div className="text-2xl md:text-3xl font-serif text-stone-900 leading-none">
                  {per ? formatMoney(per.recommended, currency) : '—'}
                </div>
                <div className="text-[11px] text-stone-500">{per ? `${per.unitLabel}` : ''}</div>

                {per ? (
                  <div className="text-[11px] text-stone-400 pt-1">
                    Total estimé : <span className="text-stone-700">{formatMoney(per.totalRecommended, currency)}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-stone-100 pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm text-stone-600">
            <span className="text-stone-400">Fourchette :</span>{' '}
            <span className="font-medium text-stone-900">
              {loading || !per ? '—' : `${formatMoney(per.min, currency)} – ${formatMoney(per.max, currency)} ${per.unitLabel}`}
            </span>
            {!loading && per ? (
              <span className="block text-xs text-stone-400 mt-1">
                Total : {formatMoney(per.totalMin, currency)} – {formatMoney(per.totalMax, currency)}
              </span>
            ) : null}
          </div>

          <div className="flex gap-3 justify-start md:justify-end">
            <Button type="button" onClick={onUseRecommended} disabled={loading || !per} className="w-auto px-5">
              Utiliser recommandé
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={onUseRange}
              disabled={loading || !per}
              className="w-auto px-0 text-stone-500 hover:text-stone-900"
            >
              Utiliser la fourchette
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Page
========================================================= */

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

  // ✅ Nouveau champ: mealType (fast ponctuel) + budgetPerPerson (numérique)
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('dinner');
  const [budgetPerPerson, setBudgetPerPerson] = useState<number | ''>('');

  const [formData, setFormData] = useState<RequestForm>({
    mode: 'fast',
    clientType: 'private',
    location: '',
    dateMode: 'single',
    startDate: '',
    // @ts-ignore
    endDate: '',
    assignmentType: 'dinner',
    guestCount: 2,
    serviceExpectations: 'chef_only',
    cuisinePreferences: '',
    dietaryRestrictions: '',
    preferredLanguage: '',
    // ✅ on garde budgetRange pour back/DB si déjà utilisé, mais on y mettra "X€/pers"
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

  // ✅ Synchronise mealType -> assignmentType (fast seulement)
  useEffect(() => {
    if (mode !== 'fast') return;
    setFormData((prev) => ({
      ...prev,
      assignmentType: mealType === 'lunch' ? ('lunch' as any) : ('dinner' as any),
    }));
  }, [mealType, mode]);

  // ✅ Stocke budgetPerPerson dans budgetRange sous forme standard (compat)
  useEffect(() => {
    if (mode !== 'fast') return;
    if (budgetPerPerson === '' || typeof budgetPerPerson !== 'number') {
      setFormData((prev) => ({ ...prev, budgetRange: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, budgetRange: `${budgetPerPerson}€/pers` }));
  }, [budgetPerPerson, mode]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // ✅ Ajoute une note automatique partout (hors frais de service)
      const injected = {
        ...formData,
        notes: [
          formData.notes?.trim(),
          'Tarifs indicatifs hors frais de service.',
          // Concierge uniquement (€/jour = prestation chef only, hors approvisionnement)
          mode === 'concierge'
            ? 'Pour les résidences : le prix / jour inclut uniquement la prestation du Chef (hors approvisionnement).'
            : null,
        ]
          .filter(Boolean)
          .join('\n'),
      };

      const response = await submitRequest(injected);
      if (response?.success) setResult(response);
    } catch (error) {
      console.error('Error submitting', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     Budget benchmark (local compute)
     - FAST: step 1 => seulement quand le client a mis un budget/pers
     - CONCIERGE: step 3 => toujours possible
  ========================================================= */

  const shouldShowBenchmark = useMemo(() => {
    if (!mode) return false;

    if (mode === 'fast' && step === 1) {
      // ✅ seulement si budget/pers saisi (pas de budget total sur ponctuel)
      return typeof budgetPerPerson === 'number' && budgetPerPerson > 0;
    }

    if (mode === 'concierge' && step === 3) return true;
    return false;
  }, [mode, step, budgetPerPerson]);

  const [budgetLoading, setBudgetLoading] = useState(false);
  const [marketBudget, setMarketBudget] = useState<ReturnType<typeof getMarketBudgetRange> | null>(null);

  useEffect(() => {
    if (!shouldShowBenchmark) return;

    const ctx = buildBudgetContextFromForm(formData);

    const hasLocation = String(formData.location || '').trim().length >= 2;
    const hasStart = String(formData.startDate || '').trim().length >= 8;

    if (!ctx || !hasLocation || !hasStart) {
      setMarketBudget(null);
      return;
    }

    let cancelled = false;
    const t = setTimeout(() => {
      setBudgetLoading(true);
      try {
        const res = getMarketBudgetRange(ctx);
        if (!cancelled) setMarketBudget(res);
      } catch (e) {
        console.error('BUDGET BENCHMARK ERROR', e);
        if (!cancelled) setMarketBudget(null);
      } finally {
        if (!cancelled) setBudgetLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    shouldShowBenchmark,
    formData.location,
    formData.startDate,
    // @ts-ignore
    (formData as any).endDate,
    (formData as any).guestCount,
    (formData as any).assignmentType,
    (formData as any).serviceExpectations,
    formData.dateMode,
  ]);

  const verdict = useMemo(() => {
    const per = calcPerUnit(marketBudget);
    if (!per) return null;

    if (marketBudget?.kind !== 'event') return null;

    return getBudgetVerdict({
      budgetPerPerson: typeof budgetPerPerson === 'number' ? budgetPerPerson : null,
      marketPerPersonMin: per.min,
      marketPerPersonMax: per.max,
    });
  }, [marketBudget, budgetPerPerson]);

  const applyRecommendedBudget = () => {
    if (!marketBudget) return;
    const per = calcPerUnit(marketBudget);
    if (!per) return;

    if (marketBudget.kind === 'event') {
      // ✅ On set directement le champ numérique budget/pers
      setBudgetPerPerson(Math.round(per.recommended));
      return;
    }

    // Concierge : on garde texte lisible en compat
    const s = `≈ ${formatMoney(per.recommended, marketBudget.currency)} / jour (≈ ${formatMoney(per.totalRecommended, marketBudget.currency)} total)`;
    setFormData((prev) => ({ ...prev, budgetRange: s }));
  };

  const applyRangeBudget = () => {
    if (!marketBudget) return;
    const per = calcPerUnit(marketBudget);
    if (!per) return;

    if (marketBudget.kind === 'event') {
      // pour fast, on ne met pas une “fourchette” dans le champ numérique.
      // on garde juste la carte comme info.
      return;
    }

    const s = `${formatMoney(per.min, marketBudget.currency)} – ${formatMoney(per.max, marketBudget.currency)} / jour (Total: ${formatMoney(
      per.totalMin,
      marketBudget.currency
    )} – ${formatMoney(per.totalMax, marketBudget.currency)})`;

    setFormData((prev) => ({ ...prev, budgetRange: s }));
  };

  /* ========================================================= */

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
                Votre demande a été attribuée à notre équipe Concierge. Nous étudions le cahier des charges et reviendrons vers vous avec une proposition structurée.
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
              className="group border border-stone-200 p-10 text-left transition hover:border-stone-900 bg-white"
            >
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Date unique</p>
              <h3 className="text-3xl font-serif text-stone-900 mb-4">Fast Match</h3>
              <p className="text-stone-500 font-light leading-relaxed">
                Pour une demande simple sur une date précise. Nous identifions rapidement un chef disponible correspondant à votre brief.
              </p>
            </button>

            <button
              type="button"
              onClick={() => selectMode('concierge')}
              className="group border border-stone-200 p-10 text-left transition hover:border-stone-900 bg-white"
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

              <p className="text-[11px] text-stone-400 pt-2">
                Tous les tarifs sont <span className="text-stone-600">hors frais de service</span>.
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
                    <span className={`text-[10px] uppercase tracking-widest transition-colors ${isActive ? 'text-stone-900' : 'text-stone-300'}`}>
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
                  <h2 className="text-3xl font-serif text-stone-900 mb-2">Votre demande</h2>
                  <p className="text-sm text-stone-500 font-light">
                    Déjeuner ou dîner, nombre de convives, et budget par personne.
                  </p>

                  <div className="space-y-6 pt-4">
                    <Label>Vous êtes :</Label>
                    <div className="flex gap-4 flex-wrap">
                      {[
                        { val: 'private', label: 'Client Privé' },
                        { val: 'concierge', label: 'Conciergerie / Agence' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, clientType: opt.val as any })}
                          className={`px-6 py-3 text-sm border transition-colors bg-white ${
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

                  {/* ✅ Déjeuner / Dîner */}
                  <div className="space-y-3">
                    <Label>Type de prestation</Label>
                    <div className="flex gap-4 flex-wrap">
                      {[
                        { val: 'lunch', label: 'Déjeuner' },
                        { val: 'dinner', label: 'Dîner' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setMealType(opt.val as any)}
                          className={`px-6 py-3 text-sm border transition-colors bg-white ${
                            mealType === opt.val
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
                      <Label>Date de la prestation</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Nombre de convives</Label>
                      <Input
                        type="number"
                        min={1}
                        className="max-w-[180px]"
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value || '0', 10) })}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Budget par personne</Label>
                      <Input
                        type="number"
                        min={1}
                        className="max-w-[220px]"
                        value={budgetPerPerson}
                        onChange={(e) => setBudgetPerPerson(e.target.value === '' ? '' : parseInt(e.target.value || '0', 10))}
                        placeholder="Ex: 180"
                      />
                      <p className="text-[11px] text-stone-400">
                        Tarif hors frais de service. (Déjeuner / dîner ponctuel = budget <b>€/personne</b>.)
                      </p>
                    </div>
                  </div>

                  {/* ✅ Benchmark: seulement si budget/pers renseigné */}
                  {shouldShowBenchmark && (
                    <div className="space-y-4 pt-2">
                      <BudgetBenchmarkCard
                        loading={budgetLoading}
                        data={marketBudget}
                        onUseRecommended={applyRecommendedBudget}
                        onUseRange={applyRangeBudget}
                        note={
                          <span>
                            Tarifs indicatifs <b>hors frais de service</b>.
                          </span>
                        }
                      />

                      {verdict ? (
                        <div
                          className={[
                            'rounded-lg border px-4 py-3 text-sm',
                            verdict.tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900',
                          ].join(' ')}
                        >
                          <div className="font-medium">{verdict.label}</div>
                          <div className="text-xs opacity-80 mt-1">{verdict.desc}</div>
                        </div>
                      ) : null}
                    </div>
                  )}

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
                      <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Agence, Family Office..." />
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

                    <p className="text-[11px] text-stone-400 mt-2">
                      Tous les tarifs sont <b>hors frais de service</b>.
                    </p>

                    {formData.dateMode === 'multi' ? (
                      <p className="text-[11px] text-stone-400">
                        Pour les résidences : le prix <b>/ jour</b> inclut uniquement la prestation du Chef (hors approvisionnement).
                      </p>
                    ) : null}
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
                              'flex justify-between items-center p-4 border transition-colors bg-white',
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

                  {/* ✅ Benchmark + budget info */}
                  <div className="space-y-6 pt-6 border-t border-stone-100">
                    <BudgetBenchmarkCard
                      loading={budgetLoading}
                      data={marketBudget}
                      onUseRecommended={applyRecommendedBudget}
                      onUseRange={applyRangeBudget}
                      note={
                        <span>
                          Résidences : <b>prix / jour = prestation du Chef uniquement</b> (hors approvisionnement). <br />
                          Tous les tarifs sont <b>hors frais de service</b>.
                        </span>
                      }
                    />

                    <div className="space-y-2">
                      <Label>Budget estimatif (facultatif)</Label>
                      <p className="text-xs text-stone-400 italic mb-1">
                        Indiquez une fourchette / jour si vous en avez une (hors approvisionnement).
                      </p>
                      <Input
                        value={formData.budgetRange}
                        onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                        placeholder="Ex: 600€ / jour"
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

                    <p className="text-[11px] text-stone-400">
                      Tous les tarifs sont <b>hors frais de service</b>. Résidences : <b>hors approvisionnement</b>.
                    </p>
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
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                {mode === 'fast' ? 'Réponse sous 24h.' : 'Traitement confidentiel.'}
              </p>
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
