import type { Metadata } from 'next';

const SITE_URL = 'https://chefstalents.com';
const SITE_NAME = 'Chefs Talents';
const DEFAULT_IMAGE = '/images/editorial/hero-chef-talents.jpg';

export function buildMetadata({ title, description, slug = '', image = DEFAULT_IMAGE, type = 'website', noIndex = false }: { title: string; description: string; slug?: string; image?: string; type?: 'website' | 'article'; noIndex?: boolean; }): Metadata {
  const url = slug ? `${SITE_URL}/${slug}` : SITE_URL;
  return {
    title, description,
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'fr_FR', type, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export function buildArticleSchema(a: { title: string; description: string; slug: string; datePublished: string; dateModified?: string; image?: string; }) {
  return {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: a.title, description: a.description,
    url: `${SITE_URL}/insights/${a.slug}`,
    datePublished: a.datePublished, dateModified: a.dateModified ?? a.datePublished,
    image: `${SITE_URL}${a.image ?? DEFAULT_IMAGE}`,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` } },
    inLanguage: 'fr-FR',
  };
}
