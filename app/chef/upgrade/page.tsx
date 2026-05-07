'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Marker, Label, Button } from '../../../components/ui';
import { Crown, Sparkles, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { format } from '@/lib/chef-i18n';
import { CHEF_PLANS, type PlanKey, type PaymentMode } from '@/lib/chef-plans';

type ChefProfile = {
  plan?: 'free' | 'pro';
  planStatus?: string;
  [key: string]: any;
};

const VIP_PLAN_KEYS: Array<Extract<PlanKey, 'vip_3m' | 'vip_6m' | 'vip_12m'>> = [
  'vip_3m',
  'vip_6m',
  'vip_12m',
];

// Discount % vs the 3m monthly rate (59 €/mois)
const REFERENCE_MONTHLY_CENTS = 5900;

function discountPct(monthlyCents: number): number {
  if (monthlyCents >= REFERENCE_MONTHLY_CENTS) return 0;
  return Math.round((1 - monthlyCents / REFERENCE_MONTHLY_CENTS) * 100);
}

export default function ChefUpgradePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useChefLocale();

  const [booting, setBooting] = useState(true);
  const [sbUserId, setSbUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ChefProfile | null>(null);
  const [mode, setMode] = useState<PaymentMode>('upfront');
  const [submitting, setSubmitting] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelledFlag = params?.get('cancelled') === '1';

  // Auth + load profile
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      const u = data.session?.user ?? null;
      if (!u) {
        router.replace('/chef/login');
        return;
      }
      setSbUserId(u.id);

      try {
        const res = await fetch(
          `/api/chef/profile?id=${encodeURIComponent(u.id)}`,
          { cache: 'no-store' },
        );
        const json = await res.json();
        if (alive) setProfile(json?.profile ?? null);
      } catch {
        /* ignore */
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const isVipActive =
    profile?.plan === 'pro' && profile?.planStatus === 'active';

  const startCheckout = async (planKey: PlanKey) => {
    setError(null);
    setSubmitting(planKey);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setError(t.upgrade.loginRequired);
        setSubmitting(null);
        return;
      }

      // Boost = upfront only; VIP plans use selected mode
      const checkoutMode: PaymentMode =
        planKey === 'boost_1m' ? 'upfront' : mode;

      const res = await fetch('/api/chef/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planKey, mode: checkoutMode }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.url) {
        throw new Error(json?.detail || json?.error || 'Stripe error');
      }

      window.location.href = json.url;
    } catch (e: any) {
      console.error('[upgrade] checkout error', e);
      setError(t.upgrade.stripeError);
      setSubmitting(null);
    }
  };

  if (booting) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div>
        <Marker />
        <Label>{t.upgrade.pageLabel}</Label>
        <h1 className="text-3xl md:text-4xl font-serif text-stone-900">
          {t.upgrade.pageTitle}
        </h1>
        <p className="text-stone-500 mt-3 max-w-2xl">{t.upgrade.subtitle}</p>
      </div>

      {/* Already VIP banner */}
      {isVipActive && (
        <div className="border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm text-amber-900">
            {t.upgrade.alreadyVipBanner}
          </div>
          <Link
            href="/chef/vip"
            className="text-xs text-amber-800 underline whitespace-nowrap"
          >
            {t.vip.manageSubscriptionCta}
          </Link>
        </div>
      )}

      {/* Cancelled banner */}
      {cancelledFlag && (
        <div className="border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          {t.upgrade.cancelledBanner}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          role="group"
          aria-label="Payment mode"
          className="inline-flex items-center rounded-full border border-stone-200 bg-white overflow-hidden text-sm"
        >
          <button
            type="button"
            onClick={() => setMode('monthly')}
            aria-pressed={mode === 'monthly'}
            className={`px-5 py-2 font-medium transition-colors ${
              mode === 'monthly'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            {t.upgrade.monthlyToggle}
          </button>
          <button
            type="button"
            onClick={() => setMode('upfront')}
            aria-pressed={mode === 'upfront'}
            className={`px-5 py-2 font-medium transition-colors ${
              mode === 'upfront'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            {t.upgrade.upfrontToggle}
          </button>
        </div>
        <div className="text-xs text-stone-500">
          {mode === 'monthly' ? t.upgrade.monthlyHint : t.upgrade.upfrontHint}
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {VIP_PLAN_KEYS.map((planKey) => {
          const plan = CHEF_PLANS[planKey];
          const variant = plan.variants[mode] ?? plan.variants.upfront;
          if (!variant) return null;

          const monthlyCents = plan.variants.monthly?.amount ?? 0;
          const totalCents = plan.variants.upfront?.amount ?? 0;
          const monthlyEur = Math.round(monthlyCents / 100);
          const totalEur = Math.round(totalCents / 100);
          const off = discountPct(monthlyCents);
          const isBest = planKey === 'vip_12m';
          const planMeta = t.upgrade.plans[planKey];

          return (
            <div
              key={planKey}
              className={`relative border bg-white p-6 flex flex-col ${
                isBest
                  ? 'border-stone-900 shadow-lg ring-1 ring-stone-900'
                  : 'border-stone-200'
              }`}
            >
              {isBest && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-stone-900 text-white">
                  {t.upgrade.bestValueBadge}
                </span>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-stone-500">
                  {planMeta.commitmentLabel}
                </span>
                {off > 0 && (
                  <span className="text-[10px] uppercase tracking-widest font-bold text-amber-700 border border-amber-300 px-2 py-0.5">
                    {format(t.upgrade.discountBadge, { n: off })}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-serif text-stone-900 mt-3">
                {planMeta.name}
              </h2>

              <div className="mt-4 mb-2">
                <div className="text-4xl font-serif text-stone-900">
                  {monthlyEur}
                  <span className="text-sm text-stone-500 font-sans ml-1">
                    {t.upgrade.perMonth}
                  </span>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {format(t.upgrade.totalLabel, { amount: totalEur })}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => startCheckout(planKey)}
                disabled={submitting !== null}
                className={`w-full mt-auto ${
                  isBest
                    ? 'bg-stone-900 hover:bg-stone-800'
                    : 'bg-white border border-stone-900 text-stone-900 hover:bg-stone-50'
                }`}
              >
                {submitting === planKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t.upgrade.submitCta
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Benefits */}
      <div className="border border-stone-200 bg-stone-50/50 p-6 md:p-8 space-y-4">
        <h3 className="text-lg font-serif text-stone-900">
          {t.upgrade.benefitsTitle}
        </h3>
        <ul className="space-y-3">
          {t.upgrade.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
              <CheckCircle2 className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Boost — separate */}
      <div className="border border-stone-200 bg-white p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-stone-700" />
          <Label className="mb-0">{t.upgrade.boostSectionLabel}</Label>
        </div>
        <h3 className="text-xl font-serif text-stone-900">
          {t.upgrade.boostSectionTitle}
        </h3>
        <p className="text-sm text-stone-500 max-w-2xl">
          {t.upgrade.boostSectionDesc}
        </p>
        <Button
          type="button"
          onClick={() => startCheckout('boost_1m')}
          disabled={submitting !== null}
          className="bg-stone-900 hover:bg-stone-800"
        >
          {submitting === 'boost_1m' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {t.upgrade.boostCta}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
