// lib/vip-guides/_guides/cuisine-evenement-prive.ts
// Guide VIP — La cuisine d'événement privé : un dîner pour 30 dans une villa
// FR / EN — pilier "metier"

import type { Guide } from '../types';

export const cuisineEvenementPrive: Guide = {
  slug: 'cuisine-evenement-prive',
  heroImage: '/images/email/plating.jpg',
  readingMinutes: 7,
  pillar: 'metier',
  publishedAt: '2026-05-08',

  fr: {
    title: 'La cuisine d’événement privé : un dîner pour trente dans une villa',
    excerpt:
      'Comment passer du service quotidien à seize couverts au dîner d’événement à trente, sans rupture de niveau. La logistique, le menu, l’équipe et le timing qui rendent l’opération tenable.',
    body: [
      {
        kind: 'p',
        text: 'Au cours d’une mission saisonnière, beaucoup de chefs reçoivent à un moment donné la demande qui change la dynamique de la résidence. Le client annonce un anniversaire, un déjeuner d’affaires, ou un dîner d’invités. Vingt-cinq ou trente couverts à servir le même soir, avec le même niveau d’assiette que le dîner familial habituel. Cette demande n’est pas une extension du service quotidien, c’est un autre métier qui se superpose. Sous-estimer la marche est l’erreur qui coûte le plus cher pendant une mission.',
      },
      {
        kind: 'p',
        text: 'Sur les missions que je suis dans le réseau, l’événement privé est en moyenne servi six à dix fois dans une saison de vingt semaines. Ce qui donne une opportunité commerciale réelle, à condition que vous sachiez la facturer et l’exécuter sans casse. Le différentiel entre un chef qui prend ces dîners en gestion sereine et un chef qui les subit est probablement le facteur principal de fidélisation auprès du segment ultra-aisé.',
      },

      { kind: 'h2', text: 'Le seuil opérationnel à reconnaître' },
      {
        kind: 'p',
        text: 'Au-delà de seize couverts, vous changez de logique. En dessous de seize, vous fonctionnez encore en cuisine de service privé : un piano, une équipe limitée, un dressage en salle ou en cuisine selon la saison. Au-delà, vous entrez en logique d’événementiel léger. Chaque service prend dix à quinze minutes par table de huit, ce qui multiplie les fenêtres de coordination. Le timing doit être planifié à la minute, pas à la sensation.',
      },
      {
        kind: 'p',
        text: 'Le seuil suivant se situe vers vingt-cinq couverts. À ce stade, vous ne pouvez plus dresser seul à l’assiette. Vous passez en service au plat ou en service à l’américaine, ou vous renforcez l’équipe de un ou deux commis dédiés au dressage. Ne pas reconnaître ce seuil conduit à un dîner où le dixième dressage sort vingt minutes après le premier, à une température qui n’est plus la même.',
      },

      { kind: 'h2', text: 'Construire le menu de l’événement' },
      {
        kind: 'p',
        text: 'Un menu d’événement privé n’est pas une version plus longue du menu quotidien. C’est une partition pensée pour la coordination, pas pour la créativité. Trois principes structurent les menus qui tiennent à trente.',
      },
      {
        kind: 'p',
        text: 'Premier principe, la maximisation des préparations à froid ou à température stabilisée. Une entrée travaillée la veille et dressée le jour J en quinze minutes pour trente couverts vaut mieux qu’une entrée chaude qui demande un timing serré. Carpaccio, ceviche, terrine, salade composée, tartare maturé. Vous gagnez les vingt premières minutes de service, ce qui décale la fenêtre du plat principal sans pression.',
      },
      {
        kind: 'p',
        text: 'Deuxième principe, le plat principal sur cuisson longue ou basse température. Une côte de bœuf maturée cuite à basse température pendant trois heures et finie au piano dix minutes avant le service donne un dressage rapide et reproductible. Un agneau confit. Un poisson en croûte de sel pour deux tables. Évitez les cuissons à la minute multipliées par trente, qui condamnent un cuisinier à rester sur les feux pendant tout le service.',
      },
      {
        kind: 'p',
        text: 'Troisième principe, le dessert assemblé en amont, avec une finition courte. Un entremets dressé sur grand plat trois heures avant et finition de fruits frais à la sortie de chambre froide. Une glace turbinée la veille avec un coulis fait le matin. Le dessert doit pouvoir partir en service en douze minutes pour trente, jamais en trente minutes.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Le test du menu événementiel : si vous ne pouvez pas faire sortir trente couverts à la même cuisson en moins de vingt-cinq minutes, votre menu est mal calibré. Reprenez le plat principal. La présence du chef étoilé n’a jamais sauvé un menu mal pensé pour la coordination.',
      },

      { kind: 'h2', text: 'L’équipe à dimensionner correctement' },
      {
        kind: 'p',
        text: 'À douze couverts, vous pouvez tenir seul. À seize, un commis dédié à la prep et au dressage devient nécessaire. À vingt-cinq, vous avez besoin d’un commis fixe et d’un renfort sur la journée du service (huit à dix heures). À trente, vous fonctionnez en équipe de trois en cuisine plus un service en salle. Au-delà de trente, vous montez à quatre en cuisine et vous traitez l’événement comme un mini-traiteur.',
      },
      {
        kind: 'p',
        text: 'Le coût de cette équipe de renfort se facture séparément du tarif jour de la mission, en complément négocié avec l’agent ou directement avec le client. Comptez 280 à 380 € net par jour pour un commis confirmé, 380 à 480 € pour un sous-chef de renfort. Sur un événement à trente couverts, le surcoût équipe se situe entre 800 et 1 600 €, plus le repas et le transport. Cette ligne ne se discute jamais en amont du service, elle se pose au moment où le client annonce le format de l’événement.',
      },

      { kind: 'h2', text: 'Le timing du jour J' },
      {
        kind: 'p',
        text: 'Un dîner d’événement à trente couverts s’organise par tranches horaires figées. La veille au soir, prep des bases, mise en place des éléments à froid, contrôle des produits livrés. Le matin du jour J de 8 h à 12 h, prep des cuissons longues, dressage des éléments à servir froids, briefing avec le service. De 12 h à 17 h, finition des bases chaudes, mise en place des chambres froides, premier débriefing avec le client sur l’ordre du service. Une heure avant l’arrivée, mise en chauffe finale, dressage des assiettes témoin.',
      },
      {
        kind: 'p',
        text: 'Le moment critique est la fenêtre des trente minutes qui précèdent le service. Cette fenêtre doit être protégée comme un espace stérile : pas de question du client, pas de modification de menu, pas de visite d’invité dans la cuisine. Sur les services qui se passent mal, cette fenêtre a presque toujours été interrompue. Posez la règle au moment du brief avec la house manager ou la stewardess. Les maisons sérieuses la respectent.',
      },

      { kind: 'h2', text: 'Le poste service en salle' },
      {
        kind: 'p',
        text: 'Sur un dîner d’événement, le service en salle décide la qualité perçue autant que la cuisine. Un dressage parfait servi tiède sur la moitié des assiettes vaut moins qu’un dressage simple servi chaud sur l’ensemble. Si vous travaillez avec une stewardess de yacht ou une house manager, briefez explicitement le timing du service. Combien d’assiettes par tour, à quel intervalle, qui dresse au passe, qui passe les assiettes. Ces décisions se prennent en amont, pas pendant le service.',
      },
      {
        kind: 'p',
        text: 'Pour les missions où il n’y a pas de service en salle structuré, recrutez un ou deux serveurs en extra par votre réseau local. Sur la Côte d’Azur, à Ibiza, à Megève, ces extras existent à la journée pour 200 à 280 € net. Cette ligne se présente au client comme un coût de service à part entière. Ne tentez jamais de servir trente couverts en double casquette cuisine et salle.',
      },

      { kind: 'h2', text: 'La tarification de l’événement' },
      {
        kind: 'p',
        text: 'Un événement privé à trente couverts pendant une mission saisonnière représente une journée de mobilisation totale, plus un quart de journée la veille, plus le coût de l’équipe de renfort. La facturation type s’établit en supplément de votre forfait de mission, sous la forme d’une ligne dédiée.',
      },
      {
        kind: 'ul',
        items: [
          'Forfait événement chef pour la journée : 1 200 à 1 800 € net selon le format.',
          'Renfort équipe (commis et sous-chef) : 800 à 1 600 € net selon la composition.',
          'Service en salle complémentaire (extras) : 400 à 800 € net selon le nombre.',
          'Surcoût matière sur le fonds courses : 70 à 150 € par couvert sur produits exigeants (truffe, caviar, foie gras, langouste).',
        ],
      },
      {
        kind: 'p',
        text: 'Le client ultra-aisé attend ce niveau de structuration. Présenter un événement à trente couverts avec un simple "ça rentre dans le forfait" est perçu comme amateur. Présenter une ligne événement détaillée avec les composantes ci-dessus est perçu comme professionnel. Cette structuration vous donne aussi la marge nécessaire pour exécuter sereinement, ce qui se ressent à l’assiette.',
      },

      { kind: 'h2', text: 'Le principe stratégique' },
      {
        kind: 'p',
        text: 'L’événement privé est le moment où votre niveau professionnel devient le plus visible. Le client invite ses pairs, qui le jugent sur la qualité de la table. Un dîner d’événement réussi pendant une mission saisonnière déclenche dans 30 à 50 % des cas une nouvelle mission dans les douze mois suivants, soit chez le même client soit chez un de ses invités. Le retour sur investissement de la rigueur opérationnelle sur ces dîners est le plus élevé de toute la mission. Tarifez en conséquence, et exécutez avec le sérieux d’une opération qui structure votre saison suivante.',
      },
    ],
  },

  en: {
    title: 'Private event cooking: dinner for thirty in a villa',
    excerpt:
      'Moving from a daily service of sixteen covers to a thirty-cover event without level drop. Logistics, menu, team and timing that make the operation sustainable.',
    body: [
      {
        kind: 'p',
        text: 'During a seasonal mission, many chefs receive at some point the request that changes the dynamics of the residence. The client announces a birthday, a business lunch, or a guest dinner. Twenty-five or thirty covers to serve the same evening, at the same plate level as the usual family dinner. That request is not an extension of the daily service, it is another craft superimposed on it. Underestimating the step up is the mistake that costs the most during a mission.',
      },
      {
        kind: 'p',
        text: 'Across missions I follow in the network, the private event is served on average six to ten times during a twenty-week season. That makes for a real commercial opportunity, provided you know how to bill it and execute it without breakage. The gap between a chef who handles those dinners with composed delivery and one who endures them is probably the main loyalty driver in the ultra-affluent segment.',
      },

      { kind: 'h2', text: 'The operational threshold to recognise' },
      {
        kind: 'p',
        text: 'Above sixteen covers, you change logic. Below sixteen, you still operate within private service kitchen mode: one range, a limited team, plating in dining room or in kitchen depending on the season. Above sixteen, you enter light catering logic. Each plating run takes ten to fifteen minutes per table of eight, which multiplies coordination windows. Timing has to be planned to the minute, not to the feel.',
      },
      {
        kind: 'p',
        text: 'The next threshold sits around twenty-five covers. At that stage, you can no longer plate alone à la carte. You move to family service or American style, or you reinforce the team with one or two commis dedicated to plating. Failing to recognise this threshold leads to a dinner where the tenth plating leaves twenty minutes after the first, at a temperature that is no longer the same.',
      },

      { kind: 'h2', text: 'Building the event menu' },
      {
        kind: 'p',
        text: 'A private event menu is not a longer version of the daily menu. It is a score written for coordination, not for creativity. Three principles structure menus that hold at thirty.',
      },
      {
        kind: 'p',
        text: 'First principle, maximising cold or stabilised-temperature preparations. A starter prepped the day before and plated on the day in fifteen minutes for thirty covers beats a hot starter that demands tight timing. Carpaccio, ceviche, terrine, composed salad, aged tartare. You gain the first twenty minutes of service, which shifts the main course window without pressure.',
      },
      {
        kind: 'p',
        text: 'Second principle, the main course on long or low-temperature cooking. An aged rib of beef cooked at low temperature for three hours and finished on the range ten minutes before service gives a fast and reproducible plating. A confit lamb. A salt-crust fish for two tables. Avoid à la minute cookings multiplied by thirty, which condemn a cook to stay on the burners for the entire service.',
      },
      {
        kind: 'p',
        text: 'Third principle, the dessert assembled upstream, with a short finish. An entremets plated on a large platter three hours before and a fresh fruit finish out of the cold room. An ice cream churned the day before with a coulis made in the morning. Dessert has to leave service in twelve minutes for thirty, never in thirty minutes.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'The event menu test: if you cannot get thirty covers of the same cooking out in under twenty-five minutes, your menu is miscalibrated. Rework the main course. A starred chef’s presence has never saved a menu poorly designed for coordination.',
      },

      { kind: 'h2', text: 'Sizing the team correctly' },
      {
        kind: 'p',
        text: 'At twelve covers, you can hold alone. At sixteen, a dedicated commis on prep and plating becomes necessary. At twenty-five, you need a permanent commis and a reinforcement on service day (eight to ten hours). At thirty, you operate as a team of three in kitchen plus dining room service. Above thirty, you move to four in kitchen and treat the event as a mini-catering operation.',
      },
      {
        kind: 'p',
        text: 'The cost of this reinforcement team is billed separately from the daily mission rate, as a complement negotiated with the agent or directly with the client. Expect 280 to 380 € net per day for a confirmed commis, 380 to 480 € for a reinforcement sous-chef. On a thirty-cover event, the team overhead sits between 800 and 1 600 €, plus meals and transport. This line is never discussed upstream of service, it is set the moment the client announces the event format.',
      },

      { kind: 'h2', text: 'The day-of timing' },
      {
        kind: 'p',
        text: 'A thirty-cover event dinner is organised in fixed time blocks. The evening before, prep of bases, mise en place of cold elements, control of delivered produce. The morning of D-day from 8 to 12, prep of long cookings, plating of cold-served items, briefing with the dining room. From 12 to 17, finishing of hot bases, mise en place of cold rooms, first debrief with the client on the order of service. One hour before arrival, final reheat, plating of reference dishes.',
      },
      {
        kind: 'p',
        text: 'The critical moment is the thirty-minute window before service. That window must be protected as a sterile space: no client question, no menu change, no guest visit in the kitchen. On services that go badly, this window has almost always been interrupted. Set the rule during the brief with the house manager or stewardess. Serious houses respect it.',
      },

      { kind: 'h2', text: 'The dining room service post' },
      {
        kind: 'p',
        text: 'On an event dinner, dining room service decides perceived quality as much as the cooking. A perfect plating served lukewarm on half the plates is worth less than a simple plating served hot on all of them. If you work with a yacht stewardess or a house manager, brief the service timing explicitly. How many plates per round, at what interval, who plates at the pass, who carries the plates. These decisions are made upstream, not during service.',
      },
      {
        kind: 'p',
        text: 'On missions where there is no structured dining room service, hire one or two extra waiters through your local network. On the French Riviera, in Ibiza, in Megève, those extras are available by the day at 200 to 280 € net. This line is presented to the client as a separate service cost. Never attempt to serve thirty covers in double-hat kitchen and dining room mode.',
      },

      { kind: 'h2', text: 'Pricing the event' },
      {
        kind: 'p',
        text: 'A thirty-cover private event during a seasonal mission represents a full day of total mobilisation, plus a quarter day the day before, plus the cost of the reinforcement team. The standard billing sits as a supplement to your mission package, in the form of a dedicated line.',
      },
      {
        kind: 'ul',
        items: [
          'Chef event fee for the day: 1 200 to 1 800 € net depending on format.',
          'Team reinforcement (commis and sous-chef): 800 to 1 600 € net depending on composition.',
          'Additional dining room service (extras): 400 to 800 € net depending on headcount.',
          'Premium produce overhead on the grocery fund: 70 to 150 € per cover on demanding products (truffle, caviar, foie gras, lobster).',
        ],
      },
      {
        kind: 'p',
        text: 'The ultra-affluent client expects this level of structuring. Presenting a thirty-cover event with a flat "it fits the package" reads as amateur. Presenting a detailed event line with the components above reads as professional. This structuring also gives you the margin to execute calmly, which shows on the plate.',
      },

      { kind: 'h2', text: 'The strategic principle' },
      {
        kind: 'p',
        text: 'The private event is the moment when your professional level becomes most visible. The client invites their peers, who judge them on the quality of the table. A successful event dinner during a seasonal mission triggers in 30 to 50% of cases a new mission within the following twelve months, either with the same client or with one of their guests. The return on investment of operational rigour on those dinners is the highest of the entire mission. Price accordingly, and execute with the seriousness of an operation that structures your following season.',
      },
    ],
  },
};
