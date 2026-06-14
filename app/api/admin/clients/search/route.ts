// app/api/admin/clients/search/route.ts
//
// GET /api/admin/clients/search?q=...
//
// Auto-complete client lors de la création manuelle d'une demande.
// Cherche dans client_requests par email / phone / full_name / first_name
// (case-insensitive). Dédoublonne par email et renvoie la dernière saisie
// connue de chaque client : on a son nom, son phone, son company_name,
// son client_type, son partner_id — autant d'infos à pré-remplir.
//
// q doit faire >= 2 caractères, sinon 400.

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
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Math.min(Number(url.searchParams.get('limit')) || 8, 20);

  if (q.length < 2) {
    return NextResponse.json({ ok: true, clients: [] });
  }

  const supabase = getSupabase();
  // Escape pour le pattern Postgres LIKE — supabase accepte * comme wildcard.
  const pattern = `*${q.replace(/[%_]/g, '')}*`;

  // OR sur email / phone / full_name / first_name / company_name
  const { data, error } = await supabase
    .from('client_requests')
    .select(
      'id, email, full_name, first_name, phone, company_name, client_type, partner_id, acquisition_channel, created_at',
    )
    .or(
      `email.ilike.${pattern},phone.ilike.${pattern},full_name.ilike.${pattern},first_name.ilike.${pattern},company_name.ilike.${pattern}`,
    )
    .order('created_at', { ascending: false })
    .limit(60); // on prend large pour dédupliquer ensuite

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Dédup par email (le plus récent gagne) : on veut 1 ligne par client unique.
  const seen = new Set<string>();
  const clients: any[] = [];
  for (const row of data || []) {
    const key = (row.email || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    clients.push({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      firstName: row.first_name,
      phone: row.phone,
      companyName: row.company_name,
      clientType: row.client_type,
      partnerId: row.partner_id,
      acquisitionChannel: row.acquisition_channel,
      lastRequestAt: row.created_at,
    });
    if (clients.length >= limit) break;
  }

  return NextResponse.json({ ok: true, clients });
}
