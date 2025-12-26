import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { supabase: null as any, missing: { url: !!url, serviceKey: !!serviceKey } };
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  return { supabase, missing: null as any };
}

// (Optionnel mais recommandé) : simple garde “admin email” via header
// Tu peux l’enlever si tu n’en veux pas.
const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email && email === ADMIN_EMAIL.toLowerCase();
}

export async function GET(req: Request) {
  try {
    // garde soft (pas une vraie sécu, mais évite l’accès public direct)
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase, missing } = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing env', missing },
        { status: 500 }
      );
    }

    // ⚠️ Table: public.profiles (comme sur ta capture)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Réponse stable pour ton front
    return NextResponse.json({ chefs: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'GET /api/admin/chefs failed' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const status = String(body?.status || '').trim();

    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

    const { supabase, missing } = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Missing env', missing }, { status: 500 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('email', email);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'PUT /api/admin/chefs failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = String(searchParams.get('email') || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const { supabase, missing } = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Missing env', missing }, { status: 500 });
    }

    const { error } = await supabase.from('profiles').delete().eq('email', email);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'DELETE /api/admin/chefs failed' },
      { status: 500 }
    );
  }
}
