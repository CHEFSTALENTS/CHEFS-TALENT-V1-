// lib/ai/seoBacklogGenerator.ts
//
// Génère un batch de NOUVEAUX topics SEO via Claude pour alimenter
// automatiquement la table seo_topics. Utilisé par :
//   - POST /api/admin/seo/topics/generate-batch (déclenchement manuel admin)
//   - GET /api/cron/seo-backlog-refill           (cron quotidien)
//
// Logique :
//   1. Récupère le contexte : topics existants + articles déjà publiés
//      + destinations disponibles
//   2. Demande à Claude de proposer N topics non-redondants
//   3. Insère ces topics dans seo_topics en status='pending'

import { createClient } from '@supabase/supabase-js';
import { generateJSON } from './claude';
import {
  SEO_BACKLOG_GENERATOR_SYSTEM_PROMPT,
  BACKLOG_TOPICS_SCHEMA_HINT,
  buildBacklogTopicsPrompt,
} from './seoAgentPrompts';
import { destinations as allDestinations } from '../destinations';

export type GeneratedTopic = {
  topic: string;
  mode: 'new_article' | 'improve_destination';
  destination_slug?: string | null;
  desired_angle?: string | null;
  priority: number;
  rationale?: string;
};

export type BacklogGenResult =
  | {
      ok: true;
      inserted: any[];                       // rows insérés en DB
      proposed: GeneratedTopic[];            // tout ce que Claude a proposé (avant filtrage)
      skippedDuplicates: number;             // topics ignorés parce que doublons
      generation: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        costEur: number;
      };
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function normalizeTopic(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function generateBacklogTopics(input: {
  count: number;                  // combien de topics demander à Claude (5-30 raisonnable)
  adminEmail: string;
  now?: Date;
}): Promise<BacklogGenResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY manquante', status: 500 };
  }

  const supabase = getSupabase();

  // 1. Récupère les topics existants (tous statuts confondus, on veut tout connaître)
  const { data: topics, error: topicsErr } = await supabase
    .from('seo_topics')
    .select('topic, mode, destination_slug, status')
    .order('created_at', { ascending: false })
    .limit(200);
  if (topicsErr) {
    return { ok: false, error: `read topics failed: ${topicsErr.message}`, status: 500 };
  }

  // 2. Récupère les articles publiés
  const { data: articles, error: articlesErr } = await supabase
    .from('articles')
    .select('title, slug, target_destination_slug')
    .eq('status', 'published')
    .eq('locale', 'fr')
    .limit(100);
  if (articlesErr) {
    return { ok: false, error: `read articles failed: ${articlesErr.message}`, status: 500 };
  }

  // 3. Liste des destinations FR du site
  const availableDestinations = allDestinations
    .filter((d) => d.lang === 'fr')
    .map((d) => ({ slug: d.slug, name: d.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // 4. Appel Claude
  let result;
  try {
    result = await generateJSON<{ topics: GeneratedTopic[] }>({
      systemPrompt: SEO_BACKLOG_GENERATOR_SYSTEM_PROMPT,
      userPrompt: buildBacklogTopicsPrompt({
        count: input.count,
        existingTopics: topics || [],
        publishedArticles: articles || [],
        availableDestinations,
        now: input.now,
      }),
      schemaHint: BACKLOG_TOPICS_SCHEMA_HINT,
      maxTokens: 4000, // ~30 topics max
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || 'CLAUDE_ERROR', status: 502 };
  }

  const proposed = result.data?.topics || [];
  if (!Array.isArray(proposed) || proposed.length === 0) {
    return { ok: false, error: 'invalid_output', status: 502 };
  }

  // 5. Filtre les doublons contre les topics existants (par texte normalisé)
  const existingNormalized = new Set((topics || []).map((t) => normalizeTopic(t.topic)));
  const articleSlugs = new Set((articles || []).map((a) => a.slug));
  const validDestinationSlugs = new Set(availableDestinations.map((d) => d.slug));

  const toInsert: Array<Omit<GeneratedTopic, 'rationale'>> = [];
  let skipped = 0;

  for (const t of proposed) {
    if (!t.topic || typeof t.topic !== 'string' || t.topic.trim().length < 3) {
      skipped++;
      continue;
    }
    const norm = normalizeTopic(t.topic);
    if (existingNormalized.has(norm)) {
      skipped++;
      continue;
    }
    // Si Claude a inventé un destination_slug qui n'existe pas, on le nullifie
    if (t.destination_slug && !validDestinationSlugs.has(t.destination_slug)) {
      t.destination_slug = null;
    }
    // En mode improve_destination, la destination est obligatoire
    if (t.mode === 'improve_destination' && !t.destination_slug) {
      skipped++;
      continue;
    }
    // Vérifie qu'on n'a pas déjà un article publié sur ce slug-là
    if (t.destination_slug && articleSlugs.has(t.destination_slug)) {
      // pas bloquant mais on baisse la priorité
      t.priority = Math.max(0, (t.priority || 0) - 2);
    }
    toInsert.push({
      topic: t.topic.trim(),
      mode: t.mode === 'improve_destination' ? 'improve_destination' : 'new_article',
      destination_slug: t.destination_slug || null,
      desired_angle: t.desired_angle?.trim() || null,
      priority: Math.max(0, Math.min(10, Number(t.priority) || 0)),
    });
    existingNormalized.add(norm); // évite doublons intra-batch
  }

  if (toInsert.length === 0) {
    return {
      ok: true,
      inserted: [],
      proposed,
      skippedDuplicates: skipped,
      generation: {
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
        costEur: result.costEur,
      },
    };
  }

  // 6. Insert batch
  const { data: inserted, error: insertErr } = await supabase
    .from('seo_topics')
    .insert(
      toInsert.map((t) => ({
        topic: t.topic,
        mode: t.mode,
        destination_slug: t.destination_slug,
        desired_angle: t.desired_angle,
        priority: t.priority,
        status: 'pending',
        created_by_admin_email: input.adminEmail,
      })),
    )
    .select('*');

  if (insertErr) {
    return { ok: false, error: `insert failed: ${insertErr.message}`, status: 500 };
  }

  return {
    ok: true,
    inserted: inserted || [],
    proposed,
    skippedDuplicates: skipped,
    generation: {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheReadTokens: result.cacheReadTokens,
      costEur: result.costEur,
    },
  };
}
