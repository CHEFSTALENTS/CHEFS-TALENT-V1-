import { NextResponse } from 'next/server';
import { getVipContent, setVipContent } from '@/lib/vip-content';

export const runtime = 'nodejs';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

/**
 * GET /api/admin/vip-content
 * → { content: VipContent }
 */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

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

/**
 * PUT /api/admin/vip-content
 * Body: { content: VipContent }
 * → { content: VipContent } (sanitisé)
 */
export async function PUT(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }

    const content = await setVipContent(body.content ?? body);
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
