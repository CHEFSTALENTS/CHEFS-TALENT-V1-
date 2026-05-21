// app/api/admin/seo/articles/route.ts
//
// GET /api/admin/seo/articles
// Liste les articles SEO (drafts + published) pour l'UI admin.
//
// Query :
//   ?status=draft|review|published|archived  (optionnel, défaut: tous)
//   ?limit=20 (défaut 50, max 200)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limitRaw = Number(url.searchParams.get('limit') || '50');
  const limit = Math.min(Math.max(1, isFinite(limitRaw) ? limitRaw : 50), 200);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let q = supabase
    .from('articles')
    .select(
      'id, slug, title, subtitle, category, status, locale, target_destination_slug, ai_generated, ai_model, ai_cost_eur, ai_input_tokens, ai_output_tokens, published_at, created_at, updated_at, created_by_admin_email',
    )
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status) {
    q = q.eq('status', status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, articles: data || [] });
}
