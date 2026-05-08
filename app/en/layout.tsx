import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Private Chef at Home | Villas, Yachts, Residences — Chefs Talents',
  description:
    'Chefs Talents connects vetted private chefs with discerning clients across Europe. Villas, yachts, chalets, UHNW residences. One request, the right answer.',
  alternates: {
    canonical: 'https://chefstalents.com/en',
    languages: {
      'fr-FR': 'https://chefstalents.com',
      'en-US': 'https://chefstalents.com/en',
      'es-ES': 'https://chefstalents.com/es',
      'x-default': 'https://chefstalents.com',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://chefstalents.com/en',
    siteName: 'Chefs Talents',
    title:
      'Private Chef at Home | Villas, Yachts, Residences — Chefs Talents',
    description:
      'Network of vetted private chefs for discerning clients across Europe. Villas, yachts, UHNW residences.',
    images: [
      {
        url: '/images/editorial/hero-chef-talents.jpg',
        width: 1200,
        height: 630,
        alt: 'Chefs Talents private chef',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Private Chef at Home | Villas, Yachts, Residences — Chefs Talents',
    description:
      'Network of vetted private chefs for discerning clients across Europe.',
    images: ['/images/editorial/hero-chef-talents.jpg'],
  },
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">
        Private chef at home in Europe — Villas, yachts and luxury residences
      </h1>
      {children}
    </>
  );
}
