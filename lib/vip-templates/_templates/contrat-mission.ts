// lib/vip-templates/_templates/contrat-mission.ts
// Template VIP — Contrat chef privé (base à personnaliser, ne remplace pas un avocat)

import type { VipTemplate } from '../types';

export const contratMission: VipTemplate = {
  slug: 'contrat-mission',
  pillar: 'business',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Contrat de mission chef privé',
    excerpt:
      'Base contractuelle structurée autour des sept clauses qui protègent vraiment. À personnaliser puis à faire valider par un avocat sur la première version, ensuite réutilisable.',
    eyebrow: 'CONTRAT — MISSION CHEF PRIVÉ',
    body: [
      { kind: 'title', text: 'Contrat de mission' },
      { kind: 'subtitle', text: 'Prestation de chef privé saisonnier' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', text: 'Entre les soussignés' },
      {
        kind: 'table',
        rows: [
          { label: 'Le chef (prénom, nom, statut, SIRET, adresse)', value: '' },
          { label: 'Le client (nom, adresse, représentant)', value: '' },
        ],
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'p',
        text: 'Il a été convenu et arrêté ce qui suit, dans le cadre d’une mission de chef privé pour la période et le lieu indiqués ci-après.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'I', text: 'Périmètre de la prestation' },
      {
        kind: 'p',
        text: 'Le chef assure la conception et l’exécution des repas pour le compte du client, à l’adresse [lieu], du [date début] au [date fin]. La prestation comprend [nombre] repas par jour, sur la base de [nombre moyen] couverts. Tout service ou prestation hors périmètre fera l’objet d’un avenant écrit validé par les deux parties avant exécution.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'II', text: 'Calendrier de paiement' },
      {
        kind: 'p',
        text: 'Le forfait total de la mission s’élève à [montant] € net. Le règlement intervient en trois temps : 35 % à la signature du présent contrat, 35 % au quinzième jour de mission sur présentation de facture, 30 % dans les sept jours suivant la fin de mission sur présentation de facture finale. Le retard de paiement de plus de quinze jours sur l’une des échéances entraîne la suspension immédiate de la prestation, sans préjudice des sommes dues. Pénalités de retard au taux légal en vigueur.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'III', text: 'Rupture anticipée' },
      {
        kind: 'p',
        text: 'Si la rupture vient du client, l’intégralité du forfait reste due. Si la rupture vient du chef pour cause de force majeure justifiée, le pro-rata des journées effectuées est dû et l’acompte reste acquis. Si la rupture vient du chef pour convenance, le client conserve le solde et l’acompte fait l’objet d’une négociation entre les parties.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'IV', text: 'Responsabilité civile et assurance' },
      {
        kind: 'p',
        text: 'Le chef intervient sous sa propre couverture en responsabilité civile professionnelle, dont l’attestation est annexée au présent contrat. Cette couverture s’applique aux dommages liés à son activité de chef privé sur le lieu de mission. Les biens personnels apportés par le chef restent sous sa propre assurance.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'V', text: 'Confidentialité' },
      {
        kind: 'p',
        text: 'Le chef s’engage à une confidentialité absolue sur l’identité du client, le contenu des repas servis, l’organisation interne de la résidence, les invités présents pendant la mission, et toute information personnelle relevée pendant la prestation. Cet engagement s’applique pendant et après la mission, sans limite de durée.',
      },
      {
        kind: 'p',
        text: 'Le chef est autorisé à photographier les plats qu’il réalise et à les publier sur ses comptes professionnels, à condition de ne pas identifier la résidence ou ses occupants. Toute autre communication publique liée à la mission requiert l’accord écrit du client.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VI', text: 'Non-sollicitation' },
      {
        kind: 'p',
        text: 'Pendant douze mois après la fin de la présente mission, le chef s’engage à ne pas contacter directement le client pour proposer une nouvelle prestation, sans en informer préalablement [agent ou conciergerie] qui a placé la mission initiale. Cette clause ne fait pas obstacle à un contact direct sur initiative du client.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VII', text: 'Droit applicable et résolution des conflits' },
      {
        kind: 'p',
        text: 'Le présent contrat est soumis au droit français. En cas de différend, les parties s’engagent à tenter une résolution amiable par voie de médiation avant toute action contentieuse. À défaut d’accord, le tribunal de commerce de [ville] sera seul compétent.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },
      {
        kind: 'table',
        rows: [
          { label: 'Fait à', value: '' },
          { label: 'Le', value: '' },
          { label: 'En deux exemplaires originaux', value: '' },
        ],
      },
      { kind: 'spacer', mm: 6 },
      {
        kind: 'signatureDouble',
        leftLabel: 'Le chef',
        rightLabel: 'Le client',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Cette base contractuelle ne remplace pas l’avis d’un avocat. Faites valider la première version par un cabinet, ensuite réutilisez la trame d’une mission à l’autre en adaptant les paramètres variables.',
      },
    ],
  },

  en: {
    title: 'Private chef mission contract',
    excerpt:
      'Contract base structured around the seven clauses that actually protect. Customise, have a lawyer validate the first version, then reuse for subsequent missions.',
    eyebrow: 'CONTRACT — PRIVATE CHEF MISSION',
    body: [
      { kind: 'title', text: 'Mission contract' },
      { kind: 'subtitle', text: 'Seasonal private chef service' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', text: 'Between the undersigned' },
      {
        kind: 'table',
        rows: [
          { label: 'The chef (first name, name, status, registration, address)', value: '' },
          { label: 'The client (name, address, representative)', value: '' },
        ],
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'p',
        text: 'The following has been agreed within the framework of a private chef mission for the period and location set out below.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'I', text: 'Scope of service' },
      {
        kind: 'p',
        text: 'The chef provides the conception and execution of meals on behalf of the client, at [location], from [start date] to [end date]. The service includes [number] meals per day, on the basis of [average number] covers. Any service outside the scope will be subject to a written addendum validated by both parties before execution.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'II', text: 'Payment schedule' },
      {
        kind: 'p',
        text: 'The total mission package amounts to [amount] € net. Payment occurs in three steps: 35% at signature of this contract, 35% on the fifteenth day of mission against invoice, 30% within seven days following the end of mission against final invoice. Any payment delay exceeding fifteen days on any instalment triggers immediate suspension of the service, without prejudice to sums due. Late penalties at the applicable statutory rate.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'III', text: 'Early termination' },
      {
        kind: 'p',
        text: 'If termination comes from the client, the full package remains due. If termination comes from the chef due to justified force majeure, the pro-rata of executed days is due and the deposit stays earned. If termination comes from the chef for convenience, the client retains the balance and the deposit is subject to negotiation between the parties.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'IV', text: 'Civil liability and insurance' },
      {
        kind: 'p',
        text: 'The chef operates under their own professional civil liability cover, the certificate of which is attached to this contract. This cover applies to damages linked to their private chef activity at the mission location. Personal items brought by the chef remain under their own insurance.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'V', text: 'Confidentiality' },
      {
        kind: 'p',
        text: 'The chef undertakes absolute confidentiality on the client identity, the content of meals served, the internal organisation of the residence, the guests present during the mission, and any personal information observed during the service. This commitment applies during and after the mission, without time limit.',
      },
      {
        kind: 'p',
        text: 'The chef is authorised to photograph the plates they produce and post them on their professional accounts, provided they do not identify the residence or its occupants. Any other public communication linked to the mission requires the written agreement of the client.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VI', text: 'Non-solicitation' },
      {
        kind: 'p',
        text: 'For twelve months after the end of this mission, the chef undertakes not to contact the client directly to propose a new service, without prior notice to [agent or concierge] who placed the initial mission. This clause does not preclude direct contact at the initiative of the client.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VII', text: 'Applicable law and dispute resolution' },
      {
        kind: 'p',
        text: 'This contract is governed by French law. In case of dispute, the parties undertake to attempt amicable resolution through mediation before any contentious action. Failing agreement, the commercial court of [city] will have sole competence.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },
      {
        kind: 'table',
        rows: [
          { label: 'Signed at', value: '' },
          { label: 'On', value: '' },
          { label: 'In two original copies', value: '' },
        ],
      },
      { kind: 'spacer', mm: 6 },
      {
        kind: 'signatureDouble',
        leftLabel: 'The chef',
        rightLabel: 'The client',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'This contract base does not replace legal advice. Have the first version validated by a law firm, then reuse the framework across missions by adapting the variable parameters.',
      },
    ],
  },
};
