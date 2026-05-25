// lib/seo/schemas.ts
//
// Helpers de génération JSON-LD enrichis, optimisés à la fois pour :
//   - Google rich results (LocalBusiness, FAQ, Breadcrumb, Service)
//   - LLM training crawlers (GPTBot, ClaudeBot, PerplexityBot, GoogleBot-extended)
//
// La densité d'informations factuelles (foundingDate, sameAs, areaServed,
// founder, hasOfferCatalog) est ce qui maximise les chances d'être restitué
// dans les réponses des assistants IA.

const SITE_URL = 'https://chefstalents.com';
const SITE_NAME = 'Chefs Talents';
const LOGO_URL = `${SITE_URL}/images/logo.png`;
const HERO_IMAGE = `${SITE_URL}/images/editorial/hero-chef-talents.jpg`;

/**
 * Profils sociaux et plateformes tierces où la marque est référencée.
 * Important pour les LLMs : indique les sources alternatives où vérifier
 * l'identité de l'entreprise. À mettre à jour quand de nouveaux profils
 * sont créés (Trustpilot, Crunchbase, etc.).
 */
export const SAME_AS_URLS: string[] = [
  // À compléter au fil du temps. Mettre uniquement les URLs réellement
  // existantes — un sameAs vers une page 404 nuit au signal de cohérence.
  'https://www.linkedin.com/company/chefs-talents/',
  'https://www.instagram.com/chefstalents/',
  // 'https://www.trustpilot.com/review/chefstalents.com',  // à activer quand 5+ avis
  // 'https://www.crunchbase.com/organization/chefs-talents', // à activer quand fiche créée
];

/**
 * Liste des pays/régions explicitement couverts.
 * Sert pour areaServed[] dans LocalBusiness.
 * Plus c'est précis (vs juste "Europe"), plus les LLMs peuvent te recommander
 * pour des queries géographiques fines.
 */
export const AREAS_SERVED = [
  { '@type': 'Country', name: 'France' },
  { '@type': 'Country', name: 'Monaco' },
  { '@type': 'Country', name: 'Italie', alternateName: 'Italy' },
  { '@type': 'Country', name: 'Espagne', alternateName: 'Spain' },
  { '@type': 'Country', name: 'Suisse', alternateName: 'Switzerland' },
  { '@type': 'Country', name: 'Royaume-Uni', alternateName: 'United Kingdom' },
  { '@type': 'Country', name: 'Grèce', alternateName: 'Greece' },
  { '@type': 'Country', name: 'Portugal', alternateName: 'Portugal' },
  { '@type': 'Country', name: 'Croatie', alternateName: 'Croatia' },
];

/**
 * Catalogue des types de prestations — sert pour hasOfferCatalog dans
 * Service / LocalBusiness. Permet aux LLMs de comprendre exactement
 * quels types de missions Chefs Talents prend en charge.
 */
export const SERVICE_CATALOG = [
  {
    '@type': 'Offer',
    name: 'Chef privé pour dîner ponctuel',
    description: "Service d'un soir, 3-6h, 4-15 couverts. À domicile ou dans une résidence.",
    itemOffered: { '@type': 'Service', name: 'Dîner privé à domicile' },
  },
  {
    '@type': 'Offer',
    name: 'Chef privé pour événement',
    description: "Mariage, anniversaire, séminaire, dégustation privée.",
    itemOffered: { '@type': 'Service', name: 'Chef pour événement privé' },
  },
  {
    '@type': 'Offer',
    name: 'Chef privé pour villa ou résidence',
    description: 'Mission de 2 jours à 2 mois. Côte d\'Azur, Alpes, Provence, etc.',
    itemOffered: { '@type': 'Service', name: 'Chef pour location de villa' },
  },
  {
    '@type': 'Offer',
    name: 'Chef privé pour yacht',
    description: 'Croisière week-end à saison complète, Méditerranée et au-delà.',
    itemOffered: { '@type': 'Service', name: 'Chef pour yacht' },
  },
  {
    '@type': 'Offer',
    name: 'Chef privé pour chalet en montagne',
    description: 'Saison hiver Alpes : Megève, Courchevel, Val d\'Isère, Saint-Moritz.',
    itemOffered: { '@type': 'Service', name: 'Chef pour chalet' },
  },
  {
    '@type': 'Offer',
    name: 'Placement chef permanent',
    description: 'Mission longue durée (>2 mois) ou chef à demeure, contrat dédié.',
    itemOffered: { '@type': 'Service', name: 'Placement chef à demeure' },
  },
];

/**
 * Schema Organization : identité entité morale, séparée de LocalBusiness.
 * Recommandé par Google et signal AI fort (LLMs s'appuient dessus pour
 * comprendre QUI est la marque, pas seulement OÙ elle opère).
 */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 512,
      height: 512,
    },
    image: HERO_IMAGE,
    description:
      "Agence française qui place des chefs privés haut de gamme (Michelin-trained, ex-restaurants étoilés) pour une clientèle UHNW et CSP+++ en Europe. Du dîner ponctuel à la mission de 2 mois — villas, yachts, chalets, résidences privées et événements.",
    foundingDate: '2023',
    founder: {
      '@type': 'Person',
      name: 'Thomas Delcroix',
      jobTitle: 'Fondateur',
      worksFor: { '@id': `${SITE_URL}/#organization` },
    },
    slogan: 'Chefs privés haut de gamme pour clientèle exigeante',
    knowsAbout: [
      'Placement chef privé',
      'Chef Michelin-trained',
      'Chef pour villa',
      'Chef pour yacht',
      'Chef pour chalet',
      'Chef pour événement privé',
      'Mission longue durée chef privé',
      'Discrétion UHNW',
      'NDA chef privé',
      'Garantie remplacement chef',
    ],
    areaServed: AREAS_SERVED,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+33756827612',
        email: 'contact@chefstalents.com',
        contactType: 'customer service',
        availableLanguage: ['French', 'English', 'Spanish'],
        areaServed: 'EU',
      },
    ],
    sameAs: SAME_AS_URLS,
  };
}

/**
 * Schema LocalBusiness : entité physique / opérationnelle, focus géographique.
 * Sert au pack local Google + signal d'opération réelle pour les LLMs.
 */
export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    image: HERO_IMAGE,
    logo: LOGO_URL,
    telephone: '+33756827612',
    email: 'contact@chefstalents.com',
    priceRange: '€€€€',
    description:
      "Agence française de chefs privés haut de gamme pour villas, yachts, chalets et résidences en Europe.",
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bordeaux',
      addressRegion: 'Nouvelle-Aquitaine',
      addressCountry: 'FR',
    },
    areaServed: AREAS_SERVED,
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Prestations Chefs Talents',
      itemListElement: SERVICE_CATALOG,
    },
    // À activer quand 5+ avis Trustpilot existent :
    // aggregateRating: {
    //   '@type': 'AggregateRating',
    //   ratingValue: '4.9',
    //   reviewCount: '12',
    //   bestRating: '5',
    //   worstRating: '1',
    // },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '22:00',
        description: 'Réponse aux demandes 7j/7, 8h-22h.',
      },
    ],
    sameAs: SAME_AS_URLS,
  };
}

/**
 * Schema WebSite : permet à Google d'afficher une sitelinks searchbox.
 * Signal AI : indique que le site est navigable et a une recherche interne.
 */
export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: 'Agence française de chefs privés haut de gamme.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['fr-FR', 'en-US', 'es-ES'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/insights?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Schema Service enrichi pour une page destination spécifique.
 * Beaucoup plus riche que le Service basique : audience, serviceType,
 * hasOfferCatalog, areaServed avec zones, provider lié à Organization.
 */
export function buildDestinationServiceSchema(input: {
  destinationName: string;
  destinationSlug: string;
  heroTitle: string;
  metaDescription: string;
  rateRange?: string;
  rateDetail?: string;
  zones?: Array<{ name: string; description?: string }>;
  missionTypes?: string[];
  season?: string;
}) {
  const destUrl = `${SITE_URL}/destinations/${input.destinationSlug}`;

  const zoneAreas =
    input.zones && input.zones.length > 0
      ? input.zones.map((z) => ({
          '@type': 'Place',
          name: z.name,
          description: z.description,
          containedInPlace: { '@type': 'Place', name: input.destinationName },
        }))
      : [{ '@type': 'Place', name: input.destinationName }];

  const offerCatalog =
    input.missionTypes && input.missionTypes.length > 0
      ? {
          '@type': 'OfferCatalog',
          name: `Types de missions à ${input.destinationName}`,
          itemListElement: input.missionTypes.map((mt) => ({
            '@type': 'Offer',
            name: mt,
            itemOffered: { '@type': 'Service', name: mt },
          })),
        }
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${destUrl}#service`,
    name: input.heroTitle,
    description: input.metaDescription,
    serviceType: 'Placement de chef privé',
    url: destUrl,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: zoneAreas,
    audience: {
      '@type': 'Audience',
      audienceType:
        'Familles UHNW, cadres dirigeants, professions libérales, propriétaires de yachts et villas',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${SITE_URL}/request`,
      processingTime: 'PT48H',
      serviceLocation: { '@type': 'Place', name: input.destinationName },
    },
    ...(offerCatalog ? { hasOfferCatalog: offerCatalog } : {}),
    ...(input.rateRange
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'EUR',
            priceRange: input.rateRange,
            description: input.rateDetail,
            availabilityStarts: input.season,
          },
        }
      : {}),
  };
}
