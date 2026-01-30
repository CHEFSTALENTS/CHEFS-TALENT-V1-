import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChefRow = {
  id: string;
  email: string;
  profile: any; // JSONB
};

function getCity(profile: any): string | null {
  return profile?.baseCity?.trim() || null;
}

function getName(profile: any): string {
  if (profile?.name) return profile.name;
  const fn = profile?.firstName || '';
  const ln = profile?.lastName || '';
  const full = `${fn} ${ln}`.trim();
  return full || 'Chef';
}

function getAvatar(profile: any): string | null {
  return profile?.avatarUrl || profile?.photoUrl || null;
}

async function geocode(query: string) {
  const token = process.env.MAPBOX_SECRET_TOKEN;
  if (!token) throw new Error('Missing MAPBOX_SECRET_TOKEN');

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?limit=1&types=place,locality&access_token=${token}`;

  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return null;

  const j = await r.json();
  const f = j?.features?.[0];
  if (!f?.center) return null;

  return { lng: f.center[0], lat: f.center[1] };
}

export async function GET() {
  try {
    // 1️⃣ Load chefs
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('id,email,profile')
      .limit(2000);

    if (error) throw error;

    const chefs = (data || []) as ChefRow[];

    // 2️⃣ Normalize
    const prepared = chefs
      .map(c => {
        const city = getCity(c.profile);
        if (!city) return null;

        return {
          id: c.id,
          email: c.email,
          name: getName(c.profile),
          avatarUrl: getAvatar(c.profile),
          baseCity: city,
          query: city,
        };
      })
      .filter(Boolean) as any[];

    const queries = [...new Set(prepared.map(c => c.query))];

    // 3️⃣ Load geo cache
    const { data: cached } = await supabase
      .from('geo_cache')
      .select('query,lat,lng')
      .in('query', queries);

    const cache = new Map<string, { lat: number; lng: number }>();
    (cached || []).forEach((c: any) =>
      cache.set(c.query, { lat: c.lat, lng: c.lng })
    );

    // 4️⃣ Geocode missing
    for (const q of queries) {
      if (cache.has(q)) continue;

      const coords = await geocode(q);
      if (!coords) continue;

      cache.set(q, coords);

      await supabase
        .from('geo_cache')
        .upsert({ query: q, ...coords }, { onConflict: 'query' });
    }

    // 5️⃣ Final payload
    const items = prepared
      .map(c => {
        const geo = cache.get(c.query);
        if (!geo) return null;

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          avatarUrl: c.avatarUrl,
          baseCity: c.baseCity,
          lat: geo.lat,
          lng: geo.lng,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('admin/chefs/map error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
