export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const id = decodeURIComponent(ctx.params.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[api/admin/requests/:id] supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found', id }, { status: 404 });
    }

    return NextResponse.json(
      { item: data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('[api/admin/requests/:id] server error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
