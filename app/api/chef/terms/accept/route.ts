import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const version = String(body?.version || '09/01/2026').trim();

    // ✅ session supabase (anti spoof)
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser();

    if (authErr || !authData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;

    const supabase = getSupabaseAdmin();

    // 1) Lire le profile actuel (optionnel)
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

    // 3) Upsert (crée la ligne si absente)
    const { error: upErr } = await supabase
      .from('chef_profiles')
      .upsert(
        { user_id: userId, profile: patchedProfile },
        { onConflict: 'user_id' }
      );

    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
