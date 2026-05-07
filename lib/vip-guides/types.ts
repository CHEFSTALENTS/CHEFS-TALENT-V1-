// lib/vip-guides/types.ts
// Types pour les guides VIP. Chaque guide est un objet TS bilingue (FR/EN).

export type GuideLocale = 'fr' | 'en';

/** Bloc de contenu d'un guide. Le rendu mappe chaque kind vers un composant. */
export type GuideBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'callout'; text: string; tone?: 'note' | 'warning' | 'success' }
  | { kind: 'quote'; text: string; cite?: string };

export type GuideTranslation = {
  title: string;
  excerpt: string;
  body: GuideBlock[];
};

/** Les 4 piliers du programme VIP : les 4 dimensions du métier de chef privé. */
export type Pillar = 'metier' | 'business' | 'marque' | 'humain';

export type Guide = {
  slug: string;
  /** Chemin sous /public, ex: /images/email/villa-service.jpg */
  heroImage: string;
  /** Temps de lecture estimé en minutes (affiché en méta). */
  readingMinutes: number;
  /** Pilier auquel le guide se rattache (affiché en méta). */
  pillar: Pillar;
  /** Date de publication ISO (affichée en méta). */
  publishedAt: string;
  fr: GuideTranslation;
  en: GuideTranslation;
};

export const PILLAR_LABELS: Record<Pillar, Record<GuideLocale, string>> = {
  metier: { fr: 'Le métier', en: 'The craft' },
  business: { fr: 'Le business', en: 'Business' },
  marque: { fr: 'La marque', en: 'Brand' },
  humain: { fr: 'L’humain', en: 'People' },
};

/** Ordre canonique des piliers utilisé dans toute l’UI. */
export const PILLAR_ORDER: Pillar[] = ['metier', 'business', 'marque', 'humain'];
