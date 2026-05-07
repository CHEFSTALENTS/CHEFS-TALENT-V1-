// lib/vip-templates/_templates/fiche-fournisseur.ts
// Template VIP — Fiche fournisseur destination

import type { VipTemplate } from '../types';

export const ficheFournisseur: VipTemplate = {
  slug: 'fiche-fournisseur',
  pillar: 'metier',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Fiche fournisseur destination',
    excerpt:
      'Une fiche par fournisseur, capitalisable d’une saison à l’autre. Tient sur une page A4. Imprimez-en une dizaine au début de chaque saison sur les destinations que vous travaillez.',
    eyebrow: 'FOURNISSEURS — CARNET',
    body: [
      { kind: 'title', text: 'Fiche fournisseur' },
      { kind: 'subtitle', text: 'Identification et qualification' },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'table',
        rows: [
          { label: 'Destination', value: '' },
          { label: 'Catégorie (primeur, poissonnerie, fromager, viande, vins…)', value: '' },
          { label: 'Nom de l’établissement', value: '' },
          { label: 'Adresse', value: '' },
          { label: 'Contact principal (prénom, fonction)', value: '' },
          { label: 'Téléphone', value: '' },
          { label: 'Email ou WhatsApp', value: '' },
          { label: 'Recommandé par', value: '' },
        ],
      },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'I', text: 'Qualification (cinq questions)' },
      {
        kind: 'list',
        style: 'roman',
        items: [
          'Travaillez-vous avec des hôtels haut de gamme ou des résidences privées dans la zone ? Lesquels.',
          'Jours et horaires de livraison. Heure de coupure pour les commandes du lendemain.',
          'Minimum de commande standard. Minimum spécifique pour livraison sur résidence.',
          'Mode de règlement : avance, virement à 30 jours, carte à la livraison.',
          'Interlocuteur unique pour la saison ou plusieurs personnes selon les produits.',
        ],
      },
      { kind: 'fillLine', label: 'Réponses synthétiques', rows: 6 },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'II', text: 'Produits et prix repères' },
      {
        kind: 'table',
        rows: [
          { label: 'Spécialités principales', value: '' },
          { label: 'Produits saisonniers travaillés', value: '' },
          { label: 'Prix repère 1 (avec date)', value: '' },
          { label: 'Prix repère 2 (avec date)', value: '' },
          { label: 'Prix repère 3 (avec date)', value: '' },
        ],
      },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'III', text: 'Notes opérationnelles' },
      {
        kind: 'p',
        text: 'Qualité observée sur la saison. Régularité de livraison. Souplesse en cas de demande de dernière minute. Capacité à livrer un produit rare. Particularités à mémoriser.',
      },
      { kind: 'fillLine', label: 'Observations', rows: 5 },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'IV', text: 'Saison suivante' },
      {
        kind: 'list',
        style: 'dash',
        items: [
          'Reprendre contact en _____________ avec un message court de retour.',
          'Vérifier disponibilité du produit __________________ pour la fenêtre __________.',
          'Renégocier le minimum de commande à ____________ €.',
          'Confirmer maintien de l’interlocuteur principal.',
        ],
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'Une catégorie deux contacts. Le premier est votre fournisseur principal, le second votre solution de secours quand le premier vous lâche un dimanche matin.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Document à conserver dans votre carnet de saison. Met à jour à chaque livraison ou retour de mission.',
      },
    ],
  },

  en: {
    title: 'Destination supplier sheet',
    excerpt:
      'One sheet per supplier, capitalised season after season. Fits on one A4 page. Print about ten at the start of each season for the destinations you work.',
    eyebrow: 'SUPPLIERS — LOGBOOK',
    body: [
      { kind: 'title', text: 'Supplier sheet' },
      { kind: 'subtitle', text: 'Identification and qualification' },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'table',
        rows: [
          { label: 'Destination', value: '' },
          { label: 'Category (greengrocer, fishmonger, cheese, meat, wines…)', value: '' },
          { label: 'Business name', value: '' },
          { label: 'Address', value: '' },
          { label: 'Main contact (first name, role)', value: '' },
          { label: 'Phone', value: '' },
          { label: 'Email or WhatsApp', value: '' },
          { label: 'Recommended by', value: '' },
        ],
      },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'I', text: 'Qualification (five questions)' },
      {
        kind: 'list',
        style: 'roman',
        items: [
          'Do you work with high-end hotels or private residences in the area? Which ones.',
          'Delivery days and hours. Cut-off time for next-day orders.',
          'Standard order minimum. Specific minimum for residence delivery.',
          'Payment method: advance, 30-day wire, card on delivery.',
          'Single seasonal contact or several people depending on products.',
        ],
      },
      { kind: 'fillLine', label: 'Synthetic answers', rows: 6 },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'II', text: 'Products and reference prices' },
      {
        kind: 'table',
        rows: [
          { label: 'Main specialities', value: '' },
          { label: 'Seasonal products worked', value: '' },
          { label: 'Reference price 1 (with date)', value: '' },
          { label: 'Reference price 2 (with date)', value: '' },
          { label: 'Reference price 3 (with date)', value: '' },
        ],
      },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'III', text: 'Operational notes' },
      {
        kind: 'p',
        text: 'Observed quality across the season. Delivery regularity. Flexibility on last-minute requests. Ability to source a rare product. Particularities to remember.',
      },
      { kind: 'fillLine', label: 'Observations', rows: 5 },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'IV', text: 'Next season' },
      {
        kind: 'list',
        style: 'dash',
        items: [
          'Reach back in _____________ with a short return message.',
          'Check availability of __________________ for the window __________.',
          'Renegotiate order minimum to ____________ €.',
          'Confirm main contact remains.',
        ],
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'One category, two contacts. The first is your main supplier, the second your fallback when the first lets you down on a Sunday morning.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Document to keep in your seasonal logbook. Update on each delivery or end-of-mission review.',
      },
    ],
  },
};
