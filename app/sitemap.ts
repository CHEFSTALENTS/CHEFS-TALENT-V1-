import { MetadataRoute } from 'next';
import { getAllDestinationSlugs } from '@/lib/destinations';
import { articles } from '@/data/articles';

const BASE_URL = 'https://chefstalents.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Pages statiques principales (homepage, langues, conversion, légal)
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/en`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/es`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/conciergeries`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/private-clients`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/destinations`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/insights`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/request`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/accompagnement`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Pages destinations (FR + EN + ES, lues dynamiquement depuis lib/destinations.ts)
  const destinationPages: MetadataRoute.Sitemap = getAllDestinationSlugs().map((slug) => ({
    url: `${BASE_URL}/destinations/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: slug.startsWith('private-chef-') || slug.startsWith('chef-prive-') ? 0.85 : 0.8,
  }));

  // Pages articles (lues dynamiquement depuis data/articles.ts)
  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/insights/${a.slug}`,
    lastModified: a.publishedAt ? new Date(a.publishedAt) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...destinationPages, ...articlePages];
}
