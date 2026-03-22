import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clean(v: any) {
  const s = String(v ?? '').trim();
  return s || null;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('chef_profiles')
      .select('*')
      .limit(20);

    if (error) throw error;

    const sample = (data || []).map((row: any) => ({
      id: row?.id ?? null,
      email: row?.email ?? null,
      status_column: row?.status ?? null,
      city_column: row?.city ?? null,
      country_column: row?.country ?? null,
      first_name_column: row?.first_name ?? null,
      last_name_column: row?.last_name ?? null,

      has_profile: !!row?.profile,
      profile_id: row?.profile?.id ?? null,
      profile_status: row?.profile?.status ?? null,
      profile_name: row?.profile?.name ?? null,
      profile_firstName: row?.profile?.firstName ?? null,
      profile_lastName: row?.profile?.lastName ?? null,
      profile_baseCity: row?.profile?.baseCity ?? null,
      profile_country: row?.profile?.country ?? null,
      profile_location_baseCity: row?.profile?.location?.baseCity ?? null,
      profile_location_country: row?.profile?.location?.country ?? null,
      profile_avatarUrl: row?.profile?.avatarUrl ?? null,
      profile_photoUrl: row?.profile?.photoUrl ?? null,
    }));

    return NextResponse.json({
      ok: true,
      count: (data || []).length,
      sample,
    });
  } catch (e: any) {
    console.error('DEBUG /api/admin/chefs/map error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
