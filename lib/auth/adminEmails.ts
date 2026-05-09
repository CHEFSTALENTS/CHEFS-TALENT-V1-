// lib/auth/adminEmails.ts
// Source unique de vérité pour l'allowlist d'emails admin.
// Importé à la fois par lib/auth/requireAdmin.ts (serveur) et par
// app/admin/_components/AdminGate.tsx (client).
//
// À externaliser plus tard en env var ADMIN_EMAILS=email1,email2,...

export const ADMIN_EMAILS: ReadonlySet<string> = new Set<string>([
  'contact@chefstalents.com',
  'thomasdelcroix2108@gmail.com',
]);

/**
 * Vérifie qu'un email est dans l'allowlist admin.
 * Insensible à la casse, trim auto.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}
