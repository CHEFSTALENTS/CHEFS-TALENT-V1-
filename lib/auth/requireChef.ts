// lib/auth/requireChef.ts
// Helper serveur : vérifie qu'une requête entrante provient d'un chef
// authentifié via Supabase Auth.
//
// Pattern symétrique à `requireAdmin`. Toute route `/api/chef/*` qui mute
// ou lit des données spécifiques à un chef DOIT utiliser ce helper et NE
// JAMAIS faire confiance à un `userId` / `chefId` / `id` reçu en query ou
// body — uniquement l'`id` du token Supabase est fiable.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export type ChefAuthOk = {
  ok: true;
  user: {
    id: string;
    email: string;
  };
};

export type ChefAuthErr = {
  ok: false;
  status: 401 | 500;
  error: string;
};

/**
 * Valide un Bearer token Supabase et retourne l'utilisateur authentifié.
 *
 * Usage :
 *   const auth = await requireChef(req);
 *   if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   const userId = auth.user.id;  // jamais issu du body !
 */
export async function requireChef(req: Request): Promise<ChefAuthOk | ChefAuthErr> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      ok: false,
      status: 500,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: 'MISSING_BEARER_TOKEN' };
  }
  const token = match[1].trim();
  if (!token) {
    return { ok: false, status: 401, error: 'EMPTY_BEARER_TOKEN' };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, error: 'INVALID_TOKEN' };
  }

  return {
    ok: true,
    user: {
      id: data.user.id,
      email: (data.user.email || '').toLowerCase().trim(),
    },
  };
}

/**
 * Sucre syntaxique : retourne directement une NextResponse 401/500 si
 * non authentifié, ou la session OK.
 *
 * Usage :
 *   const auth = await requireChefOr401(req);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.user.id est la SOURCE DE VÉRITÉ
 */
export async function requireChefOr401(
  req: Request,
): Promise<ChefAuthOk | NextResponse> {
  const auth = await requireChef(req);
  if (auth.ok === true) return auth;
  const err = auth as ChefAuthErr;
  return NextResponse.json(
    { error: err.error, ok: false },
    { status: err.status },
  );
}
