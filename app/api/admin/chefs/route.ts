export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendChefActivated } from '@/lib/email/sendChefActivated';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { signChefProfileUrls } from '@/lib/storage';

const TABLE = 'chef_profiles';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = { url: !url, serviceKey: !serviceKey };
  if (!url || !serviceKey) return { supabase: null as any, missing };

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  return { supabase, missing: null as any };
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

// Normalise le shape du profile (peut être imbriqué)
function normalizeProfile(raw: any) {
  const p = safeObj(raw);
  return safeObj(p.profile || p.data || p.user || p);
}

function pickName(p: any) {
  const firstName = p.firstName || p.firstname || p.first_name || p.prenom || p.name?.first || '';
  const lastName = p.lastName || p.lastname || p.last_name || p.nom || p.name?.last || '';
  return { firstName: String(firstName || ''), lastName: String(lastName || '') };
}

// ⚠️ statuses attendus côté app
const ALLOWED_STATUS = new Set(['pending_validation', 'approved', 'active', 'paused']);

function normalizeStatus(s: any) {
  const v = String(s || '').trim().toLowerCase();
  // accepte "pending" si jamais
  if (v === 'pending') return 'pending_validation';
  return ALLOWED_STATUS.has(v) ? v : '';
}

function pickStatus(p: any) {
  const s = normalizeStatus(p.status || p.chefStatus || p.state || '');
  return s || 'pending_validation';
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const { supabase, missing } = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Missing env', missing }, { status: 500 });

    const r = await supabase
      .from(TABLE)
      .select('user_id,email,profile,created_at,updated_at')
      .order('email', { ascending: true });

    const rows =
      r.error?.message?.toLowerCase().includes('column') ||
      r.error?.message?.toLowerCase().includes('does not exist')
        ? await supabase.from(TABLE).select('user_id,email,profile').order('email', { ascending: true })
        : r;

    if (rows.error) return NextResponse.json({ error: rows.error.message }, { status: 500 });

    const data = (rows.data || []).map((row: any) => {
      const p = normalizeProfile(row.profile);
      const { firstName, lastName } = pickName(p);
      const status = pickStatus(p);

      return {
        ...row,
        profile: p,
        firstName,
        lastName,
        status,
        createdAt: row.created_at || row.createdAt || null,
      };
    });

    // Bucket chef-uploads privé : signer les URLs avatar/photo/images
    // de chaque profile avant de retourner au client (TTL 1h).
    await Promise.all(data.map((c: any) => signChefProfileUrls(c.profile)));

    return NextResponse.json({ chefs: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GET /api/admin/chefs failed' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const status = normalizeStatus(body?.status);

    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    if (!status) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const { supabase, missing } = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Missing env', missing }, { status: 500 });

    // 1) On récupère la ligne actuelle (pour user_id + profile)
    const { data: row, error: e1 } = await supabase
      .from(TABLE)
      .select('user_id,email,profile')
      .eq('email', email)
      .maybeSingle();

    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

    const current = normalizeProfile(row?.profile);
    const previousStatus = String((current as any)?.status || '').toLowerCase();
    const nowIso = new Date().toISOString();

    // Détecte le passage VERS active depuis un autre status (pending_validation,
    // approved, paused...) : c'est le moment où l'on envoie l'email
    // d'activation. On évite seulement le cas trivial active → active.
    const isActivationTransition =
      status === 'active' && previousStatus !== 'active';

    // Log : pas l'email entier (RGPD). On garde juste la transition.
    console.log('[admin/chefs PUT]', {
      previousStatus,
      newStatus: status,
      isActivationTransition,
    });

    // ✅ On écrit le status AU BON ENDROIT : profile.status
    const nextProfile = {
      ...current,
      status,
      updatedAt: nowIso, // utile côté front
    };

    // 2) Upsert (robuste) : si pas de ligne, on crée quand même
    // ⚠️ si user_id est null et que ta table exige user_id NOT NULL,
    // il faut alors upsert via user_id; ici on garde update si row existe.
    if (row?.user_id) {
      const { error: e2 } = await supabase
        .from(TABLE)
        .upsert(
          {
            user_id: row.user_id,
            email,
            profile: nextProfile,
            updated_at: nowIso,
          },
          { onConflict: 'user_id' }
        );

      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

      // Trigger l'email d'activation si transition vers active.
      // Fire & forget : on ne bloque pas la réponse admin.
      if (isActivationTransition) {
        try {
          const firstName =
            String((current as any)?.firstName || '').trim() || undefined;
          const rawLocale = String((current as any)?.preferredLocale || '');
          const locale: 'fr' | 'en' | 'es' =
            rawLocale === 'en' || rawLocale === 'es' ? rawLocale : 'fr';
          // Pas de log de l'email ni du firstName (RGPD).
          console.log('[admin/chefs PUT] sending activation email', {
            locale,
            previousStatus,
          });
          await sendChefActivated({ email, firstName, locale });
          console.log('[admin/chefs PUT] activation email sent');
        } catch (err: any) {
          console.error(
            '[admin/chefs PUT] activation email failed',
            err?.message,
          );
        }
      }

      return NextResponse.json({ ok: true, email, user_id: row.user_id, status });
    }

    // fallback: si on n'a pas user_id (cas rare), on update par email
    const { error: e3 } = await supabase
      .from(TABLE)
      .update({ profile: nextProfile, updated_at: nowIso })
      .eq('email', email);

    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

    if (isActivationTransition) {
      try {
        const firstName =
          String((current as any)?.firstName || '').trim() || undefined;
        const rawLocale = String((current as any)?.preferredLocale || '');
        const locale: 'fr' | 'en' | 'es' =
          rawLocale === 'en' || rawLocale === 'es' ? rawLocale : 'fr';
        await sendChefActivated({ email, firstName, locale });
      } catch (err: any) {
        console.error(
          '[admin/chefs PUT] activation email failed (fallback)',
          err?.message,
        );
      }
    }

    return NextResponse.json({ ok: true, email, status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'PUT /api/admin/chefs failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const email = String(searchParams.get('email') || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const { supabase, missing } = supabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Missing env', missing }, { status: 500 });

    const { error } = await supabase.from(TABLE).delete().eq('email', email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'DELETE /api/admin/chefs failed' }, { status: 500 });
  }
}
