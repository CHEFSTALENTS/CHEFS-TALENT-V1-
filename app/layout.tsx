import type { Metadata } from ‘next’;
import Script from ‘next/script’;
import ‘./globals.css’;

export const metadata: Metadata = {
metadataBase: new URL(‘https://chefstalents.com’),
title: {
default: ‘Chef Privé à Domicile | Villas, Yachts, Résidences — Chefs Talents’,
template: ‘%s’,
},
description: “Chefs Talents met en relation des chefs privés sélectionnés avec des clients exigeants en Europe. Villas, yachts, chalets, résidences UHNW. Une seule demande, la bonne réponse.”,
robots: { index: true, follow: true, googleBot: { index: true, follow: true, ‘max-image-preview’: ‘large’, ‘max-snippet’: -1 } },
openGraph: {
type: ‘website’, locale: ‘fr_FR’, url: ‘https://chefstalents.com’, siteName: ‘Chefs Talents’,
title: ‘Chef Privé à Domicile | Villas, Yachts, Résidences — Chefs Talents’,
description: “Réseau de chefs privés sélectionnés pour des clients exigeants. Villas, yachts, résidences UHNW en Europe.”,
images: [{ url: ‘/images/editorial/hero-chef-talents.jpg’, width: 1200, height: 630, alt: ‘Chef privé Chefs Talents’ }],
},
twitter: { card: ‘summary_large_image’, title: ‘Chef Privé à Domicile | Villas, Yachts, Résidences — Chefs Talents’, description: “Réseau de chefs privés sélectionnés. Villas, yachts, résidences UHNW en Europe.”, images: [’/images/editorial/hero-chef-talents.jpg’] },
alternates: { canonical: ‘https://chefstalents.com’ },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="fr">
<head>
<script
type=“application/ld+json”
dangerouslySetInnerHTML={{ __html: JSON.stringify({
‘@context’: ‘https://schema.org’, ‘@type’: ‘LocalBusiness’,
name: ‘Chefs Talents’, url: ‘https://chefstalents.com’,
telephone: ‘+33756827612’, email: ‘contact@chefstalents.com’,
description: “Réseau de chefs privés sélectionnés pour des clients exigeants en Europe.”,
address: { ‘@type’: ‘PostalAddress’, addressLocality: ‘Bordeaux’, addressCountry: ‘FR’ },
areaServed: { ‘@type’: ‘Place’, name: ‘Europe’ }, priceRange: ‘€€€€’,
}) }}
/>
<noscript>
<img height=“1” width=“1” style={{ display: ‘none’ }}
src=“https://www.facebook.com/tr?id=3942328079231750&ev=PageView&noscript=1”
alt=”” />
</noscript>
</head>
<body>
{children}

```
    {/* Google Ads */}
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

    {/* Meta Pixel — nouveau compte Chefs Talents */}
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
```

);
}
