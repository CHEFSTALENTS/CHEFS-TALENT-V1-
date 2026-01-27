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
   Pricing rules (service fee)
========================================================= */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type PricingOk = {
  ok: true;
  rate: number;
  rateLabel: string;
  chefTotal: number;
  serviceFee: number;
  totalWithService: number;
  unitLabel: '€/pers' | '€/jour';
  qty: number;
  reason?: string; // ✅ ajout pour calmer TS
};

type PricingKo = {
  ok: false;
  rate: number | null;
  rateLabel: string;
  reason: string;
};

type PricingResult = PricingOk | PricingKo;
const isValidISODate = (s?: string) => !!s && !Number.isNaN(new Date(s).getTime());

const daysBetweenInclusive = (start?: string, end?: string) => {
  if (!isValidISODate(start) || !isValidISODate(end)) return 1;
  const a = new Date(start);
  const b = new Date(end);
  const days = Math.floor((b.getTime() - a.getTime()) / DAY_MS) + 1;
  return Math.max(1, days);
};

const isLastMinute72h = (startDate?: string) => {
  if (!isValidISODate(startDate)) return false;
  const now = new Date();
  const start = new Date(startDate);
  const hours = (start.getTime() - now.getTime()) / HOUR_MS;
  return hours <= 72;
};

function pickServiceFeeRate(formData: any): { rate: number | null; label: string; reason?: string } {
  const mode = String(formData.mode || 'fast'); // 'fast' | 'concierge'
  const assignment = String(formData.assignmentType || '');
  const startDate = String(formData.startDate || '');

  // 1) Yacht sur devis
  if (assignment === 'yacht') {
    return { rate: null, label: 'Sur devis', reason: 'yacht' };
  }

  // 2) Last minute <= 72h
  if (isLastMinute72h(startDate)) {
    return { rate: 0.18, label: '18% (last minute -72h)', reason: 'last_minute' };
  }

  // 3) Fast
  if (mode === 'fast') {
    return { rate: 0.11, label: '11% (fast)', reason: 'fast' };
  }

  // 4) Concierge selon durée
  const dateMode = String(formData.dateMode || 'single');
  const endDate = String(formData.endDate || '');
  const days = dateMode === 'multi' ? daysBetweenInclusive(startDate, endDate) : 1;

  if (days >= 8) return { rate: 0.13, label: '13% (concierge ≥8j)', reason: 'concierge_long' };
  return { rate: 0.15, label: '15% (concierge <8j)', reason: 'concierge_short' };
}

function computePricing(formData: any): PricingResult {
  const mode = String(formData.mode || 'fast');
  const dateMode = String(formData.dateMode || (mode === 'concierge' ? 'multi' : 'single'));
  const startDate = String(formData.startDate || '');
  const endDate = String(formData.endDate || '');

  const { rate, label } = pickServiceFeeRate(formData);

  // Yacht => pas d’estimation
  if (rate === null) {
    return { ok: false, rate: null, rateLabel: label, reason: 'Mission yacht : tarification sur devis.' };
  }

  // FAST = €/pers
  if (mode === 'fast') {
    const pax = Number(formData.guestCount ?? 0) || 0;
    const bpp = Number(String(formData.budgetPerPerson ?? '').replace(',', '.')) || 0;

    if (pax <= 0 || bpp <= 0) {
      return { ok: false, rate, rateLabel: label, reason: 'Renseignez convives + budget/pers pour calculer.' };
    }

    const chefTotal = bpp * pax;
    const serviceFee = chefTotal * rate;
    const totalWithService = chefTotal + serviceFee;

    return {
      ok: true,
      rate,
      rateLabel: label,
      chefTotal,
      serviceFee,
      totalWithService,
      unitLabel: '€/pers',
      qty: pax,
    };
  }

  // CONCIERGE
  const days = dateMode === 'multi' ? daysBetweenInclusive(startDate, endDate) : 1;
  const perDay = Number(String(formData.budgetPerDay ?? '').replace(',', '.')) || 0;

  if (days <= 0 || perDay <= 0) {
    return { ok: false, rate, rateLabel: label, reason: 'Renseignez un budget / jour pour calculer.' };
  }

  const chefTotal = perDay * days;
  const serviceFee = chefTotal * rate;
  const totalWithService = chefTotal + serviceFee;

  return {
    ok: true,
    rate,
    rateLabel: label,
    chefTotal,
    serviceFee,
    totalWithService,
    unitLabel: '€/jour',
    qty: days,
  };
}

/* =========================================================
   Helpers
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

function isHighSeasonFromStartDate(startDate?: string) {
  const d = parseISODate(startDate);
  if (!d) return false;
  const m = d.getMonth() + 1;
  return (m >= 6 && m <= 9) || m === 12;
}

function isInternationalFromLocation(location?: string) {
  const s = String(location || '').toLowerCase();
  if (!s) return false;

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
  const hintsFR = ['france', 'paris', 'lyon', 'marseille', 'nice', 'cannes', 'saint tropez', 'courchevel', 'megeve', 'bordeaux'];

  const nonfr = hintsNonFR.some((x) => s.includes(x));
  const fr = hintsFR.some((x) => s.includes(x));

  return nonfr && !fr;
}

/**
 * ✅ Benchmark kind:
 * - Ponctuel (single) => EVENT => €/pers
 * - Résidence (multi + >=2 jours) => RESIDENCE => €/jour
 */
function getBudgetKindFromForm(formData: RequestForm): RequestKind {
  const isMulti = formData.dateMode === 'multi';
  const days = daysBetweenInclusive(formData.startDate, (formData as any).endDate);
  return isMulti && days >= 2 ? 'residence' : 'event';
}

function buildBudgetContextFromForm(formData: RequestForm): BudgetContext | null {
  // Bloquer benchmark résidence tant qu'on n'a pas endDate (évite le "ponctuel" parasite)
  if (formData.dateMode === 'multi') {
    const end = String((formData as any).endDate || '').trim();
    if (end.length < 8) return null;
  }

  const assignment = String((formData as any).assignmentType || 'dinner');
  const kind = getBudgetKindFromForm(formData);

  const days = kind === 'residence' ? daysBetweenInclusive(formData.startDate, (formData as any).endDate) : null;
  const guests = kind === 'event' ? Math.max(1, Number((formData as any).guestCount ?? 1)) : null;

  const yacht = assignment === 'yacht';
  const brigade =
    String((formData as any).serviceExpectations || '') === 'full_team' || String((formData as any).serviceExpectations || '') === 'brigade';

  const highSeason = isHighSeasonFromStartDate(formData.startDate);
  const international = isInternationalFromLocation(formData.location);

  const tier: BudgetContext['tier'] = 'premium';

  if (kind === 'event' && (!guests || guests <= 0)) return null;
  if (kind === 'residence' && (!days || days <= 0)) return null;

  return {
    kind,
    days,
    guests,
    locationCountry: null,
    tier,
    flags: { highSeason, international, yacht, brigade },
  };
}

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

/* =========================================================
   UI components (local)
========================================================= */

function PricingSummary({ formData }: { formData: any }) {
  const p = useMemo(() => computePricing(formData), [formData]);

  return (
    <div className="border border-stone-200 bg-white p-5 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400">Estimation (service inclus)</div>

      <div className="text-sm text-stone-700">
        Frais de service : <b>{p.rateLabel}</b>
      </div>

      {!p.ok ? (
        <div className="text-sm text-stone-500">{p.reason}</div>
      ) : (
        <>
          <div className="text-sm text-stone-700">
            Base chef : <b>{formatMoney(p.chefTotal)}</b>{' '}
            <span className="text-stone-400">
              ({p.qty} {p.unitLabel === '€/jour' ? 'jour(s)' : 'pers.'})
            </span>
          </div>
          <div className="text-sm text-stone-700">
            Frais de service : <b>{formatMoney(p.serviceFee)}</b>
          </div>
          <div className="text-sm text-stone-900">
            Total estimé : <b>{formatMoney(p.totalWithService)}</b>
          </div>
        </>
      )}

      <div className="text-xs text-stone-400 italic">
        {String(formData.assignmentType || '') === 'yacht'
          ? 'Mission yacht : tarification sur devis.'
          : formData.mode === 'concierge'
          ? 'Approvisionnements non inclus.'
          : 'Tarifs indiqués hors approvisionnements.'}
      </div>
    </div>
  );
}

function BudgetBenchmarkCard({
  loading,
  data,
  onUseRecommended,
  onUseRange,
  variant,
}: {
  loading: boolean;
  data: ReturnType<typeof getMarketBudgetRange> | null;
  onUseRecommended: () => void;
  onUseRange: () => void;
  variant: 'fast' | 'concierge';
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
              {data?.tier ? (
                <span className="text-[10px] uppercase tracking-[0.22em] text-stone-500 border border-stone-200 px-2 py-1 rounded-full">
                  {data.tier}
                </span>
              ) : null}
              {typeof data?.multiplier === 'number' ? (
                <span className="text-[10px] uppercase tracking-[0.22em] text-stone-500 border border-stone-200 px-2 py-1 rounded-full">
                  ×{Number(data.multiplier).toFixed(2)}
                </span>
              ) : null}
            </div>

            <div className="text-xl md:text-2xl font-serif text-stone-900 leading-tight">{headerTitle}</div>

            {variant === 'concierge' ? (
              <p className="text-sm text-stone-500 font-light leading-relaxed max-w-2xl">
                Estimation indicative basée sur la prestation du chef. <span className="text-stone-700">Approvisionnements non inclus.</span>{' '}
                <span className="text-stone-700">Tarifs hors frais de service.</span>
              </p>
            ) : (
              <p className="text-sm text-stone-500 font-light leading-relaxed max-w-2xl">
                Estimation indicative. <span className="text-stone-700">Tarifs hors frais de service.</span>
              </p>
            )}
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
   Form factory
========================================================= */

type FastMealMoment = 'lunch' | 'dinner';

const makeEmptyForm = (m: RequestMode): RequestForm =>
  ({
    mode: m,
    clientType: 'private',
    location: '',
    dateMode: m === 'concierge' ? 'multi' : 'single',
    startDate: '',
    // @ts-ignore
    endDate: '',
    assignmentType: m === 'fast' ? 'dinner' : 'daily',
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
    // additions (soft typed)
    // @ts-ignore
    mealMoment: 'dinner' as FastMealMoment,
    // FAST numeric
    // @ts-ignore
    budgetPerPerson: '',
    // CONCIERGE numeric
    // @ts-ignore
    budgetPerDay: '',
  } as any);

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

  const [formData, setFormData] = useState<RequestForm>(() => makeEmptyForm('fast'));

  const [budgetLoading, setBudgetLoading] = useState(false);
  const [marketBudget, setMarketBudget] = useState<ReturnType<typeof getMarketBudgetRange> | null>(null);

  const getTotalSteps = () => (mode === 'fast' ? 2 : 4);
  const nextStep = () => setStep((prev) => Math.min(prev + 1, getTotalSteps()));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const selectMode = (selected: RequestMode) => {
    setMode(selected);
    setStep(1);
    setFormData(makeEmptyForm(selected));
    setMarketBudget(null);
    setBudgetLoading(false);
    router.push(`?mode=${selected}`);
  };

  const resetMode = () => {
    setMode(null);
    setStep(1);
    setFormData(makeEmptyForm('fast'));
    setMarketBudget(null);
    setBudgetLoading(false);
    router.push('/request');
  };

  // Init from URL
  useEffect(() => {
    const modeParam = searchParams?.get('mode');
    const typeParam = searchParams?.get('type');
    const stepParamRaw = searchParams?.get('step');
    const stepParam = stepParamRaw ? parseInt(stepParamRaw, 10) : null;

    if (modeParam === 'fast' || modeParam === 'concierge') {
      const m = modeParam as RequestMode;
      setMode(m);

      const total = m === 'fast' ? 2 : 4;
      const desiredStep = stepParam ? Math.max(1, Math.min(stepParam, total)) : 1;
      setStep(desiredStep);

      setFormData((prev) => {
        const next = makeEmptyForm(m);
        if (typeParam === 'concierge' || typeParam === 'private') {
          (next as any).clientType = typeParam;
        } else if (m === 'fast') {
          (next as any).clientType = (prev as any).clientType ?? 'private';
        }
        return next;
      });

      setMarketBudget(null);
      setBudgetLoading(false);
    } else {
      setMode(null);
      setStep(1);
      setMarketBudget(null);
      setBudgetLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* =========================================================
     Validation (required fields)
  ========================================================= */

  const requiredState = useMemo(() => {
    const errors: string[] = [];
    const m = mode;

    if (!m) return { ok: false, errors: ['Mode manquant'] };

    const loc = String(formData.location || '').trim();
    const start = String(formData.startDate || '').trim();
    const email = String(formData.email || '').trim();
    const name = String(formData.fullName || '').trim();
    const phone = String(formData.phone || '').trim();

    if (m === 'fast') {
      const pax = Number((formData as any).guestCount || 0);
      const bpp = Number(String((formData as any).budgetPerPerson || '').replace(',', '.')) || 0;

      if (loc.length < 2) errors.push('Lieu');
      if (start.length < 8) errors.push('Date');
      if (!pax || pax <= 0) errors.push('Nombre de convives');
      if (!bpp || bpp <= 0) errors.push('Budget par personne');
      if (step === 2) {
        if (name.length < 2) errors.push('Nom complet');
        if (!email.includes('@')) errors.push('Email');
        if (phone.length < 6) errors.push('Téléphone');
      }

      return { ok: errors.length === 0, errors };
    }

    // concierge
    const dateMode = String(formData.dateMode || 'multi');
    const end = String((formData as any).endDate || '').trim();
    const perDay = Number(String((formData as any).budgetPerDay || '').replace(',', '.')) || 0;

    if (loc.length < 2) errors.push('Lieu');
    if (start.length < 8) errors.push('Date de début');
    if (dateMode === 'multi' && end.length < 8) errors.push('Date de fin');
    if (String(formData.assignmentType || '').length < 2) errors.push('Type d’assignation');
    if (!perDay || perDay <= 0) errors.push('Budget par jour');

    if (step === 4) {
      if (name.length < 2) errors.push('Nom complet');
      if (!email.includes('@')) errors.push('Email');
      if (phone.length < 6) errors.push('Téléphone');
    }

    return { ok: errors.length === 0, errors };
  }, [mode, step, formData]);

  /* =========================================================
     Benchmark logic
  ========================================================= */

  const shouldShowBenchmark = useMemo(() => {
    if (!mode) return false;

    const hasLocation = String(formData.location || '').trim().length >= 2;
    const hasStart = String(formData.startDate || '').trim().length >= 8;

    if (mode === 'fast' && step === 1) {
      const guestsOk = Number((formData as any).guestCount || 0) > 0;
      const bppRaw = (formData as any).budgetPerPerson;
      const bpp = typeof bppRaw === 'string' ? Number(bppRaw.replace(',', '.')) : Number(bppRaw || 0);
      return hasLocation && hasStart && guestsOk && Number.isFinite(bpp) && bpp > 0;
    }

    if (mode === 'concierge' && step === 3) {
      const isMulti = formData.dateMode === 'multi';
      const hasEnd = !isMulti || String((formData as any).endDate || '').trim().length >= 8;
      return hasLocation && hasStart && hasEnd;
    }

    return false;
  }, [
    mode,
    step,
    formData.location,
    formData.startDate,
    formData.dateMode,
    (formData as any).endDate,
    (formData as any).guestCount,
    (formData as any).budgetPerPerson,
  ]);

  useEffect(() => {
    if (!shouldShowBenchmark) {
      setMarketBudget(null);
      setBudgetLoading(false);
    }
  }, [shouldShowBenchmark]);

  useEffect(() => {
    if (!shouldShowBenchmark) return;

    const ctx = buildBudgetContextFromForm(formData);
    if (!ctx) {
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
    (formData as any).endDate,
    (formData as any).guestCount,
    (formData as any).assignmentType,
    (formData as any).serviceExpectations,
    formData.dateMode,
  ]);

  const applyRecommendedBudget = () => {
    if (!marketBudget) return;
    const per = calcPerUnit(marketBudget);
    if (!per) return;

    const s =
      marketBudget.kind === 'event'
        ? `≈ ${formatMoney(per.recommended, marketBudget.currency)} / pers (hors frais de service)`
        : `≈ ${formatMoney(per.recommended, marketBudget.currency)} / jour (hors frais de service)`;

    setFormData((prev) => ({ ...prev, budgetRange: s }));
  };

  const applyRangeBudget = () => {
    if (!marketBudget) return;
    const per = calcPerUnit(marketBudget);
    if (!per) return;

    const s =
      marketBudget.kind === 'event'
        ? `${formatMoney(per.min, marketBudget.currency)} – ${formatMoney(per.max, marketBudget.currency)} / pers (hors frais de service)`
        : `${formatMoney(per.min, marketBudget.currency)} – ${formatMoney(per.max, marketBudget.currency)} / jour (hors frais de service)`;

    setFormData((prev) => ({ ...prev, budgetRange: s }));
  };

  /* =========================================================
     Submit
  ========================================================= */

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: any = { ...formData };

      // FAST normalize numeric
      if (mode === 'fast') {
        const raw = (formData as any).budgetPerPerson;
        const bpp = typeof raw === 'string' ? Number(raw.replace(',', '.')) : Number(raw || 0);
        payload.budgetPerPerson = Number.isFinite(bpp) ? bpp : undefined;
        payload.dateMode = 'single';
        // budgetRange textual for DB readability
        payload.budgetRange = payload.budgetPerPerson ? `${formatMoney(payload.budgetPerPerson)} / pers (hors frais de service)` : '';
      }

      // CONCIERGE normalize numeric
      if (mode === 'concierge') {
        const raw = (formData as any).budgetPerDay;
        const bpd = typeof raw === 'string' ? Number(raw.replace(',', '.')) : Number(raw || 0);
        payload.budgetPerDay = Number.isFinite(bpd) ? bpd : undefined;
        // budgetRange textual
        payload.budgetRange = payload.budgetPerDay ? `${formatMoney(payload.budgetPerDay)} / jour (hors frais de service)` : '';
      }

      // Pricing snapshot
      const pricing = computePricing(payload);
      payload.pricing = pricing.ok
        ? {
            rate: pricing.rate,
            rateLabel: pricing.rateLabel,
            chefTotal: pricing.chefTotal,
            serviceFee: pricing.serviceFee,
            totalWithService: pricing.totalWithService,
            unitLabel: pricing.unitLabel,
            qty: pricing.qty,
          }
        : { rate: null, rateLabel: pricing.rateLabel, reason: pricing.reason };

      const response = await submitRequest(payload);
      if (response?.success) setResult(response);
    } catch (error) {
      console.error('Error submitting', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================
     SUCCESS SCREEN
  ========================= */

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

          <h2 className="text-4xl font-serif font-normal mb-6 text-stone-900">{isFastMode ? 'Demande enregistrée' : 'Dossier ouvert'}</h2>

          <div className="text-stone-500 mb-12 text-lg font-light space-y-4">
            {isFastMode ? (
              <>
                <p>Votre demande Fast Match a bien été reçue.</p>
                <p>Nous vérifions la disponibilité immédiate de nos chefs et vous confirmerons l’attribution sous 2h.</p>
                <p className="text-xs text-stone-400">Tarifs hors frais de service (estimation service inclus affichée avant validation).</p>
              </>
            ) : (
              <>
                <p>Votre demande a été attribuée à notre équipe Concierge. Nous étudions le cahier des charges et reviendrons vers vous avec une proposition structurée.</p>
                <p className="text-xs text-stone-400">
                  Prix / jour = prestation du chef uniquement (approvisionnements non inclus). Estimation service inclus affichée avant validation.
                </p>
              </>
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

  /* =========================
     MODE SELECTION
  ========================= */

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
                Pour une demande simple sur une date précise. Budget en <b>€/personne</b>.
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
                Missions longues/sensibles. Prix en <b>€/jour</b> (prestation du chef uniquement).
              </p>
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  /* =========================
     FORM FLOW
  ========================= */

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

              <h1 className="text-2xl font-serif text-stone-900 leading-tight">{mode === 'fast' ? 'Fast Match' : 'Concierge Match'}</h1>

              <p className="text-xs text-stone-500 font-light leading-relaxed">
                {mode === 'fast'
                  ? 'Date unique · budget en €/personne.'
                  : 'Multi-jours · prix en €/jour (prestation chef uniquement) · approvisionnements non inclus.'}
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
                    <div className={`h-px transition-all duration-500 ${isActive ? 'w-8 bg-stone-900' : isPast ? 'w-4 bg-stone-300' : 'w-2 bg-stone-100'}`} />
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
            {/* ================= FAST STEP 1 ================= */}
            {mode === 'fast' && step === 1 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-2">Votre demande</h2>

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
                            formData.clientType === opt.val ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-900'
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
                      <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} autoFocus />
                    </div>
                    <div className="space-y-4">
                      <Label>Date</Label>
                      <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label>Nombre de convives</Label>
                      <Input type="number" min={1} value={formData.guestCount} onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value || '0', 10) })} />
                    </div>

                    <div className="space-y-4">
                      <Label>Budget par personne</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Ex : 150"
                        // @ts-ignore
                        value={(formData as any).budgetPerPerson}
                        onChange={(e) => setFormData({ ...formData, /* @ts-ignore */ budgetPerPerson: e.target.value })}
                      />
                      <p className="text-xs text-stone-400 italic">Confidentiel. Sert à proposer des chefs cohérents.</p>
                    </div>
                  </div>

                  {shouldShowBenchmark ? (
                    <div className="space-y-6 pt-2">
                      <BudgetBenchmarkCard loading={budgetLoading} data={marketBudget} onUseRecommended={applyRecommendedBudget} onUseRange={applyRangeBudget} variant="fast" />
                      <div className="space-y-2">
                        <Label>Référence (lecture seule)</Label>
                        <Input value={formData.budgetRange} readOnly />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <div className="border border-stone-200 bg-white p-5 text-sm text-stone-500">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Référence marché</div>
                        Renseignez <b>lieu</b>, <b>date</b>, <b>convives</b> et <b>budget / personne</b> pour afficher une estimation.
                      </div>
                    </div>
                  )}

                  {/* Estimation service inclus */}
                  <PricingSummary
                    formData={{
                      ...formData,
                      // ensure numeric read
                      budgetPerPerson: Number(String((formData as any).budgetPerPerson || '').replace(',', '.')) || undefined,
                    }}
                  />

                  <div className="space-y-4">
                    <Label>Préférences (facultatif)</Label>
                    <Textarea value={formData.cuisinePreferences} onChange={(e) => setFormData({ ...formData, cuisinePreferences: e.target.value })} className="min-h-[110px]" />
                  </div>
                </div>
              </Reveal>
            )}

            {/* ================= FAST STEP 2 ================= */}
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

                  {/* Estimation service inclus */}
                  <PricingSummary
                    formData={{
                      ...formData,
                      budgetPerPerson: Number(String((formData as any).budgetPerPerson || '').replace(',', '.')) || undefined,
                    }}
                  />
                </div>
              </Reveal>
            )}

            {/* ================= CONCIERGE STEP 1 ================= */}
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
                          className={`h-16 text-left px-6 transition-colors ${formData.clientType === opt.val ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:text-stone-900'}`}
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
                    <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Ville, Pays, Station..." />
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
                        <Input type="date" value={(formData as any).endDate || ''} onChange={(e) => setFormData({ ...formData, /* @ts-ignore */ endDate: e.target.value })} />
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            {/* ================= CONCIERGE STEP 2 ================= */}
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
                      <option value="daily">Service quotidien (Villa/Chalet)</option>
                      <option value="yacht">Mission yachting</option>
                      <option value="event">Événement (complexe)</option>
                      <option value="dinner">Dîner privé (complexe)</option>
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
                </div>
              </Reveal>
            )}

            {/* ================= CONCIERGE STEP 3 ================= */}
            {mode === 'concierge' && step === 3 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Précisions</h2>

                  <div className="space-y-4">
                    <Label>Style culinaire</Label>
                    <Textarea value={formData.cuisinePreferences} onChange={(e) => setFormData({ ...formData, cuisinePreferences: e.target.value })} />
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

                  {/* ✅ Champ numérique budget/day */}
                  <div className="space-y-2">
                    <Label>Budget par jour</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Ex : 750"
                      // @ts-ignore
                      value={(formData as any).budgetPerDay || ''}
                      onChange={(e) => setFormData({ ...formData, /* @ts-ignore */ budgetPerDay: e.target.value })}
                    />
                    <p className="text-xs text-stone-400 italic">Prestation du chef uniquement (approvisionnements non inclus).</p>
                  </div>

                  {/* Benchmark (Concierge) */}
                  {shouldShowBenchmark ? (
                    <div className="space-y-6 pt-6 border-t border-stone-100">
                      <BudgetBenchmarkCard loading={budgetLoading} data={marketBudget} onUseRecommended={applyRecommendedBudget} onUseRange={applyRangeBudget} variant="concierge" />
                      <div className="space-y-2">
                        <Label>Référence (lecture seule)</Label>
                        <Input value={formData.budgetRange} readOnly />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-6 border-t border-stone-100">
                      <div className="border border-stone-200 bg-white p-5 text-sm text-stone-500">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Référence marché</div>
                        Renseignez <b>lieu</b>, <b>dates</b> (début + fin si multi) pour afficher une estimation.
                      </div>
                    </div>
                  )}

                  {/* Estimation service inclus */}
                  <PricingSummary
                    formData={{
                      ...formData,
                      budgetPerDay: Number(String((formData as any).budgetPerDay || '').replace(',', '.')) || undefined,
                    }}
                  />
                </div>
              </Reveal>
            )}

            {/* ================= CONCIERGE STEP 4 ================= */}
            {mode === 'concierge' && step === 4 && (
              <Reveal>
                <div className="space-y-12">
                  <h2 className="text-3xl font-serif text-stone-900 mb-8">Finalisation</h2>

                  <div className="space-y-4">
                    <Label>Notes confidentielles</Label>
                    <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="min-h-[110px]" />
                  </div>

                  <div className="space-y-6 pt-6">
                    <Label>Vos coordonnées</Label>
                    <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Nom complet" autoFocus />

                    <div className="grid md:grid-cols-2 gap-8">
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Téléphone" />
                    </div>
                  </div>

                  {/* Estimation service inclus */}
                  <PricingSummary
                    formData={{
                      ...formData,
                      budgetPerDay: Number(String((formData as any).budgetPerDay || '').replace(',', '.')) || undefined,
                    }}
                  />
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
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !requiredState.ok}
                className={`w-64 h-14 text-white ${isSubmitting || !requiredState.ok ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-900'}`}
                title={!requiredState.ok ? `Champs requis: ${requiredState.errors.join(', ')}` : undefined}
              >
                {isSubmitting ? 'Envoi...' : mode === 'fast' ? 'Envoyer la demande' : 'Soumettre le dossier'}
              </button>
            )}
          </div>

          {!requiredState.ok && step === getTotalSteps() && (
            <div className="text-right mt-3">
              <p className="text-[11px] text-stone-400">Champs requis manquants : {requiredState.errors.join(', ')}</p>
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
