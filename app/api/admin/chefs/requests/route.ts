export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('client_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/requests] supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    console.error('[admin/requests] server error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
