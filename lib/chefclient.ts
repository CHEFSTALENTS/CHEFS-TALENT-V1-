import { supabase } from '@/services/supabaseClient';
import { chefFetchRaw } from '@/lib/chefFetch';

export async function requireSbUser() {
  const { data } = await supabase.auth.getSession();
  const sbUser = data.session?.user ?? null;
  if (!sbUser?.id) throw new Error('NO_USER');
  return sbUser;
}

export async function getChefProfile(_userId?: string) {
  // _userId est ignoré — la route déduit l'identité du Bearer token.
  const res = await chefFetchRaw('/api/chef/profile', { cache: 'no-store' });
  const json = await res.json();
  return json?.profile ?? {};
}

export async function saveChefProfilePatch(patch: Record<string, any>) {
  const sbUser = await requireSbUser();

  const current = await getChefProfile(sbUser.id);

  const merged = {
    ...current,
    ...patch,
    id: sbUser.id,
    email: sbUser.email ?? current.email ?? '',
    updatedAt: new Date().toISOString(),
  };

  const resPut = await chefFetchRaw('/api/chef/profile', {
    method: 'PUT',
    body: JSON.stringify({ profile: merged }),
  });

  if (!resPut.ok) {
    const txt = await resPut.text().catch(() => '');
    throw new Error(txt || 'SAVE_FAILED');
  }

  return merged;
}
