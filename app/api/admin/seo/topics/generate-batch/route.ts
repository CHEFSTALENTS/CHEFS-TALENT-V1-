// app/api/admin/seo/topics/generate-batch/route.ts
//
// POST /api/admin/seo/topics/generate-batch
// Trigger manuel : demande à Claude N topics et les insère dans le backlog.
//
// Body : { count?: number }   (défaut 15, max 30)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextResponse } from 'next/server';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';
import { generateBacklogTopics } from '@/lib/ai/seoBacklogGenerator';

export async function POST(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // pas de body → défauts
  }

  const requestedCount = Math.min(Math.max(1, Number(body?.count) || 15), 30);

  console.log('[seo/topics/generate-batch] start', {
    count: requestedCount,
    admin: auth.user.email,
  });

  const result = await generateBacklogTopics({
    count: requestedCount,
    adminEmail: auth.user.email,
  });

  if (result.ok !== true) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status || 500 },
    );
  }

  console.log('[seo/topics/generate-batch] done', {
    inserted: result.inserted.length,
    skipped: result.skippedDuplicates,
    costEur: result.generation.costEur,
  });

  return NextResponse.json({
    ok: true,
    insertedCount: result.inserted.length,
    skippedDuplicates: result.skippedDuplicates,
    topics: result.inserted,
    generation: result.generation,
  });
}
