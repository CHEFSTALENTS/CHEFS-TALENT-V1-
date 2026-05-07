import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  CHEF_PLANS,
  computeBoostedUntil,
  computeCancelAt,
  computePlanEndsAt,
  isPlanKey,
  type PlanKey,
} from '@/lib/chef-plans';

// Stripe webhooks need raw body access — Next 14 App Router supports this via req.text()
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Merge un patch dans chef_profiles.profile (preserve les autres champs JSON).
 */
async function patchProfile(userId: string, patch: Record<string, any>) {
  const admin = getSupabaseAdmin();

  const { data: existing, error: readErr } = await admin
    .from('chef_profiles')
    .select('user_id, profile')
    .eq('user_id', userId)
    .maybeSingle();

  if (readErr) {
    console.error('[webhook] read profile error', readErr);
    throw readErr;
  }

  const current =
    (existing?.profile && typeof existing.profile === 'object'
      ? existing.profile
      : {}) ?? {};

  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const { error: writeErr } = await admin
    .from('chef_profiles')
    .upsert({ user_id: userId, profile: next }, { onConflict: 'user_id' });

  if (writeErr) {
    console.error('[webhook] upsert profile error', writeErr);
    throw writeErr;
  }
}

/**
 * POST /api/stripe/webhook
 * Stripe webhook handler. À configurer dans Stripe Dashboard pour les events :
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed (optionnel)
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  if (!WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'WEBHOOK_NOT_CONFIGURED' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (e: any) {
    console.error('[stripe-webhook] signature failed', e?.message);
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        const userId = meta.userId;
        const planKeyRaw = meta.planKey;
        const paymentMode = meta.paymentMode as 'monthly' | 'upfront' | undefined;

        if (!userId || !isPlanKey(planKeyRaw)) {
          console.warn('[webhook] missing or invalid metadata', { userId, planKey: planKeyRaw });
          break;
        }
        const planKey = planKeyRaw as PlanKey;

        const stripeCustomerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;
        const stripeSubscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (planKey === 'boost_1m') {
          // Boost activation : 30 jours de visibilité
          await patchProfile(userId, {
            boostedUntil: computeBoostedUntil(),
            stripeCustomerId,
          });
        } else {
          // VIP activation
          const months = CHEF_PLANS[planKey].months;

          // Applique l'engagement via cancel_at sur la subscription Stripe
          // (n'est pas accepté à la création du Checkout Session).
          if (stripeSubscriptionId && paymentMode === 'monthly') {
            try {
              await stripe.subscriptions.update(stripeSubscriptionId, {
                cancel_at: computeCancelAt(months),
              });
            } catch (e: any) {
              console.error('[webhook] failed to apply cancel_at on subscription', e?.message);
              // On n'arrête pas le flow : l'engagement sera enforced côté UI/business
            }
          }

          await patchProfile(userId, {
            plan: 'pro',
            planStatus: 'active',
            planKey,
            paymentMode,
            planEndsAt: computePlanEndsAt(months),
            stripeCustomerId,
            ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const status = sub.status; // active, past_due, canceled, unpaid, etc.
        const planStatus =
          status === 'active' || status === 'trialing'
            ? 'active'
            : status === 'past_due' || status === 'unpaid'
              ? 'past_due'
              : 'cancelled';

        const patch: Record<string, any> = { planStatus };
        if (sub.cancel_at) {
          patch.planEndsAt = new Date(sub.cancel_at * 1000).toISOString();
        }

        await patchProfile(userId, patch);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await patchProfile(userId, {
          plan: 'free',
          planStatus: 'cancelled',
          planEndsAt: new Date().toISOString(),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!subId) break;
        // Récupère le metadata.userId via la subscription
        const sub = await stripe.subscriptions.retrieve(subId);
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await patchProfile(userId, { planStatus: 'past_due' });
        break;
      }

      default:
        // Pas d'action pour les autres events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[stripe-webhook] processing error', e);
    return NextResponse.json(
      { error: 'PROCESSING_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
