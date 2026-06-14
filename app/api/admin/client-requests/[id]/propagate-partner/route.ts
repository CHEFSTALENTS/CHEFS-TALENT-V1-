// POST /api/admin/client-requests/[id]/propagate-partner
//
// Propage le partner_id + acquisition_channel d'une client_request vers
// les quotes et missions liées (via request_id).
//
// Body :
//   { cascadeQuotes?: boolean, cascadeMissions?: boolean,
//     overwriteExisting?: boolean }
//
// Par défaut : on ne propage QUE si l'objet n'a pas déjà un partner_id
// défini. Avec overwriteExisting=true, on écrase aussi les valeurs
// existantes (cas où Thomas veut corriger une attribution erronée).
//
// GET /api/admin/client-requests/[id]/propagate-partner
//   → renvoie un dry-run : nb de quotes/missions impactés selon les options

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

async function listImpacted(
  supabase: ReturnType<typeof getSupabase>,
  requestId: string,
  overwriteExisting: boolean,
) {
  // Quotes liées
  let qQuery = supabase
    .from('quotes')
    .select('id, reference, status, partner_id, source')
    .eq('request_id', requestId);
  if (!overwriteExisting) qQuery = qQuery.is('partner_id', null);
  const { data: quotes } = await qQuery;

  // Missions liées
  let mQuery = supabase
    .from('missions')
    .select('id, title, status, partner_id, source')
    .eq('request_id', requestId);
  if (!overwriteExisting) mQuery = mQuery.is('partner_id', null);
  const { data: missions } = await mQuery;

  return {
    quotes: quotes || [],
    missions: missions || [],
  };
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const overwriteExisting = url.searchParams.get('overwriteExisting') === '1';

  const supabase = getSupabase();
  const { data: request } = await supabase
    .from('client_requests')
    .select('id, partner_id, acquisition_channel')
    .eq('id', id)
    .maybeSingle();

  if (!request) {
    return NextResponse.json({ ok: false, error: 'REQUEST_NOT_FOUND' }, { status: 404 });
  }

  const impacted = await listImpacted(supabase, id, overwriteExisting);

  return NextResponse.json({
    ok: true,
    request: {
      partner_id: request.partner_id,
      acquisition_channel: request.acquisition_channel,
    },
    impacted: {
      quotes: impacted.quotes.length,
      missions: impacted.missions.length,
      quotesDetail: impacted.quotes,
      missionsDetail: impacted.missions,
    },
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const cascadeQuotes = body.cascadeQuotes !== false; // default true
  const cascadeMissions = body.cascadeMissions !== false; // default true
  const overwriteExisting = !!body.overwriteExisting;

  const supabase = getSupabase();
  const { data: request } = await supabase
    .from('client_requests')
    .select('id, partner_id, acquisition_channel')
    .eq('id', id)
    .maybeSingle();

  if (!request) {
    return NextResponse.json({ ok: false, error: 'REQUEST_NOT_FOUND' }, { status: 404 });
  }

  const targetPartnerId = request.partner_id || null;
  const targetSource = request.acquisition_channel || null;

  const result: any = { quotesUpdated: 0, missionsUpdated: 0 };

  if (cascadeQuotes) {
    let q = supabase
      .from('quotes')
      .update({ partner_id: targetPartnerId, source: targetSource })
      .eq('request_id', id);
    if (!overwriteExisting) q = q.is('partner_id', null);
    const { data, error } = await q.select('id');
    if (error) {
      console.warn('[propagate-partner] quotes update error', error.message);
    } else {
      result.quotesUpdated = data?.length ?? 0;
    }
  }

  if (cascadeMissions) {
    let m = supabase
      .from('missions')
      .update({ partner_id: targetPartnerId, source: targetSource })
      .eq('request_id', id);
    if (!overwriteExisting) m = m.is('partner_id', null);
    const { data, error } = await m.select('id');
    if (error) {
      console.warn('[propagate-partner] missions update error', error.message);
    } else {
      result.missionsUpdated = data?.length ?? 0;
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
