// lib/vip-guides/_guides/tarification-mission-saisonniere.ts
// Guide VIP — Tarification d'une mission saisonnière
// FR / EN — pilier "pricing"

import type { Guide } from '../types';

export const tarificationMissionSaisonniere: Guide = {
  slug: 'tarifer-mission-saisonniere',
  heroImage: '/images/email/villa-service.jpg',
  readingMinutes: 6,
  pillar: 'business',
  publishedAt: '2026-05-07',

  fr: {
    title: 'Tarifer une mission saisonnière à cinq zéros sans baisser de garde',
    excerpt:
      'Comment tenir un tarif net face à un agent expérimenté, sécuriser une mission de quatre à douze semaines, et sortir de la négociation avec une marge intacte.',
    body: [
      {
        kind: 'p',
        text: 'Sur les missions saisonnières que j’observe dans notre réseau depuis 2022, le tarif chef se joue dans les vingt premières minutes de la conversation. Au moment où l’agent demande "vous fonctionnez à quel tarif", la réponse pose le cadre pour les six semaines à venir. Si elle est floue ou défensive, le client garde la main sur la négociation jusqu’au dernier service. Si elle est posée, structurée, presque administrative, la discussion bascule sur l’opérationnel et le tarif n’est plus rediscuté.',
      },
      {
        kind: 'p',
        text: 'Trop de chefs envoient un devis construit comme un menu de dîner et perdent une mission à 35 ou 60 k€ pour 800 € mal expliqués. La cause est rarement un mauvais prix. Elle est presque toujours un devis qui ne ressemble pas à celui d’un professionnel installé.',
      },

      { kind: 'h2', text: 'Le devis en quatre lignes' },
      {
        kind: 'p',
        text: 'Un devis crédible n’est jamais une seule ligne. Le client ultra-aisé ou son agent veulent comprendre ce qu’ils paient, dans la même logique qu’une facture d’avocat ou d’architecte. Quatre lignes suffisent et règlent 80 % des objections.',
      },
      {
        kind: 'ul',
        items: [
          'Salaire chef, exprimé en net par jour ou par semaine.',
          'Per diem couvrant les repas, le transport sur place et les dépenses personnelles.',
          'Forfait préparation pour la recherche, le sourcing et le déplacement aller-retour.',
          'Fonds courses, géré séparément avec un suivi hebdomadaire.',
        ],
      },
      {
        kind: 'p',
        text: 'Cette structure protège votre rémunération sur la ligne salaire et rend la matière première lisible côté client. Vous n’avez plus à défendre votre tarif jour quand le client trouve qu’une livraison de truffe blanche pèse sur la facture. La conversation porte sur le fonds courses, qui est sa décision, pas sur votre niveau.',
      },

      { kind: 'h2', text: 'Tarifer à la journée, jamais à l’heure' },
      {
        kind: 'p',
        text: 'En mission longue, raisonner en taux horaire condamne à un calcul perdant. Vous serez disponible plus longtemps que vous ne servez. Les clients ultra-aisés n’achètent pas un compteur, ils achètent une présence et un niveau, avec la garantie que tout fonctionne sans qu’ils aient à y penser.',
      },
      {
        kind: 'p',
        text: 'Voici les fourchettes de marché que j’observe en 2026 pour un chef privé confirmé qui livre un haut niveau, en restant légèrement sous les pratiques les plus tendues du segment. Les valeurs hautes ne sont accessibles qu’avec un dossier solide (références UHNW vérifiables, presse, expérience étoilée ou équivalent).',
      },
      {
        kind: 'ul',
        items: [
          'Villa sur la Côte d’Azur, à Ibiza ou à Mykonos : 500 à 800 € net par jour pour le chef seul.',
          'Yacht charter de 10 à 20 mètres : 600 à 1 000 € net par jour selon la taille et les certifications STCW.',
          'Chalet d’hiver à Courchevel, Verbier ou Gstaad : 600 à 900 € net par jour.',
          'Mission longue de huit semaines ou plus : forfait mensuel négocié entre 16 000 et 22 000 € net pour le chef seul.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Si vous démarrez avec un parcours UHNW encore léger, restez sur le bas de fourchette pendant deux saisons et capitalisez sur les références. Une saison à 550 € par jour proprement exécutée vous fait passer à 750 € la saison d’après. L’inverse, monter trop vite et mal exécuter, ferme des portes pour deux ans.',
      },

      { kind: 'h2', text: 'Le jour de repos hebdomadaire' },
      {
        kind: 'p',
        text: 'Une mission longue sans jour de repos finit mal, pour vous ou pour le client. Posez ce jour dès la première version du devis, jamais en cours de négociation. Deux modèles fonctionnent dans le segment.',
      },
      {
        kind: 'p',
        text: 'Le premier consiste à facturer une demi-journée pour ce repos pendant que vous restez sur place, prêt en cas d’urgence. C’est le standard sur les missions yacht où la logistique d’hébergement extérieur est compliquée. Le second consiste à ne pas facturer ce jour mais à conserver l’hébergement aux frais du client. C’est plus adapté aux missions villa et chalet, où vous pouvez sortir.',
      },
      {
        kind: 'p',
        text: 'Mentionnez le jour de repos dans le corps du devis, pas dans une annexe. Un client ultra-aisé qui découvre cette ligne en milieu de mission se sent piégé, et c’est à ce moment que les conflits de relation se cristallisent.',
      },

      { kind: 'h2', text: 'Le fonds courses, ligne où tout peut basculer' },
      {
        kind: 'p',
        text: 'C’est la ligne qui peut faire dérailler une mission proprement bouclée par ailleurs. Le client ultra-aisé dépense par habitude. Son agent surveille au centime. Vous êtes au milieu, et c’est à vous de poser le cadre.',
      },
      {
        kind: 'p',
        text: 'Le fonds courses ne passe jamais par votre compte personnel. Soit vous obtenez une carte de paiement dédiée au nom de la résidence, soit l’agent vire une avance au démarrage que vous reconstituez au besoin. Vous fournissez chaque dimanche soir un récapitulatif avec les tickets photographiés, classés par catégorie. Pas en fin de mission. Le suivi hebdomadaire prévient toutes les discussions tendues à la sortie.',
      },
      {
        kind: 'p',
        text: 'Donnez une fourchette dans le devis pour cadrer les attentes. Sur des standards classiques sans exigence luxe sur les produits, comptez 200 à 350 € par personne par semaine. Avec exigence sur la truffe, le caviar, certains vins, on passe rapidement à 500 ou 700 €. Le client comprend que ces variations dépendent de ses choix, pas des vôtres.',
      },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'Ne payez jamais une mission longue de votre poche pour vous faire rembourser ensuite. Une mission qui démarre avec 4 ou 5 000 € avancés par le chef se termine en conflit dans neuf cas sur dix. Si l’agent insiste pour ce mode de fonctionnement, considérez que vous traitez avec un client qui paie mal, et tarifez un complément de risque dans la ligne salaire.',
      },

      { kind: 'h2', text: 'Le forfait préparation, la ligne qui sauve' },
      {
        kind: 'p',
        text: 'Une mission saisonnière mobilise cinq à dix jours de travail invisible avant le premier service. Recherche fournisseurs locaux, étude du brief, achats spécifiques, vols, transferts. Si vous ne facturez pas ce temps, vous l’offrez. Sur une mission de 40 000 €, ce temps offert représente 8 à 12 % de votre marge.',
      },
      {
        kind: 'p',
        text: 'Le forfait préparation se chiffre 1 000 à 1 800 € net pour une mission inférieure à un mois, 2 200 à 3 500 € pour une mission de un à deux mois, 3 500 à 5 500 € pour une mission de deux mois et plus. Au-delà de quatre semaines en international, ajoutez le transport en classe affaires si la destination est exigeante (Maldives, Sardaigne en haute saison, certaines îles grecques).',
      },

      { kind: 'h2', text: 'La phrase qui ferme la négociation' },
      {
        kind: 'p',
        text: 'Quand un agent vous renvoie le classique "le client trouve ça un peu haut", n’entrez pas dans la justification ligne par ligne. Vous donnez l’impression de défendre votre tarif, donc qu’il y a quelque chose à défendre. La réponse à intégrer comme un réflexe :',
      },
      {
        kind: 'quote',
        text: 'Mon tarif reflète le niveau attendu sur ce type de mission. Je peux ajuster le périmètre (moins de jours, équipe réduite, prestation simplifiée) mais pas le tarif jour. Préférez-vous qu’on retravaille le périmètre ?',
      },
      {
        kind: 'p',
        text: 'Vous posez votre prix comme une donnée fixe et vous redonnez la main au client en lui proposant une issue qui ne touche pas votre marge. Dans 70 % des cas, l’agent revient avec un "OK on garde le périmètre, le client valide". Dans les autres cas, le périmètre se réduit, ce qui est aussi une issue saine.',
      },

      { kind: 'h2', text: 'Le principe stratégique' },
      {
        kind: 'p',
        text: 'Tarifer une mission saisonnière n’est pas une négociation. C’est une démonstration de niveau. Un chef qui structure son devis comme un cabinet structure une mission est traité comme un professionnel installé. Un chef qui chiffre dans un message WhatsApp est traité comme un chef qu’on essaie. La forme du devis vaut autant que le chiffre.',
      },
      {
        kind: 'p',
        text: 'Sur deux saisons consécutives appliquées avec rigueur, j’observe en moyenne une hausse de 25 à 40 % du tarif jour réalisé sans perte de volume de missions. La discipline tarifaire crée la trajectoire, pas l’ambition tarifaire seule.',
      },
    ],
  },

  en: {
    title: 'Pricing a five-figure seasonal mission without dropping your guard',
    excerpt:
      'How to hold a clean rate against an experienced agent, secure a four to twelve week mission, and walk out of the negotiation with your margin intact.',
    body: [
      {
        kind: 'p',
        text: 'Across the seasonal missions I observe in our network since 2022, the chef rate is decided in the first twenty minutes of the conversation. The moment the agent asks "what is your rate", the answer sets the frame for the next six weeks. Vague or defensive, the client keeps control of the negotiation until the final service. Calm, structured, almost administrative, and the conversation moves to operations and the rate is not discussed again.',
      },
      {
        kind: 'p',
        text: 'Too many chefs send a quote built like a dinner menu and lose a 35 to 60 k€ mission over 800 € that were never properly explained. The cause is rarely a wrong price. It is almost always a quote that does not look like one a settled professional would issue.',
      },

      { kind: 'h2', text: 'The four-line quote' },
      {
        kind: 'p',
        text: 'A credible quote is never a single line. The ultra-affluent client or their agent want to see what they pay for, in the same logic as a lawyer or architect invoice. Four lines is enough and they settle 80% of objections.',
      },
      {
        kind: 'ul',
        items: [
          'Chef salary, expressed in net daily or weekly amount.',
          'Per diem covering meals, local transport and personal expenses.',
          'Preparation fee for sourcing, brief study and round-trip travel.',
          'Grocery fund, tracked separately with a weekly recap.',
        ],
      },
      {
        kind: 'p',
        text: 'This structure protects your fee on the salary line and makes the food cost legible on the client side. You no longer defend your day rate when the client objects to a white truffle delivery. The conversation moves to the grocery fund, which is their decision, not your level.',
      },

      { kind: 'h2', text: 'Day rate, never hourly' },
      {
        kind: 'p',
        text: 'On long missions, hourly thinking leads to a losing calculation. You will be on call far longer than you actually serve. Ultra-affluent clients do not buy a meter, they buy a presence and a level, with the guarantee that everything works without them having to think about it.',
      },
      {
        kind: 'p',
        text: 'Here are the market ranges I observe in 2026 for a confirmed private chef delivering at a high level, kept slightly below the most stretched practices in the segment. The high values are reachable only with a solid file (verifiable UHNW references, press, starred or equivalent experience).',
      },
      {
        kind: 'ul',
        items: [
          'Villa on the French Riviera, in Ibiza or Mykonos: 500 to 800 € net per day for the chef alone.',
          'Yacht charter from 10 to 20 metres: 600 to 1 000 € net per day depending on size and STCW certifications.',
          'Winter chalet in Courchevel, Verbier or Gstaad: 600 to 900 € net per day.',
          'Long mission of eight weeks or more: monthly fixed fee negotiated between 16 000 and 22 000 € net for the chef alone.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'If you start with a still light UHNW track record, stay on the low end for two seasons and capitalise on references. A clean season at 550 € per day takes you to 750 € the following year. The opposite path, raising too fast and executing badly, closes doors for two years.',
      },

      { kind: 'h2', text: 'The weekly day off' },
      {
        kind: 'p',
        text: 'A long mission without a day off ends badly, for you or the client. Set this day in the very first version of the quote, never mid-negotiation. Two models work in the segment.',
      },
      {
        kind: 'p',
        text: 'The first one charges half a day for that rest while you stay on site, ready for emergencies. It is the standard on yacht missions where outside accommodation logistics are complicated. The second model charges nothing for the day but keeps housing on the client. It works better for villa and chalet missions, where you can leave the property.',
      },
      {
        kind: 'p',
        text: 'Mention the day off in the body of the quote, not in an annex. An ultra-affluent client who discovers this line halfway through the mission feels trapped, and that is when the relationship conflicts crystallise.',
      },

      { kind: 'h2', text: 'The grocery fund, where everything can break' },
      {
        kind: 'p',
        text: 'This is the line that can derail a mission cleanly handled in every other respect. The ultra-affluent client spends by habit. Their agent watches every cent. You are in the middle, and the framing is on you.',
      },
      {
        kind: 'p',
        text: 'The grocery fund never goes through your personal account. Either you secure a dedicated payment card in the residence name, or the agent wires an advance at the start that you replenish as needed. You provide every Sunday evening a recap with photographed receipts, sorted by category. Not at the end of the mission. The weekly tracking pre-empts all the tense discussions at the exit.',
      },
      {
        kind: 'p',
        text: 'Give a range in the quote to set expectations. On classic standards with no luxury sourcing constraints, expect 200 to 350 € per person per week. With expectations on truffle, caviar, certain wines, the figure quickly moves to 500 or 700 €. The client understands that those variations follow their choices, not yours.',
      },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'Never fund a long mission out of your own pocket expecting reimbursement later. A mission that starts with 4 or 5 000 € advanced by the chef ends in conflict in nine cases out of ten. If the agent insists on this setup, consider you are dealing with a client who pays late or partially, and price a risk premium into the salary line.',
      },

      { kind: 'h2', text: 'The preparation fee, the line that saves you' },
      {
        kind: 'p',
        text: 'A seasonal mission mobilises five to ten days of invisible work before the first service. Local supplier research, brief study, specific purchases, flights, transfers. If you do not invoice that time, you give it away. On a 40 000 € mission, this gifted time is 8 to 12% of your margin.',
      },
      {
        kind: 'p',
        text: 'The preparation fee runs at 1 000 to 1 800 € net for a mission below one month, 2 200 to 3 500 € for a mission of one to two months, 3 500 to 5 500 € for a mission of two months and beyond. Past four weeks in international, add business class travel if the destination is demanding (Maldives, Sardinia in peak season, certain Greek islands).',
      },

      { kind: 'h2', text: 'The sentence that closes the negotiation' },
      {
        kind: 'p',
        text: 'When an agent throws the classic "the client finds it a little high", do not get into a line-by-line justification. You signal that there is something to defend. The sentence to internalise as a reflex:',
      },
      {
        kind: 'quote',
        text: 'My rate reflects the level expected on this kind of mission. I can adjust the scope (fewer days, smaller team, simpler service) but not the day rate. Would you prefer we rework the scope?',
      },
      {
        kind: 'p',
        text: 'You set your price as a fixed datum and you give the client an exit that does not touch your margin. In 70% of cases, the agent comes back with "OK we keep the scope, the client validates". In the remaining cases, the scope shrinks, which is also a healthy outcome.',
      },

      { kind: 'h2', text: 'The strategic principle' },
      {
        kind: 'p',
        text: 'Pricing a seasonal mission is not a negotiation. It is a demonstration of level. A chef who structures their quote the way a consulting firm structures an engagement is treated as a settled professional. A chef who quotes in a WhatsApp message is treated as someone the client is testing. The form of the quote weighs as much as the figure itself.',
      },
      {
        kind: 'p',
        text: 'Across two consecutive seasons applied with discipline, I observe an average 25 to 40% increase in realised day rate with no loss of mission volume. Pricing discipline creates the trajectory, not pricing ambition alone.',
      },
    ],
  },
};
