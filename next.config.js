/** @type {import('next').NextConfig} */

// Content-Security-Policy : limite les sources autorisées pour les scripts,
// images, styles, etc. → réduit l'impact d'un XSS éventuel et bloque
// certains vecteurs (clickjacking, exfiltration).
//
// Démarré en `Content-Security-Policy-Report-Only` : le navigateur applique
// la policy en mode observation (log les violations dans la console, ne
// bloque rien) pendant 7-14 jours pour repérer les domains manquants sans
// casser la prod. Quand les logs sont propres, renommer le header en
// `Content-Security-Policy` pour passer en enforcement.
//
// Sources autorisées :
// - script : Stripe Checkout, GTM/Google Ads, Meta Pixel, PostHog
// - connect : Supabase, Stripe API, PostHog, Google Analytics, IP geo (ipapi)
// - img : Unsplash (placeholders SEO), Supabase Storage, Meta tracking
// - frame : Stripe Checkout, FB Pixel (1x1)
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-inline' + 'unsafe-eval' requis par Next.js App Router (RSC bootstrap)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.googleadservices.com https://www.google-analytics.com https://connect.facebook.net https://*.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://www.facebook.com https://www.google-analytics.com https://www.googletagmanager.com https://googleads.g.doubleclick.net",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.posthog.com https://www.google-analytics.com https://stats.g.doubleclick.net https://ipapi.co",
  "frame-src 'self' https://js.stripe.com https://www.facebook.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig = {
  reactStrictMode: true,

  // Headers HTTP : sécurité + SEO
  async headers() {
    // Headers de sécurité communs à toutes les pages
    const securityHeaders = [
      // CSP en mode observation (Report-Only). Bascule en
      // 'Content-Security-Policy' (sans Report-Only) après 7-14 jours
      // d'observation sans violations dans la console navigateur.
      {
        key: 'Content-Security-Policy-Report-Only',
        value: CSP_DIRECTIVES,
      },
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
      // Surcharges pour /admin/* : non indexable.
      // Note : on NE met PAS Cache-Control ici. Next.js 14.2 plante au
      // prerender si un Cache-Control de config conflicte avec le
      // `revalidate` de la page. Le contrôle de cache se fait via les
      // exports `dynamic = 'force-dynamic'` et `revalidate = 0` dans les
      // pages elles-mêmes.
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      // Surcharges pour /chef/* : non indexable (espaces privés)
      {
        source: '/chef/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Surcharges pour /api/* : non indexable. Cache contrôlé par les
      // routes elles-mêmes via `export const dynamic = 'force-dynamic'`.
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
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
    // ⚠️ Sécurité : éviter les wildcards de hostname dans remotePatterns.
    // Un wildcard '*.supabase.co' permet à n'importe quel projet Supabase
    // d'être source d'images proxifiées par Next.js Image Optimizer →
    // vecteur de DoS (cf. GHSA-9g9p-9gw9-jx7f).
    //
    // À FAIRE manuellement par Thomas : remplacer 'PROJECT-ID' par
    // l'ID exact du projet Supabase Chefs Talents (visible dans
    // NEXT_PUBLIC_SUPABASE_URL : https://PROJECT-ID.supabase.co).
    // En attendant, le wildcard reste actif pour ne pas casser les
    // images chef-uploads en prod, mais c'est À RESTREINDRE.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // TODO sécurité : restreindre à 'PROJECT-ID.supabase.co' une fois
      // l'ID confirmé. Le wildcard ci-dessous reste actif pour la prod.
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

module.exports = nextConfig;
