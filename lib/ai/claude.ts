// lib/ai/claude.ts
//
// Wrapper Anthropic SDK pour la génération de contenu SEO.
// Centralisé pour gérer : prompt caching, tracking de coûts, model selection.
//
// Variables d'env :
//   ANTHROPIC_API_KEY   →  clé API Anthropic (à set sur Vercel)
//   ANTHROPIC_MODEL     →  modèle (défaut: claude-sonnet-4-5)
//
// Prompt caching : on cache les instructions système (long, statiques)
// pour réduire les coûts de ~80% sur les requêtes successives à <5 min.

import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-sonnet-4-5';

// Tarifs Anthropic en USD pour 1M tokens (claude-sonnet-4-5, à jour 2026-05)
// Convertis approximativement en EUR (1 USD ≈ 0.92 EUR).
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5':       { input: 3,  output: 15 },   // USD per 1M tokens
  'claude-opus-4':           { input: 15, output: 75 },
  'claude-haiku-4':          { input: 0.8, output: 4 },
};
const USD_TO_EUR = 0.92;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY env var manquante');
  }
  return new Anthropic({ apiKey });
}

function getModel(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

export type GenerationResult<T = any> = {
  /** Objet JSON parsé depuis la réponse Claude */
  data: T;
  /** Tokens consommés */
  inputTokens: number;
  outputTokens: number;
  /** Cache hit (cached_creation + cached_read) */
  cacheReadTokens: number;
  /** Coût total estimé en EUR */
  costEur: number;
  /** Modèle utilisé */
  model: string;
  /** Réponse brute (pour debug) */
  rawText: string;
};

/**
 * Génère un objet JSON typé via Claude.
 *
 * @param systemPrompt   Instructions système (CACHED → mettre les parties stables ici)
 * @param userPrompt     Requête spécifique (variable, non-caché)
 * @param schemaHint     Description du schema JSON attendu (inclus dans system prompt)
 * @param maxTokens      Limite output (défaut: 8000)
 */
export async function generateJSON<T = any>(input: {
  systemPrompt: string;
  userPrompt: string;
  schemaHint?: string;
  maxTokens?: number;
}): Promise<GenerationResult<T>> {
  const client = getClient();
  const model = getModel();

  const systemContent = [
    {
      type: 'text' as const,
      text: input.systemPrompt + (input.schemaHint ? `\n\n## Format de réponse attendu (JSON strict)\n${input.schemaHint}` : ''),
      // Cache breakpoint : les instructions système (longues, statiques)
      // sont mises en cache. Réduit drastiquement le coût des appels successifs.
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: input.maxTokens || 8000,
    system: systemContent,
    messages: [
      {
        role: 'user',
        content: input.userPrompt,
      },
    ],
  });

  // Extrait le texte de la réponse (Claude retourne potentiellement plusieurs blocks)
  const rawText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n');

  // Parse le JSON (Claude peut wrapper avec ```json ou pas)
  const cleanedText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let data: T;
  try {
    data = JSON.parse(cleanedText);
  } catch (e: any) {
    throw new Error(
      `Claude n'a pas renvoyé un JSON valide. Texte reçu : ${rawText.slice(0, 300)}... — Erreur: ${e?.message}`,
    );
  }

  // Calcul du coût
  const usage = response.usage;
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const cacheReadTokens = (usage as any).cache_read_input_tokens || 0;
  const cacheWriteTokens = (usage as any).cache_creation_input_tokens || 0;

  const pricing = PRICING[model] || PRICING[DEFAULT_MODEL];
  // Note : les tokens cachés en lecture coûtent ~10 % du tarif input.
  // Les tokens d'écriture du cache coûtent ~125 % du tarif input.
  // On approxime ici pour le tracking — pas besoin d'être à 100 %.
  const inputCostUsd =
    ((inputTokens - cacheReadTokens) * pricing.input) / 1_000_000
    + (cacheReadTokens * pricing.input * 0.1) / 1_000_000
    + (cacheWriteTokens * pricing.input * 1.25) / 1_000_000;
  const outputCostUsd = (outputTokens * pricing.output) / 1_000_000;
  const costEur = Math.round((inputCostUsd + outputCostUsd) * USD_TO_EUR * 10000) / 10000;

  return {
    data,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    costEur,
    model,
    rawText,
  };
}
