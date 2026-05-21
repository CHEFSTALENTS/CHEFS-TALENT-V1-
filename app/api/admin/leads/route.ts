// app/api/admin/leads/route.ts
//
// GET /api/admin/leads
// Liste les leads pour la dashboard admin.

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
  const source = url.searchParams.get('source');
  const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || '100')), 500);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let q = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) q = q.eq('status', status);
  if (source) q = q.eq('source', source);

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Stats globales (sur tous les leads, pas le seul batch)
  const { count: totalActive } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  const { count: totalConverted } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'converted');
  const { count: totalUnsubscribed } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unsubscribed');

  return NextResponse.json({
    ok: true,
    leads: data || [],
    stats: {
      active: totalActive || 0,
      converted: totalConverted || 0,
      unsubscribed: totalUnsubscribed || 0,
    },
  });
}
