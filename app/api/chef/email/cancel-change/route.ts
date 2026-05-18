// app/api/chef/email/cancel-change/route.ts
//
// POST : annule un changement d'email en cours (clear pendingEmail).
// Aucun email envoyé. Le chef revient à l'état "pas de changement en cours".

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireChefOr401 } from '@/lib/auth/requireChef';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireChefOr401(req);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.id;

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from('chef_profiles')
    .select('profile')
    .eq('user_id', userId)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: 'CHEF_NOT_FOUND' }, { status: 404 });
  }

  const profile = (row.profile as any) ?? {};
  const nextProfile = {
    ...profile,
    pendingEmail: null,
    pendingEmailRequestedAt: null,
    updatedAt: new Date().toISOString(),
  };
  await supabase
    .from('chef_profiles')
    .update({ profile: nextProfile })
    .eq('user_id', userId);

  return NextResponse.json({ ok: true });
}
