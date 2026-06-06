// app/api/admin/quotes/[id]/agent/apply-suggestion/route.ts
//
// POST /api/admin/quotes/:id/agent/apply-suggestion
//   Body: { turnIndex: number, suggestionIndex: number }
//   → applique la suggestion au devis (update quotes) + marque la suggestion
//     comme applied=true dans la conversation.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const ALLOWED_FIELDS = new Set([
  'intitule', 'lieu', 'dates_text', 'convives_text',
  'rythme_text', 'langues_text', 'hebergement_text',
  'destinataire_nom', 'destinataire_type', 'destinataire_adresse',
  'tariff_options', 'courses_text', 'courses_provision_text',
  'conditions', 'validity_date',
  'chef_cost_eur', 'chef_travel_cost_eur',
  'butler_required', 'butler_cost_eur',
]);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: quoteId } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const turnIndex = Number(body?.turnIndex);
  const suggestionIndex = Number(body?.suggestionIndex);
  if (!Number.isFinite(turnIndex) || !Number.isFinite(suggestionIndex)) {
    return NextResponse.json({ ok: false, error: 'INVALID_INDICES' }, { status: 400 });
  }

  const supabase = getSupabase();

  // 1. Charge la conversation active
  const { data: conv } = await supabase
    .from('quote_agent_conversations')
    .select('*')
    .eq('quote_id', quoteId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

  const turns = Array.isArray(conv.turns) ? conv.turns : [];
  const turn = turns[turnIndex];
  if (!turn || turn.role !== 'agent') {
    return NextResponse.json({ ok: false, error: 'INVALID_TURN' }, { status: 400 });
  }
  const suggestion = turn.suggestions?.[suggestionIndex];
  if (!suggestion) {
    return NextResponse.json({ ok: false, error: 'INVALID_SUGGESTION' }, { status: 400 });
  }
  if (!ALLOWED_FIELDS.has(suggestion.field)) {
    return NextResponse.json({ ok: false, error: `FIELD_NOT_EDITABLE: ${suggestion.field}` }, { status: 400 });
  }

  // 2. Applique au devis
  const updates: Record<string, any> = { [suggestion.field]: suggestion.value };
  const { error: updErr } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', quoteId);
  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  // 3. Marque la suggestion comme applied + update la conversation
  turns[turnIndex] = {
    ...turn,
    suggestions: turn.suggestions!.map((s: any, i: number) =>
      i === suggestionIndex ? { ...s, applied: true } : s,
    ),
  };
  await supabase
    .from('quote_agent_conversations')
    .update({ turns })
    .eq('id', conv.id);

  return NextResponse.json({ ok: true, appliedField: suggestion.field });
}
