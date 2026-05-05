
export interface ArticleBlock {
  type: 'paragraph' | 'h2' | 'h3' | 'list' | 'quote';
  content: string | string[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  date: string;            // affichage humain ("Avril 2026")
  publishedAt?: string;    // ISO pour SEO ("2026-04-01")
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
    publishedAt: "2023-10-01",
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
    publishedAt: "2023-11-01",
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
    publishedAt: "2023-12-01",
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
    publishedAt: "2023-09-01",
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
    publishedAt: "2024-01-01",
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
    publishedAt: "2026-04-01",
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
    publishedAt: "2026-04-01",
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
    publishedAt: "2026-04-01",
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
    publishedAt: "2026-04-01",
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
    publishedAt: "2026-04-01",
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
,{
    id: '11',
    slug: 'chef-prive-cannes',
    title: "Chef privé Cannes : villas, événements et festival",
    subtitle: "Trouver un chef privé à Cannes pour votre villa, votre yacht ou un événement privé.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Côte d'Azur",
    image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Cannes concentre une demande exceptionnelle en chefs privés, amplifiée par le Festival et les événements internationaux. Les villas des hauteurs, les yachts du Vieux-Port et les résidences du Cap d'Antibes créent un marché dense et exigeant toute l'année." },
      { type: 'h2', content: "Un marché particulier" },
      { type: 'paragraph', content: "À Cannes, le chef privé doit maîtriser deux registres : la cuisine de résidence quotidienne et la cuisine d'événement pour des dîners de 20 à 50 couverts. Le Festival de Cannes en mai crée un pic de demande extrême — les profils disponibles se raréfient dès février." },
      { type: 'h2', content: "Profils recommandés" },
      { type: 'list', content: ["Chef événementiel expérimenté pour les dîners de prestige.", "Chef résident pour les séjours longue durée en villa.", "Chef bilingue français-anglais pour la clientèle internationale du festival."] },
      { type: 'h2', content: "Tarifs à Cannes en 2026" },
      { type: 'list', content: ["Mission ponctuelle : 600€ à 1 400€ par jour.", "Période Festival (mai) : majoration de 30 à 50% sur les tarifs standards.", "Mission saisonnière : 7 000€ à 14 000€ par mois."] },
      { type: 'quote', content: "Cannes exige des profils capables de passer d'un dîner intime à un cocktail de 40 personnes sans perdre en qualité ni en discrétion." }
    ]
  },
  {
    id: '12',
    slug: 'chef-prive-monaco',
    title: "Chef privé Monaco : exigences, profils et discrétion",
    subtitle: "Monaco exige des chefs privés d'exception. Standards, profils et coordination pour résidences et yachts.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Monaco",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Monaco est la destination la plus exigeante d'Europe pour les chefs privés. La Principauté concentre une densité unique de résidences ultra-premium, de superyachts et de clients dont les standards sont parmi les plus élevés au monde." },
      { type: 'h2', content: "Les exigences spécifiques de Monaco" },
      { type: 'paragraph', content: "À Monaco, la discrétion n'est pas une option — c'est un prérequis absolu. Les chefs intervenant dans la Principauté signent systématiquement des accords de confidentialité stricts. Leur expérience doit être irréprochable, leur présentation impeccable, et leur capacité à s'effacer totale." },
      { type: 'h2', content: "Profils adaptés à Monaco" },
      { type: 'list', content: ["Chef avec expérience palace ou restaurant étoilé confirmée.", "Maîtrise obligatoire de l'anglais, le français étant un plus.", "Expérience en environnement UHNW validée et vérifiée.", "Capacité à travailler avec un personnel de maison structuré."] },
      { type: 'h2', content: "Tarifs à Monaco" },
      { type: 'list', content: ["Mission courte : 800€ à 1 600€ par jour.", "Mission mensuelle : 8 000€ à 18 000€ selon le profil.", "Chef résident annuel : sur devis, profils très sélectifs."] },
      { type: 'quote', content: "Monaco ne tolère pas l'approximation. Chaque profil que nous proposons pour la Principauté a été validé pour son niveau d'excellence et sa discrétion absolue." }
    ]
  },
  {
    id: '13',
    slug: 'chef-prive-mykonos',
    title: "Chef privé Mykonos : villas de luxe et gastronomie privée",
    subtitle: "Guide complet pour engager un chef privé à Mykonos pour votre villa ou votre yacht.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Grèce",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Mykonos s'est imposée comme l'une des destinations les plus prisées de Méditerranée pour les villas de luxe. La saison s'étend de juin à septembre, avec un pic intense en juillet-août où les villas avec piscine et vue mer accueillent une clientèle internationale fortunée." },
      { type: 'h2', content: "Spécificités culinaires de Mykonos" },
      { type: 'paragraph', content: "La cuisine grecque moderne — produits locaux exceptionnels, fruits de mer frais, légumes du terroir — est la base attendue. Les clients internationaux apprécient un chef capable de marier la gastronomie méditerranéenne contemporaine avec les spécialités locales des Cyclades." },
      { type: 'h2', content: "Logistique sur l'île" },
      { type: 'paragraph', content: "L'approvisionnement à Mykonos nécessite une anticipation rigoureuse. Le port de Mykonos Town reçoit des livraisons quotidiennes, mais les meilleurs produits sont souvent à commander à l'avance auprès de producteurs locaux. Un chef expérimenté sur l'île connaît ses fournisseurs." },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission semaine : 3 000€ à 7 000€ selon le profil.", "Saison complète : 10 000€ à 18 000€ par mois.", "Vols et hébergement à prévoir en supplément."] },
      { type: 'quote', content: "Mykonos en juillet-août, c'est le marché le plus tendu de Grèce. Les bons profils sont pris dès mars. Anticipez votre demande." }
    ]
  },
  {
    id: '14',
    slug: 'chef-prive-santorin',
    title: "Chef privé Santorin : l'excellence culinaire sur la caldeira",
    subtitle: "Engager un chef privé à Santorin pour votre villa avec vue sur la caldeira.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Grèce",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Santorin est l'une des destinations les plus photographiées du monde — et l'une des plus exigeantes pour les chefs privés. Les villas de Oia et Fira, perchées sur la caldeira, accueillent une clientèle en quête d'une expérience culinaire à la hauteur du décor exceptionnel." },
      { type: 'h2', content: "Un contexte unique" },
      { type: 'paragraph', content: "Les villas de Santorin sont souvent construites à flanc de falaise, avec des cuisines d'accès complexe et des contraintes logistiques particulières. L'approvisionnement en produits frais nécessite une organisation rigoureuse — le port d'Athènes est à 4h de bateau." },
      { type: 'h2', content: "Ce que les clients attendent" },
      { type: 'list', content: ["Cuisine méditerranéenne contemporaine intégrant les produits locaux : tomates cerises de Santorin, fava de Naxos, fruits de mer des Cyclades.", "Dîners au coucher du soleil sur terrasse — la présentation visuelle est primordiale.", "Capacité à gérer des groupes de 6 à 16 personnes pour des séjours de 7 à 14 jours."] },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission semaine : 2 800€ à 6 500€.", "Mission 2 semaines : 5 000€ à 11 000€."] },
      { type: 'quote', content: "À Santorin, le dîner face à la caldeira est un moment rituel. Le chef privé en est le metteur en scène silencieux." }
    ]
  },
  {
    id: '15',
    slug: 'chef-prive-sardaigne',
    title: "Chef privé Sardaigne : Costa Smeralda et villas de luxe",
    subtitle: "Engager un chef privé en Sardaigne pour la saison estivale : Costa Smeralda, Porto Cervo, Portisco.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Italie",
    image: "https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "La Costa Smeralda est l'une des destinations les plus exclusives de Méditerranée. Porto Cervo, Portisco, Baia Sardinia — ces enclaves concentrent des villas et des yachts dont les propriétaires attendent une expérience culinaire irréprochable." },
      { type: 'h2', content: "La cuisine sarde en contexte privé" },
      { type: 'paragraph', content: "La Sardaigne dispose d'un terroir exceptionnel : bottarga de Cabras, pecorino sardo, cochon de lait rôti, langoustes de la côte nord. Un chef expérimenté sur l'île sait tirer parti de ces produits tout en proposant une cuisine internationale adaptée aux clients étrangers." },
      { type: 'h2', content: "Logistique sur l'île" },
      { type: 'paragraph', content: "L'accès à la Costa Smeralda est aérien (aéroport d'Olbia) ou maritime. L'approvisionnement est possible via les marchés locaux et les grossistes d'Olbia, mais les produits premium doivent souvent être importés depuis le continent." },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission semaine : 3 200€ à 7 000€.", "Saison complète (juin–septembre) : 10 000€ à 17 000€ par mois."] },
      { type: 'quote', content: "La Costa Smeralda en juillet, c'est Porto Cervo et ses yachts de 50 mètres. Les chefs qui y opèrent ont l'habitude des standards les plus élevés." }
    ]
  },
  {
    id: '16',
    slug: 'chef-prive-porto-cervo',
    title: "Chef privé Porto Cervo : le summum de la Méditerranée",
    subtitle: "Porto Cervo concentre les standards les plus élevés de Méditerranée. Guide pour trouver le bon chef privé.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Italie",
    image: "https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Porto Cervo est la marina la plus exclusive de Méditerranée. En juillet-août, elle concentre une densité unique de superyachts et de villas ultra-premium dont les propriétaires attendent une cuisine à la hauteur de leur environnement." },
      { type: 'h2', content: "Standards culinaires à Porto Cervo" },
      { type: 'paragraph', content: "Les clients de Porto Cervo ont souvent leurs habitudes dans les plus grands restaurants du monde. Le chef privé doit délivrer un niveau étoilé dans un contexte opérationnel complexe — cuisine de villa ou galley de yacht, approvisionnement insulaire, groupes variables." },
      { type: 'h2', content: "Profils recommandés" },
      { type: 'list', content: ["Chef avec expérience superyacht ou restaurant étoilé.", "Maîtrise de l'italien, l'anglais et idéalement le français.", "Connaissance des producteurs locaux de Sardaigne.", "Expérience des environnements UHNW validée."] },
      { type: 'quote', content: "Porto Cervo en haute saison : les meilleures disponibilités partent en mars. Ne tardez pas à soumettre votre demande." }
    ]
  },
  {
    id: '17',
    slug: 'chef-prive-marbella',
    title: "Chef privé Marbella : villas de luxe et Costa del Sol",
    subtitle: "Guide pour trouver un chef privé à Marbella, Puerto Banús et sur la Costa del Sol.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Espagne",
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Marbella et Puerto Banús concentrent une clientèle internationale exigeante sur la Costa del Sol. Les villas de La Zagaleta, Sierra Blanca et Golden Mile accueillent des séjours de plusieurs semaines nécessitant des chefs privés de haut niveau." },
      { type: 'h2', content: "Le marché culinaire de Marbella" },
      { type: 'paragraph', content: "Marbella est un marché mature pour les chefs privés. La clientèle est internationale — britannique, russe, saoudienne, française — avec des attentes très variées. Le chef doit maîtriser plusieurs cuisines et s'adapter rapidement aux préférences de chaque groupe." },
      { type: 'h2', content: "Spécificités locales" },
      { type: 'list', content: ["Produits locaux exceptionnels : jamón ibérico, fruits de mer de l'Atlantique, légumes d'Andalousie.", "Cuisine en extérieur fréquente — barbecue, paella, service au bord de la piscine.", "Groupes importants fréquents — villas pouvant accueillir 20 à 30 personnes."] },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission semaine : 2 800€ à 6 000€.", "Mission mensuelle : 7 000€ à 13 000€."] },
      { type: 'quote', content: "Marbella offre une saison longue — d'avril à octobre — avec des pics en juillet et août. Les profils senior sont disponibles mais se réservent tôt." }
    ]
  },
  {
    id: '18',
    slug: 'chef-prive-portugal-algarve',
    title: "Chef privé Portugal : Algarve, Lisbonne et villas de luxe",
    subtitle: "Guide pour trouver un chef privé en Algarve ou à Lisbonne pour votre villa ou quinta.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Portugal",
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Le Portugal s'est imposé comme l'une des destinations premium d'Europe. L'Algarve, avec ses falaises et ses villas de luxe, et Lisbonne, avec ses quintas et ses palais rénovés, attirent une clientèle internationale en quête d'authenticité et de raffinement." },
      { type: 'h2', content: "L'Algarve : une destination en pleine montée en gamme" },
      { type: 'paragraph', content: "Vilamoura, Vale do Lobo, Quinta do Lago — ces enclaves de l'Algarve concentrent des villas dont le niveau s'est considérablement élevé ces cinq dernières années. La demande en chefs privés suit cette montée en gamme." },
      { type: 'h2', content: "Produits et cuisine au Portugal" },
      { type: 'list', content: ["Fruits de mer exceptionnels : percebes, percebes, langoustes, coquillages.", "Produits du terroir : huile d'olive alentejana, fromages, vins du Douro et de l'Alentejo.", "Cuisine contemporaine portugaise très appréciée des clients internationaux."] },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission semaine : 2 500€ à 5 500€.", "Mission mensuelle : 6 000€ à 12 000€."] },
      { type: 'quote', content: "Le Portugal offre un rapport qualité-prix encore favorable par rapport à la Côte d'Azur ou à Ibiza. Les profils de qualité sont disponibles avec moins d'anticipation nécessaire." }
    ]
  },
  {
    id: '19',
    slug: 'chef-prive-courchevel',
    title: "Chef privé Courchevel : chalets de luxe et gastronomie alpine",
    subtitle: "Trouver un chef privé à Courchevel 1850 pour votre chalet. Standards, profils et saison ski.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Montagne",
    image: "https://images.unsplash.com/photo-1516571589254-46487e38c92a?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Courchevel 1850 est la station de ski la plus prestigieuse des Alpes françaises. Les chalets du Jardin Alpin et de Bellecôte accueillent une clientèle internationale dont les attentes culinaires rivalisent avec les meilleures tables parisiennes." },
      { type: 'h2', content: "La saison Courchevel" },
      { type: 'paragraph', content: "La saison ski s'étend de décembre à avril, avec deux pics majeurs : Noël–Nouvel An et les vacances de février. Sur ces périodes, les meilleurs chefs de chalet sont réservés 6 à 12 mois à l'avance par les propriétaires réguliers." },
      { type: 'h2', content: "Profils adaptés aux chalets de Courchevel" },
      { type: 'list', content: ["Chef gastronomique capable de délivrer des menus dégustation après une journée de ski.", "Maîtrise de la pâtisserie fine pour les tea-times.", "Expérience des chalets alpins : contraintes d'altitude, approvisionnement hivernal, service en espace réduit.", "Langues : français et anglais indispensables, russe apprécié."] },
      { type: 'h2', content: "Tarifs à Courchevel" },
      { type: 'list', content: ["Semaine de Noël : 5 000€ à 12 000€ — période la plus chère.", "Semaine standard en saison : 3 500€ à 8 000€.", "Saison complète : 15 000€ à 25 000€."] },
      { type: 'quote', content: "À Courchevel 1850, le chef de chalet est autant un ambassadeur gastronomique qu'un logisticien d'altitude. Les deux compétences sont non négociables." }
    ]
  },
  {
    id: '20',
    slug: 'chef-prive-megeve',
    title: "Chef privé Megève : chalets et art de vivre alpin",
    subtitle: "Trouver un chef privé à Megève pour votre chalet. La station la plus chic des Alpes françaises.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Montagne",
    image: "https://images.unsplash.com/photo-1516571589254-46487e38c92a?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Megève est la station alpine la plus élégante de France. Contrairement à Courchevel, elle cultive un art de vivre discret et raffiné, où la gastronomie occupe une place centrale dans l'expérience du séjour." },
      { type: 'h2', content: "L'esprit culinaire de Megève" },
      { type: 'paragraph', content: "Megève est entourée de producteurs d'exception : fromagers de Haute-Savoie, charcutiers savoyards, trufficulteurs du Périgord pour les périodes hivernales. Le chef privé à Megève doit savoir travailler ces produits avec respect tout en proposant une cuisine gastronomique contemporaine." },
      { type: 'h2', content: "Profils recommandés" },
      { type: 'list', content: ["Chef avec sensibilité terroir et cuisine de saison.", "Expérience des environnements chalet — service intime, interaction avec les clients.", "Maîtrise des classiques savoyards revisités.", "Capacité à gérer les repas du personnel de chalet."] },
      { type: 'h2', content: "Tarifs à Megève" },
      { type: 'list', content: ["Semaine en haute saison : 3 000€ à 7 000€.", "Saison complète : 12 000€ à 20 000€."] },
      { type: 'quote', content: "Megève, c'est la discrétion du luxe alpin. Le chef privé y est un acteur central de l'art de vivre — pas un prestataire de service." }
    ]
  },
  {
    id: '21',
    slug: 'chef-prive-val-disere',
    title: "Chef privé Val d'Isère : chalets d'exception en Tarentaise",
    subtitle: "Guide pour trouver un chef privé à Val d'Isère pour votre chalet de luxe.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Montagne",
    image: "https://images.unsplash.com/photo-1516571589254-46487e38c92a?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Val d'Isère attire une clientèle sportive et internationale dans des chalets parmi les plus luxueux des Alpes. La demande en chefs privés y est forte sur toute la saison, avec des pics à Noël, Nouvel An et février." },
      { type: 'h2', content: "Spécificités de Val d'Isère" },
      { type: 'paragraph', content: "L'altitude (1850m) et l'enclavement de la station imposent une logistique rigoureuse. Les meilleurs chefs de Val d'Isère planifient leurs approvisionnements sur 3 à 5 jours, travaillent avec des producteurs locaux de la Tarentaise et anticipent les fermetures de route en cas de chutes de neige importantes." },
      { type: 'h2', content: "Ce que les clients attendent" },
      { type: 'list', content: ["Petits-déjeuners copieux avant les premières pistes.", "Déjeuners légers mais nourrissants pour les skieurs.", "Dîners gastronomiques après les sorties en montagne.", "Tea-time avec pâtisseries fines — moment incontournable du chalet alpin."] },
      { type: 'quote', content: "Val d'Isère concentre des skieurs passionnés et des épicuriens exigeants. Le chef privé doit satisfaire les deux." }
    ]
  },
  {
    id: '22',
    slug: 'chef-prive-cap-ferrat',
    title: "Chef privé Cap Ferrat : villas d'exception entre Nice et Monaco",
    subtitle: "Le Cap Ferrat concentre les résidences les plus discrètes de la Côte d'Azur. Guide chef privé.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Côte d'Azur",
    image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Le Cap Ferrat est la presqu'île la plus exclusive de France. Entre Nice et Monaco, ses villas millénaires accueillent une clientèle parmi les plus discrètes et les plus exigeantes de la Côte d'Azur. Un marché confidentiel, une demande réelle." },
      { type: 'h2', content: "Un environnement particulier" },
      { type: 'paragraph', content: "Les résidences du Cap Ferrat sont souvent occupées sur des durées longues — plusieurs semaines ou plusieurs mois. Le chef privé s'y intègre comme un membre de la maison, avec une discrétion et une régularité irréprochables." },
      { type: 'h2', content: "Profils adaptés au Cap Ferrat" },
      { type: 'list', content: ["Chef résident capable de gérer l'intégralité des repas sur la durée.", "Profil discret, habitué aux environnements UHNW.", "Connaissance des producteurs locaux : marchés de Villefranche, producteurs niçois.", "Langues : français, anglais, et souvent une troisième langue selon les résidents."] },
      { type: 'quote', content: "Le Cap Ferrat, c'est le luxe qui ne se montre pas. Nos chefs y opèrent dans la même discrétion." }
    ]
  },
  {
    id: '23',
    slug: 'chef-prive-biarritz',
    title: "Chef privé Biarritz : villas basques et Côte d'Argent",
    subtitle: "Trouver un chef privé à Biarritz et sur la Côte basque pour votre villa.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Pays Basque",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Biarritz et la Côte basque constituent un marché en forte croissance pour les chefs privés. Les villas de la Villa Belza, du Cap Saint-Martin et des hauteurs de Saint-Jean-de-Luz accueillent une clientèle parisienne et internationale attirée par le cadre exceptionnel et la richesse gastronomique du Pays Basque." },
      { type: 'h2', content: "La gastronomie basque en contexte privé" },
      { type: 'paragraph', content: "Le Pays Basque dispose d'un terroir gastronomique parmi les plus riches d'Europe : pintxos, jambon de Bayonne, fromage de brebis d'Ossau-Iraty, thon rouge de Saint-Jean-de-Luz, palombe en saison. Un chef privé qui connaît ce terroir offre une expérience culinaire incomparable." },
      { type: 'h2', content: "Tarifs à Biarritz" },
      { type: 'list', content: ["Mission semaine : 2 500€ à 5 500€.", "Mission mensuelle : 5 500€ à 11 000€."] },
      { type: 'quote', content: "Biarritz en juillet-août, c'est la Côte d'Azur sans l'ostentation. Une clientèle exigeante mais décontractée, un cadre naturel exceptionnel." }
    ]
  },
  {
    id: '24',
    slug: 'chef-prive-marrakech',
    title: "Chef privé Marrakech : riads, villas et gastronomie privée",
    subtitle: "Engager un chef privé à Marrakech pour votre riad ou villa. Spécificités et logistique au Maroc.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Maroc",
    image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Marrakech s'est imposée comme une destination de luxe incontournable. Les riads de la Médina, les villas de Palmeraie et les propriétés des hauteurs de l'Atlas accueillent une clientèle internationale en quête d'une expérience culinaire authentique et raffinée." },
      { type: 'h2', content: "La cuisine marocaine en contexte privé" },
      { type: 'paragraph', content: "La gastronomie marocaine — tagines, couscous, pastilla, méchoui — est une attente forte des clients qui séjournent à Marrakech. Mais la clientèle internationale attend aussi un chef capable de proposer une cuisine internationale en parallèle, notamment pour les enfants et les convives moins familiers avec les saveurs du Maghreb." },
      { type: 'h2', content: "Logistique à Marrakech" },
      { type: 'list', content: ["Marché central de Marrakech : produits frais exceptionnels et peu coûteux.", "Épiceries fines et supermarchés pour les produits importés.", "Contraintes halal à respecter selon les clients.", "Gestion de la chaleur en été — cuisine adaptée aux fortes températures."] },
      { type: 'h2', content: "Tarifs à Marrakech" },
      { type: 'list', content: ["Mission semaine : 2 000€ à 4 500€.", "Mission mensuelle : 4 500€ à 9 000€."] },
      { type: 'quote', content: "Marrakech offre un cadre sensoriel unique. Le dîner sur terrasse sous les étoiles, avec les arômes du souk en arrière-plan, est une expérience que seul un chef privé peut orchestrer." }
    ]
  },
  {
    id: '25',
    slug: 'chef-prive-corfou',
    title: "Chef privé Corfou : villas et cuisine ionienne",
    subtitle: "Guide pour engager un chef privé à Corfou pour votre villa ou votre séjour dans les îles Ioniennes.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Grèce",
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Corfou est la plus verte et la plus italianisée des îles grecques. Ses villas de la côte nord — Nisaki, Kassiopi, Agni — accueillent une clientèle principalement britannique et nordique, attirée par la beauté sauvage de l'île et sa cuisine aux influences vénitiennes." },
      { type: 'h2', content: "La cuisine corfiote" },
      { type: 'paragraph', content: "L'influence vénitienne de plusieurs siècles a laissé une empreinte unique sur la cuisine de Corfou : pastitsada, sofrito, bourdeto. Un chef privé qui maîtrise ces spécialités en plus de la cuisine méditerranéenne classique offre une expérience culinaire authentiquement locale." },
      { type: 'h2', content: "Logistique à Corfou" },
      { type: 'list', content: ["Marché de Corfou Town pour les produits locaux.", "Poissons et fruits de mer directement auprès des pêcheurs locaux.", "Huile d'olive de Corfou — parmi les meilleures de Grèce.", "Vols directs depuis toutes les grandes villes européennes en saison."] },
      { type: 'quote', content: "Corfou reste plus accessible que Mykonos ou Santorin, avec des villas et des profils de chefs disponibles plus facilement en haute saison." }
    ]
  },
  {
    id: '26',
    slug: 'chef-prive-amalfi-capri',
    title: "Chef privé Amalfi et Capri : dolce vita culinaire",
    subtitle: "Engager un chef privé sur la Côte Amalfitaine ou à Capri pour votre villa italienne.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Italie",
    image: "https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "La Côte Amalfitaine et Capri sont parmi les destinations les plus romantiques d'Europe. Les villas accrochées aux falaises de Positano, Ravello et Amalfi, ainsi que les propriétés de Capri et Anacapri, accueillent une clientèle internationale en quête de dolce vita authentique." },
      { type: 'h2', content: "La cuisine du Sud de l'Italie en contexte privé" },
      { type: 'paragraph', content: "La cuisine campanienne est d'une richesse exceptionnelle : mozzarella di bufala, tomates San Marzano, fruits de mer du Golfe de Naples, limoncello d'Amalfi. Un chef privé qui maîtrise cette cuisine avec les produits locaux offre une expérience gastronomique incomparable." },
      { type: 'h2', content: "Contraintes logistiques" },
      { type: 'list', content: ["La route amalfitaine est étroite — livraisons à planifier tôt le matin.", "Capri : tout transit par bateau depuis Naples ou Sorrente.", "Produits frais disponibles quotidiennement sur les marchés locaux.", "Accès aux cuisines parfois complexe dans les villas historiques."] },
      { type: 'h2', content: "Tarifs 2026" },
      { type: 'list', content: ["Mission semaine : 3 000€ à 6 500€.", "Mission mensuelle : 9 000€ à 16 000€."] },
      { type: 'quote', content: "Un dîner sur terrasse à Positano avec vue sur la mer au coucher du soleil : c'est l'expérience que nos chefs créent chaque soir." }
    ]
  },
  {
    id: '27',
    slug: 'chef-prive-portofino',
    title: "Chef privé Portofino : Ligurie et Riviera italienne",
    subtitle: "Trouver un chef privé à Portofino et sur la Riviera ligure pour votre villa ou votre yacht.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Italie",
    image: "https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Portofino est l'un des villages les plus photographiés d'Italie. Ses villas perchées sur le promontoire et les propriétés de Santa Margherita Ligure et Rapallo accueillent une clientèle internationale attirée par l'élégance discrète de la Riviera ligure." },
      { type: 'h2', content: "La cuisine ligure en contexte privé" },
      { type: 'paragraph', content: "La Ligurie est le berceau du pesto genovese, de la focaccia et des troffie al pesto. La cuisine locale, légère et parfumée, est parfaitement adaptée aux dîners estivaux. Un chef privé qui maîtrise ces spécialités tout en proposant une cuisine internationale fait toujours mouche." },
      { type: 'h2', content: "Portofino et les yachts" },
      { type: 'paragraph', content: "Portofino est aussi une escale incontournable pour les superyachts en Méditerranée. Un chef avec expérience yacht est souvent préféré pour les séjours combinant villa et navigation sur la côte ligure et toscane." },
      { type: 'quote', content: "Portofino, c'est la Méditerranée dans sa plus belle expression. Nos chefs y apportent une cuisine à la hauteur du décor." }
    ]
  },
  {
    id: '28',
    slug: 'chef-prive-dubai',
    title: "Chef privé Dubaï : villas et résidences premium",
    subtitle: "Engager un chef privé à Dubaï pour votre villa, votre penthouse ou votre yacht.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Moyen-Orient",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Dubaï est devenue l'une des destinations les plus demandées pour les chefs privés hors d'Europe. Les villas de Palm Jumeirah, les penthouses de Downtown et les résidences des Emirates Hills accueillent une clientèle internationale aux standards exceptionnels." },
      { type: 'h2', content: "Les spécificités de Dubaï" },
      { type: 'paragraph', content: "Dubaï impose des contraintes particulières : réglementation halal, absence d'alcool dans certaines propriétés, chaleur extrême en été (cuisine exclusivement en intérieur), et une clientèle souvent habituée aux meilleures tables du monde." },
      { type: 'h2', content: "Profils adaptés à Dubaï" },
      { type: 'list', content: ["Maîtrise de la cuisine internationale — française, japonaise, méditerranéenne.", "Connaissance des contraintes halal et des régimes religieux.", "Expérience des environnements UHNW du Moyen-Orient.", "Langues : anglais indispensable, arabe très apprécié."] },
      { type: 'h2', content: "Tarifs à Dubaï" },
      { type: 'list', content: ["Mission semaine : 3 500€ à 8 000€.", "Mission mensuelle : 10 000€ à 20 000€."] },
      { type: 'quote', content: "Dubaï concentre une clientèle parmi les plus exigeantes au monde. Nos chefs y apportent un niveau d'excellence et une discrétion absolue." }
    ]
  },
  {
    id: '29',
    slug: 'chef-prive-antibes',
    title: "Chef privé Antibes et Cap d'Antibes : entre mer et pinèdes",
    subtitle: "Trouver un chef privé à Antibes, Juan-les-Pins et Cap d'Antibes pour votre villa.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Côte d'Azur",
    image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Antibes et le Cap d'Antibes offrent un cadre plus résidentiel et moins médiatisé que Saint-Tropez ou Cannes. Les villas nichées dans les pinèdes du Cap accueillent des séjours souvent plus longs, avec une clientèle attachée à la discrétion et à la qualité du quotidien." },
      { type: 'h2', content: "Le profil des clients d'Antibes" },
      { type: 'paragraph', content: "La clientèle du Cap d'Antibes est souvent fidèle — familles qui reviennent chaque été depuis des années dans la même villa. Le chef privé s'intègre dans ce quotidien avec une régularité et une adaptabilité exemplaires." },
      { type: 'h2', content: "Atouts culinaires de la région" },
      { type: 'list', content: ["Marché provençal d'Antibes — l'un des plus beaux de la Côte d'Azur.", "Accès aux pêcheurs locaux pour des poissons d'une fraîcheur irréprochable.", "Proximité de Cannes et Nice pour les produits premium et les épiceries fines."] },
      { type: 'quote', content: "Antibes, c'est la Côte d'Azur sans la foule. Un cadre idéal pour une mission de chef privé sereine et de qualité." }
    ]
  },
  {
    id: '30',
    slug: 'chef-prive-nice',
    title: "Chef privé Nice : entre mer et collines",
    subtitle: "Trouver un chef privé à Nice et dans l'arrière-pays niçois pour votre résidence.",
    date: "Avril 2026",
    publishedAt: "2026-04-01",
    category: "Côte d'Azur",
    image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=2070&auto=format&fit=crop",
    relatedLink: "/request?type=private",
    relatedLinkText: "Soumettre une demande",
    blocks: [
      { type: 'paragraph', content: "Nice est la capitale de la Côte d'Azur et un marché important pour les chefs privés. Entre les résidences du mont Boron, les villas de Cimiez et les propriétés de l'arrière-pays, la demande est soutenue toute l'année." },
      { type: 'h2', content: "La cuisine niçoise en contexte privé" },
      { type: 'paragraph', content: "La cuisine niçoise est une identité à part entière : socca, pissaladière, salade niçoise, ratatouille, daube provençale. Un chef privé qui maîtrise ce patrimoine culinaire tout en proposant une cuisine gastronomique contemporaine trouve immédiatement sa place dans une résidence niçoise." },
      { type: 'h2', content: "Nice comme base pour les missions Côte d'Azur" },
      { type: 'paragraph', content: "Nice est aussi un hub logistique pour les missions sur l'ensemble de la Côte d'Azur. Nos chefs basés à Nice peuvent intervenir rapidement sur Antibes, Cannes, Monaco ou le Cap Ferrat selon les besoins." },
      { type: 'quote', content: "Nice, c'est la Côte d'Azur à l'état pur — sans l'ostentation, avec tout le raffinement." }
    ]
  }
];
