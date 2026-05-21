// app/api/admin/seo/articles/[id]/translate/route.ts
//
// POST /api/admin/seo/articles/:id/translate
// Génère la version anglaise d'un article FR existant.
//
// Body :
//   { targetLocale?: 'en' }   // pour le moment uniquement 'en'
//
// Conditions :
//   - L'article source doit avoir locale='fr'
//   - L'article source peut être draft ou published (on autorise les deux pour
//     pouvoir préparer une traduction avant de publier le FR)
//
// Résultat :
//   - Crée un nouveau row dans `articles` avec locale='en', source_article_id=<id source>,
//     status='draft'
//   - L'admin peut ensuite l'éditer/publier comme n'importe quel article

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { generateJSON } from '@/lib/ai/claude';
import {
  SEO_TRANSLATE_SYSTEM_PROMPT,
  ARTICLE_SCHEMA_HINT,
  buildTranslateArticlePrompt,
} from '@/lib/ai/seoAgentPrompts';

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

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type TranslatedArticle = {
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // pas de body = défaut
  }

  const targetLocale = body?.targetLocale || 'en';
  if (targetLocale !== 'en') {
    return NextResponse.json(
      { ok: false, error: `targetLocale '${targetLocale}' non supportée (EN uniquement pour le moment)` },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'ANTHROPIC_API_KEY env var manquante' },
      { status: 500 },
    );
  }

  const supabase = getSupabase();

  // 1. Lire l'article source
  const { data: source, error: srcErr } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (srcErr) return NextResponse.json({ ok: false, error: srcErr.message }, { status: 500 });
  if (!source) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

  if (source.locale !== 'fr') {
    return NextResponse.json(
      { ok: false, error: `L'article source doit être en FR (actuellement: ${source.locale})` },
      { status: 400 },
    );
  }

  // 2. Vérifier qu'il n'y a pas déjà une traduction EN
  const { data: existingTranslation } = await supabase
    .from('articles')
    .select('id, slug, status')
    .eq('source_article_id', id)
    .eq('locale', targetLocale)
    .maybeSingle();
  if (existingTranslation) {
    return NextResponse.json(
      {
        ok: false,
        error: `Une traduction ${targetLocale.toUpperCase()} existe déjà (slug: ${existingTranslation.slug}). Supprimez-la d'abord si vous voulez la régénérer.`,
        existingId: existingTranslation.id,
      },
      { status: 409 },
    );
  }

  console.log('[seo/translate] start', {
    sourceId: id,
    sourceSlug: source.slug,
    targetLocale,
    admin: auth.user.email,
  });

  // 3. Appel Claude pour traduire
  let result;
  try {
    result = await generateJSON<TranslatedArticle>({
      systemPrompt: SEO_TRANSLATE_SYSTEM_PROMPT,
      userPrompt: buildTranslateArticlePrompt({
        frArticle: {
          title: source.title,
          subtitle: source.subtitle,
          meta_title: source.meta_title,
          meta_description: source.meta_description,
          category: source.category,
          slug: source.slug,
          blocks: source.blocks,
          faqs: source.faqs,
        },
      }),
      schemaHint: ARTICLE_SCHEMA_HINT,
      maxTokens: 8000,
    });
    console.log('[seo/translate] Claude ok', {
      model: result.model,
      input: result.inputTokens,
      output: result.outputTokens,
      costEur: result.costEur,
    });
  } catch (e: any) {
    console.error('[seo/translate] Claude error', { message: e?.message, status: e?.status });
    return NextResponse.json(
      { ok: false, error: e?.message || 'CLAUDE_ERROR' },
      { status: 502 },
    );
  }

  const translated = result.data;
  if (!translated?.title || !Array.isArray(translated?.blocks) || translated.blocks.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'invalid_output', rawText: result.rawText?.slice(0, 1000) },
      { status: 502 },
    );
  }

  // 4. Normalise le slug EN (anti-collision)
  let slug = translated.slug && typeof translated.slug === 'string'
    ? slugify(translated.slug)
    : slugify(translated.title);
  if (!slug) slug = `${source.slug}-en`;

  const { data: collision } = await supabase
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (collision) {
    slug = `${slug}-${Date.now().toString(36).slice(-5)}`;
  }

  // 5. Persiste la traduction (status='draft', à publier après review)
  const { data: inserted, error: insertErr } = await supabase
    .from('articles')
    .insert({
      slug,
      locale: targetLocale,
      category: translated.category || source.category,
      title: translated.title,
      subtitle: translated.subtitle || null,
      meta_title: translated.metaTitle || null,
      meta_description: translated.metaDescription || null,
      blocks: translated.blocks,
      faqs: translated.faqs || [],
      target_destination_slug: source.target_destination_slug, // même destination liée
      image_url: source.image_url, // partage l'image hero du FR
      image_alt: source.image_alt,
      status: 'draft',
      ai_generated: true,
      ai_model: result.model,
      ai_input_tokens: result.inputTokens,
      ai_output_tokens: result.outputTokens,
      ai_cost_eur: result.costEur,
      source_article_id: id,
      created_by_admin_email: auth.user.email,
    })
    .select('*')
    .single();

  if (insertErr) {
    console.error('[seo/translate] insert error', insertErr);
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
