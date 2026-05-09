// app/api/admin/newsletter/recipients/route.ts
// GET → renvoie la liste complète des destinataires d'un broadcast.
// Auth : Supabase Bearer token (admin allowlist).
//
// Le front utilise cette route pour récupérer la liste, puis itère
// localement en appelant POST /api/admin/newsletter { single: ... }
// pour chaque destinataire avec un throttling propre. Cela évite le
// timeout serverless Vercel (10s sur Hobby) qui survient quand on tente
// d'envoyer >50 emails dans une seule requête.

import { NextResponse } from 'next/server';
import {
  listChefsByStatus,
  type ChefStatus,
} from '@/lib/email/listChefsByStatus';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: ChefStatus[] = ['pending_validation', 'approved', 'active', 'paused'];

function parseSegments(raw: string | null): ChefStatus[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ChefStatus => (VALID as string[]).includes(s));
}

function parseExclude(raw: string | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;\n]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.includes('@')),
  );
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const segments = parseSegments(url.searchParams.get('segments'));
    const exclude = parseExclude(url.searchParams.get('exclude'));

    if (segments.length === 0) {
      return NextResponse.json({
        ok: true,
        total: 0,
        excluded: 0,
        recipients: [],
      });
    }

    const all = await listChefsByStatus(segments);
    const recipients = all.filter((r) => !exclude.has(r.email.toLowerCase()));

    return NextResponse.json({
      ok: true,
      total: recipients.length,
      excluded: all.length - recipients.length,
      recipients: recipients.map((r) => ({
        email: r.email,
        firstName: r.firstName || null,
        locale: r.locale || 'fr',
      })),
    });
  } catch (e: any) {
    console.error('[admin/newsletter/recipients GET] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
