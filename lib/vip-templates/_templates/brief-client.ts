// lib/vip-templates/_templates/brief-client.ts
// Template VIP — Brief client en huit questions

import type { VipTemplate } from '../types';

export const briefClient: VipTemplate = {
  slug: 'brief-client',
  pillar: 'business',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Brief client en huit questions',
    excerpt:
      'Document imprimable à compléter pendant l’appel de pré-mission avec l’agent ou le client. Si plusieurs questions restent floues malgré vos relances, considérez le signal et ajustez votre tarif ou refusez la mission.',
    eyebrow: 'BRIEF — PRÉ-MISSION',
    body: [
      { kind: 'title', text: 'Brief client' },
      { kind: 'subtitle', text: 'Conversation de pré-mission' },
      { kind: 'spacer', mm: 5 },

      {
        kind: 'table',
        rows: [
          { label: 'Date du brief', value: '' },
          { label: 'Interlocuteur', value: '' },
          { label: 'Lieu de la mission', value: '' },
          { label: 'Dates de mission', value: '' },
        ],
      },
      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },

      {
        kind: 'section',
        number: 'I',
        text: 'Qui mange réellement ?',
      },
      {
        kind: 'p',
        text: 'Composition réelle de la tablée : adultes, enfants par tranche d’âge, invités tournants. Le client reçoit-il pendant le séjour ?',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      {
        kind: 'section',
        number: 'II',
        text: 'Contraintes médicales et religieuses',
      },
      {
        kind: 'p',
        text: 'Allergies sévères, intolérances, régimes médicaux suivis, casher, halal. Validation écrite obligatoire avant signature.',
      },
      { kind: 'fillLine', label: 'Liste détaillée', rows: 4 },
      { kind: 'spacer', mm: 4 },

      {
        kind: 'section',
        number: 'III',
        text: 'Rythme attendu',
      },
      {
        kind: 'p',
        text: 'Nombre de services par jour, horaires, dîner formel ou rythme variable. Heure tardive éventuelle des dîners.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      {
        kind: 'section',
        number: 'IV',
        text: 'Cuisine et équipement',
      },
      {
        kind: 'p',
        text: 'Photos demandées : piano, four, chambre froide, garde-manger, plonge. Vérifier capacité de stockage froid et zones de cuisson en parallèle.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      {
        kind: 'section',
        number: 'V',
        text: 'Équipe sur place',
      },
      {
        kind: 'p',
        text: 'Commis, plongeur, service en salle, house manager, stewardess. Qui décide quoi. À qui rapporte le chef au quotidien.',
      },
      { kind: 'fillLine', label: 'Liste prénoms et rôles', rows: 4 },
      { kind: 'spacer', mm: 4 },

      {
        kind: 'section',
        number: 'VI',
        text: 'Budget courses et chaîne d’approvisionnement',
      },
      {
        kind: 'p',
        text: 'Budget par semaine. Qui paie, comment, quel circuit administratif. Fournisseurs en place ou liberté du chef. Repas équipage : inclus ou enveloppe dédiée.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 4 },
      { kind: 'spacer', mm: 4 },

      {
        kind: 'section',
        number: 'VII',
        text: 'Usages de la maison',
      },
      {
        kind: 'p',
        text: 'Le client mange à table avec ses invités ou à part. Présence du chef pour la présentation des plats. Tabous spécifiques.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      {
        kind: 'section',
        number: 'VIII',
        text: 'Sortie de mission',
      },
      {
        kind: 'p',
        text: 'Conditions de fin, solde à régler, retenue éventuelle, prolongation, raccourcissement. Délais et modalités du paiement final.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'Si plusieurs questions restent floues malgré vos relances, vous tenez probablement un dossier mal cadré côté client. Tarifez le travail supplémentaire dans votre forfait, ou passez la mission.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Document interne. Conservez-le pour mémoire jusqu’à la signature du contrat, puis archivez avec le dossier de mission.',
      },
    ],
  },

  en: {
    title: 'Client brief in eight questions',
    excerpt:
      'Printable document to fill during the pre-mission call with the agent or client. If several questions remain vague despite your reminders, treat it as a signal and adjust your rate or decline the mission.',
    eyebrow: 'BRIEF — PRE-MISSION',
    body: [
      { kind: 'title', text: 'Client brief' },
      { kind: 'subtitle', text: 'Pre-mission conversation' },
      { kind: 'spacer', mm: 5 },

      {
        kind: 'table',
        rows: [
          { label: 'Brief date', value: '' },
          { label: 'Counterpart', value: '' },
          { label: 'Mission location', value: '' },
          { label: 'Mission dates', value: '' },
        ],
      },
      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'I', text: 'Who actually eats?' },
      {
        kind: 'p',
        text: 'Real table composition: adults, children by age bracket, rotating guests. Does the client receive guests during the stay?',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'II', text: 'Medical and religious constraints' },
      {
        kind: 'p',
        text: 'Severe allergies, intolerances, supervised medical diets, kosher, halal. Written validation mandatory before signature.',
      },
      { kind: 'fillLine', label: 'Detailed list', rows: 4 },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'III', text: 'Expected pace' },
      {
        kind: 'p',
        text: 'Number of services per day, schedule, formal dinner or variable rhythm. Possible late dinner hour.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'IV', text: 'Kitchen and equipment' },
      {
        kind: 'p',
        text: 'Photos requested: range, oven, cold room, pantry, dishwashing. Check cold storage capacity and parallel cooking zones.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'V', text: 'Team on site' },
      {
        kind: 'p',
        text: 'Commis, dishwasher, dining room service, house manager, stewardess. Who decides what. To whom does the chef report day to day.',
      },
      { kind: 'fillLine', label: 'First names and roles list', rows: 4 },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VI', text: 'Grocery budget and supply chain' },
      {
        kind: 'p',
        text: 'Weekly budget. Who pays, how, administrative channel. Existing suppliers or chef freedom. Crew meals: included or dedicated envelope.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 4 },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VII', text: 'Customs of the house' },
      {
        kind: 'p',
        text: 'Client eats at the table with guests or separately. Chef presence for plating. Specific taboos.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VIII', text: 'End of mission' },
      {
        kind: 'p',
        text: 'Closing conditions, balance, retention, extension, shortening. Final payment timeframe and method.',
      },
      { kind: 'fillLine', label: 'Notes', rows: 3 },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'If several questions remain vague despite your reminders, you likely face a poorly framed file on the client side. Price the extra work into your package, or pass the mission.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Internal document. Keep it for record until contract signing, then archive with the mission file.',
      },
    ],
  },
};
