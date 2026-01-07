import { supabase } from '@/services/supabaseClient';

export async function requireSbUser() {
  const { data } = await supabase.auth.getSession();
  const sbUser = data.session?.user ?? null;
  if (!sbUser?.id) throw new Error('NO_USER');
  return sbUser;
}

export async function getChefProfile(userId: string) {
  const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(userId)}`, { cache: 'no-store' });
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

  const resPut = await fetch('/api/chef/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sbUser.id, profile: merged }),
  });

  if (!resPut.ok) {
    const txt = await resPut.text().catch(() => '');
    throw new Error(txt || 'SAVE_FAILED');
  }

  return merged;
}
