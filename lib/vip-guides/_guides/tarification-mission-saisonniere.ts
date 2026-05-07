// lib/vip-guides/_guides/tarification-mission-saisonniere.ts
// Guide VIP — Tarification d'une mission saisonnière
// FR / EN — pilier "pricing"

import type { Guide } from '../types';

export const tarificationMissionSaisonniere: Guide = {
  slug: 'tarifer-mission-saisonniere',
  heroImage: '/images/email/villa-service.jpg',
  readingMinutes: 7,
  pillar: 'pricing',
  publishedAt: '2026-05-07',

  fr: {
    title: 'Tarifer une mission saisonnière à 5 zéros sans baisser de garde',
    excerpt:
      'La méthode pour construire un tarif qui respecte votre niveau, qui se défend face à un agent, et qui sécurise une mission de 4 à 12 semaines.',
    body: [
      {
        kind: 'p',
        text: 'Une mission saisonnière en villa, sur un yacht ou en chalet, ce n’est pas un long enchaînement de prestations courtes. C’est un engagement opérationnel — votre vie pendant 4 à 12 semaines — et un investissement client à plusieurs zéros. La tarification doit refléter cela. Trop de chefs envoient un devis construit comme un menu de dîner, et perdent une mission à 30 ou 60 k€ pour 800 € de différence mal expliqués.',
      },
      {
        kind: 'p',
        text: 'Ce guide pose la méthode que j’utilise avec les chefs VIP du réseau pour construire un tarif clair, juste pour vous, lisible pour le client.',
      },

      { kind: 'h2', text: '1. Découpez le tarif en quatre lignes' },
      {
        kind: 'p',
        text: 'Un devis crédible n’a jamais une seule ligne. Le client UHNW ou son agent veulent comprendre ce qu’ils paient. Quatre lignes suffisent :',
      },
      {
        kind: 'ul',
        items: [
          'Salaire chef — votre rémunération nette par jour ou par semaine.',
          'Per diem — repas, transport sur place, dépenses personnelles couvertes.',
          'Forfait préparation — recherche, sourcing, déplacement aller-retour.',
          'Fonds courses — provision pour les achats alimentaires, gérée séparément.',
        ],
      },
      {
        kind: 'p',
        text: 'Cette séparation a un effet psychologique fort. Le client lit "salaire chef" comme un coût attendu, et "fonds courses" comme une variable contrôlable. Vous obtenez deux choses : un tarif chef qui ne se discute plus, et une matière première qui ne pénalise pas votre marge.',
      },

      { kind: 'h2', text: '2. Calez votre journée à un tarif, pas à un nombre d’heures' },
      {
        kind: 'p',
        text: 'En mission longue, le calcul "10 € de l’heure × 12 h" est un piège. Vous serez disponible plus longtemps que vous ne servez. Les UHNW achètent une présence et un niveau, pas un compteur horaire.',
      },
      {
        kind: 'p',
        text: 'La fourchette saine pour un chef privé confirmé en 2026 :',
      },
      {
        kind: 'ul',
        items: [
          'Mission villa Côte d’Azur, Ibiza, Mykonos : 600 à 900 € net / jour pour le chef seul.',
          'Yacht charter (10 à 20 m) : 700 à 1 100 € net / jour, selon le brevet et la taille.',
          'Chalet hiver (Courchevel, Verbier, Gstaad) : 700 à 1 000 € net / jour.',
          'Mission longue (8 semaines+), un confort : forfait mensuel négocié à 18 000 à 25 000 € net pour le chef seul.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Ces fourchettes sont valables pour un chef confirmé qui livre un haut niveau. Si vous démarrez avec moins d’expérience UHNW, restez sur le bas, jamais en dessous.',
      },

      { kind: 'h2', text: '3. Ajoutez le jour off — et facturez-le' },
      {
        kind: 'p',
        text: 'Une mission longue sans jour off est une mission qui finit mal — pour vous ou pour le client. Imposez un jour off par semaine dès le devis. Deux options :',
      },
      {
        kind: 'ul',
        items: [
          'Jour off payé à 50 % — vous restez sur place, le client paie une demi-journée. Standard sur les missions yacht.',
          'Jour off non payé mais hébergé — vous êtes libre, l’hébergement reste à charge client. Mieux pour les missions chalet ou villa.',
        ],
      },
      {
        kind: 'p',
        text: 'Mentionnez-le dès la première proposition. Un client UHNW qui découvre le jour off à la fin de la négociation se sent piégé. Un client qui le voit dès le devis comprend que vous tenez la durée.',
      },

      { kind: 'h2', text: '4. Cadrez le fonds courses dès la première heure' },
      {
        kind: 'p',
        text: 'C’est la ligne qui peut tout faire dérailler. Les UHNW dépensent par habitude — les agents, eux, surveillent au centime près. Trois règles :',
      },
      {
        kind: 'ol',
        items: [
          'Le fonds courses ne passe jamais par votre compte personnel. Carte client dédiée, ou avance virée en début de mission.',
          'Vous fournissez un récap hebdomadaire avec tickets photographiés. Pas en fin de mission — chaque dimanche soir.',
          'Vous indiquez une fourchette dans le devis : "200 à 400 € / personne / semaine en standard, ajusté selon les exigences (truffe, caviar, vins rares)."',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'Ne payez jamais une mission longue de votre poche pour vous faire rembourser plus tard. Une mission qui démarre avec 5 000 € avancés par le chef se termine 90 % du temps en conflit.',
      },

      { kind: 'h2', text: '5. Préparation et déplacement : le forfait qui sauve' },
      {
        kind: 'p',
        text: 'Une mission saisonnière, c’est aussi 5 à 10 jours de travail invisible avant le premier service : recherche fournisseurs, étude du brief, achats spécifiques, vols, transferts. Si vous ne facturez pas ce temps, vous l’offrez.',
      },
      {
        kind: 'p',
        text: 'Forfait de préparation type, à intégrer en ligne séparée :',
      },
      {
        kind: 'ul',
        items: [
          'Mission < 1 mois : 1 200 à 2 000 € net.',
          'Mission 1 à 2 mois : 2 500 à 4 000 € net.',
          'Mission 2 mois et plus : 4 000 à 6 000 € net + transport business class si international.',
        ],
      },

      { kind: 'h2', text: '6. La phrase qui ferme la négociation' },
      {
        kind: 'p',
        text: 'Quand un agent vous dit "le client trouve ça un peu haut", n’entrez pas dans la justification ligne par ligne. Vous perdez le terrain. La réponse à apprendre par cœur :',
      },
      {
        kind: 'quote',
        text: 'Mon tarif reflète le niveau attendu sur ce type de mission. Je peux ajuster le périmètre — moins de jours, équipe réduite, prestation simplifiée — mais pas le tarif jour. Préférez-vous qu’on retravaille le périmètre ?',
      },
      {
        kind: 'p',
        text: 'Cette phrase fait deux choses : elle pose votre prix comme non négociable, et elle remet la balle dans le camp du client en lui donnant une option de sortie qui n’est pas votre marge.',
      },

      { kind: 'h2', text: 'En résumé' },
      {
        kind: 'ul',
        items: [
          'Quatre lignes claires, jamais une seule.',
          'Tarif par jour, pas par heure. 600 à 1 100 € selon le contexte.',
          'Jour off mentionné dans le devis.',
          'Fonds courses séparé, suivi hebdomadaire.',
          'Forfait préparation systématique.',
          'Une phrase de fermeture qui protège votre tarif.',
        ],
      },
      {
        kind: 'p',
        text: 'La tarification d’une mission saisonnière n’est pas une négociation, c’est une démonstration de niveau. Un chef qui tarife clairement vend deux fois plus qu’un chef qui tarife bas.',
      },
    ],
  },

  en: {
    title: 'Pricing a seasonal assignment with five zeros, without dropping your guard',
    excerpt:
      'The method to build a rate that reflects your level, holds up against an agent, and secures a 4 to 12 week mission.',
    body: [
      {
        kind: 'p',
        text: 'A seasonal assignment in a villa, on a yacht or in a chalet is not a long sequence of short bookings. It is an operational commitment — your life for 4 to 12 weeks — and a client investment with several zeros. Your pricing should reflect that. Too many chefs send a quote built like a dinner menu and lose a 30 to 60 k€ mission over 800 € of unexplained difference.',
      },
      {
        kind: 'p',
        text: 'This guide lays out the method I use with VIP chefs in the network to build a clear rate — fair to you, readable for the client.',
      },

      { kind: 'h2', text: '1. Break the rate into four lines' },
      {
        kind: 'p',
        text: 'A credible quote never has a single line. The UHNW client or their agent want to see what they pay for. Four lines is enough:',
      },
      {
        kind: 'ul',
        items: [
          'Chef salary — your net pay per day or per week.',
          'Per diem — meals, local transport, personal expenses covered.',
          'Preparation fee — research, sourcing, travel to and from the site.',
          'Grocery fund — a separate provision for food purchases, tracked apart.',
        ],
      },
      {
        kind: 'p',
        text: 'This separation has a strong psychological effect. The client reads "chef salary" as an expected cost, and "grocery fund" as a controllable variable. You get two things: a chef rate that no longer gets discussed, and food costs that don’t eat into your margin.',
      },

      { kind: 'h2', text: '2. Lock the day rate, not an hourly one' },
      {
        kind: 'p',
        text: 'On long missions, the "€10/h × 12 h" math is a trap. You will be available far longer than you actually serve. UHNW clients buy a presence and a level — not a meter.',
      },
      {
        kind: 'p',
        text: 'Healthy ranges for a confirmed private chef in 2026:',
      },
      {
        kind: 'ul',
        items: [
          'Villa mission French Riviera, Ibiza, Mykonos: €600 to €900 net / day for the chef alone.',
          'Yacht charter (10 to 20 m): €700 to €1 100 net / day, depending on certifications and size.',
          'Winter chalet (Courchevel, Verbier, Gstaad): €700 to €1 000 net / day.',
          'Long mission (8 weeks+), with comfort: monthly fixed fee negotiated at €18 000 to €25 000 net for the chef alone.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'These ranges apply to a confirmed chef delivering at a high level. If you are starting with less UHNW experience, stay at the lower end — never below.',
      },

      { kind: 'h2', text: '3. Add the day off — and bill it' },
      {
        kind: 'p',
        text: 'A long mission without a day off is a mission that ends badly — for you or the client. Set one day off per week in the quote itself. Two options:',
      },
      {
        kind: 'ul',
        items: [
          'Day off paid at 50% — you stay on site, the client pays a half day. Standard on yacht missions.',
          'Day off unpaid but housed — you are free, accommodation remains client-funded. Better for chalet or villa missions.',
        ],
      },
      {
        kind: 'p',
        text: 'Bring it up from the first proposal. A UHNW client who discovers the day off at the end of negotiation feels trapped. A client who sees it in the original quote understands that you can hold the duration.',
      },

      { kind: 'h2', text: '4. Frame the grocery fund in the first hour' },
      {
        kind: 'p',
        text: 'This is the line that can derail everything. UHNW clients spend by habit — agents, on the other hand, watch every cent. Three rules:',
      },
      {
        kind: 'ol',
        items: [
          'The grocery fund never goes through your personal account. Dedicated client card, or advance wire at the start of the mission.',
          'You provide a weekly recap with photographed receipts. Not at the end of the mission — every Sunday evening.',
          'You give a range in the quote: "€200 to €400 / person / week in standard, adjusted for premium requirements (truffle, caviar, rare wines)."',
        ],
      },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'Never pay a long mission out of your own pocket expecting reimbursement later. A mission that starts with €5 000 fronted by the chef ends in conflict 90% of the time.',
      },

      { kind: 'h2', text: '5. Preparation and travel: the fee that saves you' },
      {
        kind: 'p',
        text: 'A seasonal mission also means 5 to 10 days of invisible work before the first service: supplier research, brief study, specific purchases, flights, transfers. If you do not invoice that time, you are giving it away.',
      },
      {
        kind: 'p',
        text: 'Standard preparation fee to add as a separate line:',
      },
      {
        kind: 'ul',
        items: [
          'Mission < 1 month: €1 200 to €2 000 net.',
          'Mission 1 to 2 months: €2 500 to €4 000 net.',
          'Mission 2 months or more: €4 000 to €6 000 net + business class travel if international.',
        ],
      },

      { kind: 'h2', text: '6. The sentence that closes the negotiation' },
      {
        kind: 'p',
        text: 'When an agent tells you "the client finds it a little high", do not start justifying line by line. You lose the ground. The sentence to learn by heart:',
      },
      {
        kind: 'quote',
        text: 'My rate reflects the level expected on this kind of mission. I can adjust the scope — fewer days, smaller team, simpler service — but not the day rate. Would you prefer we rework the scope?',
      },
      {
        kind: 'p',
        text: 'This sentence does two things: it sets your price as non-negotiable, and it sends the ball back to the client with an exit that is not your margin.',
      },

      { kind: 'h2', text: 'In short' },
      {
        kind: 'ul',
        items: [
          'Four clear lines, never a single one.',
          'Day rate, not hourly. €600 to €1 100 depending on context.',
          'Day off mentioned in the quote.',
          'Grocery fund separate, weekly tracking.',
          'Preparation fee always added.',
          'A closing sentence that protects your rate.',
        ],
      },
      {
        kind: 'p',
        text: 'Pricing a seasonal mission is not a negotiation — it is a demonstration of level. A chef who prices clearly sells twice as much as a chef who prices low.',
      },
    ],
  },
};
