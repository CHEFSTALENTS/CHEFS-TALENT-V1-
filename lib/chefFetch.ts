// lib/chefFetch.ts
// Helper client : wrapper fetch() qui injecte le Bearer token Supabase
// dans Authorization. Utilisé par les pages chef pour appeler les routes
// `/api/chef/*` qui sont désormais protégées par requireChef.
//
// Symétrique à lib/adminFetch.ts.

'use client';

import { supabase } from '@/services/supabaseClient';

export async function getChefAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) return null;
  return data.session.access_token;
}

/**
 * Wrapper fetch (raw Response) qui injecte le Bearer token Supabase
 * + Content-Type JSON automatique si body string.
 *
 * Lève une Error si pas de session (la page chef devrait gate en amont).
 */
export async function chefFetchRaw(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getChefAccessToken();
  if (!token) {
    throw new Error(
      'NOT_AUTHENTICATED — la session a expiré, reconnecte-toi sur /chef/login',
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

/**
 * Variante typée : lève si HTTP non-OK, parse JSON sinon.
 */
export async function chefFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await chefFetchRaw(url, init);
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
