// app/api/admin/seo/articles/[id]/route.ts
//
// GET    /api/admin/seo/articles/:id  → article complet (preview admin)
// DELETE /api/admin/seo/articles/:id  → supprime (drafts uniquement, sécurité)
//
// La publication (status → 'published') sera ajoutée dans la PR suivante.

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = getSupabase();

  // Sécurité : on ne permet la suppression que des brouillons (status draft/review).
  // Un article publié doit être unpublié d'abord (futur endpoint PATCH).
  const { data: existing, error: readErr } = await supabase
    .from('articles')
    .select('id, status')
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
