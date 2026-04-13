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
    { url: `${base}/insights/chef-prive-ibiza-2026`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights/combien-coute-chef-prive`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights/chef-prive-saint-tropez`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/insights/chef-prive-cannes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-monaco`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-mykonos`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-santorin`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-sardaigne`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-porto-cervo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-marbella`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-portugal-algarve`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-courchevel`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-megeve`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-val-disere`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-cap-ferrat`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-biarritz`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-marrakech`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-corfou`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-amalfi-capri`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-portofino`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-dubai`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-antibes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-nice`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-yacht`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-villa`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-chalet-montagne`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-famille-uhnw`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/insights/chef-prive-sejour-longue-duree`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
