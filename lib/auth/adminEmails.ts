// lib/auth/adminEmails.ts
// Source unique de vérité pour l'allowlist d'emails admin.
// Importé à la fois par lib/auth/requireAdmin.ts (serveur) et par
// app/admin/_components/AdminGate.tsx (client).
//
// Configuration :
//   1. Définir NEXT_PUBLIC_ADMIN_EMAILS sur Vercel (CSV) :
//        NEXT_PUBLIC_ADMIN_EMAILS=email1@x.com,email2@y.com
//   2. Redéployer (les variables NEXT_PUBLIC_* sont inlinées au build)
//
// Si l'env var est absente, on retombe sur les valeurs hardcodées (les
// deux comptes de Thomas) pour garantir un accès admin minimum même en
// cas d'oubli de configuration. Un warning est loggé serveur-side dans
// ce cas, sans révéler le détail des emails.
//
// Sécurité : exposer NEXT_PUBLIC_ADMIN_EMAILS au client est OK. Cette
// liste sert à la défense en profondeur (UI gate AdminGate) ET au
// serveur. Connaître la liste ne donne PAS accès au admin : il faut
// un Bearer Supabase valide ET être dans la liste (cf. requireAdmin.ts).

// ============================================================
// Fallback hardcodé : utilisé uniquement si NEXT_PUBLIC_ADMIN_EMAILS
// n'est pas définie ou est vide. Garantit un accès admin minimum.
// ============================================================
const FALLBACK_EMAILS: string[] = [
  'contact@chefstalents.com',
  'thomasdelcroix2108@gmail.com',
];

/**
 * Parse une CSV d'emails en liste normalisée (lowercase + trim).
 * Tolère les espaces et les entrées vides.
 */
function parseAdminEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && e.includes('@'));
}

const RAW_ENV = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
const PARSED_FROM_ENV = parseAdminEmails(RAW_ENV);

// Source effective : env var si définie et valide, sinon fallback.
const EFFECTIVE_EMAILS =
  PARSED_FROM_ENV.length > 0 ? PARSED_FROM_ENV : FALLBACK_EMAILS;

// Warning serveur-side si on tombe sur le fallback en prod.
// (Console côté navigateur reste muet pour éviter le bruit utilisateur.)
if (
  typeof window === 'undefined' &&
  PARSED_FROM_ENV.length === 0 &&
  process.env.NODE_ENV === 'production'
) {
  console.warn(
    '[adminEmails] NEXT_PUBLIC_ADMIN_EMAILS not set, using hardcoded fallback. ' +
      'Configure it on Vercel for proper externalization.',
  );
}

export const ADMIN_EMAILS: ReadonlySet<string> = new Set<string>(
  EFFECTIVE_EMAILS,
);

/**
 * Vérifie qu'un email est dans l'allowlist admin.
 * Insensible à la casse, trim auto.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

/**
 * Pour debug / vérif manuelle : combien d'admins sont configurés et
 * via quelle source. Ne révèle PAS la liste, juste le compte et l'origine.
 */
export function getAdminEmailsSource(): {
  count: number;
  source: 'env' | 'fallback';
} {
  return {
    count: EFFECTIVE_EMAILS.length,
    source: PARSED_FROM_ENV.length > 0 ? 'env' : 'fallback',
  };
}
