/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Headers HTTP : sécurité + SEO
  async headers() {
    // Headers de sécurité communs à toutes les pages
    const securityHeaders = [
      // HSTS : force HTTPS pendant 1 an, inclut les subdomains, autorise
      // l'inscription dans la liste preload Chromium (à demander manuellement
      // si tu veux via https://hstspreload.org/)
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      // Empêche les autres sites d'embarquer ton site dans une iframe
      // (anti-clickjacking, surtout pour /admin)
      { key: 'X-Frame-Options', value: 'DENY' },
      // Empêche le navigateur de "deviner" le type MIME (anti-XSS via
      // fichiers uploadés)
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Limite les infos passées dans le Referer aux requêtes cross-origin
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Désactive les API browser dont tu n'as pas besoin (geolocation,
      // microphone, camera, etc.). payment=(self) reste activé pour Stripe
      // Checkout.
      {
        key: 'Permissions-Policy',
        value:
          'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()',
      },
      // SEO : indexation autorisée par défaut
      { key: 'X-Robots-Tag', value: 'index, follow' },
    ];

    return [
      // Headers généraux pour toutes les routes du site
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Surcharges pour /admin/* : non indexable + cache court
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      // Surcharges pour /chef/* : non indexable (espaces privés)
      {
        source: '/chef/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Surcharges pour /api/* : pas de cache + non indexable
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },

  // Redirections www → non-www
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
