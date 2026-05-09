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

/**
 * Clé canonique pour le cache geo_cache : permet à toutes les variantes
 * d'écriture d'une même ville (« Saint Tropez », « SAINT TROPEZ »,
 * « Saint-Tropez ») de partager la même entrée cache, donc les mêmes
 * coordonnées, donc le même cluster sur la map.
 *
 * Transformations :
 *  - lowercase
 *  - retire les accents
 *  - remplace ponctuation par espaces
 *  - collapse espaces multiples
 *  - "st" / "st." → "saint" (au début d'un mot)
 */
function canonicalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,;:!?]/g, ' ')
    .replace(/\bst\b/g, 'saint')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
        const rawQuery = normalizeQuery(baseCity, country);

        if (rawQuery) activeWithCityCount++;

        // cacheKey : version canonique pour grouper toutes les variantes
        // d'écriture (« Saint Tropez », « SAINT TROPEZ », « St Tropez »)
        // sous la même entrée cache → mêmes coords → même cluster.
        const cacheKey = rawQuery ? canonicalizeQuery(rawQuery) : null;

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
          rawQuery,
          cacheKey,
        };
      })
      .filter(Boolean)
      .filter((x: any) => !!x.cacheKey);

    // Logs sans PII (juste les compteurs) pour debug Vercel
    console.log('[admin/chefs/map] counts', {
      totalChefs,
      activeOrApproved: activeCount,
      withCityDetected: activeWithCityCount,
      uniqueCacheKeys: new Set(rows.map((r: any) => r.cacheKey)).size,
    });

    // Les cacheKeys uniques (versions canoniques)
    const cacheKeys = Array.from(new Set(rows.map((r: any) => r.cacheKey))) as string[];

    // Pour chaque cacheKey, on garde la première rawQuery rencontrée.
    // C'est la requête la plus représentative qu'on enverra à Mapbox.
    const rawQueryByKey = new Map<string, string>();
    for (const r of rows) {
      if (!rawQueryByKey.has(r.cacheKey)) {
        rawQueryByKey.set(r.cacheKey, r.rawQuery);
      }
    }

    // 3) Lecture du cache geo_cache (par cacheKey ET par rawQuery legacy)
    // On lookup les 2 variantes : les nouvelles entries seront stockées
    // par cacheKey, mais l'historique a des entries par rawQuery.
    const cacheMap = new Map<string, { lat: number; lng: number }>();
    const allLookupQueries = Array.from(
      new Set([...cacheKeys, ...rows.map((r: any) => r.rawQuery)]),
    );

    if (allLookupQueries.length) {
      const { data: cached, error: cacheError } = await supabase
        .from('geo_cache')
        .select('query, lat, lng')
        .in('query', allLookupQueries);

      if (cacheError) {
        console.error('[admin/chefs/map] geo_cache read error', cacheError.message);
      }

      // On indexe par cacheKey canonique : si on trouve l'entrée legacy
      // (rawQuery), on la canonicalise pour la map en mémoire. Comme ça
      // toutes les variantes de la même ville convergent vers les mêmes
      // coords (les premières trouvées en cache).
      (cached || []).forEach((x: any) => {
        if (
          typeof x?.lat !== 'number' ||
          Number.isNaN(x.lat) ||
          typeof x?.lng !== 'number' ||
          Number.isNaN(x.lng)
        ) {
          return;
        }
        const key = canonicalizeQuery(x.query);
        // On ne remplace pas une entrée déjà présente (premier gagne)
        if (!cacheMap.has(key)) {
          cacheMap.set(key, { lat: x.lat, lng: x.lng });
        }
      });
    }

    // 4) Géocodage Mapbox des cacheKeys manquantes
    const missingKeys = cacheKeys.filter((k) => !cacheMap.has(k));
    const failedQueries: string[] = [];

    for (const key of missingKeys) {
      const rawQuery = rawQueryByKey.get(key) || key;
      try {
        const coords = await geocodeMapbox(rawQuery);
        if (!coords) {
          failedQueries.push(rawQuery);
          continue;
        }

        cacheMap.set(key, coords);

        // On stocke avec la cacheKey canonique → toutes les futures
        // variantes pointeront vers la même entrée.
        await supabase
          .from('geo_cache')
          .upsert(
            { query: key, lat: coords.lat, lng: coords.lng },
            { onConflict: 'query' }
          );
      } catch (e: any) {
        failedQueries.push(rawQuery);
        console.error('[admin/chefs/map] mapbox geocode failed', rawQuery, e?.message);
      }
    }

    // 5) Construction des points : tous les chefs avec la même cacheKey
    // partagent la même paire (lat, lng) → cluster naturel.
    const points = rows
      .map((r: any) => {
        const coords = cacheMap.get(r.cacheKey);
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

    console.log('[admin/chefs/map] result', {
      rendered: points.length,
      failed: failedQueries.length,
    });

    return NextResponse.json({ items: points });
  } catch (e: any) {
    console.error('[admin/chefs/map] error', e?.message);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
