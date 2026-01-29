import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ service role côté serveur uniquement
);

function norm(q: string) {
  return q.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const qRaw = String(body?.query || '').trim();
    if (!qRaw) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const query = norm(qRaw);

    // 1) cache
    const cached = await supabaseAdmin
      .from('geo_cache')
      .select('lat,lng')
      .eq('query', query)
      .maybeSingle();

    if (cached.data?.lat && cached.data?.lng) {
      return NextResponse.json({ lat: cached.data.lat, lng: cached.data.lng, cached: true });
    }

    // 2) Mapbox geocoding
    const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return NextResponse.json({ error: 'Missing Mapbox token' }, { status: 500 });

    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
      `${encodeURIComponent(qRaw)}.json?` +
      `limit=1&types=place,locality,postcode&language=fr&access_token=${token}`;

    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return NextResponse.json({ error: 'Geocode failed' }, { status: 500 });

    const json = await r.json();
    const feature = json?.features?.[0];
    const center = feature?.center; // [lng, lat]
    if (!center?.length) return NextResponse.json({ lat: null, lng: null }, { status: 200 });

    const lng = Number(center[0]);
    const lat = Number(center[1]);

    // 3) upsert cache
    await supabaseAdmin.from('geo_cache').upsert(
      { query, lat, lng },
      { onConflict: 'query' }
    );

    return NextResponse.json({ lat, lng, cached: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
