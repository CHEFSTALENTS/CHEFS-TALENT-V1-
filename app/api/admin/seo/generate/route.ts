// app/api/admin/seo/generate/route.ts
//
// POST /api/admin/seo/generate
// Génère un article SEO via Claude pour Chefs Talents.
//
// Body :
//   {
//     mode: 'new_article',
//     topic: string,                  // sujet libre (ex: "Saint-Tropez", "Chef yacht été")
//     destinationSlug?: string,       // si défini, hydrate le contexte depuis lib/destinations.ts
//     desiredAngle?: string,          // angle optionnel
//     persist?: boolean,              // défaut true : insère dans public.articles en status='draft'
//   }
//
// Renvoie :
//   { ok: true, article: <row supabase>, generation: { inputTokens, outputTokens, costEur, model, cacheReadTokens } }
//   ou { ok: false, error: string }
//
// La génération est synchrone (1 seul appel Claude). Pour un volume plus
// important on passerait à une file de jobs, mais ici on reste simple :
// l'admin lance manuellement, attend ~20-40s, voit le résultat.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel Pro max = 300s. La génération Claude prend 30–90s selon la longueur
// de l'article (Sonnet ~50–100 tokens/sec, articles ~800–1200 mots).
export const maxDuration = 300;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { generateJSON } from '@/lib/ai/claude';
import {
  SEO_AGENT_SYSTEM_PROMPT,
  ARTICLE_SCHEMA_HINT,
  buildNewArticlePrompt,
} from '@/lib/ai/seoAgentPrompts';
import { getDestinationBySlug } from '@/lib/destinations';

type GeneratedArticle = {
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

// Combining diacritical marks (U+0300 to U+036F).
// Construit via new RegExp + \u escapes pour éviter d'avoir des
// caractères combinants littéraux dans le code source (qui peuvent
// foirer le parsing dans certains runtimes serverless).
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

export async function POST(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const {
    mode = 'new_article',
    topic,
    destinationSlug,
    desiredAngle,
    persist = true,
  } = body || {};

  if (mode !== 'new_article') {
    return NextResponse.json(
      { ok: false, error: `mode '${mode}' non supporté dans cette version (utiliser 'new_article')` },
      { status: 400 },
    );
  }

  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    return NextResponse.json({ ok: false, error: 'topic_required' }, { status: 400 });
  }

  // Hydrate contexte destination si fourni
  let destinationContext: string | undefined;
  let targetDestinationSlug: string | null = null;
  if (destinationSlug && typeof destinationSlug === 'string') {
    const ctx = buildDestinationContext(destinationSlug);
    if (!ctx) {
      return NextResponse.json(
        { ok: false, error: `destination '${destinationSlug}' introuvable dans lib/destinations.ts` },
        { status: 400 },
      );
    }
    destinationContext = ctx;
    targetDestinationSlug = destinationSlug;
  }

  // Sanity check : on veut une erreur 500 explicite plutôt que de planter
  // dans le SDK Anthropic si la clé n'est pas set.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY env var manquante sur le serveur' },
      { status: 500 },
    );
  }

  console.log('[seo/generate] start', {
    topic: topic.slice(0, 60),
    destinationSlug,
    hasContext: !!destinationContext,
    admin: auth.user.email,
  });

  // Appel Claude
  let result;
  try {
    result = await generateJSON<GeneratedArticle>({
      systemPrompt: SEO_AGENT_SYSTEM_PROMPT,
      userPrompt: buildNewArticlePrompt({
        topic: topic.trim(),
        destinationContext,
        desiredAngle: desiredAngle?.trim() || undefined,
      }),
      schemaHint: ARTICLE_SCHEMA_HINT,
      // 4500 tokens output = ~3000 mots max (avec JSON overhead) =
      // articles de 800–1200 mots en pratique, génération ~30–60s.
      maxTokens: 4500,
    });
    console.log('[seo/generate] Claude ok', {
      model: result.model,
      input: result.inputTokens,
      output: result.outputTokens,
      costEur: result.costEur,
    });
  } catch (e: any) {
    console.error('[seo/generate] Claude error', {
      message: e?.message,
      status: e?.status,
      type: e?.type,
      stack: e?.stack?.split('\n').slice(0, 4).join('\n'),
    });
    return NextResponse.json(
      { ok: false, error: e?.message || 'CLAUDE_ERROR', detail: e?.status ? `HTTP ${e.status}` : undefined },
      { status: 502 },
    );
  }

  const generated = result.data;

  // Validation minimale
  if (!generated?.title || !Array.isArray(generated?.blocks) || generated.blocks.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_output',
        rawText: result.rawText?.slice(0, 1000),
      },
      { status: 502 },
    );
  }

  // Normalise le slug (Claude peut renvoyer du n'importe quoi)
  let slug = (generated.slug && typeof generated.slug === 'string')
    ? slugify(generated.slug)
    : slugify(generated.title);
  if (!slug) slug = `article-${Date.now()}`;

  // Si on ne persiste pas, on renvoie juste le brouillon (preview mode)
  if (!persist) {
    return NextResponse.json({
      ok: true,
      article: {
        slug,
        title: generated.title,
        subtitle: generated.subtitle || null,
        meta_title: generated.metaTitle || null,
        meta_description: generated.metaDescription || null,
        category: generated.category || null,
        blocks: generated.blocks,
        faqs: generated.faqs || [],
        target_destination_slug: targetDestinationSlug,
        status: 'draft',
        ai_generated: true,
      },
      generation: {
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
        costEur: result.costEur,
      },
    });
  }

  // Persistance Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Si le slug existe déjà, on suffixe avec un timestamp court
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
      created_by_admin_email: auth.user.email,
    })
    .select('*')
    .single();

  if (insertErr) {
    console.error('[seo/generate] insert error', insertErr);
    return NextResponse.json(
      { ok: false, error: `Insert error: ${insertErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    article: inserted,
    generation: {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheReadTokens: result.cacheReadTokens,
      costEur: result.costEur,
    },
  });
}
