// app/es/villa/page.tsx — Versión española de /villa.

import type { Metadata } from 'next';
import VillaLanding from '../../villa/_components/VillaLanding';
import { esCopy } from '../../villa/_lib/copy';

const BASE = 'https://chefstalents.com';
const PATH = '/es/villa';

export const metadata: Metadata = {
  title: esCopy.meta.title,
  description: esCopy.meta.description,
  alternates: {
    canonical: `${BASE}${PATH}`,
    languages: {
      fr: `${BASE}/villa`,
      en: `${BASE}/en/villa`,
      es: `${BASE}${PATH}`,
      'x-default': `${BASE}/en/villa`,
    },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: esCopy.meta.title,
    description: esCopy.meta.description,
    url: `${BASE}${PATH}`,
    siteName: 'Chefs Talents',
    images: ['/images/editorial/IMG_1619.jpg'],
    locale: 'es_ES',
    type: 'website',
  },
};

export default function EsVillaPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: esCopy.faq.items.map((f) => ({
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
      <VillaLanding copy={esCopy} />
    </>
  );
}
