// app/api/admin/requests/to-quote/route.ts
//
// GET /api/admin/requests/to-quote?since=2
//
// Renvoie les demandes "à deviser" : client_requests en statut
// in_review/pitched/qualified créées il y a >= N jours et SANS devis
// non-cancelled lié. N par défaut = 2 jours (paramétrable via ?since=).
//
// Utilisé par :
//   - /api/admin/badges (juste le count)
//   - la page /admin/requests pour afficher un bandeau "Demandes en attente"

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const STATUSES_WAITING_QUOTE = ['in_review', 'pitched', 'qualified'];

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
  const since = Math.max(0, Number(url.searchParams.get('since')) || 2);
  const includeList = url.searchParams.get('list') === '1';

  const cutoffIso = new Date(Date.now() - since * 86400000).toISOString();

  const supabase = getSupabase();

  // 1. Tous les ids de requests qui ont déjà un devis non-cancelled
  const { data: quotedRequests } = await supabase
    .from('quotes')
    .select('request_id')
    .neq('status', 'cancelled')
    .not('request_id', 'is', null);
  const quotedRequestIds = new Set<string>();
  for (const q of (quotedRequests || []) as any[]) {
    if (q.request_id) quotedRequestIds.add(q.request_id);
  }

  // 2. Requests dans les statuts à deviser, plus vieilles que cutoff
  const { data: candidates, error } = await supabase
    .from('client_requests')
    .select('id, email, full_name, company_name, client_type, status, location, start_date, partner_id, created_at')
    .in('status', STATUSES_WAITING_QUOTE)
    .lt('created_at', cutoffIso)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const toQuote = (candidates || []).filter((r: any) => !quotedRequestIds.has(r.id));

  return NextResponse.json({
    ok: true,
    sinceDays: since,
    count: toQuote.length,
    items: includeList ? toQuote : undefined,
  });
}
