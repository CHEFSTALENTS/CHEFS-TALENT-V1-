// lib/ai/quoteAgentMemory.ts
//
// Helpers pour la mémoire persistante de l'agent commercial.
// - retrieveRelevantMemories : pioche les mémoires pertinentes pour un
//   contexte de devis (global + matching destinataire + matching lieu)
// - upsertMemory : insert ou update une mémoire (idempotent via unique
//   index sur scope, scope_key, memory_key)

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type MemoryRow = {
  id: string;
  scope: 'global' | 'destinataire' | 'location';
  scope_key: string;
  memory_key: string;
  value: any;
  rationale: string | null;
  source: 'user_confirmed' | 'inferred_from_history' | 'agent_proposal';
  confidence: number;
  use_count: number;
  last_used_at: string | null;
  created_by_admin_email: string | null;
  created_at: string;
  updated_at: string;
};

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Normalise un libellé de lieu en clé de mémoire stable.
 * "Cannes (06)" → "cannes"
 * "Saint-Tropez, France" → "saint-tropez"
 */
export function normalizeLocationKey(raw: string | null | undefined): string {
  return String(raw ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, '')              // strip "(06)"
    .replace(/,.*$/, '')                  // strip ", France"
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

/**
 * Normalise un nom de destinataire en clé stable.
 * "Conciergerie Advisor Luxury" → "conciergerie-advisor-luxury"
 */
export function normalizeDestinataireKey(raw: string | null | undefined): string {
  return normalizeLocationKey(raw);
}

/**
 * Pioche les mémoires pertinentes pour un contexte de devis.
 * - Toutes les mémoires 'global'
 * - Les mémoires 'destinataire' qui match le destinataire (normalisé)
 * - Les mémoires 'location' qui match le lieu (normalisé)
 *
 * Triées par confidence × use_count descendant pour favoriser les
 * mémoires confirmées et utilisées.
 */
export async function retrieveRelevantMemories(input: {
  destinataire?: string | null;
  location?: string | null;
  limit?: number;
}): Promise<MemoryRow[]> {
  const supabase = getSupabase();
  const limit = input.limit ?? 30;

  const destKey = input.destinataire ? normalizeDestinataireKey(input.destinataire) : null;
  const locKey = input.location ? normalizeLocationKey(input.location) : null;

  // On fait une seule requête avec un OR sur scope/scope_key
  const orClauses: string[] = [
    'and(scope.eq.global,scope_key.eq.global)',
  ];
  if (destKey) {
    orClauses.push(`and(scope.eq.destinataire,scope_key.eq.${destKey})`);
  }
  if (locKey) {
    orClauses.push(`and(scope.eq.location,scope_key.eq.${locKey})`);
  }

  const { data, error } = await supabase
    .from('quote_agent_memories')
    .select('*')
    .or(orClauses.join(','))
    .order('confidence', { ascending: false })
    .order('use_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[quoteAgentMemory.retrieve] error', error.message);
    return [];
  }

  return (data || []) as MemoryRow[];
}

/**
 * Bump le use_count + last_used_at d'une liste de mémoires (best-effort).
 * Permet à l'agent de favoriser les mémoires effectivement utilisées
 * (un memory créé mais jamais réutilisé baisse en pertinence).
 */
export async function bumpMemoryUsage(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = getSupabase();
  // Update sans atomic increment via une RPC : on fait un fetch puis un update
  const { data } = await supabase
    .from('quote_agent_memories')
    .select('id, use_count')
    .in('id', ids);
  if (!data) return;
  for (const row of data) {
    await supabase
      .from('quote_agent_memories')
      .update({
        use_count: (row.use_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', row.id);
  }
}

/**
 * Upsert une mémoire. Si une mémoire existe déjà pour (scope, scope_key,
 * memory_key) on update value + rationale + bump confidence vers 1.0.
 * Sinon on insert.
 */
export async function upsertMemory(input: {
  scope: 'global' | 'destinataire' | 'location';
  scope_key: string;
  memory_key: string;
  value: any;
  rationale?: string | null;
  source?: 'user_confirmed' | 'inferred_from_history' | 'agent_proposal';
  confidence?: number;
  admin_email?: string | null;
}): Promise<MemoryRow | null> {
  const supabase = getSupabase();

  // Normalize les keys
  const scopeKey = input.scope === 'global'
    ? 'global'
    : input.scope === 'destinataire'
      ? normalizeDestinataireKey(input.scope_key)
      : normalizeLocationKey(input.scope_key);

  const row = {
    scope: input.scope,
    scope_key: scopeKey,
    memory_key: input.memory_key,
    value: input.value,
    rationale: input.rationale ?? null,
    source: input.source ?? 'user_confirmed',
    confidence: input.confidence ?? 1.0,
    created_by_admin_email: input.admin_email ?? null,
  };

  // Tente l'insert; si conflit, update
  const { data: existing } = await supabase
    .from('quote_agent_memories')
    .select('id')
    .eq('scope', row.scope)
    .eq('scope_key', row.scope_key)
    .eq('memory_key', row.memory_key)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('quote_agent_memories')
      .update({
        value: row.value,
        rationale: row.rationale,
        source: row.source,
        confidence: row.confidence,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) return null;
    return data as MemoryRow;
  }

  const { data, error } = await supabase
    .from('quote_agent_memories')
    .insert(row)
    .select('*')
    .single();
  if (error) {
    console.error('[quoteAgentMemory.upsert] error', error.message);
    return null;
  }
  return data as MemoryRow;
}
