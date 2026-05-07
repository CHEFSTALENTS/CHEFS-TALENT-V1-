// lib/vip-templates/_templates/script-negociation.ts
// Template VIP — Script de négociation : huit objections, huit réponses

import type { VipTemplate } from '../types';

export const scriptNegociation: VipTemplate = {
  slug: 'script-negociation',
  pillar: 'business',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Script de négociation, huit objections et huit réponses',
    excerpt:
      'Les phrases prêtes à dire qui tiennent un tarif sans rentrer dans la justification ligne par ligne. À imprimer, à mémoriser, à relire avant chaque appel commercial.',
    eyebrow: 'NÉGOCIATION — RÉPONSES PRÊTES',
    body: [
      { kind: 'title', text: 'Tenir son tarif' },
      { kind: 'subtitle', text: 'Huit situations, huit réponses' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'I', text: 'Le client trouve le tarif un peu haut' },
      {
        kind: 'p',
        text: 'Mon tarif reflète le niveau attendu sur ce type de mission. Je peux ajuster le périmètre — moins de jours, équipe réduite, prestation simplifiée — mais pas le tarif jour. Préférez-vous qu’on retravaille le périmètre ?',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'II', text: 'Demande d’un acompte réduit ou supprimé' },
      {
        kind: 'p',
        text: 'L’acompte de 35 % à la signature est une condition cadre que je tiens sur l’ensemble des missions saisonnières. Il sécurise mon engagement et conditionne la réservation effective de mes dates. Je peux étaler le solde, mais je ne peux pas modifier l’acompte.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'III', text: 'Demande d’un alignement sur un autre chef moins cher' },
      {
        kind: 'p',
        text: 'Je comprends. Chaque chef a son positionnement. Le mien correspond à un type de prestation et à un niveau de mission précis. Si le format que vous cherchez s’adresse à un autre profil, je suis le premier à vous le dire. Voulez-vous que je vous oriente vers un de mes confrères qui correspondrait mieux ?',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'IV', text: 'Pression sur le délai pour signer dans la journée' },
      {
        kind: 'p',
        text: 'Je peux vous confirmer ma disponibilité aujourd’hui en vingt minutes par téléphone. Pour signer un devis, j’ai besoin que les conditions soient correctement écrites. Je vous renvoie une proposition propre dans la journée, vous me la retournez signée demain matin si elle vous convient.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'V', text: 'Demande d’extension du périmètre sans renégocier' },
      {
        kind: 'p',
        text: 'Cette demande sort du périmètre signé. Je suis tout à fait disponible pour la prendre en charge, et je vous prépare un avenant chiffré que je vous transmets cet après-midi. Vous me confirmez par écrit avant exécution.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VI', text: 'Doute sur le fonds courses qui paraît élevé' },
      {
        kind: 'p',
        text: 'Le fonds courses dépend exclusivement de vos choix de produits. La fourchette indiquée dans le devis correspond aux standards du segment. Si vous souhaitez la maîtriser plus serrément, je peux travailler avec une enveloppe plafond hebdomadaire validée à l’avance, et vous adresser un récapitulatif chaque dimanche soir.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VII', text: 'Demande d’un événement à trente couverts dans le forfait' },
      {
        kind: 'p',
        text: 'Un dîner à trente couverts ne s’absorbe pas dans le forfait quotidien. C’est un service événementiel qui mobilise une équipe de renfort, une journée de prep dédiée et des produits spécifiques. Je vous prépare un devis complémentaire qui sécurise votre événement à votre niveau d’exigence.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VIII', text: 'Refus de signer un contrat formel' },
      {
        kind: 'p',
        text: 'Je travaille avec un contrat sur l’ensemble des missions saisonnières au-dessus de quinze mille euros. Ce document protège votre famille autant que mon activité. Il prend dix minutes à lire. Si certaines clauses vous posent question, on les revoit ensemble. Mais je n’engage pas une mission de plusieurs semaines sur une simple confirmation orale.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'Le ton de ces réponses est posé, sans excès d’explication. Une phrase ferme et une question ouverte qui rend la main au client. La justification longue affaiblit toujours le tarif.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'À relire la veille d’un appel commercial. Avec deux saisons d’exercice, ces phrases deviennent automatiques.',
      },
    ],
  },

  en: {
    title: 'Negotiation script, eight objections and eight responses',
    excerpt:
      'Ready-to-say sentences that hold a rate without slipping into line-by-line justification. To print, memorise, and re-read before each commercial call.',
    eyebrow: 'NEGOTIATION — READY RESPONSES',
    body: [
      { kind: 'title', text: 'Holding your rate' },
      { kind: 'subtitle', text: 'Eight situations, eight responses' },
      { kind: 'spacer', mm: 6 },
      { kind: 'rule' },
      { kind: 'spacer', mm: 5 },

      { kind: 'section', number: 'I', text: 'The client finds the rate a little high' },
      {
        kind: 'p',
        text: 'My rate reflects the level expected on this kind of mission. I can adjust the scope — fewer days, smaller team, simpler service — but not the day rate. Would you prefer we rework the scope?',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'II', text: 'Request for reduced or removed deposit' },
      {
        kind: 'p',
        text: 'The 35% deposit at signature is a framework condition I hold across all seasonal missions. It secures my commitment and conditions the effective booking of my dates. I can stagger the balance, but I cannot modify the deposit.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'III', text: 'Request for alignment on a cheaper chef' },
      {
        kind: 'p',
        text: 'I understand. Every chef has their positioning. Mine corresponds to a specific type of service and mission level. If the format you are looking for fits another profile, I am the first to tell you. Would you like me to refer you to a colleague who would fit better?',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'IV', text: 'Pressure to sign within the day' },
      {
        kind: 'p',
        text: 'I can confirm my availability today in twenty minutes by phone. To sign a quote, I need the conditions properly written down. I will send you a clean proposal within the day, you return it signed tomorrow morning if it works for you.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'V', text: 'Scope extension request without renegotiation' },
      {
        kind: 'p',
        text: 'This request is outside the signed scope. I am entirely available to handle it, and I am preparing an addendum with pricing that I will send you this afternoon. You confirm in writing before execution.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VI', text: 'Doubt on a grocery fund that looks high' },
      {
        kind: 'p',
        text: 'The grocery fund depends exclusively on your product choices. The range in the quote matches segment standards. If you want tighter control, I can work with a weekly cap envelope validated upfront, and send you a recap every Sunday evening.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VII', text: 'Request for a thirty-cover event within the package' },
      {
        kind: 'p',
        text: 'A thirty-cover dinner does not absorb into the daily package. It is event service that mobilises a reinforcement team, a dedicated prep day, and specific products. I will prepare a complementary quote that secures your event at your expected level.',
      },
      { kind: 'spacer', mm: 4 },

      { kind: 'section', number: 'VIII', text: 'Refusal to sign a formal contract' },
      {
        kind: 'p',
        text: 'I work with a contract on every seasonal mission above fifteen thousand euros. This document protects your family as much as my business. It takes ten minutes to read. If certain clauses raise questions, we go through them together. But I do not engage on a multi-week mission on a simple verbal confirmation.',
      },
      { kind: 'spacer', mm: 6 },

      { kind: 'rule' },
      {
        kind: 'note',
        text: 'The tone of these responses is composed, without excess explanation. One firm sentence and one open question that hands the ball back to the client. Long justification always weakens the rate.',
      },
      { kind: 'spacer', mm: 4 },
      {
        kind: 'footnote',
        text: 'Re-read the evening before a commercial call. With two seasons of practice, these sentences become automatic.',
      },
    ],
  },
};
