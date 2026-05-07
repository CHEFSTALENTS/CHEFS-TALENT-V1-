'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { format, type Dictionary } from '@/lib/chef-i18n';

type PricingTier = 'essential' | 'premium' | 'luxury' | 'ultra';

type ChefPricing = {
  tier: PricingTier | null;
  residence: { dailyRate: number | null; currency: 'EUR'; minDays: number | null };
  event: { pricePerPerson: number | null; minGuests: number | null };
  flags: { highSeason?: boolean; international?: boolean; yacht?: boolean; brigade?: boolean };
  notes?: string;
  updatedAt: string;
};

type ChefProfile = {
  id?: string;
  email?: string;
  pricing?: ChefPricing;
  [key: string]: any;
};

const defaultPricing = (): ChefPricing => ({
  tier: null,
  residence: { dailyRate: null, currency: 'EUR', minDays: null },
  event: { pricePerPerson: null, minGuests: null },
  flags: { highSeason: false, international: false, yacht: false, brigade: false },
  updatedAt: new Date().toISOString(),
});

const PRICING_BENCHMARK: Record<
  PricingTier,
  { residence: { min: number; max: number }; event: { min: number; max: number } }
> = {
  essential: { residence: { min: 300, max: 450 },  event: { min: 60,  max: 100 } },
  premium:   { residence: { min: 400, max: 700 },  event: { min: 90,  max: 150 } },
  luxury:    { residence: { min: 600, max: 900 },  event: { min: 150, max: 280 } },
  ultra:     { residence: { min: 700, max: 1400 }, event: { min: 200, max: 500 } },
};

const PRICING_MULTIPLIERS = {
  highSeason: 1.15,
  international: 1.2,
  yacht: 1.25,
  brigade: 1.2,
};

function computeMultiplier(flags: ChefPricing['flags']) {
  let m = 1;
  if (flags.highSeason) m *= PRICING_MULTIPLIERS.highSeason;
  if (flags.international) m *= PRICING_MULTIPLIERS.international;
  if (flags.yacht) m *= PRICING_MULTIPLIERS.yacht;
  if (flags.brigade) m *= PRICING_MULTIPLIERS.brigade;
  return m;
}

function roundTo(v: number, step: number) {
  return Math.round(v / step) * step;
}

function getSuggestedForTier(tier: PricingTier, flags: ChefPricing['flags']) {
  const base = PRICING_BENCHMARK[tier];
  const m = computeMultiplier(flags);

  const dailyMid = (base.residence.min + base.residence.max) / 2;
  const ppMid = (base.event.min + base.event.max) / 2;

  return {
    residenceDaily: roundTo(dailyMid * m, 25),
    eventPP: roundTo(ppMid * m, 5),
    multiplier: m,
    base,
  };
}

function toNumberOrNull(v: any): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getRangeStatus(t: Dictionary, value: number | null, min: number, max: number) {
  if (value === null) return { state: 'empty' as const, text: t.pricing.rangeEmpty };
  if (value < min)  return { state: 'low' as const,  text: format(t.pricing.rangeLow,  { min, max }) };
  if (value > max)  return { state: 'high' as const, text: format(t.pricing.rangeHigh, { min, max }) };
  return { state: 'ok' as const, text: format(t.pricing.rangeOk, { min, max }) };
}

function statusClass(state: 'empty' | 'low' | 'high' | 'ok') {
  if (state === 'ok') return 'text-green-700';
  if (state === 'low') return 'text-amber-700';
  if (state === 'high') return 'text-amber-700';
  return 'text-stone-400';
}

function TierCard({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 border transition w-full ${
        active ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="text-sm font-semibold text-stone-900">{title}</div>
      <div className="text-xs text-stone-500 mt-1">{subtitle}</div>
    </button>
  );
}

function FlagToggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label
      className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
        checked ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <span className="text-sm font-medium text-stone-800">{label}</span>
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <div
        className={`w-4 h-4 border flex items-center justify-center ${
          checked ? 'bg-stone-900 border-stone-900' : 'border-stone-300'
        }`}
      >
        {checked ? <div className="w-1.5 h-1.5 bg-white" /> : null}
      </div>
    </label>
  );
}

export default function ChefPricingPage() {
  const router = useRouter();
  const didRedirect = useRef(false);
  const { t } = useChefLocale();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [mode, setMode] = useState<'simple' | 'target'>('simple');
  const [targetNetPerDay, setTargetNetPerDay] = useState<number | null>(null);
  const [estimatedCostsPerDay, setEstimatedCostsPerDay] = useState<number | null>(null);

  const [profile, setProfile] = useState<ChefProfile>({});
  const [pricing, setPricing] = useState<ChefPricing>(defaultPricing());

  // 1) session supabase
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const u = data.session?.user ?? null;
      setSbUser(u);

      if (!u && !didRedirect.current) {
        didRedirect.current = true;
        router.replace('/chef/login');
        return;
      }

      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setSbUser(u);
      if (!u && !didRedirect.current) {
        didRedirect.current = true;
        router.replace('/chef/login');
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // 2) load DB profile
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!sbUser?.id) return;

      setLoadingPage(true);
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        const fromDb: ChefProfile | null = json?.profile ?? null;

        const base: ChefProfile = fromDb ?? { id: sbUser.id, email: sbUser.email ?? '' };
        const existing = (base as any)?.pricing ?? null;

        if (!cancelled) {
          setProfile(base);

          if (existing && typeof existing === 'object') {
            setPricing({
              ...defaultPricing(),
              ...existing,
              residence: { ...defaultPricing().residence, ...(existing.residence ?? {}) },
              event: { ...defaultPricing().event, ...(existing.event ?? {}) },
              flags: { ...defaultPricing().flags, ...(existing.flags ?? {}) },
              updatedAt: existing.updatedAt || new Date().toISOString(),
            });
          } else {
            setPricing(defaultPricing());
          }

          setLoadingPage(false);
        }
      } catch (e) {
        console.error('[pricing] load error', e);
        if (!cancelled) setLoadingPage(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  const suggestion = useMemo(() => {
    if (!pricing.tier) return null;
    return getSuggestedForTier(pricing.tier, pricing.flags);
  }, [pricing.tier, pricing.flags]);

  async function saveChefProfilePatchDb(patch: any) {
    if (!sbUser?.id) throw new Error('No user');

    const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
    const json = await resGet.json();
    const current = json?.profile ?? {};

    const merged = {
      ...current,
      ...patch,
      id: sbUser.id,
      email: sbUser.email ?? current.email ?? '',
      updatedAt: new Date().toISOString(),
    };

    const resPut = await fetch('/api/chef/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sbUser.id, profile: merged }),
    });

    if (!resPut.ok) throw new Error(await resPut.text());
    return merged;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const payload: ChefPricing = {
        ...pricing,
        residence: {
          dailyRate: pricing.residence.dailyRate ?? null,
          currency: 'EUR',
          minDays: pricing.residence.minDays ?? null,
        },
        event: {
          pricePerPerson: pricing.event.pricePerPerson ?? null,
          minGuests: pricing.event.minGuests ?? null,
        },
        flags: {
          highSeason: !!pricing.flags.highSeason,
          international: !!pricing.flags.international,
          yacht: !!pricing.flags.yacht,
          brigade: !!pricing.flags.brigade,
        },
        updatedAt: new Date().toISOString(),
      };

      const merged = await saveChefProfilePatchDb({ pricing: payload });
      setProfile(merged);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.warn('[ChefPricing] save failed', err?.message || err);
      alert(err?.message || t.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (booting || loadingPage) {
    return (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
    );
  }

  if (!sbUser) return null;

  const tierLabel = pricing.tier ? t.pricing.tiers[pricing.tier].title : '';

  return (

      <div className="max-w-2xl">
        <Marker />
        <Label>{t.pricing.pageLabel}</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">{t.pricing.pageTitle}</h1>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          {/* Tier */}
          <div className="space-y-3">
            <Label>{t.pricing.positionLabel}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TierCard
                title={t.pricing.tiers.essential.title}
                subtitle={t.pricing.tiers.essential.subtitle}
                active={pricing.tier === 'essential'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'essential' }))}
              />
              <TierCard
                title={t.pricing.tiers.premium.title}
                subtitle={t.pricing.tiers.premium.subtitle}
                active={pricing.tier === 'premium'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'premium' }))}
              />
              <TierCard
                title={t.pricing.tiers.luxury.title}
                subtitle={t.pricing.tiers.luxury.subtitle}
                active={pricing.tier === 'luxury'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'luxury' }))}
              />
              <TierCard
                title={t.pricing.tiers.ultra.title}
                subtitle={t.pricing.tiers.ultra.subtitle}
                active={pricing.tier === 'ultra'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'ultra' }))}
              />
            </div>

            <div className="text-xs text-stone-500 mt-2">{t.pricing.tierHelp}</div>

            {pricing.tier && suggestion ? (
              <div className="mt-3 rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">
                      {format(t.pricing.suggestionsTitle, { tier: tierLabel })}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {format(t.pricing.suggestionsBaseMarket, {
                        rmin: suggestion.base.residence.min,
                        rmax: suggestion.base.residence.max,
                        emin: suggestion.base.event.min,
                        emax: suggestion.base.event.max,
                      })}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {format(t.pricing.suggestionsAdjustment, { m: suggestion.multiplier.toFixed(2) })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPricing((p) => ({
                          ...p,
                          residence: { ...p.residence, dailyRate: suggestion.residenceDaily },
                          event: { ...p.event, pricePerPerson: suggestion.eventPP },
                        }))
                      }
                      className="px-3 py-2 text-sm border border-stone-200 bg-stone-50 hover:bg-stone-100"
                    >
                      {t.pricing.applySuggestions}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPricing((p) => ({
                          ...p,
                          residence: { ...p.residence, dailyRate: null, minDays: null },
                          event: { ...p.event, pricePerPerson: null, minGuests: null },
                        }))
                      }
                      className="px-3 py-2 text-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                    >
                      {t.pricing.resetCta}
                    </button>
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('simple')}
                    className={`px-3 py-2 text-xs border ${
                      mode === 'simple' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    {t.pricing.modeSimple}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('target')}
                    className={`px-3 py-2 text-xs border ${
                      mode === 'target' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    {t.pricing.modeTarget}
                  </button>
                </div>

                {mode === 'target' ? (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-stone-500">{t.pricing.targetNetLabel}</div>
                      <Input
                        type="number"
                        min={0}
                        value={targetNetPerDay ?? ''}
                        onChange={(e) => setTargetNetPerDay(toNumberOrNull(e.target.value))}
                        placeholder={t.pricing.targetNetPlaceholder}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-stone-500">{t.pricing.estimatedCostsLabel}</div>
                      <Input
                        type="number"
                        min={0}
                        value={estimatedCostsPerDay ?? ''}
                        onChange={(e) => setEstimatedCostsPerDay(toNumberOrNull(e.target.value))}
                        placeholder={t.pricing.estimatedCostsPlaceholder}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-stone-500">{t.pricing.suggestedRateLabel}</div>
                      <div className="border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900">
                        {(() => {
                          const net = targetNetPerDay ?? null;
                          if (!net) return '—';
                          const costs = estimatedCostsPerDay ?? 0;
                          const suggested = roundTo((net + costs) * suggestion.multiplier, 25);
                          return `${suggested} ${t.pricing.suggestedRateUnit}`;
                        })()}
                      </div>

                      <button
                        type="button"
                        className="mt-2 px-3 py-2 text-xs border border-stone-200 bg-white hover:bg-stone-50"
                        onClick={() => {
                          const net = targetNetPerDay ?? null;
                          if (!net) return;
                          const costs = estimatedCostsPerDay ?? 0;
                          const suggested = roundTo((net + costs) * suggestion.multiplier, 25);
                          setPricing((p) => ({ ...p, residence: { ...p.residence, dailyRate: suggested } }));
                        }}
                      >
                        {t.pricing.applyToDailyCta}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 text-[11px] text-stone-500">
                  {t.pricing.indicativeNote}
                </div>
              </div>
            ) : null}
          </div>

          {/* Residence */}
          <div className="space-y-3 pt-6 border-t border-stone-100">
            <Label>{t.pricing.residenceLabel}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.pricing.dailyRateLabel}</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.residence.dailyRate ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      residence: { ...p.residence, dailyRate: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder={t.pricing.dailyRatePlaceholder}
                />
                <p className="text-xs text-stone-400">{t.pricing.dailyRateHint}</p>
                {pricing.tier ? (() => {
                  const r = PRICING_BENCHMARK[pricing.tier].residence;
                  const s = getRangeStatus(t, pricing.residence.dailyRate, r.min, r.max);
                  return <div className={`text-xs mt-1 ${statusClass(s.state)}`}>{s.text}</div>;
                })() : (
                  <div className="text-xs mt-1 text-stone-400">{t.pricing.chooseTierFirst}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.pricing.minDaysLabel}</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.residence.minDays ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      residence: { ...p.residence, minDays: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder={t.pricing.minDaysPlaceholder}
                />
                <p className="text-xs text-stone-400">{t.pricing.minDaysHint}</p>
              </div>
            </div>
          </div>

          {/* Event */}
          <div className="space-y-3 pt-6 border-t border-stone-100">
            <Label>{t.pricing.eventLabel}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.pricing.eventPriceLabel}</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.event.pricePerPerson ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      event: { ...p.event, pricePerPerson: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder={t.pricing.eventPricePlaceholder}
                />
                {pricing.tier ? (() => {
                  const r = PRICING_BENCHMARK[pricing.tier].event;
                  const s = getRangeStatus(t, pricing.event.pricePerPerson, r.min, r.max);
                  return <div className={`text-xs mt-1 ${statusClass(s.state)}`}>{s.text}</div>;
                })() : null}
              </div>

              <div className="space-y-2">
                <Label>{t.pricing.minGuestsLabel}</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.event.minGuests ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      event: { ...p.event, minGuests: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder={t.pricing.minGuestsPlaceholder}
                />
              </div>
            </div>
            <p className="text-xs text-stone-400">{t.pricing.eventEmpty}</p>
          </div>

          {/* Flags */}
          <div className="space-y-3 pt-6 border-t border-stone-100">
            <Label>{t.pricing.flagsLabel}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FlagToggle
                label={t.pricing.flags.highSeason}
                checked={!!pricing.flags.highSeason}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, highSeason: !p.flags.highSeason } }))}
              />
              <FlagToggle
                label={t.pricing.flags.international}
                checked={!!pricing.flags.international}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, international: !p.flags.international } }))}
              />
              <FlagToggle
                label={t.pricing.flags.yacht}
                checked={!!pricing.flags.yacht}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, yacht: !p.flags.yacht } }))}
              />
              <FlagToggle
                label={t.pricing.flags.brigade}
                checked={!!pricing.flags.brigade}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, brigade: !p.flags.brigade } }))}
              />
            </div>
          </div>

          {/* Résumé */}
          <div className="pt-6 border-t border-stone-100">
            <Label>{t.pricing.summaryLabel}</Label>
            <div className="mt-2 rounded-xl border border-stone-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">
                  {format(t.pricing.summaryTier, { tier: pricing.tier ?? '—' })}
                </span>
                {pricing.flags.highSeason ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">{t.pricing.flags.highSeason}</span> : null}
                {pricing.flags.international ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">{t.pricing.flags.international}</span> : null}
                {pricing.flags.yacht ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">{t.pricing.flags.yacht}</span> : null}
                {pricing.flags.brigade ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">{t.pricing.flags.brigade}</span> : null}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-stone-200 bg-stone-50 p-3">
                  <div className="text-xs text-stone-500">{t.pricing.summaryResidence}</div>
                  <div className="mt-1">
                    <b>{pricing.residence.dailyRate ? `${pricing.residence.dailyRate} ${t.pricing.summaryDailyUnit}` : '—'}</b>
                    {pricing.residence.minDays ? <span className="text-stone-600"> • {format(t.pricing.summaryMinDays, { n: pricing.residence.minDays })}</span> : null}
                  </div>
                </div>

                <div className="border border-stone-200 bg-stone-50 p-3">
                  <div className="text-xs text-stone-500">{t.pricing.summaryEvent}</div>
                  <div className="mt-1">
                    <b>{pricing.event.pricePerPerson ? `${pricing.event.pricePerPerson} ${t.pricing.summaryPerPersonUnit}` : '—'}</b>
                    {pricing.event.minGuests ? <span className="text-stone-600"> • {format(t.pricing.summaryMinGuests, { n: pricing.event.minGuests })}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            {success ? <span className="text-sm text-green-600">{t.common.savedSuccess}</span> : <span />}
            <Button type="submit" disabled={saving} className="ml-auto w-32">
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : t.common.save}
            </Button>
          </div>
        </form>
      </div>

  );
}
