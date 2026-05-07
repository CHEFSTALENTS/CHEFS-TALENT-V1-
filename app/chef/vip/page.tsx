'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Marker, Label, Button } from '../../../components/ui';
import {
  Crown,
  MessageCircle,
  BookOpen,
  Phone,
  BarChart3,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { format } from '@/lib/chef-i18n';
import { CHEF_PLANS, type PlanKey } from '@/lib/chef-plans';

type ChefProfile = {
  plan?: 'free' | 'pro';
  planStatus?: 'active' | 'past_due' | 'cancelled' | string;
  planKey?: PlanKey;
  paymentMode?: 'monthly' | 'upfront';
  planEndsAt?: string;
  stripeCustomerId?: string;
  [key: string]: any;
};

const CALENDLY_URL = 'https://calendly.com/contact-chefstalents/30min';
const PRIVATE_GROUP_URL = ''; // Sera fourni par email après souscription (sécurité)

export default function ChefVipPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useChefLocale();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<ChefProfile | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const paidFlag = params?.get('paid') === '1';

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
      setSbUser(u);

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

  const openBillingPortal = async () => {
    setPortalError(null);
    setPortalLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        router.replace('/chef/login');
        return;
      }

      const res = await fetch('/api/chef/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.url) {
        throw new Error(json?.detail || json?.error || 'Portal error');
      }
      window.location.href = json.url;
    } catch (e: any) {
      console.error('[vip] portal error', e);
      setPortalError(e?.message || 'Error');
      setPortalLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    );
  }

  const isVipActive =
    profile?.plan === 'pro' && profile?.planStatus === 'active';
  const isPastDue = profile?.planStatus === 'past_due';
  const isCancelled =
    profile?.plan === 'pro' && profile?.planStatus === 'cancelled';

  // Non-VIP : teaser + redirect CTA
  if (!isVipActive && !isPastDue && !isCancelled) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
        <div>
          <Marker />
          <Label>{t.vip.pageLabel}</Label>
          <h1 className="text-3xl font-serif text-stone-900">
            {t.vip.pageTitle}
          </h1>
        </div>

        <div className="border border-stone-200 bg-white p-8 md:p-12 text-center">
          <Lock className="w-12 h-12 text-stone-300 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-stone-900 mb-4">
            {t.vip.notVipTitle}
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto mb-8">
            {t.vip.notVipBody}
          </p>
          <Link href="/chef/upgrade">
            <Button className="bg-stone-900 hover:bg-stone-800">
              <Crown className="w-4 h-4 mr-2" />
              {t.vip.notVipCta}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // VIP active (or past_due / cancelled with active engagement)
  const planKey = profile?.planKey as PlanKey | undefined;
  const planMonths =
    planKey && CHEF_PLANS[planKey] ? CHEF_PLANS[planKey].months : 0;
  const isAnnual = planKey === 'vip_12m';

  const dateLocale = t.availability.dateLocale;
  const endsAtDate = profile?.planEndsAt
    ? new Date(profile.planEndsAt).toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const daysLeft = profile?.planEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile.planEndsAt).getTime() - Date.now()) /
            (24 * 3600 * 1000),
        ),
      )
    : 0;

  const paymentModeLabel =
    profile?.paymentMode === 'upfront'
      ? t.vip.paymentModeUpfront
      : t.vip.paymentModeMonthly;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div>
        <Marker />
        <Label>{t.vip.pageLabel}</Label>
        <h1 className="text-3xl font-serif text-stone-900 flex items-center gap-3">
          <Crown className="w-7 h-7 text-amber-600" />
          {t.vip.pageTitle}
        </h1>
      </div>

      {/* Paid banner */}
      {paidFlag && (
        <div className="border border-green-200 bg-green-50 p-4 flex items-center gap-3 text-sm text-green-800">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {t.upgrade.paidBanner}
        </div>
      )}

      {/* Past due warning */}
      {isPastDue && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-red-800">
            {t.vip.pastDueWarning}
          </div>
          <Button
            size="sm"
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="bg-red-600 hover:bg-red-700 text-white shrink-0"
          >
            {portalLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              t.vip.manageSubscriptionCta
            )}
          </Button>
        </div>
      )}

      {/* Cancelled notice */}
      {isCancelled && (
        <div className="border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          {t.vip.cancelledNotice}
        </div>
      )}

      {/* Plan info card */}
      <div className="border border-amber-200 bg-amber-50 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-700 mb-1">
              {t.vip.activePlanLabel}
            </div>
            <div className="text-2xl font-serif text-stone-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              {format(t.vip.activePlanName, { months: planMonths })}
            </div>
            <div className="text-sm text-stone-600 mt-2 space-y-0.5">
              <div>
                {t.vip.paymentModeLabel} : <b>{paymentModeLabel}</b>
              </div>
              {profile?.planEndsAt && (
                <>
                  <div>{format(t.vip.engagementUntil, { date: endsAtDate })}</div>
                  <div className="text-xs text-stone-500">
                    {format(t.vip.daysRemaining, { n: daysLeft })}
                  </div>
                </>
              )}
            </div>
          </div>
          <Button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading || !profile?.stripeCustomerId}
            className="bg-stone-900 hover:bg-stone-800 shrink-0"
          >
            {portalLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t.vip.manageLoading}
              </>
            ) : (
              t.vip.manageSubscriptionCta
            )}
          </Button>
        </div>
        {portalError && (
          <div className="mt-3 text-sm text-red-700">{portalError}</div>
        )}
      </div>

      {/* Group section */}
      <div className="border border-stone-200 bg-white p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-stone-700" />
          <Label className="mb-0">{t.vip.groupSectionLabel}</Label>
        </div>
        <h3 className="text-xl font-serif text-stone-900">{t.vip.groupTitle}</h3>
        <p className="text-sm text-stone-500 max-w-2xl">{t.vip.groupDesc}</p>
        {PRIVATE_GROUP_URL ? (
          <a
            href={PRIVATE_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {t.vip.groupCta}
          </a>
        ) : (
          <div className="text-xs text-stone-500 italic border-l-2 border-stone-300 pl-3">
            {t.vip.groupComingSoon}
          </div>
        )}
      </div>

      {/* Tips & e-books */}
      <div className="border border-stone-200 bg-white p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-stone-700" />
          <Label className="mb-0">{t.vip.tipsSectionLabel}</Label>
        </div>
        <div>
          <h3 className="text-xl font-serif text-stone-900">{t.vip.tipsTitle}</h3>
          <p className="text-sm text-stone-500 mt-1">{t.vip.tipsDesc}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {t.vip.tipsItems.map((item, i) => (
            <div
              key={i}
              className="border border-stone-200 bg-stone-50/50 p-4 flex items-start gap-3"
            >
              <BookOpen className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-stone-900">
                  {item.title}
                </div>
                <div className="text-xs text-stone-500 mt-1">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call de positionnement (12m only) */}
      <div className="border border-stone-200 bg-white p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-stone-700" />
          <Label className="mb-0">{t.vip.callSectionLabel}</Label>
          {isAnnual && (
            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 border border-amber-300 bg-amber-50">
              {t.vip.callBadgeIncluded}
            </span>
          )}
        </div>
        <h3 className="text-xl font-serif text-stone-900">{t.vip.callTitle}</h3>
        <p className="text-sm text-stone-500 max-w-2xl">
          {isAnnual ? t.vip.callDescIncluded : t.vip.callDescNotIncluded}
        </p>
        {isAnnual ? (
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {t.vip.callCta}
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <Link href="/chef/upgrade">
            <Button variant="outline" type="button">
              <Crown className="w-4 h-4 mr-2" />
              {t.upgrade.plans.vip_12m.name}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats privées (placeholder) */}
      <div className="border border-stone-200 bg-stone-50/50 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-stone-700" />
          <Label className="mb-0">{t.vip.statsSectionLabel}</Label>
        </div>
        <h3 className="text-xl font-serif text-stone-900">{t.vip.statsTitle}</h3>
        <p className="text-sm text-stone-500 max-w-2xl">
          {t.vip.statsComingSoon}
        </p>
      </div>
    </div>
  );
}
