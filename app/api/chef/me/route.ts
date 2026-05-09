import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireChefOr401 } from '@/lib/auth/requireChef';

export async function GET(req: Request) {
  const auth = await requireChefOr401(req);
  if (auth instanceof NextResponse) return auth;
  const id = auth.user.id;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('chef_profiles')
    .select('profile')
    .eq('user_id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profile = (data?.profile ?? {}) as any;

  return NextResponse.json({
    status: profile?.status ?? null,
    termsAccepted: Boolean(profile?.termsAccepted),
    termsAcceptedAt: profile?.termsAcceptedAt ?? null,
    termsAcceptedVersion: profile?.termsAcceptedVersion ?? null,
    preferredLocale: profile?.preferredLocale ?? null,
  });
}
