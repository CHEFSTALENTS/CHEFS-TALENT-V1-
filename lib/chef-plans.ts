// lib/chef-plans.ts
// Source de vérité des plans monétisation chef.
// Les Price IDs viennent des variables d'env (configurées dans Stripe Dashboard).

export type PlanKey = 'vip_3m' | 'vip_6m' | 'vip_12m' | 'boost_1m';
export type PaymentMode = 'monthly' | 'upfront';
export type StripeMode = 'subscription' | 'payment';

export type PlanVariant = {
  priceEnv: string;
  stripeMode: StripeMode;
  /** EUR cents */
  amount: number;
};

export type PlanConfig = {
  key: PlanKey;
  label: string;
  /** Durée d'engagement en mois */
  months: number;
  /** Variantes de paiement disponibles */
  variants: Partial<Record<PaymentMode, PlanVariant>>;
};

/**
 * Tous les plans Chefs Talents.
 * Les prix VIP sont dégressifs avec l'engagement :
 *   - 3 mois  : 59€/mois  → total 177€
 *   - 6 mois  : 55€/mois  → total 330€  (~7% off vs 3m)
 *   - 12 mois : 40€/mois  → total 480€  (~32% off vs 3m)
 *   - Boost   : 119€ pour 1 mois de visibilité maximale
 *
 * Pour les VIP, le chef peut choisir mode 'monthly' (subscription Stripe avec
 * cancel_at à la fin de l'engagement) ou 'upfront' (one-time payment du total).
 */
export const CHEF_PLANS: Record<PlanKey, PlanConfig> = {
  vip_3m: {
    key: 'vip_3m',
    label: 'VIP 3 mois',
    months: 3,
    variants: {
      monthly: {
        priceEnv: 'STRIPE_PRICE_VIP_3M_MONTHLY',
        stripeMode: 'subscription',
        amount: 5900, // 59,00 € / mois
      },
      upfront: {
        priceEnv: 'STRIPE_PRICE_VIP_3M_UPFRONT',
        stripeMode: 'payment',
        amount: 17700, // 177,00 € total
      },
    },
  },
  vip_6m: {
    key: 'vip_6m',
    label: 'VIP 6 mois',
    months: 6,
    variants: {
      monthly: {
        priceEnv: 'STRIPE_PRICE_VIP_6M_MONTHLY',
        stripeMode: 'subscription',
        amount: 5500, // 55,00 € / mois
      },
      upfront: {
        priceEnv: 'STRIPE_PRICE_VIP_6M_UPFRONT',
        stripeMode: 'payment',
        amount: 33000, // 330,00 € total
      },
    },
  },
  vip_12m: {
    key: 'vip_12m',
    label: 'VIP 12 mois',
    months: 12,
    variants: {
      monthly: {
        priceEnv: 'STRIPE_PRICE_VIP_12M_MONTHLY',
        stripeMode: 'subscription',
        amount: 4000, // 40,00 € / mois
      },
      upfront: {
        priceEnv: 'STRIPE_PRICE_VIP_12M_UPFRONT',
        stripeMode: 'payment',
        amount: 48000, // 480,00 € total
      },
    },
  },
  boost_1m: {
    key: 'boost_1m',
    label: 'Boost 1 mois',
    months: 1,
    variants: {
      upfront: {
        priceEnv: 'STRIPE_PRICE_BOOST_1M',
        stripeMode: 'payment',
        amount: 11900, // 119,00 € one-time
      },
    },
  },
};

export function isPlanKey(v: unknown): v is PlanKey {
  return v === 'vip_3m' || v === 'vip_6m' || v === 'vip_12m' || v === 'boost_1m';
}

export function isPaymentMode(v: unknown): v is PaymentMode {
  return v === 'monthly' || v === 'upfront';
}

export function getPlanVariant(planKey: PlanKey, mode: PaymentMode): PlanVariant | null {
  return CHEF_PLANS[planKey]?.variants?.[mode] ?? null;
}

export function getPriceId(planKey: PlanKey, mode: PaymentMode): string | null {
  const v = getPlanVariant(planKey, mode);
  if (!v) return null;
  return process.env[v.priceEnv] ?? null;
}

export function getStripeMode(planKey: PlanKey, mode: PaymentMode): StripeMode | null {
  return getPlanVariant(planKey, mode)?.stripeMode ?? null;
}

export function getEngagementMonths(planKey: PlanKey): number {
  return CHEF_PLANS[planKey]?.months ?? 1;
}

/** Retourne unix timestamp du cancel_at (now + months × 30j). */
export function computeCancelAt(months: number): number {
  return Math.floor(Date.now() / 1000) + months * 30 * 24 * 3600;
}

/** Retourne ISO date du planEndsAt (now + months × 30j). */
export function computePlanEndsAt(months: number): string {
  return new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString();
}

/** Retourne ISO date du boostedUntil (now + 30j). */
export function computeBoostedUntil(): string {
  return new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
}
