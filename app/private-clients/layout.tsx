import type { Metadata } from 'next';

const SITE_URL = 'https://chefstalents.com';

export const metadata: Metadata = {
  title: 'Clients Privés — Chefs Talents',
  description:
    "Trouvez votre chef privé pour villa, chalet ou yacht en Europe. Sélection rigoureuse, discrétion totale, coordination complète.",
  alternates: { canonical: `${SITE_URL}/private-clients` },
  openGraph: {
    title: 'Clients Privés — Chefs Talents',
    description: "Chef privé pour villa, yacht, chalet en Europe. Discrétion totale.",
    url: `${SITE_URL}/private-clients`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clients Privés — Chefs Talents',
    description: 'Chef privé pour villa, yacht, chalet en Europe.',
  },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Chef privé à domicile pour clients particuliers',
  name: 'Chef privé Chefs Talents — Particuliers',
  description:
    "Mise en relation de clients particuliers avec des chefs privés validés en Europe : villas, yachts, chalets, résidences. Sélection rigoureuse, coordination complète.",
  provider: {
    '@type': 'Organization',
    name: 'Chefs Talents',
    url: SITE_URL,
  },
  areaServed: { '@type': 'Place', name: 'Europe' },
  audience: {
    '@type': 'Audience',
    audienceType: 'Clients particuliers, familles UHNW',
  },
  url: `${SITE_URL}/private-clients`,
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Clients Privés',
      item: `${SITE_URL}/private-clients`,
    },
  ],
};

export default function PrivateClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">
        Chef privé pour clients particuliers — Villas, yachts, chalets en Europe
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
