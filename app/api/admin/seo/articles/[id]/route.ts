// app/api/admin/seo/articles/[id]/route.ts
//
// GET    /api/admin/seo/articles/:id  → article complet (preview admin)
// PATCH  /api/admin/seo/articles/:id  → édition champs + publish/unpublish
// DELETE /api/admin/seo/articles/:id  → supprime (drafts uniquement)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ ok: true, article: data });
}

const ALLOWED_STATUS = new Set(['draft', 'review', 'published', 'archived']);
const EDITABLE_TEXT_FIELDS = [
  'title',
  'subtitle',
  'meta_title',
  'meta_description',
  'category',
  'image_url',
  'image_alt',
  'target_destination_slug',
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const updates: Record<string, any> = {};

  // Champs texte simples
  for (const key of EDITABLE_TEXT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const v = body[key];
      updates[key] = typeof v === 'string' ? (v.trim() || null) : v;
    }
  }

  // Slug : on autorise le changement mais on normalise
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const newSlug = body.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    if (newSlug) updates.slug = newSlug;
  }

  // Blocks / FAQs : on attend des arrays JSON déjà validés côté client
  if (Array.isArray(body.blocks)) {
    updates.blocks = body.blocks;
  }
  if (Array.isArray(body.faqs)) {
    updates.faqs = body.faqs;
  }

  // Status + published_at
  let oldStatus: string | null = null;
  let oldSlug: string | null = null;
  if (typeof body.status === 'string') {
    if (!ALLOWED_STATUS.has(body.status)) {
      return NextResponse.json(
        { ok: false, error: `status invalide: ${body.status}` },
        { status: 400 },
      );
    }
    updates.status = body.status;
    if (body.status === 'published') {
      // On set published_at uniquement à la première publication
      const supabase = getSupabase();
      const { data: cur } = await supabase
        .from('articles')
        .select('published_at, status, slug')
        .eq('id', id)
        .maybeSingle();
      oldStatus = cur?.status ?? null;
      oldSlug = cur?.slug ?? null;
      if (!cur?.published_at) {
        updates.published_at = new Date().toISOString();
      }
    } else {
      // Si on dépublie (published → draft/archived), on conserve published_at
      // mais on récupère oldSlug pour la revalidation
      const supabase = getSupabase();
      const { data: cur } = await supabase
        .from('articles')
        .select('status, slug')
        .eq('id', id)
        .maybeSingle();
      oldStatus = cur?.status ?? null;
      oldSlug = cur?.slug ?? null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'no_changes' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[seo/patch] update error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Revalidation des pages publiques touchées
  try {
    const newSlug = data.slug;
    const becamePublished = oldStatus !== 'published' && data.status === 'published';
    const becameUnpublished = oldStatus === 'published' && data.status !== 'published';
    const slugChanged = oldSlug && oldSlug !== newSlug;

    if (becamePublished || becameUnpublished || data.status === 'published' || slugChanged) {
      // Page d'index
      revalidatePath('/insights');
      // Page article (nouveau slug)
      revalidatePath(`/insights/${newSlug}`);
      // Si le slug a changé, on invalide aussi l'ancien
      if (slugChanged && oldSlug) {
        revalidatePath(`/insights/${oldSlug}`);
      }
    }
  } catch (e: any) {
    // Revalidation est best-effort, on ne fait pas échouer la requête
    console.warn('[seo/patch] revalidate failed', e?.message);
  }

  return NextResponse.json({ ok: true, article: data });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();

  // Sécurité : on ne permet la suppression que des brouillons (status draft/review).
  // Un article publié doit être dépublié d'abord via PATCH status='draft'.
  const { data: existing, error: readErr } = await supabase
    .from('articles')
    .select('id, status, slug')
    .eq('id', id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ ok: false, error: readErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  if (existing.status === 'published') {
    return NextResponse.json(
      { ok: false, error: 'cannot_delete_published_article' },
      { status: 409 },
    );
  }

  const { error: delErr } = await supabase.from('articles').delete().eq('id', id);
  if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
