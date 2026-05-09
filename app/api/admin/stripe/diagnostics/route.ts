// app/api/admin/stripe/diagnostics/route.ts
// Inspecte les Price IDs configurés dans les env vars et retourne pour
// chacun la config réelle côté Stripe : montant, type (recurring/one_time),
// interval, status. Permet de vérifier d'un coup d'œil que les abonnements
// vont bien biller mensuellement.
//
// Auth : Supabase Bearer token (admin allowlist).

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Expected =
  | { type: 'recurring'; interval: 'month' }
  | { type: 'one_time' };

const PLANS: {
  envName: string;
  label: string;
  expected: Expected;
  /** Montant attendu en cents (référence du code, à matcher avec Stripe) */
  expectedAmountCents: number;
}[] = [
  {
    envName: 'STRIPE_PRICE_VIP_3M_MONTHLY',
    label: 'VIP 3 mois — mensuel',
    expected: { type: 'recurring', interval: 'month' },
    expectedAmountCents: 5900,
  },
  {
    envName: 'STRIPE_PRICE_VIP_3M_UPFRONT',
    label: 'VIP 3 mois — upfront',
    expected: { type: 'one_time' },
    expectedAmountCents: 17700,
  },
  {
    envName: 'STRIPE_PRICE_VIP_6M_MONTHLY',
    label: 'VIP 6 mois — mensuel',
    expected: { type: 'recurring', interval: 'month' },
    expectedAmountCents: 5500,
  },
  {
    envName: 'STRIPE_PRICE_VIP_6M_UPFRONT',
    label: 'VIP 6 mois — upfront',
    expected: { type: 'one_time' },
    expectedAmountCents: 33000,
  },
  {
    envName: 'STRIPE_PRICE_VIP_12M_MONTHLY',
    label: 'VIP 12 mois — mensuel',
    expected: { type: 'recurring', interval: 'month' },
    expectedAmountCents: 4000,
  },
  {
    envName: 'STRIPE_PRICE_VIP_12M_UPFRONT',
    label: 'VIP 12 mois — upfront',
    expected: { type: 'one_time' },
    expectedAmountCents: 48000,
  },
  {
    envName: 'STRIPE_PRICE_BOOST_1M',
    label: 'Boost 1 mois',
    expected: { type: 'one_time' },
    expectedAmountCents: 11900,
  },
];

type DiagRow = {
  envName: string;
  label: string;
  priceId: string | null;
  expected: Expected;
  expectedAmountCents: number;
  found: boolean;
  status: 'ok' | 'warning' | 'error';
  issues: string[];
  // Données réelles depuis Stripe
  actualAmountCents?: number | null;
  actualCurrency?: string | null;
  actualType?: 'recurring' | 'one_time' | null;
  actualInterval?: string | null;
  actualIntervalCount?: number | null;
  active?: boolean | null;
  productName?: string | null;
  livemode?: boolean | null;
};

async function diagnoseOne(p: (typeof PLANS)[number]): Promise<DiagRow> {
  const priceId = process.env[p.envName] || null;
  const issues: string[] = [];

  if (!priceId) {
    return {
      envName: p.envName,
      label: p.label,
      priceId: null,
      expected: p.expected,
      expectedAmountCents: p.expectedAmountCents,
      found: false,
      status: 'error',
      issues: ['Variable d’environnement manquante côté Vercel.'],
    };
  }

  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

    const actualType: 'recurring' | 'one_time' = price.recurring
      ? 'recurring'
      : 'one_time';
    const actualInterval = price.recurring?.interval || null;
    const actualIntervalCount = price.recurring?.interval_count || null;
    const product = price.product as any;
    const productName =
      product && typeof product === 'object' ? product.name : null;

    // Compare avec les attendus
    if (p.expected.type === 'recurring') {
      if (actualType !== 'recurring') {
        issues.push(
          'Devrait être un abonnement (recurring) mais est en one-time. Les abonnements ne se renouvelleront pas.',
        );
      } else if (actualInterval !== p.expected.interval) {
        issues.push(
          `Interval attendu : ${p.expected.interval}. Actuel : ${actualInterval}.`,
        );
      } else if (actualIntervalCount && actualIntervalCount !== 1) {
        issues.push(
          `Interval count attendu : 1. Actuel : ${actualIntervalCount}.`,
        );
      }
    } else if (p.expected.type === 'one_time') {
      if (actualType !== 'one_time') {
        issues.push(
          'Devrait être un paiement unique (one-time) mais est récurrent. Le client serait facturé chaque mois.',
        );
      }
    }

    if (price.unit_amount !== p.expectedAmountCents) {
      const expectedEur = (p.expectedAmountCents / 100).toFixed(2);
      const actualEur = ((price.unit_amount ?? 0) / 100).toFixed(2);
      issues.push(
        `Montant attendu : ${expectedEur} €. Actuel : ${actualEur} €.`,
      );
    }

    if (!price.active) {
      issues.push('Ce prix est archivé côté Stripe. Les nouveaux achats échoueront.');
    }

    if (price.currency !== 'eur') {
      issues.push(
        `Devise attendue : EUR. Actuelle : ${(price.currency || '').toUpperCase()}.`,
      );
    }

    const status: DiagRow['status'] =
      issues.length === 0 ? 'ok' : issues.some((i) => i.includes('ne se renouvell')) ? 'error' : 'warning';

    return {
      envName: p.envName,
      label: p.label,
      priceId,
      expected: p.expected,
      expectedAmountCents: p.expectedAmountCents,
      found: true,
      status,
      issues,
      actualAmountCents: price.unit_amount ?? null,
      actualCurrency: price.currency,
      actualType,
      actualInterval,
      actualIntervalCount,
      active: price.active,
      productName,
      livemode: price.livemode,
    };
  } catch (err: any) {
    return {
      envName: p.envName,
      label: p.label,
      priceId,
      expected: p.expected,
      expectedAmountCents: p.expectedAmountCents,
      found: false,
      status: 'error',
      issues: [
        `Stripe a refusé le retrieve : ${err?.message || 'erreur inconnue'}. Vérifie que ce Price ID existe dans le bon environnement (test/live).`,
      ],
    };
  }
}

/**
 * Liste les subscriptions actives (active / past_due / trialing) avec
 * leur cancel_at programmé. Permet de détecter d'un coup d'œil les
 * subscriptions sans cancel_at (= billing infini, bug du webhook).
 */
async function listActiveSubscriptions() {
  type SubRow = {
    id: string;
    customerEmail: string;
    customerId: string;
    planLabel: string;
    priceId: string;
    amountCents: number | null;
    interval: string | null;
    status: string;
    createdAt: string;
    currentPeriodEnd: string | null;
    cancelAt: string | null;
    cancelAtDaysFromNow: number | null;
    cancelAtPeriodEnd: boolean;
    hasCancelAt: boolean;
  };

  const rows: SubRow[] = [];
  const now = Date.now();

  for await (const sub of stripe.subscriptions.list({
    status: 'all',
    limit: 100,
    expand: ['data.customer', 'data.items.data.price.product'],
  })) {
    const status = sub.status;
    if (
      status !== 'active' &&
      status !== 'past_due' &&
      status !== 'trialing'
    ) {
      continue;
    }

    const customer = sub.customer as any;
    const customerEmail =
      typeof customer === 'object' && customer && 'email' in customer
        ? String(customer.email || '')
        : '';
    const customerId =
      typeof customer === 'object' && customer && 'id' in customer
        ? String(customer.id)
        : typeof sub.customer === 'string'
          ? sub.customer
          : '';

    // Plan = first item (notre cas n'a qu'un item par sub)
    const item = sub.items.data[0];
    const price = item?.price;
    const product = price?.product as any;
    const planLabel =
      (product && typeof product === 'object' && product.name) ||
      price?.nickname ||
      price?.id ||
      '—';

    const cancelAtUnix = sub.cancel_at;
    const cancelAtIso = cancelAtUnix
      ? new Date(cancelAtUnix * 1000).toISOString()
      : null;
    const daysFromNow = cancelAtUnix
      ? Math.ceil((cancelAtUnix * 1000 - now) / (24 * 3600 * 1000))
      : null;

    rows.push({
      id: sub.id,
      customerEmail,
      customerId,
      planLabel,
      priceId: price?.id || '',
      amountCents: price?.unit_amount ?? null,
      interval: price?.recurring?.interval ?? null,
      status,
      createdAt: new Date(sub.created * 1000).toISOString(),
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancelAt: cancelAtIso,
      cancelAtDaysFromNow: daysFromNow,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      hasCancelAt: !!cancelAtUnix,
    });
  }

  // Tri par cancel_at ascendant (les plus urgents en premier),
  // puis ceux sans cancel_at à la fin (à corriger).
  rows.sort((a, b) => {
    if (a.cancelAt && b.cancelAt) return a.cancelAt.localeCompare(b.cancelAt);
    if (a.cancelAt) return -1;
    if (b.cancelAt) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return rows;
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const [rows, subscriptions] = await Promise.all([
      Promise.all(PLANS.map(diagnoseOne)),
      listActiveSubscriptions().catch((e) => {
        console.error('[stripe/diagnostics] subscriptions list', e?.message);
        return [] as Awaited<ReturnType<typeof listActiveSubscriptions>>;
      }),
    ]);

    const summary = {
      total: rows.length,
      ok: rows.filter((r) => r.status === 'ok').length,
      warning: rows.filter((r) => r.status === 'warning').length,
      error: rows.filter((r) => r.status === 'error').length,
    };
    const livemode = rows.find((r) => r.livemode != null)?.livemode ?? null;

    const subsSummary = {
      total: subscriptions.length,
      withCancelAt: subscriptions.filter((s) => s.hasCancelAt).length,
      withoutCancelAt: subscriptions.filter((s) => !s.hasCancelAt).length,
    };

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      livemode,
      summary,
      rows,
      subscriptions,
      subsSummary,
    });
  } catch (e: any) {
    console.error('[admin/stripe/diagnostics] error', e?.message);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
