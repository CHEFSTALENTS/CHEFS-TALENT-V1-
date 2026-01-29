import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // ✅ ADAPTE le nom de table/colonnes à ta DB
    // Exemple: public.chef_profiles: id, first_name, last_name, city, country, lat, lng, status
    const { data, error } = await supabaseAdmin
      .from('chef_profiles')
      .select('id, first_name, last_name, city, country, lat, lng, status')
      .limit(2000);

    if (error) throw error;

    const items = (data || []).map((c: any) => ({
      id: c.id,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Chef',
      city: c.city || '',
      country: c.country || '',
      lat: c.lat ?? null,
      lng: c.lng ?? null,
      status: c.status || '',
      query: [c.city, c.country].filter(Boolean).join(', '), // pour geocode si pas de coords
    }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
