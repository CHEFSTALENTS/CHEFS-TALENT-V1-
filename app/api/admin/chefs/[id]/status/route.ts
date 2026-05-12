export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendChefActivated } from '@/lib/email/sendChefActivated';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const TABLE = 'chef_profiles';

const ALLOWED_STATUS = new Set([
  'pending_validation',
  'approved',
  'active',
  'paused',
]);

function normalizeStatus(s: any): string {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'pending') return 'pending_validation';
  return ALLOWED_STATUS.has(v) ? v : '';
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

// =============================================================
// POST /api/admin/chefs/[id]/status
// Body : { status: 'active' | 'paused' | 'approved' | 'pending_validation' }
//
// Endpoint utilisé par le bouton « Pause / Activer » de la fiche
// /admin/chefs/[id]. Update profile.status par user_id (= id dans
// l'URL). Reprend la même logique que le PUT existant /api/admin/chefs
// (qui prend l'email) en l'adaptant pour user_id.
//
// Side effect : envoie l'email d'activation si transition vers 'active'.
// =============================================================
export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const userId = decodeURIComponent(ctx.params.id || '').trim();
    if (!userId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = normalizeStatus(body?.status);
    if (!status) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    // 1) Récupération de la row actuelle (par user_id ; fallback profile.id)
    let { data: row, error: fetchErr } = await supabase
      .from(TABLE)
      .select('user_id, email, profile')
      .eq('user_id', userId)
      .maybeSingle();

    // Fallback : si pas trouvé par user_id, essayer par profile.id
    // (certains anciens chefs ont profile.id != user_id)
    if ((!row || fetchErr) && !fetchErr?.message) {
      const fallback = await supabase
        .from(TABLE)
        .select('user_id, email, profile')
        .filter('profile->>id', 'eq', userId)
        .maybeSingle();
      if (fallback.data) {
        row = fallback.data;
        fetchErr = null;
      }
    }

    if (fetchErr) {
      console.error('[chefs/[id]/status] fetch error', fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: 'Chef not found' }, { status: 404 });
    }

    const current = normalizeProfile(row.profile);
    const previousStatus = String((current as any)?.status || '').toLowerCase();
    const nowIso = new Date().toISOString();

    const isActivationTransition =
      status === 'active' && previousStatus !== 'active';

    // Log sans PII (juste la transition)
    console.log('[admin/chefs/[id]/status]', {
      previousStatus,
      newStatus: status,
      isActivationTransition,
    });

    // 2) Update du profile JSON (status au bon endroit + updatedAt)
    const nextProfile = {
      ...current,
      status,
      updatedAt: nowIso,
    };

    const { error: updErr } = await supabase
      .from(TABLE)
      .update({
        profile: nextProfile,
        updated_at: nowIso,
      })
      .eq('user_id', row.user_id);

    if (updErr) {
      console.error('[chefs/[id]/status] update error', updErr.message);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // 3) Email d'activation (fire & forget, on bloque pas la réponse)
    if (isActivationTransition && row.email) {
      try {
        const firstName =
          String((current as any)?.firstName || '').trim() || undefined;
        const rawLocale = String((current as any)?.preferredLocale || '');
        const locale: 'fr' | 'en' | 'es' =
          rawLocale === 'en' || rawLocale === 'es' ? rawLocale : 'fr';

        console.log('[chefs/[id]/status] sending activation email', {
          locale,
          previousStatus,
        });
        await sendChefActivated({ email: row.email, firstName, locale });
        console.log('[chefs/[id]/status] activation email sent');
      } catch (err: any) {
        console.error(
          '[chefs/[id]/status] activation email failed',
          err?.message,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      user_id: row.user_id,
      status,
    });
  } catch (e: any) {
    console.error('[chefs/[id]/status] fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
