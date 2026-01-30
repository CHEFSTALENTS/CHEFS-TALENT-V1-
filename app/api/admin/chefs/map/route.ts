import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChefRow = {
  email: string | null;
  profile: any; // JSONB
};

function getCity(profile: any): string | null {
  const city = profile?.baseCity || profile?.location?.baseCity || null;
  return typeof city === 'string' ? city.trim() || null : null;
}

function getName(profile: any): string {
  if (profile?.name) return String(profile.name);
  const fn = profile?.firstName ? String(profile.firstName) : '';
  const ln = profile?.lastName ? String(profile.lastName) : '';
  const full = `${fn} ${ln}`.trim();
  return full || 'Chef';
}

function getAvatar(profile: any): string | null {
  return profile?.avatarUrl || profile?.photoUrl || null;
}

async function geocode(query: string) {
  const token = process.env.MAPBOX_SECRET_TOKEN; // ✅ important : côté server
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
    // 1) Load chefs (email + profile JSONB)
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('email,profile')
      .limit(3000);

    if (error) throw error;

    const rows = (data || []) as ChefRow[];

    // 2) Normalize (id vient du JSON profile.id)
    const prepared = rows
      .map((c) => {
        const profile = c.profile || {};
        const chefId = profile?.id; // ✅ UUID stocké dans le JSON
        const city = getCity(profile);
        if (!chefId || !city) return null;

        return {
          id: String(chefId),
          email: c.email ? String(c.email) : '',
          name: getName(profile),
          avatarUrl: getAvatar(profile),
          baseCity: city,
          query: city, // (ex: "Marseille")
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        baseCity: string;
        query: string;
      }>;

    const queries = Array.from(new Set(prepared.map((x) => x.query)));

    if (queries.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // 3) Load geo cache
    const { data: cached, error: cacheErr } = await supabase
      .from('geo_cache')
      .select('query,lat,lng')
      .in('query', queries);

    if (cacheErr) throw cacheErr;

    const cache = new Map<string, { lat: number; lng: number }>();
    (cached || []).forEach((c: any) => {
      if (c?.query && typeof c.lat === 'number' && typeof c.lng === 'number') {
        cache.set(String(c.query), { lat: c.lat, lng: c.lng });
      }
    });

    // 4) Geocode missing + upsert
    for (const q of queries) {
      if (cache.has(q)) continue;

      const coords = await geocode(q);
      if (!coords) continue;

      cache.set(q, coords);

      await supabase
        .from('geo_cache')
        .upsert({ query: q, lat: coords.lat, lng: coords.lng }, { onConflict: 'query' });
    }

    // 5) Final payload
    const items = prepared
      .map((c) => {
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
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
