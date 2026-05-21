// app/api/admin/seo/topics/route.ts
//
// GET    /api/admin/seo/topics?status=pending|processing|done|failed
// POST   /api/admin/seo/topics  → ajouter un topic au backlog
// DELETE /api/admin/seo/topics?id=<uuid>  → retirer un topic

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || '100')), 500);

  const supabase = getSupabase();
  let q = supabase
    .from('seo_topics')
    .select('*, generated:generated_article_id (slug, title, status)')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, topics: data || [] });
}

const ALLOWED_MODES = new Set(['new_article', 'improve_destination']);

export async function POST(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const {
    topic,
    mode = 'new_article',
    destinationSlug,
    desiredAngle,
    priority = 0,
  } = body || {};

  if (!ALLOWED_MODES.has(mode)) {
    return NextResponse.json(
      { ok: false, error: `mode invalide: ${mode}` },
      { status: 400 },
    );
  }
  if (mode === 'new_article') {
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return NextResponse.json({ ok: false, error: 'topic_required' }, { status: 400 });
    }
  }
  if (mode === 'improve_destination') {
    if (!destinationSlug || typeof destinationSlug !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'destinationSlug requis en mode improve_destination' },
        { status: 400 },
      );
    }
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('seo_topics')
    .insert({
      topic:
        mode === 'improve_destination'
          ? `Approfondir : ${destinationSlug}`
          : topic.trim(),
      mode,
      destination_slug: destinationSlug || null,
      desired_angle: desiredAngle?.trim() || null,
      priority: Number(priority) || 0,
      status: 'pending',
      created_by_admin_email: auth.user.email,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, topic: data });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id_required' }, { status: 400 });

  const supabase = getSupabase();
  // On autorise la suppression sauf si processing (en cours) — éviter de
  // perdre la trace d'une génération en route.
  const { data: existing } = await supabase
    .from('seo_topics')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  if (existing.status === 'processing') {
    return NextResponse.json(
      { ok: false, error: 'cannot_delete_processing_topic' },
      { status: 409 },
    );
  }

  const { error } = await supabase.from('seo_topics').delete().eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/admin/seo/topics : reset un topic failed → pending pour le rejouer
 * Body: { id, status: 'pending' }
 */
export async function PATCH(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }
  const { id, status } = body || {};
  if (!id || !status) {
    return NextResponse.json({ ok: false, error: 'id_and_status_required' }, { status: 400 });
  }
  if (status !== 'pending') {
    return NextResponse.json(
      { ok: false, error: 'only_status=pending_allowed_via_patch' },
      { status: 400 },
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('seo_topics')
    .update({ status: 'pending', error: null, processed_at: null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, topic: data });
}
