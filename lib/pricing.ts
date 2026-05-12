// lib/pricing.ts
// Source de vérité tarifaire : Rate Card Chefs Talents — Season 2026
// (Premium tier basé sur le PDF officiel CHEFSTALENTS_RATES2026.pdf).
//
// Règles métier :
//   - Tier Premium : tarifs du PDF (source de vérité)
//   - Tier Essentiel : Premium - 10% (chef entrée de gamme)
//   - Tier Exception : toujours sur devis
//   - Custom budget : sur devis (montant déjà fixé par le client)
//   - Durée > 16 jours : sur devis (mission long-terme spécifique)
//   - Convives > 30 : sur devis (event-style brigade)
//   - Résidence/yacht ET ≥ 5 jours : forfait semaine
//   - Sinon : prix par jour selon mealplan

export type MissionCategory =
  | 'single_service'
  | 'single_replacement'
  | 'residence'
  | 'yacht';

export type MealPlan =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'breakfast_lunch'
  | 'lunch_dinner'
  | 'full_time';

export type Tier = 'essential' | 'premium' | 'exclusive' | 'custom';

// ============================================================
// Base rates Premium tier (source : PDF Rate Card 2026)
// ============================================================

// One-off services (par jour, hors matières premières)
const ONE_OFF_RATES_EUR: Record<'breakfast' | 'lunch' | 'dinner', number> = {
  breakfast: 270, // 3h min
  lunch: 300,     // 4h min
  dinner: 400,    // 5h min
};

// Weekly packages (50h/semaine, base ≥ 5 nuits)
const WEEKLY_RATES_EUR = {
  half_board: 3400, // PDJ + dîner
  full_board: 3800, // tous les repas
};

// Tier discount : Essentiel = -10%, Premium = full price, Exception = sur devis
const TIER_DISCOUNT: Record<Tier, number | null> = {
  essential: 0.9,
  premium: 1,
  exclusive: null,
  custom: null,
};

// Seuils qui forcent le devis personnalisé
const MAX_DAYS_BEFORE_QUOTE = 16;
const MAX_GUESTS_BEFORE_QUOTE = 30;
const MIN_DAYS_FOR_WEEKLY = 5;

export type PriceEstimate = {
  /** Unité de facturation appliquée */
  unit: 'per_day' | 'per_week' | 'on_quote';
  /** Prix par unité après tier discount (null si sur devis) */
  perUnitEur: number | null;
  /** Total estimé (null si sur devis) */
  totalEur: number | null;
  /** Nombre de jours estimés */
  days?: number;
  /** Nombre de semaines facturées (forfait weekly) */
  weeks?: number;
  /** Mealplan utilisé pour le calcul */
  mealPlan?: MealPlan;
  /** True si on force le devis (durée trop longue, > 30 convives, etc.) */
  isQuote: boolean;
  /** Raison du devis si applicable (pour affichage UI) */
  quoteReason?:
    | 'tier_exception'
    | 'custom_budget'
    | 'too_many_days'
    | 'too_many_guests'
    | 'missing_data';
};

export interface PriceCalcInput {
  missionCategory?: MissionCategory;
  mealPlan?: MealPlan;
  days?: number;
  guestCount?: number;
  tier?: Tier;
}

/**
 * Calcule l'estimation tarifaire selon les paramètres mission.
 * Retourne TOUJOURS un objet PriceEstimate (jamais null).
 */
export function calcMissionPrice(opts: PriceCalcInput): PriceEstimate {
  const {
    missionCategory,
    mealPlan,
    days = 1,
    guestCount = 0,
    tier,
  } = opts;

  // 1. Exception → sur devis
  if (tier === 'exclusive') {
    return {
      unit: 'on_quote',
      perUnitEur: null,
      totalEur: null,
      isQuote: true,
      quoteReason: 'tier_exception',
    };
  }

  // 2. Budget custom → sur devis (le client a fixé son montant)
  if (tier === 'custom') {
    return {
      unit: 'on_quote',
      perUnitEur: null,
      totalEur: null,
      isQuote: true,
      quoteReason: 'custom_budget',
    };
  }

  // 3. Durée > 16 jours → sur devis
  if (days > MAX_DAYS_BEFORE_QUOTE) {
    return {
      unit: 'on_quote',
      perUnitEur: null,
      totalEur: null,
      isQuote: true,
      quoteReason: 'too_many_days',
    };
  }

  // 4. > 30 convives → sur devis (event)
  if (guestCount > MAX_GUESTS_BEFORE_QUOTE) {
    return {
      unit: 'on_quote',
      perUnitEur: null,
      totalEur: null,
      isQuote: true,
      quoteReason: 'too_many_guests',
    };
  }

  const discount = TIER_DISCOUNT[tier ?? 'premium'] ?? 1;
  if (discount === null) {
    return {
      unit: 'on_quote',
      perUnitEur: null,
      totalEur: null,
      isQuote: true,
      quoteReason: 'tier_exception',
    };
  }

  // 5. Résidence/yacht ≥ 5 jours → forfait semaine
  const isLongStay =
    (missionCategory === 'residence' || missionCategory === 'yacht') &&
    days >= MIN_DAYS_FOR_WEEKLY;

  if (isLongStay) {
    // Choix half_board vs full_board selon mealplan
    const useFullBoard = mealPlan === 'full_time';
    const baseWeekly = useFullBoard
      ? WEEKLY_RATES_EUR.full_board
      : WEEKLY_RATES_EUR.half_board;

    const weeks = Math.max(1, Math.ceil(days / 7));
    const perWeek = Math.round(baseWeekly * discount);
    const total = perWeek * weeks;

    return {
      unit: 'per_week',
      perUnitEur: perWeek,
      totalEur: total,
      days,
      weeks,
      mealPlan,
      isQuote: false,
    };
  }

  // 6. One-off par jour (mission ponctuelle / remplacement / résidence < 5j)
  const dailyRate = computeDailyRateFromMealPlan(mealPlan);
  if (dailyRate === null) {
    // Mealplan manquant ou inconnu : on retourne quand même une estimation
    // basée sur "dinner" (le plus courant) avec quoteReason missing_data
    // pour signaler à l'UI que l'utilisateur n'a pas encore complété.
    const fallbackDaily = Math.round(ONE_OFF_RATES_EUR.dinner * discount);
    return {
      unit: 'per_day',
      perUnitEur: fallbackDaily,
      totalEur: fallbackDaily * days,
      days,
      isQuote: false,
      quoteReason: 'missing_data',
    };
  }

  const perDay = Math.round(dailyRate * discount);
  const total = perDay * days;

  return {
    unit: 'per_day',
    perUnitEur: perDay,
    totalEur: total,
    days,
    mealPlan,
    isQuote: false,
  };
}

// ============================================================
// Helpers
// ============================================================

function computeDailyRateFromMealPlan(mealPlan?: MealPlan): number | null {
  if (!mealPlan) return null;
  switch (mealPlan) {
    case 'breakfast':
      return ONE_OFF_RATES_EUR.breakfast;
    case 'lunch':
      return ONE_OFF_RATES_EUR.lunch;
    case 'dinner':
      return ONE_OFF_RATES_EUR.dinner;
    case 'breakfast_lunch':
      return ONE_OFF_RATES_EUR.breakfast + ONE_OFF_RATES_EUR.lunch;
    case 'lunch_dinner':
      return ONE_OFF_RATES_EUR.lunch + ONE_OFF_RATES_EUR.dinner;
    case 'full_time':
      return (
        ONE_OFF_RATES_EUR.breakfast +
        ONE_OFF_RATES_EUR.lunch +
        ONE_OFF_RATES_EUR.dinner
      );
    default:
      return null;
  }
}

/**
 * Formate un montant en € français (sans décimales).
 */
export function formatEur(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
