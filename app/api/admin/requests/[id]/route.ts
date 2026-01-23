export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      console.error('[api/admin/requests/:id] not found', error);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ item: data });
  } catch (e) {
    console.error('[api/admin/requests/:id] server error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
