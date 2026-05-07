import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

/**
 * POST /api/chef/billing-portal
 * Auth: Bearer token Supabase
 *
 * Crée une Stripe Billing Portal Session pour gérer l'abonnement
 * (changer plan, annuler, voir factures, mettre à jour la carte).
 */
export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    const userId = data.user.id;

    const { data: existing } = await admin
      .from('chef_profiles')
      .select('profile')
      .eq('user_id', userId)
      .maybeSingle();

    const customerId = (existing?.profile as any)?.stripeCustomerId as string | undefined;

    if (!customerId) {
      return NextResponse.json(
        {
          error: 'NO_STRIPE_CUSTOMER',
          detail:
            'Aucun customer Stripe associé. Le chef doit d\'abord effectuer un paiement.',
        },
        { status: 400 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/chef/vip`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('[billing-portal] error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
