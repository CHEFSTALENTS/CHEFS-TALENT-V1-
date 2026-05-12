// lib/storage.ts
// Helper serveur pour signer les URLs du bucket `chef-uploads`.
//
// Stratégie : le bucket Supabase Storage `chef-uploads` est passé en
// PRIVÉ. Les URLs publiques existantes en DB ne fonctionnent plus.
// À la lecture, on transforme dynamiquement chaque URL stockée en
// signed URL temporaire (TTL 1h par défaut).
//
// Cette approche permet de :
//   - Garder le format DB inchangé (rétro-compat zéro)
//   - Sécuriser instantanément en privatisant le bucket
//   - Ne pas exiger une migration des URLs existantes
//
// Format toléré en entrée :
//   - URL publique legacy : https://xxx.supabase.co/storage/v1/object/public/chef-uploads/<path>
//   - Signed URL déjà valide : conservée
//   - Path direct : <userId>/<kind>/<uuid>.{ext}
//   - URL externe (Google, etc.) : conservée telle quelle

import { createClient } from '@supabase/supabase-js';

const BUCKET = 'chef-uploads';
const DEFAULT_TTL_SEC = 3600; // 1 heure

// Pattern qui détecte les URLs publiques Supabase Storage pour ce bucket
const PUBLIC_URL_PATTERN = new RegExp(
  `/storage/v1/object/public/${BUCKET}/(.+?)(\\?|$)`,
);

// Pattern qui détecte les URLs signées (déjà valides)
const SIGNED_URL_PATTERN = /\/storage\/v1\/object\/sign\//;

let _supabase: ReturnType<typeof createClient> | null = null;
function supabase() {
  if (_supabase) return _supabase;
  _supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  return _supabase;
}

/**
 * Convertit une URL publique legacy, un path ou une signed URL existante
 * en signed URL fraîche. Retourne null si le path est invalide ou en
 * cas d'erreur de signing (on ne casse pas l'app, juste pas d'image).
 */
export async function signChefUrl(
  input: string | null | undefined,
  ttlSec: number = DEFAULT_TTL_SEC,
): Promise<string | null> {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Cas 1 : URL signée déjà valide → on la garde (le client la verra
  // expirer si TTL trop court, mais à ce stade on ne sait pas).
  if (SIGNED_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  // Cas 2 : URL externe (CDN tiers, Google, etc.) → on la garde
  if (
    /^https?:\/\//.test(trimmed) &&
    !trimmed.includes('/storage/v1/object/public/') &&
    !trimmed.includes('/storage/v1/object/sign/')
  ) {
    return trimmed;
  }

  // Cas 3 : URL publique legacy → extraire le path
  let path: string | null = null;
  const match = trimmed.match(PUBLIC_URL_PATTERN);
  if (match) {
    path = decodeURIComponent(match[1]);
  } else if (!trimmed.startsWith('http')) {
    // Cas 4 : path direct (pas d'URL devant)
    path = trimmed;
  }

  if (!path) {
    // Format non reconnu, on retourne null silencieusement
    return null;
  }

  try {
    const { data, error } = await supabase()
      .storage.from(BUCKET)
      .createSignedUrl(path, ttlSec);
    if (error) {
      console.warn('[signChefUrl] sign failed for path', path, error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (e: any) {
    console.warn('[signChefUrl] exception', e?.message);
    return null;
  }
}

/**
 * Signe plusieurs URLs en batch (Promise.all). Garde l'ordre des inputs.
 */
export async function signChefUrls(
  inputs: Array<string | null | undefined>,
  ttlSec: number = DEFAULT_TTL_SEC,
): Promise<Array<string | null>> {
  return Promise.all(inputs.map((i) => signChefUrl(i, ttlSec)));
}

/**
 * Inverse de signChefUrl : convertit une signed URL en URL publique
 * legacy (format historique stocké en DB) pour pouvoir la PERSISTER
 * sans qu'elle expire.
 *
 * Utilisé à l'upsert : le frontend renvoie des signed URLs (qu'il a
 * reçues du GET), il faut les normaliser avant de sauvegarder en DB.
 *
 * Retourne :
 *  - URL publique reconstruite si entrée est une signed URL
 *  - L'entrée telle quelle dans tous les autres cas (path, URL externe,
 *    URL publique déjà OK)
 */
export function unsignChefUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pattern signed URL : /storage/v1/object/sign/chef-uploads/<path>?token=...
  const SIGNED_PATTERN = new RegExp(
    `/storage/v1/object/sign/${BUCKET}/(.+?)(\\?|$)`,
  );
  const m = trimmed.match(SIGNED_PATTERN);
  if (m) {
    const path = decodeURIComponent(m[1]);
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  // Pas une signed URL — retour tel quel
  return trimmed;
}

/**
 * Inverse de signChefProfileUrls : normalise toutes les URLs storage
 * dans un profile avant upsert. À appeler dans les routes POST/PATCH
 * de profile pour éviter de stocker des signed URLs (qui expirent).
 */
export function unsignChefProfileUrls(profile: any): void {
  if (!profile || typeof profile !== 'object') return;
  if (profile.avatarUrl) profile.avatarUrl = unsignChefUrl(profile.avatarUrl);
  if (profile.photoUrl) profile.photoUrl = unsignChefUrl(profile.photoUrl);
  for (const key of ['images', 'photos', 'gallery', 'portfolioImages', 'portfolioPhotos']) {
    if (Array.isArray(profile[key])) {
      profile[key] = profile[key].map((u: string) => unsignChefUrl(u));
    }
  }
}

/**
 * Signe les champs avatarUrl/photoUrl/images d'un profile chef in-place.
 * Utilitaire pour les endpoints qui retournent des profils chef.
 *
 * @param profile - objet profile (sera muté)
 * @param ttlSec - TTL des signed URLs en secondes (default 1h)
 */
export async function signChefProfileUrls(
  profile: any,
  ttlSec: number = DEFAULT_TTL_SEC,
): Promise<void> {
  if (!profile || typeof profile !== 'object') return;

  const tasks: Promise<void>[] = [];

  if (profile.avatarUrl) {
    tasks.push(
      signChefUrl(profile.avatarUrl, ttlSec).then((url) => {
        profile.avatarUrl = url || profile.avatarUrl;
      }),
    );
  }
  if (profile.photoUrl) {
    tasks.push(
      signChefUrl(profile.photoUrl, ttlSec).then((url) => {
        profile.photoUrl = url || profile.photoUrl;
      }),
    );
  }
  if (Array.isArray(profile.images)) {
    tasks.push(
      signChefUrls(profile.images, ttlSec).then((urls) => {
        profile.images = urls.map((u, i) => u || profile.images[i]);
      }),
    );
  }
  // Autres champs portfolio potentiels (couverture historique)
  for (const key of ['photos', 'gallery', 'portfolioImages', 'portfolioPhotos']) {
    if (Array.isArray(profile[key])) {
      tasks.push(
        signChefUrls(profile[key], ttlSec).then((urls) => {
          profile[key] = urls.map((u, i) => u || profile[key][i]);
        }),
      );
    }
  }

  await Promise.all(tasks);
}
