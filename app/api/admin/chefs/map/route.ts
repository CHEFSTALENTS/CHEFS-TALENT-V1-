import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clean(v: any) {
  const s = String(v ?? '').trim();
  return s || null;
}

function getChefStatus(row: any) {
  return String(row?.status ?? row?.profile?.status ?? '').toLowerCase();
}

function getChefName(profile: any) {
  const full = clean(profile?.name);
  if (full) return full;

  const first = clean(profile?.firstName) || '';
  const last = clean(profile?.lastName) || '';
  return `${first} ${last}`.trim() || 'Chef';
}

function getChefBaseCity(profile: any) {
  return (
    clean(profile?.location?.baseCity) ||
    clean(profile?.baseCity) ||
    clean(profile?.location?.city) ||
    clean(profile?.city) ||
    clean(profile?.ville) ||
    null
  );
}

function getChefCountry(profile: any) {
  return (
    clean(profile?.location?.country) ||
    clean(profile?.country) ||
    null
  );
}

function normalizeQuery(city?: string | null, country?: string | null) {
  const c = clean(city);
  const co = clean(country);
  if (!c) return null;
  return co ? `${c}, ${co}` : c;
}

async function geocodeMapbox(q: string) {
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.MAPBOX_TOKEN;
  if (!token) throw new Error('Missing MAPBOX token');

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(q)}.json?access_token=${token}&limit=1&types=place,locality,region,address`;

  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Mapbox geocoding failed ${r.status}`);

  const json = await r.json();
  const feat = json?.features?.[0];
  if (!feat?.center?.length) return null;

  const [lng, lat] = feat.center;
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return null;
  }

  return { lat, lng };
}

export async function GET() {
  try {
    const { data: chefs, error } = await supabase
      .from('chef_profiles')
      .select('id, email, profile');

    if (error) throw error;

    const rows = (chefs || [])
      .map((row: any) => {
        const profile = row?.profile ?? {};
        const status = getChefStatus(row);

        if (status !== 'active') return null;

        const baseCity = getChefBaseCity(profile);
        const country = getChefCountry(profile);
        const query = normalizeQuery(baseCity, country);

        if (!query) return null;

        return {
          id: profile?.id || row.id,
          name: getChefName(profile),
          email: row?.email || profile?.email || '',
          avatarUrl: profile?.avatarUrl || profile?.photoUrl || null,
          baseCity: baseCity || '',
          country: country || '',
          query,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        baseCity: string;
        country: string;
        query: string;
      }>;

    const queries = Array.from(new Set(rows.map((r) => r.query)));

    const { data: cached } = await supabase
      .from('geo_cache')
      .select('query, lat, lng')
      .in('query', queries);

    const cacheMap = new Map<string, { lat: number; lng: number }>();
    (cached || []).forEach((x: any) => {
      if (
        typeof x?.lat === 'number' &&
        typeof x?.lng === 'number' &&
        !Number.isNaN(x.lat) &&
        !Number.isNaN(x.lng)
      ) {
        cacheMap.set(x.query, { lat: x.lat, lng: x.lng });
      }
    });

    const missing = queries.filter((q) => !cacheMap.has(q));

    for (const q of missing) {
      try {
        const coords = await geocodeMapbox(q);
        if (!coords) continue;

        cacheMap.set(q, coords);

        await supabase
          .from('geo_cache')
          .upsert(
            { query: q, lat: coords.lat, lng: coords.lng },
            { onConflict: 'query' }
          );
      } catch (e) {
        console.error('Mapbox geocode error for query:', q, e);
      }
    }

    const points = rows
      .map((r) => {
        const coords = cacheMap.get(r.query);
        if (!coords) return null;

        return {
          id: r.id,
          name: r.name,
          email: r.email,
          avatarUrl: r.avatarUrl,
          baseCity: r.baseCity,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items: points });
  } catch (e: any) {
    console.error('GET /api/admin/chefs/map error', e);
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
