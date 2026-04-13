
export interface ArticleBlock {
  type: 'paragraph' | 'h2' | 'h3' | 'list' | 'quote';
  content: string | string[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  category: string;
  image: string;
  blocks: ArticleBlock[];
  relatedLink: string;
  relatedLinkText: string;
}

export const articles: Article[] = [
  {
    id: '1',
    slug: 'chef-prive-sejour-longue-duree',
    title: "Chef privé pour séjours longue durée : L'art de la constance",
    subtitle: "Pourquoi la gestion d'une cuisine sur plusieurs semaines requiert une logistique hôtelière, pas juste de la cuisine.",
    date: "Octobre 2023",
    category: "Longue Durée",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      {
        type: 'paragraph',
        content: "Lorsqu'une famille s'installe dans une résidence pour un mois ou plus, les besoins culinaires diffèrent radicalement de ceux d'un court séjour. La nouveauté du restaurant s'estompe pour laisser place à un besoin fondamental de nutrition, de régularité et d'hyper-personnalisation."
      },
      {
        type: 'h2',
        content: "Les enjeux de ce type de mission"
      },
      {
        type: 'paragraph',
        content: "Le point de friction principal dans les missions de longue durée n'est pas la technique culinaire, mais l'endurance logistique. Il s'agit de gérer les stocks sur la durée, d'éviter la répétition des menus, et de s'intégrer dans l'intimité d'une famille sans devenir intrusif."
      },
      {
        type: 'h2',
        content: "Notre approche"
      },
      {
        type: 'paragraph',
        content: "Un chef Chef Talents commence par cartographier la chaîne d'approvisionnement locale : accès aux marchés matinaux, relations avec les fermes biologiques locales, et sécurisation des produits spécifiques aux habitudes du client qui doivent être importés. Nous privilégions une cuisine 'invisible' mais omniprésente, adaptée au rythme du foyer."
      },
      {
        type: 'h2',
        content: "Exemples de situations"
      },
      {
        type: 'list',
        content: [
          "Gestion des repas 'invisibles' : smoothies post-entraînement, collations pour enfants.",
          "Coordination avec le personnel de maison pour les flux de service.",
          "Protocoles d'hygiène stricts adaptés aux résidents immunodéprimés ou aux jeunes enfants.",
          "Discrétion absolue concernant les invités et les conversations (NDA)."
        ]
      },
      {
        type: 'h2',
        content: "Pourquoi Chef Talents"
      },
      {
        type: 'quote',
        content: "Notre objectif n'est pas d'impressionner un soir, mais de soutenir un mode de vie sur la durée. C'est la différence entre un prestataire et un pilier domestique."
      }
    ]
  },
  {
    id: '2',
    slug: 'chef-prive-villa',
    title: "Chef privé pour villas privées : Standards hôteliers à domicile",
    subtitle: "L'importance de l'autonomie et de l'intégration dans des environnements privés non standardisés.",
    date: "Novembre 2023",
    category: "Villas",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      {
        type: 'paragraph',
        content: "Opérer dans une villa privée n'est pas opérer dans un restaurant. L'équipement varie, l'espace est partagé avec les clients, et les ressources ne sont pas illimitées. Le chef doit être un caméléon opérationnel."
      },
      {
        type: 'h2',
        content: "Les enjeux de ce type de mission"
      },
      {
        type: 'paragraph',
        content: "Le défi majeur est l'autonomie. Dans une villa isolée, il n'y a pas de brigade de support. Le chef est responsable de tout, de l'achat des ingrédients à la gestion des déchets, en passant par le service et le nettoyage final, tout en maintenant un standard d'excellence."
      },
      {
        type: 'h2',
        content: "Notre approche"
      },
      {
        type: 'paragraph',
        content: "Nous sélectionnons des profils ayant une double compétence : excellence gastronomique et débrouillardise logistique. Avant chaque mission, une vérification des équipements est effectuée pour anticiper les besoins techniques."
      },
      {
        type: 'h2',
        content: "Exemples de situations"
      },
      {
        type: 'list',
        content: [
          "Dîners formels assis pour 12 convives avec accords mets-vins.",
          "Buffets décontractés au bord de la piscine.",
          "Cuisine ouverte nécessitant une présentation et une interaction impeccables.",
          "Adaptation immédiate aux changements de nombre de convives."
        ]
      },
      {
        type: 'h2',
        content: "Pourquoi Chef Talents"
      },
      {
        type: 'quote',
        content: "Nous transformons une résidence privée en une extension d'un palace, où le service est fluide et la cuisine est une expérience, pas une contrainte."
      }
    ]
  },
  {
    id: '3',
    slug: 'chef-prive-chalet-montagne',
    title: "Chef privé en chalet : La logistique d'altitude",
    subtitle: "Naviguer entre les exigences caloriques de l'après-ski et la finesse gastronomique.",
    date: "Décembre 2023",
    category: "Montagne",
    image: "https://images.unsplash.com/photo-1516571589254-46487e38c92a?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/conciergeries",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      {
        type: 'paragraph',
        content: "La saison hivernale dans les Alpes présente une dualité physiologique unique. Les hôtes reviennent des pistes épuisés, nécessitant une restauration calorique, tout en attendant le raffinement de la gastronomie moderne. Équilibrer 'comfort food' et 'étoilé Michelin' est l'art spécifique du chef de chalet."
      },
      {
        type: 'h2',
        content: "Les enjeux de ce type de mission"
      },
      {
        type: 'paragraph',
        content: "Cuisiner à 1850m altère la chimie des cuissons. Plus important encore, cela altère l'accès. De fortes chutes de neige peuvent couper les approvisionnements. La gestion du timing est aussi cruciale : petit-déjeuner pour l'école de ski, tea-time immédiat au retour, dîner social."
      },
      {
        type: 'h2',
        content: "Notre approche"
      },
      {
        type: 'paragraph',
        content: "Nos chefs de la Sélection Select pour les régions alpines sont validés pour leur capacité à planifier des tampons d'approvisionnement de 72h, garantissant que la qualité des produits frais ne baisse jamais, quelle que soit la météo."
      },
      {
        type: 'h2',
        content: "Exemples de situations"
      },
      {
        type: 'list',
        content: [
          "Menus petit-déjeuner denses en nutriments pour l'endurance.",
          "Compétences en pâtisserie fine pour le service de l'Afternoon Tea.",
          "Adaptabilité aux régimes alimentaires variés au sein d'un même groupe familial."
        ]
      },
      {
        type: 'h2',
        content: "Pourquoi Chef Talents"
      },
      {
        type: 'quote',
        content: "Une expertise locale des stations (Courchevel, Gstaad, Megève) permet à nos chefs de sourcer les meilleurs produits malgré les contraintes logistiques."
      }
    ]
  },
  {
    id: '4',
    slug: 'chef-prive-yacht',
    title: "Chef privé sur yacht : Une opération de précision",
    subtitle: "Pourquoi les chefs de yacht sont une catégorie à part dans l'hospitalité privée.",
    date: "Septembre 2023",
    category: "Yachting",
    image: "https://images.unsplash.com/photo-1569263979104-865ab7dd8d36?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=concierge",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      {
        type: 'paragraph',
        content: "Dans le monde du superyachting, la cuisine (galley) est le cœur du navire. Contrairement à une villa, un yacht n'a pas de 'magasin au coin de la rue'. Une fois les amarres larguées, le chef est seul responsable de l'expérience gastronomique."
      },
      {
        type: 'h2',
        content: "Les enjeux de ce type de mission"
      },
      {
        type: 'paragraph',
        content: "L'espace est fini. Un chef doit équilibrer le stockage des produits secs, la durée de vie des produits frais et la capacité des congélateurs. Il doit aussi gérer la double contrainte : nourrir un équipage de 10 à 20 personnes tout en servant des menus dégustation aux invités."
      },
      {
        type: 'h2',
        content: "Notre approche"
      },
      {
        type: 'paragraph',
        content: "Le chef yachting doit calculer la consommation avec une précision mathématique. La flexibilité est la seule constante : un changement de météo ou de mouillage nécessite une adaptation immédiate du menu."
      },
      {
        type: 'h2',
        content: "Exemples de situations"
      },
      {
        type: 'list',
        content: [
          "Provisioning stratégique avant les traversées.",
          "Gestion du mal de mer et service en mouvement.",
          "Cuisine pour équipage (Crew Mess) nutritive et variée pour maintenir le moral.",
          "Service sur le pont arrière ou pique-niques sur plage isolée."
        ]
      },
      {
        type: 'h2',
        content: "Pourquoi Chef Talents"
      },
      {
        type: 'quote',
        content: "Nos chefs sont certifiés STCW et expérimentés en mer. Ils comprennent la hiérarchie du bord et les impératifs de sécurité."
      }
    ]
  },
  {
    id: '5',
    slug: 'chef-prive-famille-uhnw',
    title: "Chef privé pour familles UHNW : Intendance nutritionnelle",
    subtitle: "Le rôle du chef dans la santé et le bien-être à long terme des foyers exigeants.",
    date: "Janvier 2024",
    category: "Famille & Santé",
    image: "https://images.unsplash.com/photo-1629272365287-43c220f121a2?q=80&w=1931&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      {
        type: 'paragraph',
        content: "Pour les familles Ultra-High-Net-Worth, le temps est l'actif ultime, mais la santé est la richesse primordiale. Un chef privé permanent n'est pas seulement une commodité ; il est le gardien du bien-être nutritionnel de la famille."
      },
      {
        type: 'h2',
        content: "Les enjeux de ce type de mission"
      },
      {
        type: 'paragraph',
        content: "Au-delà des allergies, les chefs privés modernes gèrent des protocoles alimentaires complexes (Keto, Paleo, anti-inflammatoire) dirigés par les praticiens de la famille. Le chef agit comme l'exécutant de ces stratégies de santé."
      },
      {
        type: 'h2',
        content: "Notre approche"
      },
      {
        type: 'paragraph',
        content: "Un chef permanent travaille au cœur du foyer. Il voit la famille au petit-déjeuner, en pyjama, dans les moments de stress et de détente. Les compétences humaines — intelligence émotionnelle, discrétion — sont pondérées à égalité avec la capacité culinaire."
      },
      {
        type: 'h2',
        content: "Exemples de situations"
      },
      {
        type: 'list',
        content: [
          "Collaboration avec les nutritionnistes ou médecins de la famille.",
          "Sourcing d'ingrédients biologiques, non-OGM et traçables.",
          "Ingénierie des menus pour intégrer des nutriments pour les enfants.",
          "Gestion des repas du personnel pour assurer l'harmonie du foyer."
        ]
      },
      {
        type: 'h2',
        content: "Pourquoi Chef Talents"
      },
      {
        type: 'quote',
        content: "La confiance est notre devise. Nous plaçons des professionnels dont l'intégrité et la discrétion ont été rigoureusement validées."
      }
    ]
  }
  
,{
    id: '6',
    slug: 'chef-prive-cote-azur-ete-2026',
    title: "Chef privé Côte d'Azur : guide complet été 2026",
    subtitle: "Comment trouver et sécuriser un chef privé pour votre villa sur la Côte d'Azur pour la saison estivale.",
    date: "Avril 2026",
    category: "Côte d'Azur",
    image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "La saison estivale sur la Côte d'Azur représente la période la plus dense de l'année pour les chefs privés en Europe. Villas de Saint-Tropez, résidences de Cap Ferrat, propriétés de Mougins — la demande explose entre juin et septembre, et les meilleurs profils se réservent plusieurs mois à l'avance." },
      { type: 'h2', content: "Pourquoi la Côte d'Azur est un marché à part" },
      { type: 'paragraph', content: "La Côte d'Azur concentre une densité exceptionnelle de résidences privées haut de gamme. Un chef qui excelle en résidence parisienne n'est pas nécessairement adapté à une villa avec piscine à Ramatuelle où il devra gérer un marché provençal à 7h du matin, cuisiner pour 12 personnes le midi et dresser un dîner gastronomique le soir." },
      { type: 'h2', content: "Les zones les plus demandées" },
      { type: 'h3', content: "Saint-Tropez et le Var" },
      { type: 'paragraph', content: "Saint-Tropez reste le point de concentration le plus fort. Les villas du golfe imposent des standards élevés — produits locaux, cuisine méditerranéenne maîtrisée, capacité à gérer des groupes festifs sans perdre en qualité." },
      { type: 'h3', content: "Antibes, Cap d'Antibes" },
      { type: 'paragraph', content: "Le Cap d'Antibes accueille des résidences plus discrètes, souvent occupées sur des durées plus longues. La régularité prime sur le spectaculaire." },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission ponctuelle (1–3 jours) : 500€ à 1 200€ par jour hors matières premières.", "Mission semaine : 2 500€ à 6 000€ selon l'intensité du service.", "Mission saisonnière (1–3 mois) : 6 000€ à 15 000€ par mois."] },
      { type: 'h2', content: "Comment sécuriser un bon chef" },
      { type: 'quote', content: "Les meilleurs chefs sont réservés dès février–mars pour la saison estivale. En avril, les profils les plus demandés ont déjà plusieurs semaines bloquées." }
    ]
  },
  {
    id: '7',
    slug: 'private-chef-french-riviera-guide',
    title: "Private chef French Riviera : the complete guide 2026",
    subtitle: "Everything you need to know about hiring a private chef for your villa on the French Riviera.",
    date: "April 2026",
    category: "French Riviera",
    image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Submit a request",
    blocks: [
      { type: 'paragraph', content: "The French Riviera is one of the most competitive markets in Europe for private chefs. Demand peaks between June and September, and the best profiles are booked months in advance. Here is everything you need to know to secure the right chef for your villa or yacht." },
      { type: 'h2', content: "Why hiring a private chef on the Riviera is different" },
      { type: 'paragraph', content: "Short but intense stays, large rotating groups, outdoor dining in summer heat, fresh market logistics, and clients with extremely high standards. A chef who performs brilliantly in a Paris apartment may struggle with a 12-person villa dinner in Ramatuelle." },
      { type: 'h2', content: "Key areas" },
      { type: 'h3', content: "Saint-Tropez and the Var" },
      { type: 'paragraph', content: "The most in-demand area. Villas in the Gulf of Saint-Tropez command the highest rates and the most experienced chefs. Expect Mediterranean cuisine at its finest and strong local sourcing." },
      { type: 'h3', content: "Antibes, Cap d'Antibes, Cannes" },
      { type: 'paragraph', content: "Longer stays, more residential. Clients here often want a chef who integrates into family life while maintaining a consistently high level." },
      { type: 'h2', content: "Rates 2026" },
      { type: 'list', content: ["Short mission (1–3 days): €600 to €1,400 per day excluding ingredients.", "Weekly mission: €3,000 to €7,000 depending on service intensity.", "Seasonal placement (1–3 months): €7,000 to €16,000 per month."] },
      { type: 'quote', content: "The best chefs are fully booked by March for the summer season. Submit your brief now with full details — location, exact dates, group size and budget." }
    ]
  },
  {
    id: '8',
    slug: 'chef-prive-ibiza-2026',
    title: "Chef privé Ibiza 2026 : trouver le bon profil pour votre villa",
    subtitle: "Guide complet pour engager un chef privé à Ibiza : saisonnalité, profils et logistique.",
    date: "Avril 2026",
    category: "Ibiza",
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Ibiza s'est imposée comme l'une des destinations les plus demandées d'Europe pour les villas privées haut de gamme. De juin à septembre, l'île concentre une clientèle internationale exigeante et une logistique culinaire complexe." },
      { type: 'h2', content: "Une saison courte, une demande intense" },
      { type: 'paragraph', content: "La saison active à Ibiza dure environ quatre mois. Les villas les plus importantes font venir leurs chefs depuis la France, l'Espagne ou l'Italie, souvent pour la saison entière." },
      { type: 'h2', content: "Spécificités culinaires d'Ibiza" },
      { type: 'paragraph', content: "La clientèle est souvent internationale et cosmopolite. Les attentes reflètent cette diversité : cuisine méditerranéenne légère, végétarienne et végane fréquemment demandées, maîtrise des régimes alimentaires variés." },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission semaine : 3 500€ à 7 000€ selon le profil.", "Saison complète (juin–septembre) : 12 000€ à 20 000€ par mois pour un chef senior."] },
      { type: 'quote', content: "Les réservations pour Ibiza se font idéalement en janvier–février. En avril, il reste des disponibilités mais les profils les plus demandés sont déjà pris." }
    ]
  },
  {
    id: '9',
    slug: 'combien-coute-chef-prive',
    title: "Combien coûte un chef privé à domicile ? Tarifs 2026",
    subtitle: "Grille tarifaire complète d'un chef privé selon la mission, le niveau, la durée et la localisation.",
    date: "Avril 2026",
    category: "Guide pratique",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Le coût d'un chef privé varie considérablement selon le profil, la durée, la localisation et le niveau de service attendu. Voici une grille tarifaire réaliste pour 2026, basée sur le marché européen." },
      { type: 'h2', content: "Ce que comprend le tarif" },
      { type: 'paragraph', content: "Le tarif journalier couvre le temps et les compétences du chef — pas les ingrédients. La plupart des missions fonctionnent avec un budget matières premières séparé, refacturé au coût réel." },
      { type: 'h2', content: "Grille tarifaire 2026" },
      { type: 'list', content: ["Dîner privé ponctuel : 300€ à 800€ selon le niveau et le nombre de convives.", "Mission courte (2–5 jours) : 400€ à 1 200€ par jour.", "Mission semaine : 2 500€ à 6 000€.", "Mission mensuelle : 5 000€ à 15 000€ par mois.", "Chef résident annuel : 6 000€ à 18 000€ brut par mois."] },
      { type: 'h2', content: "Les facteurs qui font varier le tarif" },
      { type: 'list', content: ["Le profil : expérience étoilée, formation internationale.", "La localisation : Côte d'Azur, Ibiza, Monaco en saison — majoration de 20 à 40%.", "Les langues : chef multilingue plus rare et plus cher.", "La discrétion : une compétence à part entière dans les environnements UHNW."] },
      { type: 'quote', content: "Pour une semaine dans une villa à Saint-Tropez pour 8 personnes avec un chef senior : tarif chef 4 500€, matières premières 4 000€, déplacement 300€. Budget total : environ 8 800€." }
    ]
  },
  {
    id: '10',
    slug: 'chef-prive-saint-tropez',
    title: "Chef privé Saint-Tropez : standards, profils et tarifs",
    subtitle: "Saint-Tropez impose des standards culinaires particuliers. Comment trouver un chef privé à la hauteur.",
    date: "Avril 2026",
    category: "Côte d'Azur",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Saint-Tropez est l'un des marchés les plus exigeants d'Europe pour les chefs privés. La concentration de villas haut de gamme, de yachts et de clients internationaux crée une demande soutenue pour des profils d'exception — et une pénurie chronique des meilleurs chefs en haute saison." },
      { type: 'h2', content: "Le contexte culinaire de Saint-Tropez" },
      { type: 'paragraph', content: "Les villas du golfe de Saint-Tropez accueillent une clientèle habituée aux meilleures tables du monde. Le chef privé doit délivrer un niveau gastronomique constant, avec une maîtrise parfaite des produits méditerranéens locaux." },
      { type: 'h2', content: "Les profils les plus demandés" },
      { type: 'list', content: ["Chef gastronomique mobile : formation haute cuisine, idéal pour séjours courts avec dîners d'exception.", "Chef résident saisonnier : s'installe pour toute la saison. Profil rare, très recherché.", "Chef yacht : pour les propriétaires qui alternent entre villa et bateau."] },
      { type: 'h2', content: "Tarifs à Saint-Tropez en 2026" },
      { type: 'list', content: ["Mission courte (3–7 jours) : 600€ à 1 400€ par jour.", "Saison complète (juillet–août) : 8 000€ à 16 000€ par mois."] },
      { type: 'quote', content: "Juillet et août sont complets pour les meilleurs chefs dès le mois de mars. Si votre séjour est prévu en été, soumettez votre demande maintenant." }
    ]
  }
];
