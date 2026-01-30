import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const chefId = params.id;

    // chef_profiles: { email, profile (jsonb) }
    // id est dans profile.id (UUID)
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('email,profile')
      .contains('profile', { id: chefId })
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Chef not found' }, { status: 404 });

    return NextResponse.json({
      chef: {
        id: chefId,
        email: data.email ?? data.profile?.email ?? '',
        profile: data.profile ?? {},
      },
    });
  } catch (e: any) {
    console.error('GET /api/admin/chefs/[id] error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
