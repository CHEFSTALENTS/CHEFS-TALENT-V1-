// app/api/admin/quotes/route.ts
//
// GET /api/admin/quotes
// Liste paginée + filtrable des devis pour le dashboard /admin/quotes
//
// Query :
//   ?status=draft|sent|accepted|declined|expired|cancelled (multi via virgule)
//   ?q=search (sur reference, destinataire_nom, lieu, intitule)
//   ?limit=50 (défaut 50, max 200)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const search = url.searchParams.get('q')?.trim() || '';
  const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || '50')), 200);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let q = supabase
    .from('quotes')
    .select(
      'id, reference, request_id, status, issued_at, validity_date, intitule, lieu, dates_text, convives_text, destinataire_nom, destinataire_type, tariff_options, chef_cost_eur, chef_travel_cost_eur, butler_required, butler_cost_eur, sent_at, accepted_at, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) q = q.in('status', statuses);
  }

  if (search) {
    // OR sur 4 colonnes texte
    const s = `%${search.replace(/[%_]/g, '\\$&')}%`;
    q = q.or(
      `reference.ilike.${s},destinataire_nom.ilike.${s},lieu.ilike.${s},intitule.ilike.${s}`,
    );
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, quotes: data || [] });
}
