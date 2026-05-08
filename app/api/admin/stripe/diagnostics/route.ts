// app/api/admin/stripe/diagnostics/route.ts
// Inspecte les Price IDs configurés dans les env vars et retourne pour
// chacun la config réelle côté Stripe : montant, type (recurring/one_time),
// interval, status. Permet de vérifier d'un coup d'œil que les abonnements
// vont bien biller mensuellement.
//
// Auth : x-admin-email

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

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

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const rows = await Promise.all(PLANS.map(diagnoseOne));
    const summary = {
      total: rows.length,
      ok: rows.filter((r) => r.status === 'ok').length,
      warning: rows.filter((r) => r.status === 'warning').length,
      error: rows.filter((r) => r.status === 'error').length,
    };
    const livemode = rows.find((r) => r.livemode != null)?.livemode ?? null;

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      livemode,
      summary,
      rows,
    });
  } catch (e: any) {
    console.error('[admin/stripe/diagnostics] error', e?.message);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
