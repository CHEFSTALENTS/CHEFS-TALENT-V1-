// lib/budgetBenchmark.ts

export type RequestKind = 'residence' | 'event';

export type BudgetTier = 'essential' | 'premium' | 'luxury' | 'ultra';

export type BudgetContext = {
  kind: RequestKind;

  // résidence
  days?: number | null;

  // event (ponctuel: dîner / déjeuner / event 1 jour)
  guests?: number | null;

  // contexte
  locationCountry?: string | null;
  flags?: {
    highSeason?: boolean;
    international?: boolean;
    yacht?: boolean;
    brigade?: boolean;
  };

  // niveau de gamme (premium par défaut)
  tier?: BudgetTier | null;
};

const BENCH: Record<
  BudgetTier,
  {
    residence: { min: number; max: number }; // €/jour
    event: { min: number; max: number }; // €/pers
  }
> = {
  essential: { residence: { min: 300, max: 450 }, event: { min: 60, max: 100 } },
  premium: { residence: { min: 350, max: 520 }, event: { min: 80, max: 150 } },
  luxury: { residence: { min: 480, max: 650 }, event: { min: 150, max: 280 } },
  ultra: { residence: { min: 600, max: 1200 }, event: { min: 200, max: 400 } },
};

const MULT = {
  highSeason: 1.15,
  international: 1.2,
  yacht: 1.25,
  brigade: 1.2,
} as const;

function computeMultiplier(flags?: BudgetContext['flags']) {
  let m = 1;
  if (!flags) return m;
  if (flags.highSeason) m *= MULT.highSeason;
  if (flags.international) m *= MULT.international;
  if (flags.yacht) m *= MULT.yacht;
  if (flags.brigade) m *= MULT.brigade;
  return m;
}

function roundTo(v: number, step: number) {
  return Math.round(v / step) * step;
}

export type MarketBudgetRange = {
  currency: 'EUR';
  kind: RequestKind;
  tier: BudgetTier;
  multiplier: number;

  /**
   * ✅ IMPORTANT
   * - min/max/recommended = TOTAL (pour la mission complète)
   * - perUnit = prix unitaire (€/jour si résidence, €/pers si event)
   */
  unit: '€/jour' | '€/pers';

  min: number;
  max: number;
  recommended: number;

  perUnit: {
    min: number;
    max: number;
    recommended: number;
  };

  meta: { days?: number; guests?: number };
};

export function getMarketBudgetRange(ctx: BudgetContext): MarketBudgetRange {
  const tier: BudgetTier = (ctx.tier ?? 'premium') as BudgetTier;
  const base = BENCH[tier];
  const m = computeMultiplier(ctx.flags);

  if (ctx.kind === 'residence') {
    const days = Math.max(2, Number(ctx.days ?? 2)); // résidence = 2 jours min (règle métier)
    const unitMin = base.residence.min * m;
    const unitMax = base.residence.max * m;

    const minTotal = unitMin * days;
    const maxTotal = unitMax * days;
    const recTotal = (minTotal + maxTotal) / 2;

    return {
      currency: 'EUR',
      kind: 'residence',
      tier,
      multiplier: m,
      unit: '€/jour',
      min: roundTo(minTotal, 50),
      max: roundTo(maxTotal, 50),
      recommended: roundTo(recTotal, 50),
      perUnit: {
        min: roundTo(unitMin, 10),
        max: roundTo(unitMax, 10),
        recommended: roundTo((unitMin + unitMax) / 2, 10),
      },
      meta: { days },
    };
  }

  // event = ponctuel (déjeuner/dîner/event 1 jour) => €/pers
  const guests = Math.max(2, Number(ctx.guests ?? 2));
  const unitMin = base.event.min * m;
  const unitMax = base.event.max * m;

  const minTotal = unitMin * guests;
  const maxTotal = unitMax * guests;
  const recTotal = (minTotal + maxTotal) / 2;

  return {
    currency: 'EUR',
    kind: 'event',
    tier,
    multiplier: m,
    unit: '€/pers',
    min: roundTo(minTotal, 50),
    max: roundTo(maxTotal, 50),
    recommended: roundTo(recTotal, 50),
    perUnit: {
      min: roundTo(unitMin, 5),
      max: roundTo(unitMax, 5),
      recommended: roundTo((unitMin + unitMax) / 2, 5),
    },
    meta: { guests },
  };
}
