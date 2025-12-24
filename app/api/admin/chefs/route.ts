import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users') // ⚠️ si ta table a un autre nom, remplace ici
      .select('*')
      .eq('role', 'chef')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ chefs: [] }, { status: 500 });
    }

    return NextResponse.json({ chefs: data ?? [] });
  } catch (e) {
    console.error('API admin chefs error:', e);
    return NextResponse.json({ chefs: [] }, { status: 500 });
  }
}
