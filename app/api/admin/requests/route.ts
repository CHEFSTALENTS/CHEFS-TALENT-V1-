// app/api/admin/requests/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // ⚠️ IMPORTANT: service role côté server uniquement
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
  }
);

export async function GET() {
  try {
    // ✅ On lit TOUTES les demandes (B2B + B2C) depuis client_requests
    // Si tu avais un .eq('client_type','concierge') ou autre => c'était la cause.
    const { data, error } = await supabaseAdmin
      .from('client_requests')
      .select(
        `
        id,
        created_at,
        status,
        match_type,
        client_type,
        location,
        city,
        guest_count,
        guests,
        budget_range,
        budget,
        start_date,
        end_date,
        assignment_type,
        first_name,
        company_name,
        email,
        phone
      `
      )
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    // ✅ Normalisation au cas où certains champs n'existent pas selon le type
    const items = (data ?? []).map((x: any) => ({
      ...x,
      // match_type absent => on déduit
      match_type:
        x.match_type ??
        (x.client_type === 'concierge' ? 'concierge' : 'fast'),
      status: x.status ?? 'new',
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('GET /api/admin/requests error', e);
    return NextResponse.json(
      { items: [], error: e?.message ?? 'unknown_error' },
      { status: 500 }
    );
  }
}
