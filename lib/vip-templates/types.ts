// lib/vip-templates/types.ts
// Types pour les templates téléchargeables VIP.
// Format A4 imprimable, design papier ivoire + accent burgundy.

import type { Pillar } from '@/lib/vip-guides';

export type TemplateLocale = 'fr' | 'en';

/**
 * Bloc de contenu d'un template imprimable. Le rendu mappe chaque kind vers
 * un composant en respectant la grille typographique stricte (display serif,
 * body sans-serif, accent burgundy ponctuel).
 */
export type TemplateBlock =
  /** Sur-titre en petites capitales espacées, gris. Ex: "MISSION SAISONNIÈRE" */
  | { kind: 'eyebrow'; text: string }
  /** Titre principal du document, display serif large. */
  | { kind: 'title'; text: string }
  /** Sous-titre / phrase de positionnement, italique discret. */
  | { kind: 'subtitle'; text: string }
  /** Section, titre numéroté ("I", "II", "III") ou nominal court. */
  | { kind: 'section'; number?: string; text: string }
  /** Paragraphe de corps, justifié, body sans-serif. */
  | { kind: 'p'; text: string }
  /** Liste à puces (chiffres romains ou tirets fins). */
  | { kind: 'list'; style?: 'roman' | 'dash' | 'plain'; items: string[] }
  /** Filet horizontal fin pleine largeur. */
  | { kind: 'rule' }
  /** Espacement vertical, en mm. */
  | { kind: 'spacer'; mm?: number }
  /**
   * Tableau d'informations (label / valeur ou champ vide à remplir).
   * `value` vide = ligne pointillée à compléter à la main.
   */
  | { kind: 'table'; rows: { label: string; value?: string }[] }
  /** Champ à remplir : ligne soulignée avec label en sur-titre. */
  | { kind: 'fillLine'; label: string; hint?: string; rows?: number }
  /** Encadré de note, fond ivoire plus chaud, accent burgundy en marge. */
  | { kind: 'note'; text: string }
  /** Bloc de signature : nom + date + lieu sur une ligne. */
  | { kind: 'signature'; partyLabel: string }
  /** Bloc 2-colonnes signature (Le chef / Le client). */
  | { kind: 'signatureDouble'; leftLabel: string; rightLabel: string }
  /** Pied de page court, italique, gris. */
  | { kind: 'footnote'; text: string };

export type TemplateTranslation = {
  title: string;
  excerpt: string;
  /** Sur-titre éditorial qui apparaît en haut de la page imprimée. */
  eyebrow: string;
  body: TemplateBlock[];
};

export type VipTemplate = {
  slug: string;
  /** Pilier de rattachement (sert au tri dans la liste). */
  pillar: Pillar;
  /** Date de publication ISO. */
  publishedAt: string;
  fr: TemplateTranslation;
  en: TemplateTranslation;
};
