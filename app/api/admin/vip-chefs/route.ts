// app/api/admin/vip-chefs/route.ts
// Liste les chefs VIP (plan='pro') depuis Supabase pour la vue admin VIP.
// Inclut les chefs payants (Stripe) et complimentary (offerts).
// Auth : x-admin-email

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

function safeObj(v: any): any {
  if (!v) return {};
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  if (typeof v === 'object') return v;
  return {};
}

function normalizeProfile(raw: any): any {
  const p = safeObj(raw);
  return safeObj(p.profile || p.data || p.user || p);
}

export type AdminVipChef = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  planStatus: string;
  planKey?: string;
  paymentMode?: string;
  planEndsAt?: string | null;
  complimentary: boolean;
  complimentaryGrantedAt?: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  daysLeft: number | null;
  createdAt?: string | null;
};

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('chef_profiles')
      .select('user_id, email, profile, created_at')
      .limit(5000);

    if (error) {
      console.error('[admin/vip-chefs] read error', error);
      return NextResponse.json(
        { error: 'READ_FAIL', detail: error.message },
        { status: 500 },
      );
    }

    const now = Date.now();
    const result: AdminVipChef[] = [];

    for (const row of data ?? []) {
      const profile = normalizeProfile(row.profile);
      const plan = String(profile.plan || '').toLowerCase();

      // Filtre : on ne veut que les chefs VIP (pro). Inclut active, past_due,
      // cancelled (pour suivre les expirations). Exclut 'free'.
      if (plan !== 'pro') continue;

      const planEndsAt = profile.planEndsAt
        ? String(profile.planEndsAt)
        : null;
      const endsAtMs = planEndsAt ? new Date(planEndsAt).getTime() : NaN;
      const daysLeft = Number.isFinite(endsAtMs)
        ? Math.ceil((endsAtMs - now) / (24 * 3600 * 1000))
        : null;

      result.push({
        userId: row.user_id,
        email: String(row.email || profile.email || '').trim().toLowerCase(),
        firstName: String(profile.firstName || '').trim(),
        lastName: String(profile.lastName || '').trim(),
        plan,
        planStatus: String(profile.planStatus || '').toLowerCase(),
        planKey: profile.planKey || undefined,
        paymentMode: profile.paymentMode || undefined,
        planEndsAt,
        complimentary: profile.complimentary === true,
        complimentaryGrantedAt: profile.complimentaryGrantedAt || null,
        stripeCustomerId: profile.stripeCustomerId || undefined,
        stripeSubscriptionId: profile.stripeSubscriptionId || undefined,
        daysLeft,
        createdAt: row.created_at || profile.createdAt || null,
      });
    }

    // Tri par défaut : ceux qui expirent le plus tôt en premier.
    result.sort((a, b) => {
      const da = a.planEndsAt
        ? new Date(a.planEndsAt).getTime()
        : Number.POSITIVE_INFINITY;
      const db = b.planEndsAt
        ? new Date(b.planEndsAt).getTime()
        : Number.POSITIVE_INFINITY;
      return da - db;
    });

    // Breakdown utile pour la UI.
    const breakdown = {
      total: result.length,
      paid: result.filter((c) => !c.complimentary).length,
      complimentary: result.filter((c) => c.complimentary).length,
      activePlan: result.filter((c) => c.planStatus === 'active').length,
      pastDue: result.filter((c) => c.planStatus === 'past_due').length,
      cancelled: result.filter((c) => c.planStatus === 'cancelled').length,
      expiringSoon: result.filter(
        (c) => c.daysLeft != null && c.daysLeft <= 30 && c.daysLeft >= 0,
      ).length,
    };

    return NextResponse.json({
      ok: true,
      chefs: result,
      breakdown,
    });
  } catch (e: any) {
    console.error('[admin/vip-chefs] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
