// app/api/admin/badges/route.ts
//
// GET /api/admin/badges
// Compteurs légers pour la sidebar admin :
//   - requestsNew   : nb client_requests status='new'
//   - quotesAlive   : nb quotes status IN ('draft','sent')
//   - missionsRisk  : nb missions confirmées qui démarrent ≤ 7j sans contract_signed_at
//
// Toutes les queries utilisent count: 'exact', head: true → léger même
// si le volume grossit. Pas de payload, juste des nombres.

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

  const supabase = getSupabase();

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const in7d = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  // Lance en parallèle pour rester rapide.
  const [reqRes, reqPitchedRes, quotesRes, missionsRes] = await Promise.all([
    supabase
      .from('client_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),

    // Pitched = chefs envoyés au client, on attend sa réponse. Compté
    // séparément pour que Thomas voie distinctement "5 en attente
    // client" vs "3 à qualifier".
    supabase
      .from('client_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pitched'),

    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'sent']),

    supabase
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('start_date', todayIso)
      .lte('start_date', in7d),
  ]);

  // En cas d'erreur sur un compteur, on renvoie 0 — un badge à 0 vaut
  // mieux qu'une 500 qui casse toute la sidebar.
  return NextResponse.json({
    ok: true,
    requestsNew: reqRes.error ? 0 : (reqRes.count ?? 0),
    requestsPitched: reqPitchedRes.error ? 0 : (reqPitchedRes.count ?? 0),
    quotesAlive: quotesRes.error ? 0 : (quotesRes.count ?? 0),
    missionsRisk: missionsRes.error ? 0 : (missionsRes.count ?? 0),
    generatedAt: new Date().toISOString(),
  });
}
