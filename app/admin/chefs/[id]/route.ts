// app/api/admin/chefs/[id]/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function splitList(v: any) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v ?? '')
    .split(/,|\n|;|\|/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function numOrNull(v: any) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('email, profile')
      .eq('profile->>id', params.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Chef introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      email: data.email ?? null,
      profile: data.profile ?? {},
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const { data: row, error: readError } = await supabase
      .from('chef_profiles')
      .select('email, profile')
      .eq('profile->>id', params.id)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: 'Chef introuvable' }, { status: 404 });
    }

    const currentProfile = row.profile ?? {};
    const currentLocation = currentProfile.location ?? {};
    const currentAvailability = currentProfile.availability ?? {};

    const nextProfile = {
      ...currentProfile,
      phone: body.phone ?? currentProfile.phone ?? '',
      bio: body.bio ?? currentProfile.bio ?? '',
      baseCity: body.baseCity ?? currentProfile.baseCity ?? '',
      languages: splitList(body.languages ?? currentProfile.languages ?? []),
      specialties: splitList(body.specialties ?? currentProfile.specialties ?? []),
      cuisines: splitList(body.cuisines ?? currentProfile.cuisines ?? []),
      availability: {
        ...currentAvailability,
        availableNow:
          typeof body.availableNow === 'boolean'
            ? body.availableNow
            : currentAvailability.availableNow ?? true,
        nextAvailableFrom:
          body.nextAvailableFrom ?? currentAvailability.nextAvailableFrom ?? null,
      },
      location: {
        ...currentLocation,
        baseCity:
          body.baseCity ??
          body.location?.baseCity ??
          currentLocation.baseCity ??
          currentProfile.baseCity ??
          '',
        coverageZones: splitList(
          body.coverageZones ?? body.location?.coverageZones ?? currentLocation.coverageZones ?? []
        ),
        travelRadiusKm:
          numOrNull(body.travelRadiusKm ?? body.location?.travelRadiusKm) ??
          numOrNull(currentLocation.travelRadiusKm) ??
          0,
        internationalMobility:
          typeof body.internationalMobility === 'boolean'
            ? body.internationalMobility
            : typeof body.location?.internationalMobility === 'boolean'
            ? body.location.internationalMobility
            : Boolean(currentLocation.internationalMobility ?? false),
        lat:
          numOrNull(body.lat ?? body.location?.lat) ??
          numOrNull(currentLocation.lat),
        lng:
          numOrNull(body.lng ?? body.location?.lng) ??
          numOrNull(currentLocation.lng),
      },
    };

    const { error: updateError } = await supabase
      .from('chef_profiles')
      .update({ profile: nextProfile })
      .eq('profile->>id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: nextProfile,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
