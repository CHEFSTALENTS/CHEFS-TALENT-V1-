// app/api/cron/seo-backlog-refill/route.ts
//
// Cron Vercel quotidien : auto-refill du backlog seo_topics quand il descend
// sous un seuil. Empêche le cron de génération (seo-generate, 2x/jour) de
// tourner à vide.
//
// Logique :
//   1. Compte les topics en status='pending'
//   2. Si < TARGET_PENDING, demande à Claude (TARGET_PENDING - current) nouveaux topics
//   3. Insère
//
// Schedule défini dans vercel.json (1x/jour).
// Auth : Authorization: Bearer ${CRON_SECRET}.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateBacklogTopics } from '@/lib/ai/seoBacklogGenerator';

const TARGET_PENDING = 14;   // on vise à toujours avoir au moins 14 topics en attente (≈ 1 semaine de cron 2/jour)
const MAX_GEN_BATCH = 20;    // ne jamais demander plus de 20 topics en un coup

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: Request) {
  // Auth
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron/seo-backlog-refill] CRON_SECRET missing');
    return NextResponse.json({ error: 'CRON_SECRET_NOT_CONFIGURED' }, { status: 500 });
  }
  if ((req.headers.get('authorization') || '') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const supabase = getSupabase();

  // 1. Compte les topics pending
  const { count, error: countErr } = await supabase
    .from('seo_topics')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (countErr) {
    console.error('[cron/seo-backlog-refill] count error', countErr);
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  const pendingCount = count || 0;

  // 2. Décide combien générer
  if (pendingCount >= TARGET_PENDING) {
    console.log('[cron/seo-backlog-refill] backlog OK', { pending: pendingCount, target: TARGET_PENDING });
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'backlog_sufficient',
      pending: pendingCount,
      target: TARGET_PENDING,
    });
  }

  const toGenerate = Math.min(MAX_GEN_BATCH, TARGET_PENDING - pendingCount + 3); // +3 marge

  console.log('[cron/seo-backlog-refill] refilling', {
    pending: pendingCount,
    target: TARGET_PENDING,
    toGenerate,
  });

  const result = await generateBacklogTopics({
    count: toGenerate,
    adminEmail: 'cron@chefstalents.com',
  });

  if (result.ok !== true) {
    console.error('[cron/seo-backlog-refill] gen failed', result.error);
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status || 500 });
  }

  console.log('[cron/seo-backlog-refill] done', {
    requested: toGenerate,
    inserted: result.inserted.length,
    skipped: result.skippedDuplicates,
    costEur: result.generation.costEur,
  });

  return NextResponse.json({
    ok: true,
    requestedCount: toGenerate,
    insertedCount: result.inserted.length,
    skippedDuplicates: result.skippedDuplicates,
    pendingBefore: pendingCount,
    target: TARGET_PENDING,
    costEur: result.generation.costEur,
  });
}
