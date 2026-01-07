// lib/pricingSuggestion.ts
export type PricingTier = 'essential' | 'premium' | 'luxury' | 'ultra';

export const PRICING_BENCHMARK: Record<PricingTier, {
  residence: { min: number; max: number };
  event: { min: number; max: number };
}> = {
  essential: { residence: { min: 300, max: 450 }, event: { min: 60, max: 100 } },
  premium:   { residence: { min: 350, max: 520 }, event: { min: 90, max: 150 } },
  luxury:    { residence: { min: 480, max: 650 }, event: { min: 150, max: 280 } },
  ultra:     { residence: { min: 700, max: 1400 }, event: { min: 200, max: 400 } },
};

export const PRICING_MULTIPLIERS = {
  highSeason: 1.15,
  international: 1.2,
  yacht: 1.25,
  brigade: 1.2,
};

export function computeMultiplier(flags: Partial<Record<keyof typeof PRICING_MULTIPLIERS, boolean>>) {
  let m = 1;
  if (flags.highSeason) m *= PRICING_MULTIPLIERS.highSeason;
  if (flags.international) m *= PRICING_MULTIPLIERS.international;
  if (flags.yacht) m *= PRICING_MULTIPLIERS.yacht;
  if (flags.brigade) m *= PRICING_MULTIPLIERS.brigade;
  return m;
}

export function roundTo(v: number, step: number) {
  return Math.round(v / step) * step;
}

export function suggestBudget(input: {
  tier: PricingTier;
  kind: 'residence' | 'event';
  days?: number;        // residence
  guests?: number;      // event
  flags?: { highSeason?: boolean; international?: boolean; yacht?: boolean; brigade?: boolean };
}) {
  const flags = input.flags ?? {};
  const m = computeMultiplier(flags);
  const base = PRICING_BENCHMARK[input.tier];

  if (input.kind === 'residence') {
    const days = Math.max(1, Number(input.days || 1));
    const min = roundTo(base.residence.min * days * m, 50);
    const max = roundTo(base.residence.max * days * m, 50);
    const mid = roundTo(((min + max) / 2), 50);
    return { min, max, mid, multiplier: m };
  }

  const guests = Math.max(1, Number(input.guests || 1));
  const min = roundTo(base.event.min * guests * m, 25);
  const max = roundTo(base.event.max * guests * m, 25);
  const mid = roundTo(((min + max) / 2), 25);
  return { min, max, mid, multiplier: m };
}
