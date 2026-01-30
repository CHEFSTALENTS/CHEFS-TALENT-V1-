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
  // selon ta table : soit colonnes directes, soit jsonb "profile"
  name?: string | null;
  email?: string | null;
  status?: string | null;

  baseCity?: string | null;
  location?: { baseCity?: string | null } | null;

  firstName?: string | null;
  lastName?: string | null;

  avatarUrl?: string | null;
  photoUrl?: string | null;
};

function pickCity(c: ChefRow) {
  return (
    (c.baseCity || '').trim() ||
    (c.location?.baseCity || '').trim() ||
    ''
  );
}

function pickName(c: ChefRow) {
  const n = (c.name || '').trim();
  if (n) return n;

  const fn = (c.firstName || '').trim();
  const ln = (c.lastName || '').trim();
  const combined = `${fn} ${ln}`.trim();
  return combined || 'Chef';
}

function normalizeQuery(city: string) {
  const q = (city || '').trim();
  if (!q) return null;
  // tu peux ajouter ", France" si tu veux plus de stabilité sur les petites villes
  return q;
}

async function geocodeMapbox(q: string) {
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.MAPBOX_TOKEN;
  if (!token) throw new Error('Missing MAPBOX token env');

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
    /**
     * ✅ IMPORTANT
     * Ici, tu dois sélectionner les champs EXACTS de ta table.
     * Vu ton JSON, tu as très probablement des colonnes directes:
     * id, name, email, status, baseCity, location, firstName, lastName, avatarUrl
     */
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('id,name,email,status,baseCity,location,firstName,lastName,avatarUrl,photoUrl')
      .limit(2000);

    if (error) throw error;

    const rows = (data || []) as ChefRow[];

    const prepared = rows
      .map((c) => {
        const city = pickCity(c);
        const query = normalizeQuery(city);

        return {
          id: c.id,
          name: pickName(c),
          email: c.email || '',
          status: c.status || '',
          avatarUrl: c.avatarUrl || c.photoUrl || '',
          baseCity: city,
          query,
        };
      })
      .filter((x) => !!x.query);

    const queries = Array.from(new Set(prepared.map((r) => r.query!)));

    // ✅ cache lookup
    const { data: cached } = await supabase
      .from('geo_cache')
      .select('query, lat, lng')
      .in('query', queries);

    const cacheMap = new Map<string, { lat: number; lng: number }>();
    (cached || []).forEach((x: any) => cacheMap.set(x.query, { lat: x.lat, lng: x.lng }));

    // ✅ geocode missing
    const missing = queries.filter((q) => !cacheMap.has(q));

    for (const q of missing) {
      const coords = await geocodeMapbox(q);
      if (!coords) continue;

      cacheMap.set(q, coords);

      await supabase
        .from('geo_cache')
        .upsert({ query: q, lat: coords.lat, lng: coords.lng }, { onConflict: 'query' });
    }

    const items = prepared
      .map((p) => {
        const coords = cacheMap.get(p.query!);
        if (!coords) return null;

        return {
          id: p.id,
          name: p.name,
          email: p.email,
          status: p.status,
          avatarUrl: p.avatarUrl,
          baseCity: p.baseCity,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('GET /api/admin/chefs/map error', e);
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
