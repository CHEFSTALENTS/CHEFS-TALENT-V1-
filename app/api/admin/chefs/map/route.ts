export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

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

function getChefName(profile: any) {
  const fullName = clean(profile?.name);
  if (fullName) return fullName;

  const first = clean(profile?.firstName) || '';
  const last = clean(profile?.lastName) || '';
  const merged = `${first} ${last}`.trim();

  return merged || 'Chef';
}

function getChefStatus(row: any) {
  return String(row?.status ?? row?.profile?.status ?? '').toLowerCase();
}

function getChefBaseCity(profile: any) {
  return (
    clean(profile?.location?.baseCity) ||
    clean(profile?.baseCity) ||
    clean(profile?.location?.city) ||
    clean(profile?.city) ||
    clean(profile?.ville) ||
    // Fallbacks supplémentaires si la structure du profile diffère
    clean(profile?.address?.city) ||
    clean(profile?.location?.address) ||
    clean(profile?.address) ||
    null
  );
}

function getChefCountry(profile: any) {
  return (
    clean(profile?.location?.country) ||
    clean(profile?.country) ||
    clean(profile?.pays) ||
    clean(profile?.address?.country) ||
    null
  );
}

async function geocodeMapbox(q: string) {
  const token = process.env.MAPBOX_SECRET_TOKEN || process.env.MAPBOX_TOKEN;
  if (!token) throw new Error('Missing MAPBOX token (MAPBOX_SECRET_TOKEN recommended)');

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
    `${encodeURIComponent(q)}.json?access_token=${token}&limit=1&types=place,locality,region,address`;

  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Mapbox geocoding failed ${r.status}`);

  const json = await r.json();
  const feat = json?.features?.[0];
  if (!feat?.center?.length) return null;

  const [lng, lat] = feat.center;
  return { lat, lng };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    // 1) Lecture des chefs (on lit le JSON profile)
    // ⚠️ La table chef_profiles N'A PAS de colonne `id` : la PK est user_id.
    const { data: chefs, error } = await supabase
      .from('chef_profiles')
      .select('user_id, email, profile');

    if (error) {
      console.error('[admin/chefs/map] select error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalChefs = (chefs || []).length;

    // 2) On ne garde que les chefs actifs (ou approved) avec une ville
    // renseignée. On accepte aussi 'approved' au cas où certains chefs
    // sont validés mais pas encore basculés en 'active'.
    const ALLOWED_STATUSES = new Set(['active', 'approved']);

    let activeCount = 0;
    let activeWithCityCount = 0;

    const rows = (chefs || [])
      .map((row: any) => {
        const profile = row?.profile ?? {};
        const status = getChefStatus(row);

        if (!ALLOWED_STATUSES.has(status)) return null;
        activeCount++;

        const baseCity = getChefBaseCity(profile);
        const country = getChefCountry(profile);
        const query = normalizeQuery(baseCity, country);

        if (query) activeWithCityCount++;

        return {
          // user_id est la PK de chef_profiles ; profile.id n'existe pas
          // toujours dans le JSON, on tombe sur user_id par défaut.
          id: profile?.id || row.user_id,
          name: getChefName(profile),
          email: row?.email || profile?.email || '',
          avatarUrl: profile?.avatarUrl || profile?.photoUrl || null,
          baseCity: baseCity || '',
          country: country || '',
          status,
          query,
        };
      })
      .filter(Boolean)
      .filter((x: any) => !!x.query);

    // Logs sans PII (juste les compteurs) pour debug Vercel
    console.log('[admin/chefs/map] counts', {
      totalChefs,
      activeOrApproved: activeCount,
      withCityDetected: activeWithCityCount,
      uniqueQueries: rows.length,
    });

    const queries = Array.from(new Set(rows.map((r: any) => r.query))) as string[];

    // 3) Lecture du cache geo_cache
    const cacheMap = new Map<string, { lat: number; lng: number }>();

    if (queries.length) {
      const { data: cached, error: cacheError } = await supabase
        .from('geo_cache')
        .select('query, lat, lng')
        .in('query', queries);

      if (cacheError) {
        console.error('[admin/chefs/map] geo_cache read error', cacheError.message);
      }

      (cached || []).forEach((x: any) => {
        if (
          typeof x?.lat === 'number' &&
          !Number.isNaN(x.lat) &&
          typeof x?.lng === 'number' &&
          !Number.isNaN(x.lng)
        ) {
          cacheMap.set(x.query, { lat: x.lat, lng: x.lng });
        }
      });
    }

    // 4) Géocodage Mapbox des queries manquantes (avec upsert dans le cache)
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
      } catch (e: any) {
        // Pas de PII : on ne logge que la query (ville, pas d'identifiant chef).
        console.error('[admin/chefs/map] mapbox geocode failed', q, e?.message);
      }
    }

    // 5) Construction des points
    const points = rows
      .map((r: any) => {
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
    console.error('[admin/chefs/map] error', e?.message);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
