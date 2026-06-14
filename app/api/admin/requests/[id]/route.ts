export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = decodeURIComponent((await ctx.params).id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('client_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[api/admin/requests/:id] supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found', id }, { status: 404 });
    }

    return NextResponse.json(
      { item: data },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('[api/admin/requests/:id] server error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// PUT /api/admin/requests/[id]
// Update partiel d'une demande client. Principalement utilisé pour
// changer le status (workflow : new → in_review → assigned/closed).
// Body : { status?, notes?, ... }
// =============================================================
const ALLOWED_STATUSES = new Set([
  'new',
  'in_review',
  'pitched',
  'assigned',
  'closed',
  'declined',
]);

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = decodeURIComponent((await ctx.params).id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};

    if (body.status !== undefined) {
      const s = String(body.status).toLowerCase();
      if (!ALLOWED_STATUSES.has(s)) {
        return NextResponse.json(
          { error: `Invalid status: ${s}` },
          { status: 400 },
        );
      }
      patch.status = s;
    }

    // Champs éditables (l'admin peut compléter une demande créée
    // manuellement avec des infos reçues plus tard)
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.message !== undefined) patch.message = body.message;
    if (body.location !== undefined) patch.location = body.location;
    if (body.guestCount !== undefined) patch.guest_count = body.guestCount;
    if (body.startDate !== undefined) patch.start_date = body.startDate || null;
    if (body.endDate !== undefined) patch.end_date = body.endDate || null;
    if (body.budgetAmount !== undefined) patch.budget_amount = body.budgetAmount;
    if (body.budgetUnit !== undefined) patch.budget_unit = body.budgetUnit;
    if (body.budgetRange !== undefined) patch.budget_range = body.budgetRange;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'No editable field provided' },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from('client_requests')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[api/admin/requests/:id] PUT error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    console.error('[api/admin/requests/:id] PUT fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
