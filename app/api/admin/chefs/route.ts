import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // ✅ réponse stable
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
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const status = String(body?.status || '').trim();

    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    if (!id && !email) return NextResponse.json({ error: 'Missing id or email' }, { status: 400 });

    let q = supabase.from('profiles').update({ status, updated_at: new Date().toISOString() });
    q = id ? q.eq('id', id) : q.eq('email', email);

    const { error } = await q;
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
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get('id') || '').trim();
    const email = String(searchParams.get('email') || '').trim().toLowerCase();

    if (!id && !email) return NextResponse.json({ error: 'Missing id or email' }, { status: 400 });

    let q = supabase.from('profiles').delete();
    q = id ? q.eq('id', id) : q.eq('email', email);

    const { error } = await q;
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'DELETE /api/admin/chefs failed' },
      { status: 500 }
    );
  }
}
