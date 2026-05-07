import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  CHEF_PLANS,
  getPriceId,
  getStripeMode,
  isPaymentMode,
  isPlanKey,
  type PaymentMode,
  type PlanKey,
} from '@/lib/chef-plans';

export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

/**
 * POST /api/chef/create-checkout
 * Body: { planKey: 'vip_3m'|'vip_6m'|'vip_12m'|'boost_1m', mode: 'monthly'|'upfront' }
 * Auth: Bearer token Supabase (header Authorization)
 *
 * Crée une Stripe Checkout Session et retourne l'URL de redirection.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const planKey = body?.planKey;
    const mode = (body?.mode || 'upfront') as PaymentMode;

    if (!isPlanKey(planKey)) {
      return NextResponse.json(
        { error: 'INVALID_PLAN', detail: 'planKey must be vip_3m | vip_6m | vip_12m | boost_1m' },
        { status: 400 },
      );
    }
    if (!isPaymentMode(mode)) {
      return NextResponse.json(
        { error: 'INVALID_MODE', detail: 'mode must be monthly | upfront' },
        { status: 400 },
      );
    }
    // Boost = upfront uniquement
    if (planKey === 'boost_1m' && mode !== 'upfront') {
      return NextResponse.json(
        { error: 'INVALID_MODE_FOR_BOOST', detail: 'Boost is upfront-only' },
        { status: 400 },
      );
    }

    // Auth
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    const user = userData.user;

    // Récupère le profil pour reuse stripeCustomerId si existant
    const { data: existing } = await admin
      .from('chef_profiles')
      .select('profile')
      .eq('user_id', user.id)
      .maybeSingle();
    const stripeCustomerId =
      ((existing?.profile as any)?.stripeCustomerId as string | undefined) || undefined;

    // Config plan
    const priceId = getPriceId(planKey, mode);
    const stripeMode = getStripeMode(planKey, mode);

    if (!priceId || !stripeMode) {
      return NextResponse.json(
        {
          error: 'PRICE_NOT_CONFIGURED',
          detail: `Variable d'env manquante pour ${planKey}/${mode}`,
        },
        { status: 500 },
      );
    }

    // Build session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: stripeMode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/chef/vip?paid=1`,
      cancel_url: `${SITE_URL}/chef/upgrade?cancelled=1`,
      metadata: {
        userId: user.id,
        planKey,
        paymentMode: mode,
      },
      locale: 'auto',
      allow_promotion_codes: true,
    };

    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId;
    } else if (user.email) {
      sessionConfig.customer_email = user.email;
      // Force customer creation pour les paiements one-time (afin que Billing Portal fonctionne plus tard)
      if (stripeMode === 'payment') {
        sessionConfig.customer_creation = 'always';
      }
    }

    if (stripeMode === 'subscription') {
      // Note : `cancel_at` n'est pas accepté ici par le type Stripe Checkout.
      // L'engagement est appliqué au webhook (checkout.session.completed) via
      // stripe.subscriptions.update(id, { cancel_at }).
      sessionConfig.subscription_data = {
        metadata: {
          userId: user.id,
          planKey,
          paymentMode: mode,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('[create-checkout] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
