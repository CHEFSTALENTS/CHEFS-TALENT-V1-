export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const TABLE = 'revenue_entries';
const ALLOWED_CATEGORIES = new Set(['integration', 'formation', 'autre']);
const ALLOWED_VAT = new Set([0, 20]);

function normalizeCategory(v: any): string | null {
  const s = String(v || '').trim().toLowerCase();
  return ALLOWED_CATEGORIES.has(s) ? s : null;
}

function normalizeVat(v: any): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return ALLOWED_VAT.has(i) ? i : null;
}

function normalizeAmountCents(v: any): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= 0 ? i : null;
}

function normalizeDate(v: any): string | null {
  const s = String(v || '').trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = String(params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const patch: Record<string, any> = {};

    if (body?.occurred_at !== undefined) {
      const v = normalizeDate(body.occurred_at);
      if (!v) return NextResponse.json({ error: 'Invalid occurred_at' }, { status: 400 });
      patch.occurred_at = v;
    }
    if (body?.category !== undefined) {
      const v = normalizeCategory(body.category);
      if (!v) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      patch.category = v;
    }
    if (body?.label !== undefined) {
      const v = String(body.label || '').trim();
      if (!v) return NextResponse.json({ error: 'Missing label' }, { status: 400 });
      patch.label = v;
    }
    if (body?.amount_ht_cents !== undefined) {
      const v = normalizeAmountCents(body.amount_ht_cents);
      if (v === null) return NextResponse.json({ error: 'Invalid amount_ht_cents' }, { status: 400 });
      patch.amount_ht_cents = v;
    }
    if (body?.vat_rate !== undefined) {
      const v = normalizeVat(body.vat_rate);
      if (v === null) return NextResponse.json({ error: 'Invalid vat_rate' }, { status: 400 });
      patch.vat_rate = v;
    }
    if (body?.client_name !== undefined) {
      patch.client_name = body.client_name ? String(body.client_name).trim() : null;
    }
    if (body?.chef_id !== undefined) {
      patch.chef_id = body.chef_id ? String(body.chef_id).trim() : null;
    }
    if (body?.invoice_number !== undefined) {
      patch.invoice_number = body.invoice_number ? String(body.invoice_number).trim() : null;
    }
    if (body?.notes !== undefined) {
      patch.notes = body.notes ? String(body.notes).trim() : null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid field to update' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ entry: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'PATCH /api/admin/revenue/entries/[id] failed' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const id = String(params?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'DELETE /api/admin/revenue/entries/[id] failed' },
      { status: 500 },
    );
  }
}
