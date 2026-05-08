import type { Metadata } from 'next';
import { DestinationsLinks } from '@/components/seo/DestinationsLinks';

const SITE_URL = 'https://chefstalents.com';

export const metadata: Metadata = {
  title: 'Accompagnement Chef Privé — Chefs Talents',
  description:
    'Accompagnement personnalisé pour engager un chef privé : qualification de votre besoin, sélection de profils, coordination de la mission.',
  alternates: { canonical: `${SITE_URL}/accompagnement` },
  openGraph: {
    title: 'Accompagnement Chef Privé — Chefs Talents',
    description: 'Accompagnement personnalisé pour vos missions de chef privé.',
    url: `${SITE_URL}/accompagnement`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accompagnement Chef Privé — Chefs Talents',
    description: 'Accompagnement personnalisé pour vos missions de chef privé.',
  },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Accompagnement et coordination chef privé',
  name: 'Accompagnement Chefs Talents',
  description:
    'Accompagnement personnalisé pour engager un chef privé : qualification du besoin, sélection des profils, coordination de la mission, suivi de qualité.',
  provider: {
    '@type': 'Organization',
    name: 'Chefs Talents',
    url: SITE_URL,
  },
  areaServed: { '@type': 'Place', name: 'Europe' },
  url: `${SITE_URL}/accompagnement`,
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Étapes d’accompagnement',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Qualification du besoin',
          description:
            'Échange initial pour comprendre la mission, les contraintes et les attentes.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Sélection de profils',
          description:
            'Présélection de chefs validés correspondant à la mission.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Coordination de mission',
          description:
            'Suivi de la mission, gestion des imprévus, retour de qualité.',
        },
      },
    ],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Accompagnement',
      item: `${SITE_URL}/accompagnement`,
    },
  ],
};

export default function AccompagnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">
        Accompagnement chef privé — Sélection, coordination et suivi de mission
      </h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
      <DestinationsLinks
        title="Nos destinations couvertes"
        intro="Notre accompagnement s’étend à toutes les destinations premium européennes."
      />
    </>
  );
}
