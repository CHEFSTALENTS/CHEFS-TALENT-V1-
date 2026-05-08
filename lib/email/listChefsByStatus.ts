// lib/email/listChefsByStatus.ts
// Helper : liste tous les chefs depuis Supabase filtrés par status,
// pour les newsletters ciblées par segment.
// Filtre automatiquement les chefs désinscrits du marketing.

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export type ChefStatus =
  | 'pending_validation'
  | 'approved'
  | 'active'
  | 'paused';

export type ChefRecipient = {
  email: string;
  firstName: string;
  lastName: string;
  locale: 'fr' | 'en' | 'es';
  status: string;
};

const ALLOWED_STATUSES: ChefStatus[] = [
  'pending_validation',
  'approved',
  'active',
  'paused',
];

function pickLocale(raw: any): 'fr' | 'en' | 'es' {
  if (raw === 'en' || raw === 'es' || raw === 'fr') return raw;
  return 'fr';
}

/**
 * Liste les chefs dont le status est dans la liste passée. Filtre les désinscrits.
 *
 * @param statuses sous-ensemble parmi pending_validation / approved / active / paused
 *                 si vide ou absent, retourne []
 */
export async function listChefsByStatus(
  statuses: ChefStatus[],
): Promise<ChefRecipient[]> {
  // Sécurité : on ne renvoie rien si aucun status n'est fourni (évite les
  // envois massifs accidentels).
  const wanted = statuses.filter((s) =>
    (ALLOWED_STATUSES as string[]).includes(s),
  );
  if (wanted.length === 0) return [];

  const supabase = getSupabaseAdmin();

  // Scan tous les chef_profiles. Pas d'index sur profile->status, on filtre
  // côté code. Cap à 5000 pour éviter de sortir un dump complet par erreur.
  const { data, error } = await supabase
    .from('chef_profiles')
    .select('email, profile')
    .limit(5000);

  if (error) {
    console.error('[listChefsByStatus] read error', error);
    return [];
  }

  const recipients: ChefRecipient[] = [];
  for (const row of data ?? []) {
    const profile = (row.profile && typeof row.profile === 'object'
      ? row.profile
      : {}) as any;

    const status = String(profile.status || '').toLowerCase();
    if (!(wanted as string[]).includes(status)) continue;

    // Exclut les désinscrits marketing (pas pour les transactionnels).
    if (profile.marketingUnsubscribedAt) continue;

    const email = String(row.email || profile.email || '').trim().toLowerCase();
    if (!email) continue;

    recipients.push({
      email,
      firstName: String(profile.firstName || '').trim(),
      lastName: String(profile.lastName || '').trim(),
      locale: pickLocale(profile.preferredLocale),
      status,
    });
  }

  return recipients;
}
