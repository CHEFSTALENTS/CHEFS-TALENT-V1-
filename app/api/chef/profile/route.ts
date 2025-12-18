import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ⚠️ MVP: on récupère l'id via query string ?id=...
// Ensuite on branchera avec une vraie auth Supabase
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('chef_profiles')
    .select('id,email,profile,created_at,updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? null });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const email = body?.email as string | undefined;
  const profile = body?.profile ?? {};

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('chef_profiles')
    .upsert(
      { id, email: email ?? null, profile },
      { onConflict: 'id' }
    )
    .select('id,email,profile,created_at,updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
