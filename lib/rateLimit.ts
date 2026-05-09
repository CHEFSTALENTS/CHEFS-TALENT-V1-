// lib/rateLimit.ts
// Rate limiting in-memory simple, par IP et par identifier de route.
//
// Stratégie : sliding window avec un reset au bout de `windowMs`.
// Stocké dans une Map en mémoire de l'instance Vercel serverless.
// Limitations connues :
// - chaque cold-start de fonction réinitialise les compteurs
// - si Vercel scale à plusieurs instances, chacune a sa Map (rate limit
//   approximatif au niveau global, mais correct par instance)
// - pour un anti-spam basique sur un site low-volume, c'est suffisant
//
// À upgrader vers Upstash Redis ou Vercel KV quand le trafic justifie
// un rate limit distribué consistant.

import { NextResponse } from 'next/server';

export type RateLimitConfig = {
  /** Identifiant logique de la route (ex 'request-form', 'waitlist'). */
  identifier: string;
  /** Fenêtre de temps en millisecondes (ex 60_000 = 1 minute). */
  windowMs: number;
  /** Nombre max de requêtes dans la fenêtre. */
  max: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number };

// Map<key, { count, resetAt }>. La clé combine identifier + IP.
// Un nettoyage opportuniste au-dessus de 10000 entrées évite la croissance
// non bornée si l'instance vit longtemps (rare en serverless mais safe).
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 10_000;

function cleanupIfNeeded(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/**
 * Extrait l'IP cliente depuis les headers Vercel.
 * Fallback 'unknown' si aucune source disponible.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

/**
 * Vérifie le rate limit pour une requête. Incrémente le compteur si autorisé.
 *
 * Usage :
 *   const rl = rateLimit(req, { identifier: 'request-form', windowMs: 5*60_000, max: 5 });
 *   if (!rl.ok) return rateLimitResponse(rl);
 *   // ... continue
 */
export function rateLimit(req: Request, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanupIfNeeded(now);

  const ip = getClientIp(req);
  const key = `${config.identifier}:${ip}`;

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    // Nouvelle fenêtre
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  if (bucket.count >= config.max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return { ok: true, remaining: config.max - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Construit une NextResponse 429 standard avec header Retry-After.
 * Usage :
 *   const rl = rateLimit(req, ...);
 *   if (!rl.ok) return rateLimitResponse(rl);
 */
export function rateLimitResponse(rl: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((rl.resetAt - Date.now()) / 1000),
  );
  return NextResponse.json(
    {
      error: 'TOO_MANY_REQUESTS',
      detail: `Trop de requêtes, réessayez dans ${retryAfterSeconds} secondes.`,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Reset': String(rl.resetAt),
      },
    },
  );
}
