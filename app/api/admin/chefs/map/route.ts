import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

function normalizeQuery(baseCity?: string) {
  const c = (baseCity || '').trim();
  if (!c) return null;
  // tu peux forcer Europe/FR si tu veux : `${c}, Europe`
  return c;
}

async function geocodeMapbox(q: string) {
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.MAPBOX_TOKEN;
  if (!token) throw new Error('Missing MAPBOX token');

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(q)}.json?access_token=${token}&limit=1&types=place,locality`;

  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Mapbox geocoding failed ${r.status}`);
  const json = await r.json();

  const feat = json?.features?.[0];
  if (!feat?.center?.length) return null;

  const [lng, lat] = feat.center;
  return { lat, lng };
}

export async function GET() {
  try {
    // ✅ adapte aux champs réels dans chef_profiles
    const { data: chefs, error } = await supabase
      .from('chef_profiles')
      .select('id, first_name, last_name, email, BaseCity, status')
      .neq('status', 'deleted'); // optionnel

    if (error) throw error;

    const rows = (chefs || [])
      .map((c: any) => {
        const q = normalizeQuery(c.BaseCity);
        return {
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Chef',
          email: c.email || '',
          baseCity: c.BaseCity || '',
          status: c.status || '',
          query: q,
        };
      })
      .filter(x => !!x.query);

    const queries = Array.from(new Set(rows.map(r => r.query))) as string[];

    // cache batch
    const { data: cached } = await supabase
      .from('geo_cache')
      .select('query, lat, lng')
      .in('query', queries);

    const cacheMap = new Map<string, { lat: number; lng: number }>();
    (cached || []).forEach((x: any) => cacheMap.set(x.query, { lat: x.lat, lng: x.lng }));

    // geocode manquants
    const missing = queries.filter(q => !cacheMap.has(q));

    for (const q of missing) {
      const coords = await geocodeMapbox(q);
      if (!coords) continue;

      cacheMap.set(q, coords);

      await supabase
        .from('geo_cache')
        .upsert({ query: q, lat: coords.lat, lng: coords.lng }, { onConflict: 'query' });
    }

    const points = rows
      .map(r => {
        const coords = cacheMap.get(r.query!);
        if (!coords) return null;
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          baseCity: r.baseCity,
          status: r.status,
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
