// app/api/admin/quote-memories/route.ts
//
// GET /api/admin/quote-memories
// Liste toutes les mémoires de l'agent commercial avec filtres.
//
// Query :
//   ?scope=global|destinataire|location (optionnel)
//   ?q=search (sur scope_key, memory_key, rationale)
//   ?limit=200 (défaut)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const scope = url.searchParams.get('scope');
  const search = url.searchParams.get('q')?.trim() || '';
  const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || '200')), 500);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let q = supabase
    .from('quote_agent_memories')
    .select('*')
    .order('confidence', { ascending: false })
    .order('use_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (scope) q = q.eq('scope', scope);
  if (search) {
    const s = `%${search.replace(/[%_]/g, '\\$&')}%`;
    q = q.or(
      `scope_key.ilike.${s},memory_key.ilike.${s},rationale.ilike.${s}`,
    );
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, memories: data || [] });
}
