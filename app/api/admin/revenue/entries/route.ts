export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const TABLE = 'revenue_entries';
const ALLOWED_CATEGORIES = new Set(['integration', 'formation', 'autre']);
const ALLOWED_VAT = new Set([0, 20]);

function normalizeCategory(v: any): string {
  const s = String(v || '').trim().toLowerCase();
  return ALLOWED_CATEGORIES.has(s) ? s : '';
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
  // Accepts YYYY-MM-DD or any ISO string; we keep just the date part.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const from = normalizeDate(searchParams.get('from'));
    const to = normalizeDate(searchParams.get('to'));
    const category = normalizeCategory(searchParams.get('category'));

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(500);

    if (from) query = query.gte('occurred_at', from);
    if (to) query = query.lte('occurred_at', to);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entries: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'GET /api/admin/revenue/entries failed' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));

    const occurred_at = normalizeDate(body?.occurred_at);
    const category = normalizeCategory(body?.category);
    const label = String(body?.label || '').trim();
    const amount_ht_cents = normalizeAmountCents(body?.amount_ht_cents);
    const vat_rate = normalizeVat(body?.vat_rate ?? 20);

    if (!occurred_at) return NextResponse.json({ error: 'Invalid occurred_at' }, { status: 400 });
    if (!category) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    if (!label) return NextResponse.json({ error: 'Missing label' }, { status: 400 });
    if (amount_ht_cents === null) return NextResponse.json({ error: 'Invalid amount_ht_cents' }, { status: 400 });
    if (vat_rate === null) return NextResponse.json({ error: 'Invalid vat_rate (0 or 20 only)' }, { status: 400 });

    const row = {
      occurred_at,
      category,
      label,
      client_name: body?.client_name ? String(body.client_name).trim() : null,
      chef_id: body?.chef_id ? String(body.chef_id).trim() : null,
      amount_ht_cents,
      vat_rate,
      invoice_number: body?.invoice_number ? String(body.invoice_number).trim() : null,
      notes: body?.notes ? String(body.notes).trim() : null,
    };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(TABLE).insert(row).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entry: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'POST /api/admin/revenue/entries failed' },
      { status: 500 },
    );
  }
}
