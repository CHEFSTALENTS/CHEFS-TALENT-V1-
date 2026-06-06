// app/api/admin/quotes/[id]/agent/save-memory/route.ts
//
// POST /api/admin/quotes/:id/agent/save-memory
//   Body: { turnIndex: number, memoryIndex: number }
//   → enregistre la proposition de mémoire de l'agent en DB
//     (upsert sur scope/scope_key/memory_key) et marque saved=true
//     dans la conversation.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { upsertMemory } from '@/lib/ai/quoteAgentMemory';

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
  const memoryIndex = Number(body?.memoryIndex);
  if (!Number.isFinite(turnIndex) || !Number.isFinite(memoryIndex)) {
    return NextResponse.json({ ok: false, error: 'INVALID_INDICES' }, { status: 400 });
  }

  const supabase = getSupabase();

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
  const memProposal = turn.memory_proposals?.[memoryIndex];
  if (!memProposal) {
    return NextResponse.json({ ok: false, error: 'INVALID_MEMORY_PROPOSAL' }, { status: 400 });
  }

  const saved = await upsertMemory({
    scope: memProposal.scope,
    scope_key: memProposal.scope_key,
    memory_key: memProposal.memory_key,
    value: memProposal.value,
    rationale: memProposal.rationale,
    source: 'user_confirmed',
    confidence: 1.0,
    admin_email: auth.user.email,
  });

  if (!saved) {
    return NextResponse.json({ ok: false, error: 'UPSERT_FAILED' }, { status: 500 });
  }

  // Marque la proposition comme saved
  turns[turnIndex] = {
    ...turn,
    memory_proposals: turn.memory_proposals!.map((m: any, i: number) =>
      i === memoryIndex ? { ...m, saved: true } : m,
    ),
  };
  await supabase
    .from('quote_agent_conversations')
    .update({ turns })
    .eq('id', conv.id);

  return NextResponse.json({ ok: true, memory: saved });
}
