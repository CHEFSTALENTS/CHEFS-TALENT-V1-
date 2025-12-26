export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'thomas@chef-talents.com';
const TABLE = 'chef_profiles';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return {}; }
  }
  if (typeof v === 'object') return v;
  return {};
}
function normalizeProfile(raw: any) {
  const p = safeObj(raw);
  return safeObj(p.profile || p.data || p.user || p);
}

export async function GET(req: Request, ctx: { params: { email: string } }) {
  try {
    if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Missing env' }, { status: 500 });

    const email = decodeURIComponent(ctx.params.email || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const { data, error } = await supabase
      .from(TABLE)
      .select('user_id,email,profile,created_at,updated_at')
      .eq('email', email)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      chef: {
        ...data,
        profile: normalizeProfile(data.profile),
        createdAt: (data as any).created_at || null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GET detail failed' }, { status: 500 });
  }
}
