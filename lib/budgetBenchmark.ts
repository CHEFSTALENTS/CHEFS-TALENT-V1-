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

export function getMarketBudgetRange(ctx: BudgetContext) {
  const tier = ctx.tier ?? 'premium';
  const base = BENCH[tier];
  const m = computeMultiplier(ctx.flags);

  if (ctx.kind === 'residence') {
    const days = Math.max(1, Number(ctx.days ?? 1));
    const minTotal = base.residence.min * m * days;
    const maxTotal = base.residence.max * m * days;

    return {
      currency: 'EUR' as const,
      kind: 'residence' as const,
      tier,
      multiplier: m,
      unit: '€/jour',
      min: roundTo(minTotal, 50),
      max: roundTo(maxTotal, 50),
      recommended: roundTo(((minTotal + maxTotal) / 2), 50),
      meta: { days },
    };
  }

  // event
  const guests = Math.max(2, Number(ctx.guests ?? 10));
  const minTotal = base.event.min * m * guests;
  const maxTotal = base.event.max * m * guests;

  return {
    currency: 'EUR' as const,
    kind: 'event' as const,
    tier,
    multiplier: m,
    unit: '€/pers',
    min: roundTo(minTotal, 50),
    max: roundTo(maxTotal, 50),
    recommended: roundTo(((minTotal + maxTotal) / 2), 50),
    meta: { guests },
  };
}
