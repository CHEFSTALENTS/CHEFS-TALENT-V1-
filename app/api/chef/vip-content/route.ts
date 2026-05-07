import { NextResponse } from 'next/server';
import { getVipContent } from '@/lib/vip-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/chef/vip-content
 * Public (lecture du contenu VIP affiché sur /chef/vip).
 * → { content: VipContent }
 */
export async function GET() {
  try {
    const content = await getVipContent();
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
