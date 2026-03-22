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

function normalizeQuery(city?: string | null, country?: string | null) {
  const c = clean(city);
  const co = clean(country);
  if (!c) return null;
  return co ? `${c}, ${co}` : c;
}

function getRowStatus(row: any) {
  return String(
    row?.status ??
      row?.profile?.status ??
      ''
  ).toLowerCase();
}

function getRowName(row: any) {
  return (
    clean(row?.profile?.name) ||
    clean(
      `${row?.profile?.firstName || row?.first_name || ''} ${row?.profile?.lastName || row?.last_name || ''}`
    ) ||
    'Chef'
  );
}

function getRowEmail(row: any) {
  return clean(row?.email) || clean(row?.profile?.email) || '';
}

function getRowAvatar(row: any) {
  return (
    clean(row?.profile?.avatarUrl) ||
    clean(row?.profile?.photoUrl) ||
    null
  );
}

function getRowBaseCity(row: any) {
  return (
    clean(row?.profile?.location?.baseCity) ||
    clean(row?.profile?.baseCity) ||
    clean(row?.profile?.location?.city) ||
    clean(row?.profile?.city) ||
    clean(row?.profile?.ville) ||
    clean(row?.city) ||
    null
  );
}

function getRowCountry(row: any) {
  return (
    clean(row?.profile?.location?.country) ||
    clean(row?.profile?.country) ||
    clean(row?.country) ||
    null
  );
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
      .select('id, email, status, city, country, first_name, last_name, profile');

    if (error) throw error;

    const allRows = (chefs || []).map((row: any) => {
      const status = getRowStatus(row);
      const baseCity = getRowBaseCity(row);
      const country = getRowCountry(row);
      const query = normalizeQuery(baseCity, country);

      return {
        id: row?.profile?.id || row.id,
        name: getRowName(row),
        email: getRowEmail(row),
        avatarUrl: getRowAvatar(row),
        baseCity: baseCity || '',
        country: country || '',
        status,
        query,
      };
    });

    // uniquement actifs
    const rows = allRows.filter((r) => r.status === 'active' && !!r.query);

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

    return NextResponse.json({
      items: points,
      debug: {
        total: allRows.length,
        active: allRows.filter((r) => r.status === 'active').length,
        withQuery: allRows.filter((r) => !!r.query).length,
        activeWithQuery: rows.length,
        geolocated: points.length,
      },
    });
  } catch (e: any) {
    console.error('GET /api/admin/chefs/map error', e);
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
