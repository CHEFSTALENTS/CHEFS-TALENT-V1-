// app/api/admin/revenue/route.ts
// Calcule le CA admin à partir de Stripe (abonnements VIP + boost upfront)
// et Supabase (missions confirmées).
//
// GET /api/admin/revenue → renvoie un breakdown complet.
// Auth : x-admin-email

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfYear(d = new Date()): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

/** Calcule le MRR depuis Stripe (abonnements actifs). En cents → euros. */
async function computeStripeMrr(): Promise<{
  mrrEur: number;
  activeCount: number;
}> {
  let activeCount = 0;
  let mrrCents = 0;

  // Iterate via auto-pagination, max 100 par page.
  for await (const sub of stripe.subscriptions.list({
    status: 'active',
    limit: 100,
    expand: ['data.items.data.price'],
  })) {
    activeCount++;
    for (const item of sub.items.data) {
      const price = item.price;
      const amount = price.unit_amount ?? 0; // cents
      const interval = price.recurring?.interval; // 'month' | 'year' | 'week' | 'day'
      const intervalCount = price.recurring?.interval_count ?? 1;
      const qty = item.quantity ?? 1;

      // Normalise tout en MRR.
      let monthlyAmount = 0;
      if (interval === 'month') {
        monthlyAmount = (amount * qty) / Math.max(1, intervalCount);
      } else if (interval === 'year') {
        monthlyAmount = (amount * qty) / (12 * Math.max(1, intervalCount));
      } else if (interval === 'week') {
        monthlyAmount = (amount * qty * 4.345) / Math.max(1, intervalCount);
      } else if (interval === 'day') {
        monthlyAmount = (amount * qty * 30) / Math.max(1, intervalCount);
      } else {
        monthlyAmount = amount * qty;
      }
      mrrCents += monthlyAmount;
    }
  }

  return { mrrEur: Math.round(mrrCents) / 100, activeCount };
}

/**
 * Somme les charges Stripe (paiements réels encaissés) sur une fenêtre.
 * Utilise charges.list avec created.gte. Limit 100/page, paginé.
 */
async function sumStripeCharges(sinceMs: number): Promise<{
  totalEur: number;
  count: number;
}> {
  const since = Math.floor(sinceMs / 1000);
  let totalCents = 0;
  let count = 0;

  for await (const charge of stripe.charges.list({
    limit: 100,
    created: { gte: since },
  })) {
    if (charge.status !== 'succeeded') continue;
    if (charge.refunded) continue;
    // Charge.amount est en cents. On retire le refunded amount au cas où.
    const net = (charge.amount ?? 0) - (charge.amount_refunded ?? 0);
    if (net <= 0) continue;
    totalCents += net;
    count++;
  }

  return { totalEur: Math.round(totalCents) / 100, count };
}

/**
 * Somme les commissions des missions confirmed sur une fenêtre, depuis Supabase.
 * On compte les missions dont confirmed_at >= sinceISO et status='confirmed'.
 */
async function sumMissionsCommission(sinceIso: string): Promise<{
  commissionEur: number;
  count: number;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('missions')
    .select('commission_amount, confirmed_at, status')
    .gte('confirmed_at', sinceIso)
    .eq('status', 'confirmed')
    .limit(2000);

  if (error) {
    console.error('[admin/revenue] missions read', error);
    return { commissionEur: 0, count: 0 };
  }

  let commission = 0;
  let count = 0;
  for (const row of data ?? []) {
    const v = Number(row.commission_amount || 0);
    if (Number.isFinite(v) && v > 0) commission += v;
    count++;
  }
  return { commissionEur: Math.round(commission * 100) / 100, count };
}

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const monthStartMs = startOfMonth().getTime();
  const yearStartMs = startOfYear().getTime();

  try {
    const [mrr, chargesMonth, chargesYtd, missionsMonth, missionsYtd] =
      await Promise.all([
        computeStripeMrr(),
        sumStripeCharges(monthStartMs),
        sumStripeCharges(yearStartMs),
        sumMissionsCommission(new Date(monthStartMs).toISOString()),
        sumMissionsCommission(new Date(yearStartMs).toISOString()),
      ]);

    const totalMonth = chargesMonth.totalEur + missionsMonth.commissionEur;
    const totalYtd = chargesYtd.totalEur + missionsYtd.commissionEur;

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      stripe: {
        mrrEur: mrr.mrrEur,
        activeSubscriptions: mrr.activeCount,
        chargesMonthEur: chargesMonth.totalEur,
        chargesMonthCount: chargesMonth.count,
        chargesYtdEur: chargesYtd.totalEur,
        chargesYtdCount: chargesYtd.count,
      },
      missions: {
        confirmedMonth: missionsMonth.count,
        commissionMonthEur: missionsMonth.commissionEur,
        confirmedYtd: missionsYtd.count,
        commissionYtdEur: missionsYtd.commissionEur,
      },
      totals: {
        monthEur: Math.round(totalMonth * 100) / 100,
        ytdEur: Math.round(totalYtd * 100) / 100,
      },
    });
  } catch (e: any) {
    console.error('[admin/revenue] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
