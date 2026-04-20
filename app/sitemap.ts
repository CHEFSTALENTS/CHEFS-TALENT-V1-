import { MetadataRoute } from 'next';
import { getAllDestinationSlugs } from '@/lib/destinations';

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

  const articlePages: MetadataRoute.Sitemap = [
    'chef-prive-cote-azur-ete-2026', 'private-chef-french-riviera-guide',
    'chef-prive-ibiza-2026', 'combien-coute-chef-prive', 'chef-prive-saint-tropez',
    'chef-prive-cannes', 'chef-prive-monaco', 'chef-prive-mykonos', 'chef-prive-santorin',
    'chef-prive-sardaigne', 'chef-prive-porto-cervo', 'chef-prive-marbella',
    'chef-prive-portugal-algarve', 'chef-prive-courchevel', 'chef-prive-megeve',
    'chef-prive-val-disere', 'chef-prive-cap-ferrat', 'chef-prive-biarritz',
    'chef-prive-marrakech', 'chef-prive-corfou', 'chef-prive-amalfi-capri',
    'chef-prive-portofino', 'chef-prive-dubai', 'chef-prive-antibes', 'chef-prive-nice',
    'chef-prive-yacht', 'chef-prive-villa', 'chef-prive-chalet-montagne',
    'chef-prive-famille-uhnw', 'chef-prive-sejour-longue-duree',
  ].map((slug) => ({
    url: `${base}/insights/${slug}`,
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
