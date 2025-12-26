export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'thomas@chef-talents.com';
const TABLE = 'chef_profiles';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = { url: !url, serviceKey: !serviceKey };

  if (!url || !serviceKey) return { supabase: null as any, missing };

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  return { supabase, missing: null as any };
}

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  if (typeof v === 'object') return v;
  return {};
}

// On “normalise” le shape du profile car il peut être imbriqué
function normalizeProfile(raw: any) {
  const p = safeObj(raw);
  // cas fréquents: profile.profile, profile.data, profile.user etc.
  return safeObj(p.profile || p.data || p.user || p);
}

function pickName(p: any) {
  const firstName =
    p.firstName || p.firstname || p.first_name || p.prenom || p.name?.first || '';
  const lastName =
    p.lastName || p.lastname || p.last_name || p.nom || p.name?.last || '';
  return { firstName: String(firstName || ''), lastName: String(lastName || '') };
}

function pickStatus(p: any) {
  const s = String(p.status || p.chefStatus || p.state || '').trim();
  // si rien, on le considère “à valider”
  return s || 'pending_validation';
}

export async function GET(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase, missing } = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Missing env', missing }, { status: 500 });
    }

    // Essaie avec created_at (souvent présent). Si ta table ne l’a pas, ça plantera.
    const r = await supabase
      .from(TABLE)
      .select('user_id,email,profile,created_at,updated_at')
      .order('email', { ascending: true });

    // fallback si created_at/updated_at n’existent pas
    const rows =
      r.error?.message?.toLowerCase().includes('column') ||
      r.error?.message?.toLowerCase().includes('does not exist')
        ? await supabase.from(TABLE).select('user_id,email,profile').order('email', { ascending: true })
        : r;

    if (rows.error) {
      return NextResponse.json({ error: rows.error.message }, { status: 500 });
    }

    const data = (rows.data || []).map((row: any) => {
      const p = normalizeProfile(row.profile);
      const { firstName, lastName } = pickName(p);
      const status = pickStatus(p);

      return {
        ...row,
        profile: p, // profile normalisé
        firstName,
        lastName,
        status,
        // createdAt côté UI
        createdAt: row.created_at || row.createdAt || null,
      };
    });

    return NextResponse.json({ chefs: data });
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

    // 1) On récupère le profile actuel
    const { data: row, error: e1 } = await supabase
      .from(TABLE)
      .select('profile')
      .eq('email', email)
      .maybeSingle();

    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    const current = normalizeProfile(row?.profile);
    const nextProfile = { ...current, status };

    // 2) On write le profile mergé
    const { error: e2 } = await supabase
      .from(TABLE)
      .update({
        profile: nextProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

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

    const { error } = await supabase.from(TABLE).delete().eq('email', email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'DELETE /api/admin/chefs failed' },
      { status: 500 }
    );
  }
}
