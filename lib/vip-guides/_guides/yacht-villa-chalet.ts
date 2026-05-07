// lib/vip-guides/_guides/yacht-villa-chalet.ts
// Guide VIP — Yacht, villa, chalet : adapter sa cuisine et son rythme
// FR / EN — pilier "operations"

import type { Guide } from '../types';

export const yachtVillaChalet: Guide = {
  slug: 'yacht-villa-chalet',
  heroImage: '/images/email/hero-vip-welcome.jpg',
  readingMinutes: 7,
  pillar: 'operations',
  publishedAt: '2026-05-07',

  fr: {
    title: 'Yacht, villa, chalet : adapter sa cuisine et son rythme à chaque terrain',
    excerpt:
      'Trois environnements qui semblent voisins et qui imposent des logiques opposées. Ce qui change dans la prep, dans le service, dans la relation avec l’équipage. Et pourquoi un même chef peut briller dans l’un et s’épuiser dans l’autre.',
    body: [
      {
        kind: 'p',
        text: 'Beaucoup de chefs privés expérimentés acceptent indifféremment yacht, villa et chalet en pensant qu’il s’agit du même métier livré dans trois décors différents. Trois saisons sur le terrain montrent l’inverse. Le yacht, la villa et le chalet sont trois métiers proches, avec des contraintes opérationnelles fondamentalement distinctes. Comprendre ces différences avant de signer permet de choisir les missions où vous êtes structurellement bon, et d’éviter celles où vous serez en survie pendant six semaines.',
      },

      { kind: 'h2', text: 'Le yacht : tout est conditionné par l’espace et la mer' },
      {
        kind: 'p',
        text: 'La cuisine d’un yacht de moins de 30 mètres tient dans dix à quinze mètres carrés, souvent moins. Vous travaillez dans un espace où chaque mouvement compte, où la chaleur monte vite, où le plan de travail est rarement supérieur à un mètre cinquante. La capacité de stockage froid se compte en litres, pas en mètres cubes. Sur certains charters de moins de 25 mètres, vous gérez l’ensemble des produits frais d’une semaine de service avec la place d’un grand frigo combiné domestique.',
      },
      {
        kind: 'p',
        text: 'Cette contrainte impose une discipline de prep impitoyable. Vous travaillez en flux tendu sur les produits frais, vous standardisez les bases (fonds, marinades, condiments) au maximum, vous évitez les dressages qui demandent plusieurs zones de finition simultanées. Les chefs qui adorent les multi-bouchées et les montages à pince souffrent sur yacht. Ceux qui aiment la cuisine de produit, simple, dressée à la dernière minute, y excellent.',
      },
      {
        kind: 'p',
        text: 'L’autre paramètre est l’imprévisibilité. Le client décide à 11h qu’il veut déjeuner à 12h45 dans une crique trois miles plus loin. La stewardess vous transmet le changement, vous adaptez. Le service à 14h est repoussé à 16h parce que la sortie en jet ski s’est étirée. Le rythme yacht ne pardonne pas la rigidité, il récompense l’improvisation cadrée. Si vous travaillez mieux avec un planning posé la veille, le yacht n’est probablement pas votre terrain.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Sur les yachts charter, la chief stew tient le service. C’est elle qui dicte le timing du dressage, qui parle au client, qui transmet les retours. Considérez-la comme votre directrice de salle, pas comme une serveuse. Sur les neuf missions où j’ai vu un conflit chef-stew, sept se sont terminées par le départ anticipé du chef.',
      },

      { kind: 'h2', text: 'La villa : la liberté qui peut devenir un piège' },
      {
        kind: 'p',
        text: 'En villa, vous récupérez l’espace, le temps et l’autonomie. Une cuisine de villa haut de gamme dispose souvent de deux pianos, d’une chambre froide, d’un garde-manger sec, d’une zone de plonge dédiée et parfois d’un four à basse température. Vous pouvez prép la veille, marquer trois services en parallèle, gérer un dîner pour quinze sans jamais être en surchauffe technique.',
      },
      {
        kind: 'p',
        text: 'Cette liberté est aussi le piège. Sans la pression structurelle du yacht, beaucoup de chefs se laissent aller à un programme trop ambitieux. Trois services par jour de complexité élevée, avec dressage à l’assiette, sur six semaines, c’est insoutenable. Les chefs qui durent en villa sont ceux qui se construisent une routine de prep le matin, qui sécurisent un déjeuner sobre et reproductible, et qui investissent leur énergie créative sur un seul service par jour, le dîner.',
      },
      {
        kind: 'p',
        text: 'L’autre dimension de la villa, c’est la relation directe avec le client. Sur un yacht, vous voyez peu le client en dehors de la présentation des plats. En villa, vous croisez la maîtresse de maison à 8h du matin pendant qu’elle prépare le café. Vous discutez du dîner du soir devant la machine à expresso. Cette proximité est une opportunité commerciale puissante (les clients fidélisent à la personnalité du chef, pas à son CV) mais elle exige une discipline relationnelle constante. Le chef privé en villa est aussi en représentation, douze heures par jour, six jours sur sept.',
      },

      { kind: 'h2', text: 'Le chalet : la précision et le froid' },
      {
        kind: 'p',
        text: 'Le chalet d’hiver à Courchevel, Verbier, Megève ou Gstaad combine deux contraintes que le yacht et la villa n’ont pas. La première est l’altitude et le froid, qui modifient les cuissons (les fonds réduisent moins vite, les pâtes lèvent autrement, les fruits travaillés en pâtisserie demandent une compensation). La deuxième est l’horaire structuré autour du ski. Les clients partent vers 9h-10h, rentrent vers 16h-17h pour le goûter, repartent en activité de fin d’après-midi, dînent à 20h-21h. Cette structure est une bénédiction logistique : vous savez à 8h ce que vous ferez à 21h.',
      },
      {
        kind: 'p',
        text: 'Le service en chalet exige une cuisine plus généreuse, plus chaude, plus réconfortante. Les clients qui ont skié toute la journée n’ont pas envie d’une succession de bouchées d’agrumes et de tartare de daurade en sortie de piste. Ils veulent un plat principal qui tient, accompagné d’un vin rouge structuré, suivi d’un dessert qui rassemble. Les chefs qui réussissent en chalet sont ceux qui savent donner au plat principal une présence sans tomber dans la rusticité. C’est un équilibre étroit que le segment ultra-aisé apprécie quand il est tenu.',
      },
      {
        kind: 'p',
        text: 'L’opportunité commerciale du chalet, c’est la fidélisation au site. Une famille qui revient chaque année dans la même résidence pendant cinq ans constitue le ticket d’or des chefs privés saisonniers. Si vous êtes celui que la maison a aimé pendant trois saisons, vous êtes structurellement à l’abri. La géographie joue pour vous : moins de remplaçants disponibles dans les Alpes que sur la Côte d’Azur, donc moins de pression concurrentielle annuelle.',
      },

      { kind: 'h2', text: 'Choisir son terrain selon son tempérament' },
      {
        kind: 'p',
        text: 'Tous les chefs expérimentés ne sont pas adaptés aux trois environnements. Le yacht récompense l’endurance physique, l’improvisation cadrée, la résistance au confinement. Si vous avez plus de 50 ans et que vous tenez à votre dos, deux saisons yacht consécutives peuvent vous coûter cher. La villa récompense la régularité, la maîtrise du dîner formel, et la posture relationnelle. Si vous êtes plus à l’aise derrière le piano que face au client, vous serez en effort permanent. Le chalet récompense la cuisine généreuse et reproductible, la capacité à servir un plat principal réconfortant à un haut niveau, et l’ancrage local.',
      },
      {
        kind: 'p',
        text: 'Sur les chefs que je conseille dans le réseau, ceux qui durent à haut niveau sur dix ans ont généralement choisi un terrain dominant et un terrain secondaire. Yacht en été, villa en hiver. Ou villa toute l’année, plus une mission ponctuelle. Ou chalet en hiver, événementiel ponctuel le reste du temps. La spécialisation construit la maîtrise et la maîtrise construit le tarif. Vouloir tout faire conduit à un niveau moyen partout et à un tarif plafonné.',
      },

      { kind: 'h2', text: 'Le critère qui tranche en cas de doute' },
      {
        kind: 'p',
        text: 'Quand un chef hésite entre deux missions sur des terrains différents, la question utile n’est pas "laquelle paie le mieux". C’est "laquelle me met en condition de livrer mon meilleur niveau". Une mission yacht à 1 100 € net par jour livrée à 70 % de votre capacité vous coûte plus cher en réputation qu’une mission villa à 750 € livrée à 95 %. Les agents et les conciergeries observent moins votre tarif que la régularité de votre exécution, et la régularité ne se construit que sur un terrain que vous maîtrisez.',
      },
      {
        kind: 'p',
        text: 'Le tarif suit la maîtrise. La maîtrise suit le choix du terrain. Choisir son terrain, c’est le premier acte stratégique d’une carrière de chef privé qui dure.',
      },
    ],
  },

  en: {
    title: 'Yacht, villa, chalet: adapting your kitchen and your rhythm to each ground',
    excerpt:
      'Three environments that seem close and impose opposite logics. What changes in prep, service, and crew relationships. And why the same chef can shine in one and burn out in another.',
    body: [
      {
        kind: 'p',
        text: 'Many experienced private chefs accept yacht, villa and chalet missions interchangeably, assuming it is the same craft delivered in three different sets. Three seasons on the ground prove the opposite. Yacht, villa and chalet are three close cousins of the same craft, with fundamentally distinct operational constraints. Understanding these differences before signing lets you pick the missions where you are structurally good, and avoid those where you will be in survival mode for six weeks.',
      },

      { kind: 'h2', text: 'Yacht: everything is conditioned by space and sea' },
      {
        kind: 'p',
        text: 'The galley of a yacht under 30 metres fits in ten to fifteen square metres, often less. You work in a space where every move counts, where heat rises fast, where the work surface rarely exceeds one and a half metre. Cold storage capacity is measured in litres, not cubic metres. On some sub-25 metre charters, you handle all the fresh produce of a service week with the space of a large home combo fridge.',
      },
      {
        kind: 'p',
        text: 'This constraint imposes a relentless prep discipline. You work just-in-time on fresh produce, you standardise bases (stocks, marinades, condiments) as much as possible, you avoid plating that requires several finishing zones running in parallel. Chefs who love multi-bite tasting menus and tweezer-built compositions struggle on yachts. Those who love produce-driven cooking, simple, plated at the last second, excel there.',
      },
      {
        kind: 'p',
        text: 'The other parameter is unpredictability. The client decides at 11 am they want lunch at 12:45 in a cove three miles further. The stewardess passes the change, you adapt. The 2 pm service slips to 4 pm because the jet ski outing stretched. Yacht rhythm does not forgive rigidity, it rewards framed improvisation. If you work better with a schedule set the day before, the yacht is probably not your ground.',
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'On charter yachts, the chief stew runs the service. She dictates plating timing, talks to the client, conveys feedback. Treat her as your service director, not as a server. Out of nine chef-stew conflicts I have witnessed, seven ended with the chef leaving early.',
      },

      { kind: 'h2', text: 'Villa: freedom that can become a trap' },
      {
        kind: 'p',
        text: 'In a villa, you regain space, time, and autonomy. A high-end villa kitchen often features two ranges, a cold room, a dry pantry, a dedicated dishwashing area, and sometimes a low-temperature oven. You can prep the day before, run three services in parallel, handle a dinner for fifteen without ever hitting technical overload.',
      },
      {
        kind: 'p',
        text: 'That freedom is also the trap. Without the structural pressure of a yacht, many chefs let themselves slip into an over-ambitious programme. Three services a day at high complexity, plated to the dish, over six weeks, is unsustainable. Chefs who last in villas are those who build a morning prep routine, secure a sober and reproducible lunch, and invest their creative energy on a single service per day, dinner.',
      },
      {
        kind: 'p',
        text: 'The other dimension of villa work is the direct client relationship. On a yacht, you see the client mostly at plating. In a villa, you cross the lady of the house at 8 am while she makes coffee. You discuss the evening with her at the espresso machine. This proximity is a powerful commercial opportunity (clients become loyal to the chef’s personality, not their CV) but it demands constant relational discipline. The villa private chef is also performing, twelve hours a day, six days a week.',
      },

      { kind: 'h2', text: 'Chalet: precision and cold' },
      {
        kind: 'p',
        text: 'Winter chalets in Courchevel, Verbier, Megève or Gstaad combine two constraints absent from yacht and villa work. First, altitude and cold modify cooking (stocks reduce slower, doughs rise differently, pastry fruits require compensation). Second, the schedule revolves around skiing. Clients leave around 9-10 am, return at 4-5 pm for tea, head out for late afternoon activities, dine at 8-9 pm. This structure is a logistical blessing: at 8 am you know what you will be doing at 9 pm.',
      },
      {
        kind: 'p',
        text: 'Service in a chalet calls for a more generous, warmer, more comforting cuisine. Clients who skied all day do not want a procession of citrus bites and sea bream tartare on the way in from the slopes. They want a main course with presence, accompanied by a structured red wine, followed by a dessert that gathers everyone. Chefs who succeed in chalets are those who can give the main course presence without falling into rusticity. It is a tight balance the ultra-affluent segment appreciates when it is held.',
      },
      {
        kind: 'p',
        text: 'The commercial opportunity of chalet work is site loyalty. A family that returns every year to the same residence for five years is the gold ticket of seasonal private chefs. If you are the one the house liked for three consecutive seasons, you are structurally protected. Geography plays in your favour: fewer available substitutes in the Alps than on the Riviera, hence less yearly competitive pressure.',
      },

      { kind: 'h2', text: 'Choosing your ground based on temperament' },
      {
        kind: 'p',
        text: 'Not every experienced chef fits all three environments. The yacht rewards physical endurance, framed improvisation, resistance to confinement. If you are over 50 and care about your back, two consecutive yacht seasons can cost you dearly. The villa rewards regularity, mastery of formal dinner, and relational posture. If you are more comfortable behind the range than in front of the client, you will be in constant effort. The chalet rewards generous and reproducible cooking, the ability to deliver a comforting main course at high level, and local roots.',
      },
      {
        kind: 'p',
        text: 'Among chefs I advise in the network, those who last at high level over a decade have generally chosen a dominant ground and a secondary one. Yacht in summer, villa in winter. Or villa all year plus one occasional mission. Or chalet in winter, occasional events the rest of the year. Specialisation builds mastery, and mastery builds the rate. Trying to do everything leads to average level everywhere and a capped rate.',
      },

      { kind: 'h2', text: 'The criterion that decides in case of doubt' },
      {
        kind: 'p',
        text: 'When a chef hesitates between two missions on different grounds, the useful question is not "which one pays better". It is "which one puts me in condition to deliver my best level". A yacht mission at 1 100 € net per day delivered at 70% of your capacity costs more in reputation than a villa mission at 750 € delivered at 95%. Agents and concierges observe regularity of execution more than headline rate, and regularity only builds on ground you master.',
      },
      {
        kind: 'p',
        text: 'Rate follows mastery. Mastery follows ground choice. Choosing your ground is the first strategic act of a private chef career that lasts.',
      },
    ],
  },
};
