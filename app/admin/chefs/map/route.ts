import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // ⚠️ service role ONLY côté serveur (Vercel env)
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeQuery(city?: string, country?: string) {
  const c = (city || '').trim();
  const co = (country || '').trim();
  if (!c) return null;
  // ex: "Paris, FR" ou "Paris, France"
  return co ? `${c}, ${co}` : c;
}

async function geocodeMapbox(q: string) {
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.MAPBOX_TOKEN;
  if (!token) throw new Error('Missing MAPBOX token (MAPBOX_SECRET_TOKEN recommended)');

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
    // 1) chefs (adapte les colonnes à ta table)
    const { data: chefs, error } = await supabase
      .from('chef_profiles')
      .select('id, first_name, last_name, city, country, status')
      .neq('status', 'deleted'); // optionnel

    if (error) throw error;

    const rows = (chefs || [])
      .map((c: any) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Chef',
        city: c.city || '',
        country: c.country || '',
        status: c.status || '',
        query: normalizeQuery(c.city, c.country),
      }))
      .filter(x => !!x.query);

    // 2) cache lookup (batch)
    const queries = Array.from(new Set(rows.map(r => r.query))) as string[];

    const { data: cached } = await supabase
      .from('geo_cache')
      .select('query, lat, lng')
      .in('query', queries);

    const cacheMap = new Map<string, { lat: number; lng: number }>();
    (cached || []).forEach((x: any) => cacheMap.set(x.query, { lat: x.lat, lng: x.lng }));

    // 3) geocode les manquants
    const missing = queries.filter(q => !cacheMap.has(q));

    for (const q of missing) {
      const coords = await geocodeMapbox(q);
      if (!coords) continue;

      cacheMap.set(q, coords);

      // upsert cache
      await supabase
        .from('geo_cache')
        .upsert({ query: q, lat: coords.lat, lng: coords.lng }, { onConflict: 'query' });
    }

    // 4) construit la réponse
    const points = rows
      .map(r => {
        const coords = cacheMap.get(r.query!);
        if (!coords) return null;
        return {
          id: r.id,
          name: r.name,
          city: r.city,
          country: r.country,
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
