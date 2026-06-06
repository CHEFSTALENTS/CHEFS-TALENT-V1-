// lib/quotes/margin.ts
//
// Utilitaires de calcul de marge pour les devis.
// JAMAIS exporté côté template PDF — uniquement côté admin pour piloter
// la rentabilité avant d'envoyer un devis au client.

export type CostInputs = {
  chefCostEur?: number | null;
  chefTravelCostEur?: number | null;
  butlerRequired?: boolean;
  butlerCostEur?: number | null;
};

export type MarginBreakdown = {
  totalCostsEur: number;          // somme des coûts internes
  chefCostEur: number;
  chefTravelCostEur: number;
  butlerCostEur: number;
};

/**
 * Somme des coûts internes pour une mission.
 * butler_cost n'est compté que si butler_required=true (cohérence UI).
 */
export function computeTotalCosts(c: CostInputs): MarginBreakdown {
  const chefCost = Number(c.chefCostEur || 0);
  const chefTravel = Number(c.chefTravelCostEur || 0);
  const butler = c.butlerRequired ? Number(c.butlerCostEur || 0) : 0;
  return {
    chefCostEur: chefCost,
    chefTravelCostEur: chefTravel,
    butlerCostEur: butler,
    totalCostsEur: chefCost + chefTravel + butler,
  };
}

export type TariffMargin = {
  label: string;                  // 'Profil Junior', etc.
  htEur: number;                  // prix HT vendu au client
  costEur: number;                // coût interne (chef + déplacement + butler)
  marginEur: number;              // HT - costs
  marginPct: number | null;       // marge / HT × 100 (null si HT=0)
};

/**
 * Calcule la marge pour chaque option tarifaire d'un devis.
 * On compare HT vendu (ht_eur de chaque option) au coût interne total.
 */
export function computeMarginsPerOption(
  tariffOptions: Array<{ label: string; ht_eur: number }>,
  costs: CostInputs,
): TariffMargin[] {
  const breakdown = computeTotalCosts(costs);
  return tariffOptions.map((t) => {
    const ht = Number(t.ht_eur || 0);
    const marginEur = ht - breakdown.totalCostsEur;
    const marginPct = ht > 0 ? Math.round((marginEur / ht) * 100 * 10) / 10 : null;
    return {
      label: t.label,
      htEur: ht,
      costEur: breakdown.totalCostsEur,
      marginEur,
      marginPct,
    };
  });
}

/**
 * Style de marge pour affichage UI :
 *   > 40% : très bonne marge (vert)
 *   25-40% : bonne marge (sky)
 *   10-25% : marge moyenne (amber)
 *   < 10% : faible / risquée (rouge)
 *   < 0 : perte (rouge bold)
 */
export function getMarginTone(marginPct: number | null): 'great' | 'good' | 'ok' | 'low' | 'loss' | 'unknown' {
  if (marginPct === null) return 'unknown';
  if (marginPct < 0) return 'loss';
  if (marginPct < 10) return 'low';
  if (marginPct < 25) return 'ok';
  if (marginPct < 40) return 'good';
  return 'great';
}

export function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}
