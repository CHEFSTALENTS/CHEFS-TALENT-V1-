// lib/email/listVipChefs.ts
// Helper : liste tous les chefs VIP actifs depuis Supabase pour mailing.
// Utilisé par les emails broadcast (nouveau tip, communication custom).

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export type VipChefRecipient = {
  email: string;
  firstName: string;
  lastName: string;
  locale: 'fr' | 'en' | 'es';
  planKey?: string;
  complimentary: boolean;
};

function pickLocale(raw: any): 'fr' | 'en' | 'es' {
  if (raw === 'en' || raw === 'es' || raw === 'fr') return raw;
  return 'fr';
}

/**
 * Liste les chefs VIP actifs (plan='pro' && planStatus='active').
 * Inclut aussi bien les chefs payants (Stripe) que ceux à qui le VIP
 * a été offert par l'admin (complimentary=true).
 */
export async function listVipChefs(): Promise<VipChefRecipient[]> {
  const supabase = getSupabaseAdmin();

  // On scanne tous les chef_profiles et filtre côté code.
  // (Pas d'index sur profile->plan, donc query simple.)
  const { data, error } = await supabase
    .from('chef_profiles')
    .select('email, profile')
    .limit(2000);

  if (error) {
    console.error('[listVipChefs] read error', error);
    return [];
  }

  const recipients: VipChefRecipient[] = [];
  for (const row of data ?? []) {
    const profile = (row.profile && typeof row.profile === 'object'
      ? row.profile
      : {}) as any;

    const planActive =
      String(profile.plan || '') === 'pro' &&
      String(profile.planStatus || '') === 'active';
    if (!planActive) continue;

    const email = (row.email || profile.email || '').trim().toLowerCase();
    if (!email) continue;

    recipients.push({
      email,
      firstName: String(profile.firstName || '').trim(),
      lastName: String(profile.lastName || '').trim(),
      locale: pickLocale(profile.preferredLocale),
      planKey: profile.planKey,
      complimentary: profile.complimentary === true,
    });
  }

  return recipients;
}
