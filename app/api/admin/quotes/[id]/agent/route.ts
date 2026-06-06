// app/api/admin/quotes/[id]/agent/route.ts
//
// GET  /api/admin/quotes/:id/agent
//   → renvoie la conversation active (turns + meta) ou null si pas démarrée
//
// POST /api/admin/quotes/:id/agent
//   → envoie un nouveau message de Thomas (ou tour initial si message vide).
//      Appelle Claude, ajoute le turn agent à la conversation, retourne le
//      tour complet.
//   → Body: { message?: string }    (vide au premier tour pour initier)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { generateJSON } from '@/lib/ai/claude';
import {
  QUOTE_AGENT_SYSTEM_PROMPT,
  QUOTE_AGENT_RESPONSE_SCHEMA,
  buildQuoteAgentUserPrompt,
} from '@/lib/ai/quoteAgentPrompts';
import {
  retrieveRelevantMemories,
  bumpMemoryUsage,
} from '@/lib/ai/quoteAgentMemory';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type Turn = {
  role: 'agent' | 'user';
  content: string;
  ts: string;
  suggestions?: Array<{
    field: string;
    value: any;
    rationale: string;
    applied?: boolean;
  }>;
  memory_proposals?: Array<{
    scope: 'global' | 'destinataire' | 'location';
    scope_key: string;
    memory_key: string;
    value: any;
    rationale: string;
    saved?: boolean;
  }>;
};

type AgentResponse = {
  message: string;
  suggestions?: Turn['suggestions'];
  memory_proposals?: Turn['memory_proposals'];
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id: quoteId } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('quote_agent_conversations')
    .select('*')
    .eq('quote_id', quoteId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, conversation: data || null });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY env var manquante' },
      { status: 500 },
    );
  }

  const { id: quoteId } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const userMessage: string = String(body?.message || '').trim();

  const supabase = getSupabase();

  // 1. Charge le devis + la request
  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .maybeSingle();
  if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
  if (!quote) return NextResponse.json({ ok: false, error: 'QUOTE_NOT_FOUND' }, { status: 404 });

  let request: any = null;
  if (quote.request_id) {
    const { data: req2 } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', quote.request_id)
      .maybeSingle();
    request = req2 || null;
  }

  // 2. Récupère ou crée la conversation active
  const { data: existingConv } = await supabase
    .from('quote_agent_conversations')
    .select('*')
    .eq('quote_id', quoteId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversation = existingConv;
  if (!conversation) {
    const { data: created, error: cErr } = await supabase
      .from('quote_agent_conversations')
      .insert({
        quote_id: quoteId,
        request_id: quote.request_id,
        created_by_admin_email: auth.user.email,
        turns: [],
      })
      .select('*')
      .single();
    if (cErr) return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });
    conversation = created;
  }

  const turns: Turn[] = Array.isArray(conversation.turns) ? conversation.turns : [];

  // 3. Append le turn user si message présent
  if (userMessage) {
    turns.push({
      role: 'user',
      content: userMessage,
      ts: new Date().toISOString(),
    });
  }

  // 4. Récupère les mémoires pertinentes
  const memories = await retrieveRelevantMemories({
    destinataire: quote.destinataire_nom,
    location: quote.lieu || request?.location,
    limit: 30,
  });

  // 5. Appel Claude
  let result;
  try {
    result = await generateJSON<AgentResponse>({
      systemPrompt: QUOTE_AGENT_SYSTEM_PROMPT,
      userPrompt: buildQuoteAgentUserPrompt({
        quote,
        request,
        memories: memories.map((m) => ({
          scope: m.scope,
          scope_key: m.scope_key,
          memory_key: m.memory_key,
          value: m.value,
          rationale: m.rationale,
          use_count: m.use_count,
          confidence: m.confidence,
        })),
        turnHistory: turns.map((t) => ({ role: t.role, content: t.content })),
        userMessage,
      }),
      schemaHint: QUOTE_AGENT_RESPONSE_SCHEMA,
      maxTokens: 2000,
    });
  } catch (e: any) {
    console.error('[quote-agent] Claude error', e?.message);
    return NextResponse.json(
      { ok: false, error: e?.message || 'CLAUDE_ERROR' },
      { status: 502 },
    );
  }

  const agentResp = result.data;
  if (!agentResp?.message) {
    return NextResponse.json(
      { ok: false, error: 'invalid_agent_response', rawText: result.rawText?.slice(0, 500) },
      { status: 502 },
    );
  }

  // 6. Append le turn agent
  turns.push({
    role: 'agent',
    content: agentResp.message,
    ts: new Date().toISOString(),
    suggestions: agentResp.suggestions,
    memory_proposals: agentResp.memory_proposals,
  });

  // 7. Bump usage des mémoires utilisées (best-effort)
  bumpMemoryUsage(memories.map((m) => m.id)).catch(() => {});

  // 8. Update conversation
  await supabase
    .from('quote_agent_conversations')
    .update({
      turns,
      ai_input_tokens: conversation.ai_input_tokens + result.inputTokens,
      ai_output_tokens: conversation.ai_output_tokens + result.outputTokens,
      ai_cost_eur: Number(conversation.ai_cost_eur) + result.costEur,
    })
    .eq('id', conversation.id);

  return NextResponse.json({
    ok: true,
    conversation: {
      ...conversation,
      turns,
    },
    generation: {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costEur: result.costEur,
      cacheReadTokens: result.cacheReadTokens,
    },
  });
}
