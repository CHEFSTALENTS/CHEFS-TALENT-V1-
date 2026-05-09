// lib/adminFetch.ts
// Helper client : wrapper autour de fetch() qui injecte automatiquement
// le Bearer token Supabase dans l'header Authorization.
//
// Remplace l'ancien pattern `'x-admin-email': ADMIN_EMAIL` qui était
// trivialement forgeable depuis n'importe quel client externe (curl, devtools).
//
// Usage :
//   import { adminFetch } from '@/lib/adminFetch';
//   const data = await adminFetch<MyType>('/api/admin/chefs');
//   const data = await adminFetch<MyType>('/api/admin/x', { method: 'POST', body: JSON.stringify({...}) });

'use client';

import { supabase } from '@/services/supabaseClient';

/**
 * Récupère le token d'accès Supabase de la session courante.
 * Retourne null si l'utilisateur n'est pas connecté.
 */
export async function getAdminAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) return null;
  return data.session.access_token;
}

/**
 * Wrapper fetch qui injecte le Bearer token Supabase + Content-Type JSON
 * et qui parse automatiquement la réponse en JSON typé.
 *
 * Lève une Error si la session n'est pas active ou si la requête échoue.
 */
export async function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error(
      'NOT_AUTHENTICATED — la session admin a expiré, reconnecte-toi sur /chef/login',
    );
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (
    !headers.has('Content-Type') &&
    typeof init.body === 'string' &&
    init.body.length > 0
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: init.cache ?? 'no-store',
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    let detail = '';
    try {
      const json = JSON.parse(text);
      detail = json?.error || json?.detail || '';
    } catch {}
    throw new Error(detail ? `${detail} (HTTP ${res.status})` : `HTTP ${res.status}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/**
 * Variante "raw" : retourne la Response brute (utile si on veut accéder aux
 * headers, au statut, ou parser autre chose que JSON).
 */
export async function adminFetchRaw(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error(
      'NOT_AUTHENTICATED — la session admin a expiré, reconnecte-toi sur /chef/login',
    );
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (
    !headers.has('Content-Type') &&
    typeof init.body === 'string' &&
    init.body.length > 0
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...init, headers, cache: init.cache ?? 'no-store' });
}
