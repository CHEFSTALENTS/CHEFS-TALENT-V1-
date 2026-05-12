export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendChefActivated } from '@/lib/email/sendChefActivated';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const TABLE = 'chef_profiles';
const ALLOWED_STATUS = new Set(['pending_validation', 'approved', 'active', 'paused']);

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
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

function normalizeStatus(s: any) {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'pending') return 'pending_validation';
  return ALLOWED_STATUS.has(v) ? v : '';
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = String(params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const status = normalizeStatus(body?.status);
    if (!status) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const supabase = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Missing env' }, { status: 500 });

    let { data: row, error: e1 } = await supabase
      .from(TABLE)
      .select('user_id,email,profile')
      .eq('user_id', id)
      .maybeSingle();

    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    let matchedBy: 'user_id' | 'profile_id' = 'user_id';
    if (!row) {
      const r2 = await supabase
        .from(TABLE)
        .select('user_id,email,profile')
        .eq('profile->>id', id)
        .maybeSingle();
      if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 });
      row = r2.data ?? null;
      matchedBy = 'profile_id';
    }

    if (!row) return NextResponse.json({ error: 'Chef introuvable' }, { status: 404 });

    const current = safeObj(row.profile);
    const previousStatus = String((current as any)?.status || '').toLowerCase();
    const nowIso = new Date().toISOString();

    const isActivationTransition =
      status === 'active' && previousStatus !== 'active';

    console.log('[admin/chefs status POST]', {
      matchedBy,
      previousStatus,
      newStatus: status,
      isActivationTransition,
    });

    const nextProfile = {
      ...current,
      status,
      updatedAt: nowIso,
    };

    const updateQuery = row.user_id
      ? supabase.from(TABLE).update({ profile: nextProfile, updated_at: nowIso }).eq('user_id', row.user_id)
      : supabase.from(TABLE).update({ profile: nextProfile, updated_at: nowIso }).eq('profile->>id', id);

    const { error: updateError } = await updateQuery;
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    if (isActivationTransition && row.email) {
      try {
        const firstName =
          String((current as any)?.firstName || '').trim() || undefined;
        const rawLocale = String((current as any)?.preferredLocale || '');
        const locale: 'fr' | 'en' | 'es' =
          rawLocale === 'en' || rawLocale === 'es' ? rawLocale : 'fr';
        console.log('[admin/chefs status POST] sending activation email', {
          locale,
          previousStatus,
        });
        await sendChefActivated({ email: row.email, firstName, locale });
        console.log('[admin/chefs status POST] activation email sent');
      } catch (err: any) {
        console.error(
          '[admin/chefs status POST] activation email failed',
          err?.message,
        );
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'POST /api/admin/chefs/[id]/status failed' },
      { status: 500 },
    );
  }
}
