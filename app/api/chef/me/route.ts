import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

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
