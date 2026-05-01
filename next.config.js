/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Headers SEO — canonical + hreflang
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'index, follow' },
        ],
      },
    ];
  },

  // Redirections www → non-www (résout le problème "page avec redirection")
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.chefstalents.com' }],
        destination: 'https://chefstalents.com/:path*',
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
};

module.exports = nextConfig;
