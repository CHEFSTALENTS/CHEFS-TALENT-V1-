import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const userId = String(body?.userId || '').trim();
    const accepted = body?.accepted === undefined ? true : Boolean(body?.accepted);
    const version = String(body?.version || '09/01/2026').trim();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (!accepted) {
      return NextResponse.json({ success: false, error: 'accepted=false not supported' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1) Lire le profile actuel
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('profile')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const currentProfile = (data?.profile ?? {}) as any;

    // 2) Patch acceptance
    const patchedProfile = {
      ...currentProfile,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
      termsAcceptedVersion: version,
    };

    // 3) Update en DB
   const { error: upErr } = await supabase
  .from('chef_profiles')
  .upsert(
    { user_id: userId, profile: patchedProfile },
    { onConflict: 'user_id' }
  );

    return NextResponse.json({
      success: true,
      termsAccepted: true,
      termsAcceptedAt: patchedProfile.termsAcceptedAt,
      termsAcceptedVersion: version,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
