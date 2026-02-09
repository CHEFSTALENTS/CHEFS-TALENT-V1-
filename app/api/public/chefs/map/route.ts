import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
);

function getCity(profile: any): string | null {
  const v = profile?.baseCity ?? profile?.location?.baseCity;
  return typeof v === 'string' ? v.trim() || null : null;
}

export async function GET() {
  try {
    // 1) on prend seulement les chefs approved
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('profile,status')
      .eq('status', 'approved')
      .limit(5000);

    if (error) throw error;

    // 2) group by city
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const city = getCity((row as any).profile);
      if (!city) continue;
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }

    const queries = [...counts.keys()];

    // 3) récup coords depuis geo_cache
    const { data: cached, error: e2 } = await supabase
      .from('geo_cache')
      .select('query,lat,lng')
      .in('query', queries);

    if (e2) throw e2;

    const geo = new Map<string, { lat: number; lng: number }>();
    (cached ?? []).forEach((c: any) => geo.set(c.query, { lat: c.lat, lng: c.lng }));

    // 4) payload anonymisé
    const items = queries
      .map((q) => {
        const g = geo.get(q);
        if (!g) return null;

        const count = counts.get(q) ?? 0;

        // Option privacy: si < 2 chefs, on n’affiche pas
        if (count < 2) return null;

        return {
          city: q,
          lat: g.lat,
          lng: g.lng,
          count,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('public/chefs/map error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
