// lib/budgetBenchmark.ts
export type RequestKind = 'residence' | 'event';

export type BudgetContext = {
  kind: RequestKind;

  // résidence
  days?: number | null;

  // event
  guests?: number | null;

  // contexte
  locationCountry?: string | null; // optionnel si tu l’as
  flags?: {
    highSeason?: boolean;
    international?: boolean;
    yacht?: boolean;
    brigade?: boolean;
  };

  // (optionnel) niveau de gamme si tu l’as côté demande (sinon on met "premium" par défaut)
  tier?: 'essential' | 'premium' | 'luxury' | 'ultra' | null;
};

const BENCH: Record<NonNullable<BudgetContext['tier']>, {
  residence: { min: number; max: number }; // €/jour
  event: { min: number; max: number };     // €/pers
}> = {
  essential: { residence: { min: 300, max: 450 }, event: { min: 60, max: 100 } },
  premium:   { residence: { min: 350, max: 520 }, event: { min: 80, max: 150 } },
  luxury:    { residence: { min: 480, max: 650 }, event: { min: 150, max: 280 } },
  ultra:     { residence: { min: 600, max: 1200 }, event: { min: 200, max: 400 } },
};

const MULT = {
  highSeason: 1.15,
  international: 1.20,
  yacht: 1.25,
  brigade: 1.20,
};

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

// lib/budgetBenchmark.ts
export type RequestKind = 'residence' | 'event';

export type BudgetContext = {
  kind: RequestKind;

  // résidence
  days?: number | null;

  // event
  guests?: number | null;

  locationCountry?: string | null;
  flags?: {
    highSeason?: boolean;
    international?: boolean;
    yacht?: boolean;
    brigade?: boolean;
  };

  tier?: 'essential' | 'premium' | 'luxury' | 'ultra' | null;
};

const BENCH: Record<NonNullable<BudgetContext['tier']>, {
  residence: { min: number; max: number }; // €/jour
  event: { min: number; max: number };     // €/pers
}> = {
  essential: { residence: { min: 300, max: 450 }, event: { min: 60, max: 100 } },
  premium:   { residence: { min: 350, max: 520 }, event: { min: 80, max: 150 } },
  luxury:    { residence: { min: 480, max: 650 }, event: { min: 150, max: 280 } },
  ultra:     { residence: { min: 600, max: 1200 }, event: { min: 200, max: 400 } },
};

const MULT = {
  highSeason: 1.15,
  international: 1.20,
  yacht: 1.25,
  brigade: 1.20,
};

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

export type MarketBudget = {
  currency: 'EUR';
  kind: RequestKind;
  tier: NonNullable<BudgetContext['tier']>;
  multiplier: number;

  // unité (affichage)
  unitLabel: '€/jour' | '€/pers';

  // prix unitaire
  minUnit: number;
  maxUnit: number;
  recommendedUnit: number;

  // budget total estimatif
  minTotal: number;
  maxTotal: number;
  recommendedTotal: number;

  meta: { days?: number; guests?: number };
};

export function getMarketBudgetRange(ctx: BudgetContext): MarketBudget {
  const tier = (ctx.tier ?? 'premium') as NonNullable<BudgetContext['tier']>;
  const base = BENCH[tier];
  const m = computeMultiplier(ctx.flags);

  if (ctx.kind === 'residence') {
    const days = Math.max(2, Number(ctx.days ?? 2)); // résidence = ≥2 jours
    const minUnit = base.residence.min * m;
    const maxUnit = base.residence.max * m;

    const minTotal = minUnit * days;
    const maxTotal = maxUnit * days;

    return {
      currency: 'EUR',
      kind: 'residence',
      tier,
      multiplier: m,
      unitLabel: '€/jour',
      minUnit: roundTo(minUnit, 10),
      maxUnit: roundTo(maxUnit, 10),
      recommendedUnit: roundTo((minUnit + maxUnit) / 2, 10),
      minTotal: roundTo(minTotal, 50),
      maxTotal: roundTo(maxTotal, 50),
      recommendedTotal: roundTo((minTotal + maxTotal) / 2, 50),
      meta: { days },
    };
  }

  // event (déjeuner/dîner/ponctuel) = €/pers
  const guests = Math.max(1, Number(ctx.guests ?? 2));
  const minUnit = base.event.min * m;
  const maxUnit = base.event.max * m;

  const minTotal = minUnit * guests;
  const maxTotal = maxUnit * guests;

  return {
    currency: 'EUR',
    kind: 'event',
    tier,
    multiplier: m,
    unitLabel: '€/pers',
    minUnit: roundTo(minUnit, 5),
    maxUnit: roundTo(maxUnit, 5),
    recommendedUnit: roundTo((minUnit + maxUnit) / 2, 5),
    minTotal: roundTo(minTotal, 50),
    maxTotal: roundTo(maxTotal, 50),
    recommendedTotal: roundTo((minTotal + maxTotal) / 2, 50),
    meta: { guests },
  };
}
