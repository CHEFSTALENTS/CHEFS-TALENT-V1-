// lib/vip-templates/_templates/devis-mission-saisonniere.ts
// Template VIP — Devis pour mission saisonnière

import type { VipTemplate } from '../types';

export const devisMissionSaisonniere: VipTemplate = {
  slug: 'devis-mission-saisonniere',
  pillar: 'business',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Devis pour mission saisonnière',
    excerpt:
      'Le format de devis quatre lignes qui se défend face à un agent et qui se signe sans rediscuter le tarif. À personnaliser puis à imprimer ou à enregistrer en PDF.',
    eyebrow: 'DEVIS — MISSION SAISONNIÈRE',
    body: [
      { kind: 'title', text: 'Mission privée saisonnière' },
      { kind: 'subtitle', text: 'Proposition tarifaire' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 8 },

      { kind: 'section', number: 'I', text: 'Parties' },
      {
        kind: 'table',
        rows: [
          { label: 'Le chef', value: '' },
          { label: 'Le client (ou son représentant)', value: '' },
          { label: 'Lieu de la mission', value: '' },
          { label: 'Période (du / au)', value: '' },
        ],
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'II', text: 'Périmètre de la prestation' },
      {
        kind: 'p',
        text: 'Le chef assure la conception et l’exécution des repas pour le compte du client, dans la résidence indiquée ci-dessus, selon les modalités précisées ci-après.',
      },
      {
        kind: 'list',
        style: 'dash',
        items: [
          'Nombre de repas par jour : à préciser (petit-déjeuner / déjeuner / dîner)',
          'Nombre de couverts moyens par service : à préciser',
          'Type de cuisine : signature du chef',
          'Jours travaillés : six jours sur sept, un jour de repos hebdomadaire',
          'Gestion du fonds courses par le chef ou par la résidence : à préciser',
          'Service ou présence aux dîners d’invités : inclus / sur supplément',
        ],
      },
      {
        kind: 'note',
        text: 'Tout service ou prestation hors périmètre fera l’objet d’un devis complémentaire validé par écrit avant exécution.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'III', text: 'Tarification' },
      {
        kind: 'table',
        rows: [
          { label: 'Salaire chef (net par jour)', value: '' },
          { label: 'Per diem (par jour)', value: '' },
          { label: 'Forfait préparation et déplacement', value: '' },
          { label: 'Fonds courses (provision hebdomadaire)', value: '' },
          { label: 'Total forfaitaire HT', value: '' },
          { label: 'TVA applicable', value: '' },
          { label: 'Total TTC', value: '' },
        ],
      },
      {
        kind: 'note',
        text: 'Le fonds courses est géré séparément avec un récapitulatif hebdomadaire transmis le dimanche soir, tickets photographiés à l’appui. Aucun frais courses n’est avancé sur le compte personnel du chef.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'IV', text: 'Calendrier de paiement' },
      {
        kind: 'list',
        style: 'roman',
        items: [
          'Acompte de 35 % à la signature du présent devis, conditionnant le démarrage de la mission.',
          'Paiement intermédiaire de 35 % au quinzième jour de mission, sur présentation de facture.',
          'Solde de 30 % dans les sept jours suivant la fin de mission, sur présentation de facture finale.',
        ],
      },
      {
        kind: 'p',
        text: 'Tout retard de paiement supérieur à quinze jours sur l’une des échéances entraîne la suspension immédiate de la prestation, sans préjudice des sommes dues. Pénalités de retard au taux légal en vigueur.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'V', text: 'Conditions complémentaires' },
      {
        kind: 'list',
        style: 'dash',
        items: [
          'Hébergement et repas du chef pris en charge par le client pendant toute la durée de la mission.',
          'Transport aller-retour pris en charge par le client (classe affaires si destination internationale au-delà de quatre semaines).',
          'Confidentialité absolue sur l’identité du client, le contenu des repas et l’organisation de la résidence.',
          'Assurance responsabilité civile professionnelle du chef en cours de validité, justificatifs disponibles sur demande.',
        ],
      },
      { kind: 'spacer', mm: 8 },

      { kind: 'rule' },
      { kind: 'spacer', mm: 6 },
      {
        kind: 'signatureDouble',
        leftLabel: 'Le chef',
        rightLabel: 'Le client',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Document à compléter avant envoi. La signature des deux parties vaut acceptation des conditions de la présente proposition.',
      },
    ],
  },

  en: {
    title: 'Seasonal mission quote',
    excerpt:
      'The four-line quote format that holds up against an agent and gets signed without rediscussion of the rate. Customise, then print or save as PDF.',
    eyebrow: 'QUOTE — SEASONAL MISSION',
    body: [
      { kind: 'title', text: 'Private seasonal mission' },
      { kind: 'subtitle', text: 'Pricing proposal' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 8 },

      { kind: 'section', number: 'I', text: 'Parties' },
      {
        kind: 'table',
        rows: [
          { label: 'The chef', value: '' },
          { label: 'The client (or their representative)', value: '' },
          { label: 'Mission location', value: '' },
          { label: 'Period (from / to)', value: '' },
        ],
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'II', text: 'Scope of service' },
      {
        kind: 'p',
        text: 'The chef provides the conception and execution of meals on behalf of the client, at the residence indicated above, in accordance with the terms set out below.',
      },
      {
        kind: 'list',
        style: 'dash',
        items: [
          'Meals per day: to specify (breakfast / lunch / dinner)',
          'Average covers per service: to specify',
          'Cuisine: chef’s signature',
          'Working days: six days a week, one weekly rest day',
          'Grocery fund managed by chef or by residence: to specify',
          'Service or presence at guest dinners: included / supplement',
        ],
      },
      {
        kind: 'note',
        text: 'Any service outside the scope will be subject to a complementary quote validated in writing before execution.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'III', text: 'Pricing' },
      {
        kind: 'table',
        rows: [
          { label: 'Chef salary (net per day)', value: '' },
          { label: 'Per diem (per day)', value: '' },
          { label: 'Preparation and travel fee', value: '' },
          { label: 'Grocery fund (weekly provision)', value: '' },
          { label: 'Total package excl. tax', value: '' },
          { label: 'Applicable VAT', value: '' },
          { label: 'Total incl. tax', value: '' },
        ],
      },
      {
        kind: 'note',
        text: 'The grocery fund is tracked separately with a weekly recap sent on Sunday evening, with photographed receipts. No grocery expenses are fronted from the chef’s personal account.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'IV', text: 'Payment schedule' },
      {
        kind: 'list',
        style: 'roman',
        items: [
          '35% deposit at signature of this quote, conditioning the start of the mission.',
          '35% interim payment on the fifteenth day of mission, against invoice.',
          '30% balance within seven days following the end of mission, against final invoice.',
        ],
      },
      {
        kind: 'p',
        text: 'Any payment delay exceeding fifteen days on any instalment triggers immediate suspension of the service, without prejudice to the sums due. Late payment penalties at the applicable statutory rate.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'section', number: 'V', text: 'Complementary conditions' },
      {
        kind: 'list',
        style: 'dash',
        items: [
          'Chef’s accommodation and meals provided by the client for the duration of the mission.',
          'Round-trip travel covered by the client (business class if international beyond four weeks).',
          'Absolute confidentiality on client identity, meal content, and residence organisation.',
          'Chef’s professional civil liability insurance in force, certificates available on request.',
        ],
      },
      { kind: 'spacer', mm: 8 },

      { kind: 'rule' },
      { kind: 'spacer', mm: 6 },
      {
        kind: 'signatureDouble',
        leftLabel: 'The chef',
        rightLabel: 'The client',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Document to be completed before sending. Signature of both parties constitutes acceptance of the terms of this proposal.',
      },
    ],
  },
};
