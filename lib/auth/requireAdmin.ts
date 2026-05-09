// lib/auth/requireAdmin.ts
// Helper serveur : vérifie qu'une requête entrante provient d'un admin
// authentifié via Supabase Auth.
//
// Pattern : remplace l'ancien `x-admin-email` (header forgeable trivialement)
// par un Bearer token Supabase. Le client doit envoyer son access_token dans
// `Authorization: Bearer <token>`. Le serveur valide le token via Supabase,
// extrait l'email réel de l'utilisateur, et vérifie qu'il est dans la
// allowlist admin.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Allowlist d'admins. Pour ajouter un admin, ajouter son email ici.
// Idéalement à externaliser en env var ADMIN_EMAILS=email1,email2 plus tard.
const ADMIN_EMAILS = new Set<string>([
  'thomas@chef-talents.com',
  'thomas@chefstalents.com',
  'contact@chefstalents.com',
]);

export type AdminAuthOk = {
  ok: true;
  user: {
    id: string;
    email: string;
  };
};

export type AdminAuthErr = {
  ok: false;
  status: 401 | 403 | 500;
  error: string;
};

/**
 * Vérifie que la requête provient d'un admin authentifié.
 * Retourne { ok: true, user } si OK, sinon { ok: false, status, error }.
 *
 * Usage dans une route :
 *   const auth = await requireAdmin(req);
 *   if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   // ... auth.user.email est garanti admin
 */
export async function requireAdmin(req: Request): Promise<AdminAuthOk | AdminAuthErr> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      ok: false,
      status: 500,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  // Extraction du token Bearer
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: 'MISSING_BEARER_TOKEN' };
  }
  const token = match[1].trim();
  if (!token) {
    return { ok: false, status: 401, error: 'EMPTY_BEARER_TOKEN' };
  }

  // Validation du token via Supabase auth
  // On crée un client anon spécifique à cette requête pour ne pas leaker
  // d'état entre requêtes simultanées.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, status: 401, error: 'INVALID_TOKEN' };
  }

  const email = (data.user.email || '').toLowerCase().trim();
  if (!email || !ADMIN_EMAILS.has(email)) {
    return { ok: false, status: 403, error: 'NOT_AN_ADMIN' };
  }

  return {
    ok: true,
    user: { id: data.user.id, email },
  };
}

/**
 * Sucre syntaxique : retourne directement une NextResponse 401/403 si non admin,
 * ou null si OK (la route continue).
 *
 * Usage :
 *   const denied = await rejectIfNotAdmin(req);
 *   if (denied) return denied;
 */
export async function rejectIfNotAdmin(req: Request): Promise<NextResponse | null> {
  const auth = await requireAdmin(req);
  if (auth.ok === true) return null;
  const err = auth as AdminAuthErr;
  return NextResponse.json(
    { error: err.error, ok: false },
    { status: err.status },
  );
}

/**
 * Pour les routes qui veulent l'utilisateur admin (id, email) en plus du gate.
 * Lève une exception 401/403 sous forme de NextResponse retournée.
 *
 * Usage :
 *   const auth = await requireAdminOr401(req);
 *   if (auth instanceof NextResponse) return auth;
 *   // ... auth.user disponible
 */
export async function requireAdminOr401(
  req: Request,
): Promise<AdminAuthOk | NextResponse> {
  const auth = await requireAdmin(req);
  if (auth.ok === true) return auth;
  const err = auth as AdminAuthErr;
  return NextResponse.json(
    { error: err.error, ok: false },
    { status: err.status },
  );
}
