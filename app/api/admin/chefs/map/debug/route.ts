export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================
// /api/admin/chefs/map/debug
// Endpoint de diagnostic pour comprendre pourquoi /admin/map
// affiche 0 chef. Ne fait AUCUNE modification, juste de la lecture.
//
// Retourne tous les compteurs intermédiaires :
//   - Combien de chefs en DB
//   - Distribution des status (raw)
//   - Sur les chefs actifs : combien ont une ville détectée
//   - Quelles queries sont déjà dans geo_cache
//   - Quelles queries manquent (à géocoder)
//   - MAPBOX_TOKEN présent ?
//   - Sample brut du profile JSON des 3 premiers chefs (PII : email
//     masqué partiellement) pour vérifier la structure réelle
// =============================================================

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

function getChefBaseCityPaths(profile: any) {
  return {
    'profile.location.baseCity': clean(profile?.location?.baseCity),
    'profile.baseCity': clean(profile?.baseCity),
    'profile.location.city': clean(profile?.location?.city),
    'profile.city': clean(profile?.city),
    'profile.ville': clean(profile?.ville),
    'profile.location.address': clean(profile?.location?.address),
    'profile.address': clean(profile?.address),
  };
}

function getChefCountryPaths(profile: any) {
  return {
    'profile.location.country': clean(profile?.location?.country),
    'profile.country': clean(profile?.country),
    'profile.pays': clean(profile?.pays),
  };
}

function getChefStatus(row: any) {
  return String(row?.status ?? row?.profile?.status ?? '').toLowerCase();
}

// Masque partiellement un email pour le rendre identifiable sans
// exposer la PII en clair. ex: thomas@example.com → t***@e***.com
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const localMask = local[0] + '***';
  const [domainName, ...tld] = domain.split('.');
  const domainMask = (domainName?.[0] || '') + '***';
  return `${localMask}@${domainMask}.${tld.join('.')}`;
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    // ⚠️ La table chef_profiles N'A PAS de colonne `id` : la PK est user_id.
    const { data: chefs, error } = await supabase
      .from('chef_profiles')
      .select('user_id, email, profile, created_at, updated_at');

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          step: 'select chef_profiles',
        },
        { status: 500 },
      );
    }

    const total = (chefs || []).length;

    // Distribution des status
    const statusDist: Record<string, number> = {};
    (chefs || []).forEach((row: any) => {
      const s = getChefStatus(row) || '(empty)';
      statusDist[s] = (statusDist[s] || 0) + 1;
    });

    // Pour chaque chef : analyse de la détection ville/pays
    const chefAnalysis = (chefs || []).map((row: any) => {
      const profile = row?.profile ?? {};
      const status = getChefStatus(row);
      const cityPaths = getChefBaseCityPaths(profile);
      const countryPaths = getChefCountryPaths(profile);
      const detectedCity =
        cityPaths['profile.location.baseCity'] ||
        cityPaths['profile.baseCity'] ||
        cityPaths['profile.location.city'] ||
        cityPaths['profile.city'] ||
        cityPaths['profile.ville'] ||
        null;
      const detectedCountry =
        countryPaths['profile.location.country'] ||
        countryPaths['profile.country'] ||
        countryPaths['profile.pays'] ||
        null;
      const query = detectedCity
        ? detectedCountry
          ? `${detectedCity}, ${detectedCountry}`
          : detectedCity
        : null;

      return {
        emailMasked: maskEmail(row?.email || ''),
        status: status || '(empty)',
        cityPaths,
        countryPaths,
        detectedCity,
        detectedCountry,
        query,
        passesActiveFilter: status === 'active',
        passesQueryFilter: !!query,
      };
    });

    const activeOnly = chefAnalysis.filter((x) => x.passesActiveFilter);
    const activeWithQuery = activeOnly.filter((x) => x.passesQueryFilter);
    const queries = Array.from(
      new Set(activeWithQuery.map((x) => x.query)),
    ) as string[];

    // Lecture du cache geo_cache
    let cachedQueries: string[] = [];
    let cacheError: string | null = null;
    if (queries.length) {
      const { data: cached, error: cErr } = await supabase
        .from('geo_cache')
        .select('query, lat, lng')
        .in('query', queries);
      if (cErr) cacheError = cErr.message;
      cachedQueries = (cached || [])
        .filter(
          (x: any) =>
            typeof x?.lat === 'number' && typeof x?.lng === 'number',
        )
        .map((x: any) => x.query);
    }

    // Total en geo_cache (pour debug : si 0 alors la table est vide)
    const { count: geoCacheTotal } = await supabase
      .from('geo_cache')
      .select('*', { count: 'exact', head: true });

    const missingQueries = queries.filter((q) => !cachedQueries.includes(q));

    // Env Mapbox
    const mapboxSecretPresent = !!process.env.MAPBOX_SECRET_TOKEN;
    const mapboxFallbackPresent = !!process.env.MAPBOX_TOKEN;
    const mapboxPublicPresent = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // Sample des 3 premiers chefs (raw profile, sans email/téléphone)
    const sampleProfiles = (chefs || []).slice(0, 3).map((row: any) => {
      const profile = row?.profile ?? {};
      // On retire les champs PII identifiants pour le debug
      const safe: any = { ...profile };
      delete safe.phone;
      delete safe.phoneNumber;
      delete safe.tel;
      delete safe.email;
      // Garder seulement les clés top-level + location pour la lisibilité
      return {
        userId: row?.user_id,
        emailMasked: maskEmail(row?.email || ''),
        statusRow: row?.status ?? null,
        statusInProfile: profile?.status ?? null,
        topLevelKeys: Object.keys(safe),
        location: safe.location ?? null,
        baseCity: safe.baseCity ?? null,
        country: safe.country ?? null,
        firstName: safe.firstName ?? null,
        lastName: safe.lastName ?? null,
      };
    });

    return NextResponse.json({
      summary: {
        totalChefsInDB: total,
        statusDistribution: statusDist,
        activeChefsCount: activeOnly.length,
        activeWithCityCount: activeWithQuery.length,
        uniqueQueriesCount: queries.length,
        cachedQueriesCount: cachedQueries.length,
        missingQueriesCount: missingQueries.length,
        geoCacheTotalRows: geoCacheTotal,
      },
      env: {
        MAPBOX_SECRET_TOKEN_present: mapboxSecretPresent,
        MAPBOX_TOKEN_present: mapboxFallbackPresent,
        NEXT_PUBLIC_MAPBOX_TOKEN_present: mapboxPublicPresent,
      },
      cacheError,
      queries,
      cachedQueries,
      missingQueries,
      sampleProfiles,
      // Détail par chef (limit 30 pour pas explosé la réponse)
      chefAnalysisFirst30: chefAnalysis.slice(0, 30),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Server error', stack: e?.stack },
      { status: 500 },
    );
  }
}
