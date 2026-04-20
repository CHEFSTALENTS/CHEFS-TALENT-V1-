import { MetadataRoute } from 'next';
import { getAllDestinationSlugs } from '@/lib/destinations';
import { articles } from '@/data/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://chefstalents.com';
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/conciergeries`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/private-clients`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/request`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/destinations`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/accompagnement`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/insights/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const destinationPages: MetadataRoute.Sitemap = getAllDestinationSlugs().map((slug) => ({
    url: `${base}/destinations/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages, ...destinationPages];
}
