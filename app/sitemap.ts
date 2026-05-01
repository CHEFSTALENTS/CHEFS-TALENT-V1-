import { MetadataRoute } from 'next';

const BASE_URL = 'https://chefstalents.com';

// Destinations principales — même liste que lib/destinations.ts
const DESTINATION_SLUGS = [
  // FR
  'chef-prive-ibiza', 'chef-prive-saint-tropez', 'chef-prive-monaco',
  'chef-prive-mykonos', 'chef-prive-courchevel', 'chef-prive-cap-ferret',
  'chef-prive-biarritz', 'chef-prive-marbella', 'chef-prive-portofino',
  'chef-prive-sardaigne', 'chef-prive-corse', 'chef-prive-megeve',
  'chef-prive-cannes', 'chef-prive-cap-ferrat',
  // EN
  'private-chef-ibiza', 'private-chef-saint-tropez', 'private-chef-monaco',
  'private-chef-mykonos', 'private-chef-courchevel', 'private-chef-cap-ferret',
  'private-chef-biarritz', 'private-chef-marbella', 'private-chef-portofino',
  'private-chef-sardinia', 'private-chef-corsica', 'private-chef-megeve',
  'private-chef-cannes', 'private-chef-cap-ferrat',
  // ES
  'chef-privado-ibiza', 'chef-privado-saint-tropez', 'chef-privado-monaco',
  'chef-privado-mykonos', 'chef-privado-courchevel', 'chef-privado-cap-ferret',
  'chef-privado-marbella', 'chef-privado-portofino',
  'chef-privado-cerdena', 'chef-privado-cannes',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Pages statiques principales
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/en`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/es`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/request`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/chef`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/conciergeries`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Pages destinations
  const destinationPages: MetadataRoute.Sitemap = DESTINATION_SLUGS.map(slug => ({
    url: `${BASE_URL}/destinations/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: slug.startsWith('private-chef-') ? 0.85 :
              slug.startsWith('chef-prive-') ? 0.85 : 0.80,
  }));

  return [...staticPages, ...destinationPages];
}
