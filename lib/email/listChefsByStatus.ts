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
 * Coerce une valeur arbitraire en objet (parse JSON string si besoin).
 * Aligné avec safeObj dans /api/admin/chefs/route.ts.
 */
function safeObj(v: any): any {
  if (!v) return {};
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  if (typeof v === 'object') return v;
  return {};
}

/**
 * Déballe un profile potentiellement imbriqué (profile.profile, profile.data,
 * profile.user). Aligné avec normalizeProfile dans /api/admin/chefs/route.ts.
 */
function normalizeProfile(raw: any): any {
  const p = safeObj(raw);
  return safeObj(p.profile || p.data || p.user || p);
}

/**
 * Normalise le status d'un profile en alignant la logique avec celle de
 * /api/admin/chefs (pickStatus + normalizeStatus).
 *
 * Tout status qui n'est pas un des 4 canoniques (pending_validation,
 * approved, active, paused) tombe dans 'pending_validation'. Cela inclut
 * notamment 'draft' (chefs ayant complété l'inscription mais en attente de
 * validation par l'admin), 'pending' (forme courte), et le status absent
 * ou vide.
 */
function pickProfileStatus(profile: any): string {
  const raw = String(
    profile?.status || profile?.chefStatus || profile?.state || '',
  )
    .trim()
    .toLowerCase();
  if ((ALLOWED_STATUSES as string[]).includes(raw)) return raw;
  // 'pending', 'draft', '', 'archived', etc. → considéré "à valider"
  return 'pending_validation';
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
  const statusBreakdown: Record<string, number> = {};

  for (const row of data ?? []) {
    // Déballe les profiles imbriqués (row.profile.profile.* observé en BDD).
    const profile = normalizeProfile(row.profile);
    const status = pickProfileStatus(profile);

    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

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

  console.log('[listChefsByStatus]', {
    wanted,
    totalRows: (data ?? []).length,
    statusBreakdown,
    matched: recipients.length,
  });

  return recipients;
}
