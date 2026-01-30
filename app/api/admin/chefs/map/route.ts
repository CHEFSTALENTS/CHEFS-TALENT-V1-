import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChefRow = {
  email: string;
  profile: any; // JSONB
  created_at?: string;
  updated_at?: string;
};

function getChefId(row: ChefRow): string {
  // id est dans profile
  const pid =
    row?.profile?.id ||
    row?.profile?.userId ||
    row?.profile?.chefId ||
    row?.profile?.uid;

  return (typeof pid === 'string' && pid.trim()) ? pid.trim() : row.email;
}

function getCity(profile: any): string | null {
  const city =
    profile?.location?.baseCity ||
    profile?.baseCity ||
    profile?.BaseCity;

  if (!city || typeof city !== 'string') return null;
  const trimmed = city.trim();
  return trimmed.length ? trimmed : null;
}

function getName(profile: any): string {
  if (profile?.name && typeof profile.name === 'string') return profile.name;

  const fn = (profile?.firstName || '').toString();
  const ln = (profile?.lastName || '').toString();
  const full = `${fn} ${ln}`.trim();

  return full || 'Chef';
}

function getAvatar(profile: any): string | null {
  const url = profile?.avatarUrl || profile?.photoUrl;
  if (!url || typeof url !== 'string') return null;
  return url.trim() || null;
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
  if (!f?.center || !Array.isArray(f.center) || f.center.length < 2) return null;

  return { lng: Number(f.center[0]), lat: Number(f.center[1]) };
}

export async function GET() {
  try {
    // 1) Load chefs (SANS id colonne)
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('email,profile') // ✅ important
      .limit(2000);

    if (error) throw error;

    const chefs = (data || []) as ChefRow[];

    // 2) Normalize
    const chefId = c.profile?.id; // <-- UUID dans le JSON
...
return {
  id: chefId,
  email: c.email,
  name: getName(c.profile),
  avatarUrl: getAvatar(c.profile),
  baseCity: city,
  query: city,
};
    
    const prepared = chefs
      .map(row => {
        const city = getCity(row.profile);
        if (!city) return null;

        // Si tu veux améliorer la précision, tu peux forcer un pays:
        // ex: `${city}, France` (mais là tu perds l'Europe)
        const query = city;

        return {
          id: getChefId(row),
          email: row.email,
          name: getName(row.profile),
          avatarUrl: getAvatar(row.profile),
          baseCity: city,
          query,
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

    const queries = [...new Set(prepared.map(c => c.query).filter(Boolean))];

    if (!queries.length) {
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
      if (c?.query && c?.lat != null && c?.lng != null) {
        cache.set(String(c.query), { lat: Number(c.lat), lng: Number(c.lng) });
      }
    });

    // 4) Geocode missing (séquentiel simple, OK pour 2k mais idéalement on batch)
    for (const q of queries) {
      if (cache.has(q)) continue;

      const coords = await geocode(q);
      if (!coords) continue;

      cache.set(q, coords);

      await supabase.from('geo_cache').upsert(
        { query: q, ...coords },
        { onConflict: 'query' }
      );
    }

    // 5) Final payload
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
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
