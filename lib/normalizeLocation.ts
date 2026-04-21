// lib/normalizeLocation.ts
//
// Normalise les baseCity des chefs pour le matching avec les destinations des demandes.
// Problèmes détectés sur vos données réelles :
//   - Variantes orthographiques (St.Tropez / Saint Tropez / SAINT TROPEZ)
//   - Villes multiples dans un champ ("Cannes / Monaco / Saint Tropez")
//   - Phrases complètes ("Résidente parisienne intra muros mais j'ai le goût...")
//   - Noms anglais/étrangers (Dubai / Dubaï, Barcelona / Barcelone)
//   - Valeurs vides ou génériques ("Europe", "")

// ─────────────────────────────────────────────
// TABLE DE NORMALISATION
// Clé = variante → Valeur = nom canonique
// ─────────────────────────────────────────────
const CITY_ALIASES: Record<string, string> = {
  // Saint-Tropez
  'saint tropez': 'Saint-Tropez',
  'saint-tropez': 'Saint-Tropez',
  'st tropez': 'Saint-Tropez',
  'st.tropez': 'Saint-Tropez',
  'st-tropez': 'Saint-Tropez',
  'saint-tropez, var': 'Saint-Tropez',

  // Côte d'Azur
  'nice': 'Nice',
  'NICE': 'Nice',
  'cannes': 'Cannes',
  'antibes': 'Antibes',
  'monaco': 'Monaco',
  'eze': 'Èze',
  'èze': 'Èze',
  'menton': 'Menton',
  'villefranche': 'Villefranche-sur-Mer',
  'villefranche sur mer': 'Villefranche-sur-Mer',
  'beaulieu': 'Beaulieu-sur-Mer',
  'cagnes sur mer': 'Cagnes-sur-Mer',
  'cagnes-sur-mer': 'Cagnes-sur-Mer',
  'grasse': 'Grasse',
  'mougins': 'Mougins',
  'frejus': 'Fréjus',
  'les issambres': 'Les Issambres',
  'la napoule': 'La Napoule',
  'theoulé': 'Théoule-sur-Mer',
  'forcalqueiret': 'Forcalqueiret',

  // Alpes
  'courchevel': 'Courchevel',
  'megeve': 'Megève',
  'megève': 'Megève',
  'val d isere': "Val d'Isère",
  "val d'isère": "Val d'Isère",
  'meribel': 'Méribel',
  'méribel': 'Méribel',
  'annecy': 'Annecy',
  'chamonix': 'Chamonix',
  'frejus et annecy': 'Fréjus',

  // Provence
  'aix en provence': 'Aix-en-Provence',
  'aix-en-provence': 'Aix-en-Provence',
  'marseille': 'Marseille',
  'la ciotat': 'La Ciotat',
  'cassis': 'Cassis',
  'avignon': 'Avignon',
  'arles': 'Arles',
  'nimes': 'Nîmes',
  'nîmes': 'Nîmes',
  'montpellier': 'Montpellier',
  'carpentras': 'Carpentras',
  'toulon': 'Toulon',
  'pont saint esprit': 'Pont-Saint-Esprit',

  // Atlantique
  'bordeaux': 'Bordeaux',
  'lège cap ferret': 'Cap Ferret',
  'cap ferret': 'Cap Ferret',
  'biarritz': 'Biarritz',
  'la baule': 'La Baule',
  'saint julien en born': 'Saint-Julien-en-Born',
  'bergerac': 'Bordeaux', // région

  // Bretagne / Normandie
  'rennes': 'Rennes',
  'angers': 'Angers',

  // Paris / Ile-de-France
  'paris': 'Paris',
  'paris, france': 'Paris',
  'asnières sur seine': 'Paris',
  'asnières-sur-seine': 'Paris',

  // Autres France
  'lyon': 'Lyon',
  'lille': 'Lille',
  'pau': 'Pau',
  'pau, france': 'Pau',
  'toulouse': 'Toulouse',
  'genève': 'Genève',
  'geneve': 'Genève',
  'luxembourg': 'Luxembourg',

  // Espagne
  'ibiza': 'Ibiza',
  'barcelona': 'Barcelone',
  'barcelone': 'Barcelone',
  'marbella': 'Marbella',
  'puerto banus': 'Puerto Banús',

  // Italie
  'porto cervo': 'Porto Cervo',

  // International
  'dubai': 'Dubaï',
  'dubaï': 'Dubaï',
  'miami': 'Miami',
  'montreal': 'Montréal',
  'montréal': 'Montréal',
  'hamburg': 'Hambourg',

  // DOM-TOM
  'saint françois guadeloupe': 'Guadeloupe',
  'banyuls-sur-mer': 'Banyuls-sur-Mer',
};

// Valeurs à ignorer — trop génériques ou pas des villes
const IGNORE_VALUES = new Set([
  'europe',
  'france',
  'world',
  'international',
  'partout',
  'anywhere',
  '',
]);

/**
 * Extrait la première ville valide d'un champ baseCity
 * qui peut contenir plusieurs villes séparées par / , ou du texte libre.
 */
export function extractPrimaryCity(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const s = raw.trim();
  if (!s) return null;

  // Si c'est une phrase longue (>40 chars sans séparateurs = bio), on ignore
  const hasNoSeparator = !s.includes('/') && !s.includes(',') && !s.includes('|');
  if (hasNoSeparator && s.length > 40) return null;

  // Séparer sur / , | et prendre la première partie
  const parts = s.split(/[\/,|]/).map(p => p.trim()).filter(Boolean);
  const first = parts[0];

  if (!first || first.length > 50) return null;

  return first;
}

/**
 * Normalise une ville vers son nom canonique.
 * Retourne null si la valeur est invalide ou trop générique.
 */
export function normalizeCity(raw: string | null | undefined): string | null {
  const primary = extractPrimaryCity(raw);
  if (!primary) return null;

  const lower = primary.toLowerCase().trim();

  if (IGNORE_VALUES.has(lower)) return null;

  // Cherche dans les alias
  const alias = CITY_ALIASES[lower];
  if (alias) return alias;

  // Cherche avec normalisation accent-insensitive
  const normalized = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [key, value] of Object.entries(CITY_ALIASES)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (keyNorm === normalized) return value;
  }

  // Si pas d'alias, retourne la version capitalisée proprement
  return primary
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extrait toutes les villes valides d'un champ multi-villes.
 * Ex: "Cannes / Monaco / Saint Tropez" → ["Cannes", "Monaco", "Saint-Tropez"]
 */
export function extractAllCities(raw: string | null | undefined): string[] {
  if (!raw) return [];

  const parts = raw.split(/[\/,|]/).map(p => p.trim()).filter(Boolean);
  const cities: string[] = [];

  for (const part of parts) {
    if (part.length > 50) continue; // phrase, pas une ville
    const normalized = normalizeCity(part);
    if (normalized && !cities.includes(normalized)) {
      cities.push(normalized);
    }
  }

  return cities;
}

/**
 * Vérifie si un chef est basé dans (ou mobile vers) une destination donnée.
 * Utilisé dans le matching pour élargir les résultats.
 */
export function chefCoversDestination(
  chefBaseCity: string | null | undefined,
  chefMobile: boolean | null | undefined,
  destination: string | null | undefined
): boolean {
  if (!destination) return true; // pas de filtre géo

  const destNorm = normalizeCity(destination)?.toLowerCase();
  if (!destNorm) return true;

  // Chef mobile international → couvre tout
  if (chefMobile === true) return true;

  if (!chefBaseCity) return false;

  const chefCities = extractAllCities(chefBaseCity).map(c => c.toLowerCase());
  const chefPrimary = normalizeCity(chefBaseCity)?.toLowerCase();

  // Match exact ou partiel
  for (const city of [...chefCities, chefPrimary].filter(Boolean) as string[]) {
    if (city === destNorm) return true;
    if (city.includes(destNorm) || destNorm.includes(city)) return true;
  }

  // Matching par région — même département/zone
  const REGION_GROUPS: Record<string, string[]> = {
    'côte d\'azur': ['nice', 'cannes', 'antibes', 'saint-tropez', 'monaco', 'cap ferrat', 'villefranche-sur-mer', 'beaulieu-sur-mer', 'èze', 'menton', 'cagnes-sur-mer', 'mougins', 'grasse', 'fréjus', 'les issambres', 'théoule-sur-mer', 'ramatuelle', 'gassin'],
    'alpes': ['courchevel', 'megève', "val d'isère", 'méribel', 'chamonix', 'annecy', 'tignes', 'les arcs'],
    'provence': ['aix-en-provence', 'marseille', 'la ciotat', 'cassis', 'avignon', 'arles', 'toulon', 'bandol'],
    'bordeaux': ['bordeaux', 'cap ferret', 'arcachon', 'pyla-sur-mer', 'saint-julien-en-born'],
    'ibiza': ['ibiza', 'formentera'],
    'paris': ['paris', 'versailles'],
  };

  for (const [, cities] of Object.entries(REGION_GROUPS)) {
    if (cities.includes(destNorm) && cities.some(c => chefCities.includes(c) || chefPrimary === c)) {
      return true;
    }
  }

  return false;
}

/**
 * Score de proximité géographique 0-100 entre le chef et la destination.
 * Utilisé pour booster le fitScore dans le matching.
 */
export function geoProximityScore(
  chefBaseCity: string | null | undefined,
  chefMobile: boolean | null | undefined,
  destination: string | null | undefined
): number {
  if (!destination) return 50; // neutre si pas de destination
  if (chefMobile === true) return 70; // mobile = bon mais pas parfait

  if (!chefBaseCity) return 0;

  const destNorm = normalizeCity(destination)?.toLowerCase();
  const chefNorm = normalizeCity(chefBaseCity)?.toLowerCase();
  const chefCities = extractAllCities(chefBaseCity).map(c => c.toLowerCase());

  if (!destNorm || !chefNorm) return 20;

  // Match exact ville principale
  if (chefNorm === destNorm) return 100;

  // La destination est listée parmi les villes du chef
  if (chefCities.includes(destNorm)) return 95;

  // Même région
  const REGION_GROUPS: Record<string, string[]> = {
    'côte d\'azur': ['nice', 'cannes', 'antibes', 'saint-tropez', 'monaco', 'cap ferrat', 'villefranche-sur-mer', 'beaulieu-sur-mer', 'èze', 'menton', 'cagnes-sur-mer', 'mougins', 'grasse', 'fréjus', 'ramatuelle'],
    'alpes': ['courchevel', 'megève', "val d'isère", 'méribel', 'chamonix', 'annecy'],
    'provence': ['aix-en-provence', 'marseille', 'cassis', 'toulon', 'avignon'],
    'bordeaux': ['bordeaux', 'cap ferret', 'arcachon', 'pyla-sur-mer'],
    'ibiza': ['ibiza', 'formentera'],
    'paris': ['paris'],
  };

  for (const [, cities] of Object.entries(REGION_GROUPS)) {
    const chefInRegion = cities.includes(chefNorm) || chefCities.some(c => cities.includes(c));
    const destInRegion = cities.includes(destNorm);
    if (chefInRegion && destInRegion) return 80;
  }

  return 20; // pas de lien géographique
}
