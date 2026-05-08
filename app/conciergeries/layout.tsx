import type { Metadata } from 'next';

const SITE_URL = 'https://chefstalents.com';

export const metadata: Metadata = {
  title: 'Conciergeries — Chefs Talents',
  description:
    'Partenaire de confiance pour conciergeries haut de gamme. Chefs privés validés en Europe pour missions sensibles et récurrentes.',
  alternates: { canonical: `${SITE_URL}/conciergeries` },
  openGraph: {
    title: 'Conciergeries — Chefs Talents',
    description: 'Chefs privés pour conciergeries haut de gamme en Europe.',
    url: `${SITE_URL}/conciergeries`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conciergeries — Chefs Talents',
    description: 'Chefs privés pour conciergeries haut de gamme en Europe.',
  },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Mise en relation chef privé pour conciergeries',
  name: 'Chefs Talents pour conciergeries',
  description:
    'Mise en relation de conciergeries haut de gamme avec des chefs privés validés en Europe : villas, yachts, résidences UHNW, missions sensibles et récurrentes.',
  provider: {
    '@type': 'Organization',
    name: 'Chefs Talents',
    url: SITE_URL,
  },
  areaServed: { '@type': 'Place', name: 'Europe' },
  audience: {
    '@type': 'Audience',
    audienceType: 'Conciergeries haut de gamme et family offices',
  },
  url: `${SITE_URL}/conciergeries`,
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Conciergeries',
      item: `${SITE_URL}/conciergeries`,
    },
  ],
};

export default function ConciergeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* H1 sémantique server-side pour les crawlers (visuellement caché). */}
      <h1 className="sr-only">
        Chefs Talents pour conciergeries — Chefs privés validés en Europe
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
    </>
  );
}
