// app/api/cron/seo-generate/route.ts
//
// Cron Vercel : génère N articles SEO en piochant dans le backlog seo_topics.
// Schedule défini dans vercel.json. Par défaut on traite jusqu'à 2 topics par run.
//
// Auth : Authorization: Bearer ${CRON_SECRET}.
//
// Workflow par topic :
//   1. Lock optimiste : update seo_topics set status='processing' where id=? and status='pending'
//   2. Appel generateSeoArticle()
//   3. Update : status='done' avec generated_article_id, OU status='failed' avec error
//
// Si une génération échoue, on log et on continue avec la suivante (pas de rollback global).

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel Pro max = 300s. 2 articles à ~60-120s chacun ≈ 120-240s.
export const maxDuration = 300;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSeoArticle, type GenerateError } from '@/lib/ai/seoGenerate';

const BATCH_SIZE = 2;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type SeoTopicRow = {
  id: string;
  topic: string;
  mode: 'new_article' | 'improve_destination';
  destination_slug: string | null;
  desired_angle: string | null;
  priority: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
};

export async function GET(req: Request) {
  // Auth
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron/seo-generate] CRON_SECRET missing');
    return NextResponse.json({ error: 'CRON_SECRET_NOT_CONFIGURED' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const supabase = getSupabase();

  // 1. Récupère les N prochains topics pending, par priorité décroissante puis ancienneté
  const { data: topics, error: readErr } = await supabase
    .from('seo_topics')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (readErr) {
    console.error('[cron/seo-generate] read error', readErr);
    return NextResponse.json({ error: 'READ_FAIL', detail: readErr.message }, { status: 500 });
  }

  if (!topics || topics.length === 0) {
    console.log('[cron/seo-generate] no pending topics');
    return NextResponse.json({ ok: true, processed: 0, skipped: 0 });
  }

  const results: Array<{
    topicId: string;
    topic: string;
    status: 'done' | 'failed' | 'skipped';
    articleId?: string;
    error?: string;
    costEur?: number;
  }> = [];

  for (const t of topics as SeoTopicRow[]) {
    // 2. Lock optimiste : transition pending → processing (atomique)
    const { data: locked, error: lockErr } = await supabase
      .from('seo_topics')
      .update({ status: 'processing' })
      .eq('id', t.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (lockErr) {
      console.error('[cron/seo-generate] lock error', lockErr);
      results.push({ topicId: t.id, topic: t.topic, status: 'skipped', error: lockErr.message });
      continue;
    }
    if (!locked) {
      // Quelqu'un d'autre a déjà pris le topic (rare avec un cron Vercel mais possible)
      results.push({ topicId: t.id, topic: t.topic, status: 'skipped', error: 'already_processing' });
      continue;
    }

    console.log('[cron/seo-generate] processing', { topicId: t.id, mode: t.mode, topic: t.topic.slice(0, 60) });

    // 3. Génère l'article
    try {
      const gen = await generateSeoArticle(
        t.mode === 'improve_destination'
          ? {
              mode: 'improve_destination',
              destinationSlug: t.destination_slug!,
              desiredAngle: t.desired_angle,
              adminEmail: 'cron@chefstalents.com',
            }
          : {
              mode: 'new_article',
              topic: t.topic,
              destinationSlug: t.destination_slug,
              desiredAngle: t.desired_angle,
              adminEmail: 'cron@chefstalents.com',
            },
      );

      if (!gen.ok) {
        const errMsg = (gen as GenerateError).error;
        await supabase
          .from('seo_topics')
          .update({
            status: 'failed',
            error: errMsg?.slice(0, 500),
            processed_at: new Date().toISOString(),
          })
          .eq('id', t.id);
        results.push({ topicId: t.id, topic: t.topic, status: 'failed', error: errMsg });
        continue;
      }

      // 4. Marque done + lien vers l'article
      await supabase
        .from('seo_topics')
        .update({
          status: 'done',
          generated_article_id: gen.article.id,
          processed_at: new Date().toISOString(),
          error: null,
        })
        .eq('id', t.id);
      results.push({
        topicId: t.id,
        topic: t.topic,
        status: 'done',
        articleId: gen.article.id,
        costEur: gen.generation.costEur,
      });
    } catch (e: any) {
      console.error('[cron/seo-generate] unexpected error', { topicId: t.id, error: e?.message });
      await supabase
        .from('seo_topics')
        .update({
          status: 'failed',
          error: (e?.message || 'UNEXPECTED').slice(0, 500),
          processed_at: new Date().toISOString(),
        })
        .eq('id', t.id);
      results.push({ topicId: t.id, topic: t.topic, status: 'failed', error: e?.message });
    }
  }

  const totalCost = results.reduce((sum, r) => sum + (r.costEur || 0), 0);
  console.log('[cron/seo-generate] done', {
    processed: results.filter((r) => r.status === 'done').length,
    failed: results.filter((r) => r.status === 'failed').length,
    totalCostEur: totalCost,
  });

  return NextResponse.json({
    ok: true,
    processed: results.filter((r) => r.status === 'done').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    totalCostEur: Math.round(totalCost * 10000) / 10000,
    results,
  });
}
