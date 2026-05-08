import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Chef Privado a Domicilio | Villas, Yates, Residencias — Chefs Talents',
  description:
    'Chefs Talents conecta a chefs privados seleccionados con clientes exigentes en toda Europa. Villas, yates, chalets, residencias UHNW. Una solicitud, la respuesta adecuada.',
  alternates: {
    canonical: 'https://chefstalents.com/es',
    languages: {
      'fr-FR': 'https://chefstalents.com',
      'en-US': 'https://chefstalents.com/en',
      'es-ES': 'https://chefstalents.com/es',
      'x-default': 'https://chefstalents.com',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://chefstalents.com/es',
    siteName: 'Chefs Talents',
    title:
      'Chef Privado a Domicilio | Villas, Yates, Residencias — Chefs Talents',
    description:
      'Red de chefs privados seleccionados para clientes exigentes en toda Europa. Villas, yates, residencias UHNW.',
    images: [
      {
        url: '/images/editorial/hero-chef-talents.jpg',
        width: 1200,
        height: 630,
        alt: 'Chef privado Chefs Talents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Chef Privado a Domicilio | Villas, Yates, Residencias — Chefs Talents',
    description:
      'Red de chefs privados seleccionados para clientes exigentes en toda Europa.',
    images: ['/images/editorial/hero-chef-talents.jpg'],
  },
};

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">
        Chef privado a domicilio en Europa — Villas, yates y residencias de lujo
      </h1>
      {children}
    </>
  );
}
