import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://chefstalents.com';
  const now = new Date().toISOString();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/conciergeries`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/private-clients`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/request`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/insights/chef-prive-cote-azur-ete-2026`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights/private-chef-french-riviera-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights/chef-prive-ibiza-2026`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/combien-coute-chef-prive`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights/chef-prive-saint-tropez`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-yacht`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-villa`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-chalet-montagne`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-famille-uhnw`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-sejour-longue-duree`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
