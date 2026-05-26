// app/api/admin/ncc-partner/list/route.ts
//
// GET /api/admin/ncc-partner/list
// Liste les NCC partenaire envoyés (kind='ncc', target_kind='adhoc',
// contract_snapshot->>'contract_type' = 'ncc_partner').

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || '100')), 500);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('signature_requests')
    .select(
      'id, yousign_request_id, yousign_status, signers, contract_snapshot, sent_at, completed_at, signed_pdf_url, created_at, error_message',
    )
    .eq('kind', 'ncc')
    .eq('target_kind', 'adhoc')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Filtre les NCC partenaire (vs autres NCC adhoc historiques)
  const ncc = (data || []).filter((r) => {
    const snapshot = r.contract_snapshot as any;
    return snapshot?.contract_type === 'ncc_partner';
  });

  return NextResponse.json({ ok: true, signatures: ncc });
}
