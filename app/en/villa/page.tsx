// app/en/villa/page.tsx — English version of /villa.

import type { Metadata } from 'next';
import VillaLanding from '../../villa/_components/VillaLanding';
import { enCopy } from '../../villa/_lib/copy';

const BASE = 'https://chefstalents.com';
const PATH = '/en/villa';

export const metadata: Metadata = {
  title: enCopy.meta.title,
  description: enCopy.meta.description,
  alternates: {
    canonical: `${BASE}${PATH}`,
    languages: {
      fr: `${BASE}/villa`,
      en: `${BASE}${PATH}`,
      es: `${BASE}/es/villa`,
      'x-default': `${BASE}${PATH}`,
    },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: enCopy.meta.title,
    description: enCopy.meta.description,
    url: `${BASE}${PATH}`,
    siteName: 'Chefs Talents',
    images: ['/images/editorial/IMG_1619.jpg'],
    locale: 'en_GB',
    type: 'website',
  },
};

export default function EnVillaPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: enCopy.faq.items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <VillaLanding copy={enCopy} />
    </>
  );
}
