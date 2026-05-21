// lib/ai/seoGenerate.ts
//
// Logique de génération d'articles SEO extraite de la route handler pour être
// réutilisable depuis :
//   - POST /api/admin/seo/generate (déclenchement manuel admin)
//   - GET /api/cron/seo-generate    (déclenchement automatique cron Vercel)
//
// La route admin garde ses spécificités (auth Bearer, parsing body). Cette
// lib s'occupe uniquement de : construire le prompt → appeler Claude →
// persister en DB → renvoyer l'article créé + métriques.

import { createClient } from '@supabase/supabase-js';
import { generateJSON } from './claude';
import {
  SEO_AGENT_SYSTEM_PROMPT,
  ARTICLE_SCHEMA_HINT,
  buildNewArticlePrompt,
  buildImproveDestinationPrompt,
} from './seoAgentPrompts';
import { getDestinationBySlug } from '../destinations';

export type GenerateInput =
  | {
      mode: 'new_article';
      topic: string;
      destinationSlug?: string | null;
      desiredAngle?: string | null;
      adminEmail: string;
    }
  | {
      mode: 'improve_destination';
      destinationSlug: string;
      desiredAngle?: string | null;
      adminEmail: string;
    };

export type GeneratedArticle = {
  slug: string;
  title: string;
  subtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  category?: string;
  imageQueryHint?: string;
  blocks: Array<{
    type: 'paragraph' | 'h2' | 'h3' | 'list' | 'quote';
    content: string | string[];
  }>;
  faqs?: Array<{ question: string; answer: string }>;
};

export type GenerateResult = {
  ok: true;
  article: any; // row Supabase
  generation: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    costEur: number;
  };
};

export type GenerateError = {
  ok: false;
  error: string;
  status?: number;
  rawText?: string;
};

const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildDestinationContext(slug: string): string | null {
  const dest = getDestinationBySlug(slug);
  if (!dest) return null;
  const parts: string[] = [];
  parts.push(`Destination : ${dest.name} (${dest.region}, ${dest.country})`);
  if (dest.heroSubtitle) parts.push(`Pitch court : ${dest.heroSubtitle}`);
  if (dest.description) parts.push(`Description : ${dest.description}`);
  if (dest.season) parts.push(`Saison : ${dest.season}`);
  if (dest.rateRange) parts.push(`Fourchette tarifaire (interne, ne PAS citer) : ${dest.rateRange} ${dest.rateDetail || ''}`);
  if (dest.highlights?.length) parts.push(`Points clés : ${dest.highlights.join(' · ')}`);
  if (dest.missionTypes?.length) parts.push(`Types de missions : ${dest.missionTypes.join(', ')}`);
  if (dest.zones?.length) {
    parts.push(`Zones / micro-territoires :`);
    for (const z of dest.zones) parts.push(`- ${z.name} : ${z.description}`);
  }
  if (dest.seoKeywords?.length) parts.push(`Mots-clés cibles : ${dest.seoKeywords.join(', ')}`);
  return parts.join('\n');
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Génère et persiste un article SEO en brouillon.
 * Retourne le row inséré ou une erreur explicite.
 */
export async function generateSeoArticle(
  input: GenerateInput,
): Promise<GenerateResult | GenerateError> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY env var manquante', status: 500 };
  }

  // 1. Construit le user prompt selon le mode
  let userPrompt: string;
  let targetDestinationSlug: string | null = null;
  let maxTokens = 8000;

  if (input.mode === 'improve_destination') {
    const dest = getDestinationBySlug(input.destinationSlug);
    if (!dest) {
      return {
        ok: false,
        error: `destination '${input.destinationSlug}' introuvable`,
        status: 400,
      };
    }
    const ctx = buildDestinationContext(input.destinationSlug);
    if (!ctx) {
      return {
        ok: false,
        error: `contexte destination indisponible pour ${input.destinationSlug}`,
        status: 400,
      };
    }
    userPrompt = buildImproveDestinationPrompt({
      destinationName: dest.name,
      destinationSlug: input.destinationSlug,
      destinationContext: ctx,
      desiredAngle: input.desiredAngle?.trim() || undefined,
    });
    targetDestinationSlug = input.destinationSlug;
    maxTokens = 10000;
  } else {
    if (!input.topic || input.topic.trim().length < 3) {
      return { ok: false, error: 'topic_required', status: 400 };
    }
    let destinationContext: string | undefined;
    if (input.destinationSlug) {
      const ctx = buildDestinationContext(input.destinationSlug);
      if (!ctx) {
        return {
          ok: false,
          error: `destination '${input.destinationSlug}' introuvable`,
          status: 400,
        };
      }
      destinationContext = ctx;
      targetDestinationSlug = input.destinationSlug;
    }
    userPrompt = buildNewArticlePrompt({
      topic: input.topic.trim(),
      destinationContext,
      desiredAngle: input.desiredAngle?.trim() || undefined,
    });
  }

  // 2. Appelle Claude
  let result;
  try {
    result = await generateJSON<GeneratedArticle>({
      systemPrompt: SEO_AGENT_SYSTEM_PROMPT,
      userPrompt,
      schemaHint: ARTICLE_SCHEMA_HINT,
      maxTokens,
    });
  } catch (e: any) {
    console.error('[seoGenerate] Claude error', {
      message: e?.message,
      status: e?.status,
    });
    return {
      ok: false,
      error: e?.message || 'CLAUDE_ERROR',
      status: 502,
    };
  }

  const generated = result.data;

  // 3. Validation minimale
  if (!generated?.title || !Array.isArray(generated?.blocks) || generated.blocks.length === 0) {
    return {
      ok: false,
      error: 'invalid_output',
      status: 502,
      rawText: result.rawText?.slice(0, 1000),
    };
  }

  // 4. Normalise le slug
  let slug = (generated.slug && typeof generated.slug === 'string')
    ? slugify(generated.slug)
    : slugify(generated.title);
  if (!slug) slug = `article-${Date.now()}`;

  // 5. Persistance (avec gestion collision de slug)
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-5)}`;
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('articles')
    .insert({
      slug,
      locale: 'fr',
      category: generated.category || null,
      title: generated.title,
      subtitle: generated.subtitle || null,
      meta_title: generated.metaTitle || null,
      meta_description: generated.metaDescription || null,
      blocks: generated.blocks,
      faqs: generated.faqs || [],
      target_destination_slug: targetDestinationSlug,
      status: 'draft',
      ai_generated: true,
      ai_model: result.model,
      ai_input_tokens: result.inputTokens,
      ai_output_tokens: result.outputTokens,
      ai_cost_eur: result.costEur,
      created_by_admin_email: input.adminEmail,
    })
    .select('*')
    .single();

  if (insertErr) {
    return {
      ok: false,
      error: `Insert error: ${insertErr.message}`,
      status: 500,
    };
  }

  return {
    ok: true,
    article: inserted,
    generation: {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheReadTokens: result.cacheReadTokens,
      costEur: result.costEur,
    },
  };
}
