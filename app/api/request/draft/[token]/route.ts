export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// =============================================================
// GET /api/request/draft/[token]
//
// Retourne le state d'un draft pour permettre au visiteur de reprendre
// son formulaire. Marque resumed_at = now() pour le suivi.
//
// Endpoint PUBLIC (pas d'auth). Le token = preuve de possession
// (l'URL avec token est dans l'email du visiteur, comme magic link).
// =============================================================
export async function GET(
  req: Request,
  ctx: { params: { token: string } },
) {
  // Rate limit léger pour éviter l'énumération de tokens.
  // 30 req / 5 min par IP — généreux mais bloque les bruteforces.
  const rl = rateLimit(req, {
    identifier: 'request-draft-get',
    windowMs: 5 * 60_000,
    max: 30,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  try {
    const token = decodeURIComponent(ctx.params.token || '').trim();
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('request_drafts')
      .select('email, state, last_step, lang, converted_at, created_at')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.error('[request/draft/[token]] GET error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Si déjà converti, on retourne quand même (mais on signale)
    // → le front pourra afficher « Vous avez déjà soumis cette demande »
    // au lieu de re-pré-remplir le form.

    // Vérification expiration : 7 jours
    const createdAt = new Date(data.created_at).getTime();
    const sevenDays = 7 * 24 * 3600 * 1000;
    if (Date.now() - createdAt > sevenDays) {
      return NextResponse.json({ error: 'Draft expired' }, { status: 410 });
    }

    // Marque resumed_at sans bloquer la réponse
    supabase
      .from('request_drafts')
      .update({ resumed_at: new Date().toISOString() })
      .eq('token', token)
      .then(() => {});

    return NextResponse.json({
      ok: true,
      email: data.email,
      state: data.state,
      lastStep: data.last_step,
      lang: data.lang,
      converted: !!data.converted_at,
    });
  } catch (e: any) {
    console.error('[request/draft/[token]] GET fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
