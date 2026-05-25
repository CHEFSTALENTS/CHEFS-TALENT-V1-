import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import AnalyticsProvider from '@/lib/analytics/AnalyticsProvider';
import LandingFloatingCTAs from '@/components/landing/LandingFloatingCTAs';
import {
  buildOrganizationSchema,
  buildLocalBusinessSchema,
  buildWebSiteSchema,
} from '@/lib/seo/schemas';

export const metadata: Metadata = {
  metadataBase: new URL('https://chefstalents.com'),
  title: {
    default: 'Chef Prive a Domicile | Villas, Yachts, Residences - Chefs Talents',
    template: '%s',
  },
  description: "Chefs Talents met en relation des chefs prives selectionnes avec des clients exigeants en Europe. Villas, yachts, chalets, residences UHNW. Une seule demande, la bonne reponse.",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: {
    type: 'website', locale: 'fr_FR', url: 'https://chefstalents.com', siteName: 'Chefs Talents',
    title: 'Chef Prive a Domicile | Villas, Yachts, Residences - Chefs Talents',
    description: "Reseau de chefs prives selectionnes pour des clients exigeants. Villas, yachts, residences UHNW en Europe.",
    images: [{ url: '/images/editorial/hero-chef-talents.jpg', width: 1200, height: 630, alt: 'Chef prive Chefs Talents' }],
  },
  twitter: { card: 'summary_large_image', title: 'Chef Prive a Domicile | Villas, Yachts, Residences - Chefs Talents', description: "Reseau de chefs prives selectionnes. Villas, yachts, residences UHNW en Europe.", images: ['/images/editorial/hero-chef-talents.jpg'] },
  alternates: {
    canonical: 'https://chefstalents.com',
    languages: {
      'fr-FR': 'https://chefstalents.com',
      'en-US': 'https://chefstalents.com/en',
      'es-ES': 'https://chefstalents.com/es',
      'x-default': 'https://chefstalents.com',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/*
          Schemas globaux JSON-LD : Organization + LocalBusiness + WebSite.
          Chargés au niveau root → présents sur toutes les pages, signal AI
          fort pour les bots d'entraînement (GPTBot, ClaudeBot, Perplexity).

          - Organization : identité morale (founder, sameAs, knowsAbout, areaServed)
          - LocalBusiness : entité opérationnelle (adresse, telephone, openingHours, offerCatalog)
          - WebSite : navigation + SearchAction (sitelinks searchbox Google)
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildLocalBusinessSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildWebSiteSchema()),
          }}
        />
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=3942328079231750&ev=PageView&noscript=1"
            alt="" />
        </noscript>
      </head>
      <body>
        {/* ──────────────────────────────────────────────────────────────
            Google Tag Manager — noscript fallback (premier enfant du body
            comme requis par la doc GTM). ID configurable via
            NEXT_PUBLIC_GTM_ID, fallback hard-codé GTM-W9G5ZJ9L.
            ─────────────────────────────────────────────────────────── */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-W9G5ZJ9L'}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* GTM script — afterInteractive : ne bloque pas le first paint
            mais charge dès que le browser est prêt. GTM va ensuite gérer
            les autres tags (Analytics, Ads conversion, etc.) si configurés. */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-W9G5ZJ9L'}');`}
        </Script>

        <AnalyticsProvider>{children}</AnalyticsProvider>

        {/* Bulles flottantes (WhatsApp + Formulaire) sur la landing — le composant
            détecte lui-même la pathname et se cache sur /admin /chef /request /api */}
        <LandingFloatingCTAs />

        {/* Google Ads gtag.js — conservé en plus de GTM le temps de migrer
            les conversions côté GTM UI. Compatible avec GTM (partage le
            même dataLayer). */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18111694917"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18111694917');
          `}
        </Script>

        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','3942328079231750');
            fbq('track','PageView');`}
        </Script>
      </body>
    </html>
  );
}
