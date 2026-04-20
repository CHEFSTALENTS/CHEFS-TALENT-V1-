import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://chefstalents.com'),
  title: {
    default: 'Chef Privé à Domicile | Villas, Yachts, Résidences — Chefs Talents',
    template: '%s — Chefs Talents',
  },
  description: "Chefs Talents met en relation des chefs privés sélectionnés avec des clients exigeants en Europe. Villas, yachts, chalets, résidences UHNW. Une seule demande, la bonne réponse.",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: {
    type: 'website', locale: 'fr_FR', url: 'https://chefstalents.com', siteName: 'Chefs Talents',
    title: 'Chef Privé à Domicile | Villas, Yachts, Résidences — Chefs Talents',
    description: "Réseau de chefs privés sélectionnés pour des clients exigeants. Villas, yachts, résidences UHNW en Europe.",
    images: [{ url: '/images/editorial/hero-chef-talents.jpg', width: 1200, height: 630, alt: 'Chef privé Chefs Talents' }],
  },
  twitter: { card: 'summary_large_image', title: 'Chef Privé à Domicile | Villas, Yachts, Résidences — Chefs Talents', description: "Réseau de chefs privés sélectionnés. Villas, yachts, résidences UHNW en Europe.", images: ['/images/editorial/hero-chef-talents.jpg'] },
  alternates: { canonical: 'https://chefstalents.com' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'LocalBusiness',
          name: 'Chefs Talents', url: 'https://chefstalents.com',
          telephone: '+33756827612', email: 'contact@chefstalents.com',
          description: "Réseau de chefs privés sélectionnés pour des clients exigeants en Europe.",
          address: { '@type': 'PostalAddress', addressLocality: 'Bordeaux', addressCountry: 'FR' },
          areaServed: { '@type': 'Place', name: 'Europe' }, priceRange: '€€€€',
        }) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
