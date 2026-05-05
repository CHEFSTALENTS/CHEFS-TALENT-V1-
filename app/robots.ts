import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/auth/', '/chef/'] }],
    sitemap: 'https://chefstalents.com/sitemap.xml',
  };
}
