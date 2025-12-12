
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
];
