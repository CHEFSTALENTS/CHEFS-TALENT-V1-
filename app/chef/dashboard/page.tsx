'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Button } from '../../../components/ui';
import { computeChefScore } from '@/lib/chefScore';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { format } from '@/lib/chef-i18n';
import {
  CheckCircle2, Clock, ArrowRight, User, ChefHat, Image as ImageIcon,
  Map, Calendar, AlertTriangle, Crown, Sparkles, Lock, DollarSign,
  Send, Zap, ChevronRight, ExternalLink,
} from 'lucide-react';

type AnyProfile = Record<string, any>;

const MIN_PORTFOLIO_PHOTOS = 5;
const CALENDLY_URL = 'https://calendly.com/contact-chefstalents/30min';

function getPortfolioPhotosCount(p: any): number {
  const imgs = p?.images ?? p?.photos ?? p?.gallery ?? p?.portfolioImages ?? [];
  return Array.isArray(imgs) ? imgs.filter(Boolean).length : 0;
}

function getMergedImages(p: any): string[] {
  const imgs = p?.images ?? p?.photos ?? p?.gallery ?? p?.portfolioImages ?? [];
  return Array.isArray(imgs) ? imgs.filter(Boolean) : [];
}

// ─── Bannière Calendly ────────────────────────────────────────────────────────
function CalendlyBanner({ score, status }: { score: number; status: string }) {
  const { t } = useChefLocale();
  const show = score >= 80 && status !== 'active' && status !== 'approved';
  if (!show) return null;

  return (
    <div className="bg-stone-900 border border-stone-700 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">{t.dashboard.calendlyLabel}</p>
          <h3 className="text-white font-serif text-lg">{t.dashboard.calendlyTitle}</h3>
          <p className="text-stone-400 text-sm font-light mt-1">
            {t.dashboard.calendlyDescription}
          </p>
        </div>
      </div>
      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-2 bg-white text-stone-900 px-6 py-3 text-sm font-semibold hover:bg-stone-100 transition-colors"
      >
        {t.dashboard.calendlyCta} <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

// ─── Bannière VIP ─────────────────────────────────────────────────────────────
function VipBanner({ plan, planStatus }: { plan?: string; planStatus?: string }) {
  const { t } = useChefLocale();
  const isVip = plan === 'pro' && planStatus === 'active';

  if (isVip) return (
    <div className="border border-amber-200 bg-amber-50 p-6 flex items-center gap-4">
      <Crown className="w-6 h-6 text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-amber-900 text-sm">{t.dashboard.vipMember}</p>
        <p className="text-amber-700 text-xs font-light">{t.dashboard.vipMemberDesc}</p>
      </div>
      <Link href="/chef/vip" className="text-xs text-amber-700 underline">{t.dashboard.vipAccessTips}</Link>
    </div>
  );

  return (
    <div className="border border-stone-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-stone-600" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">{t.dashboard.vipPriceLabel}</p>
          <h3 className="text-stone-900 font-serif text-lg">{t.dashboard.vipTitle}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {t.dashboard.vipBenefits.map((bullet, i) => (
              <span key={i} className="text-xs text-stone-500 flex items-center gap-1">
                <span className="text-amber-500">✦</span> {bullet}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Link
        href="/chef/upgrade"
        className="shrink-0 inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-sm font-semibold hover:bg-stone-800 transition-colors"
      >
        <Crown className="w-4 h-4" /> {t.dashboard.vipCta}
      </Link>
    </div>
  );
}

// ─── Boost de profil ──────────────────────────────────────────────────────────
function BoostCard({ chefId, boostedUntil }: { chefId: string; boostedUntil?: string }) {
  const { t } = useChefLocale();
  const isBoosted = boostedUntil && new Date(boostedUntil) > new Date();

  const daysLeft = isBoosted
    ? Math.ceil((new Date(boostedUntil!).getTime() - Date.now()) / 86400000)
    : 0;

  return (
    <div className={`border p-6 ${isBoosted ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isBoosted ? 'bg-amber-100' : 'bg-stone-100'}`}>
            <Zap className={`w-5 h-5 ${isBoosted ? 'text-amber-600' : 'text-stone-600'}`} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
              {isBoosted
                ? format(t.dashboard.boostActiveLabel, { days: daysLeft })
                : t.dashboard.boostInactiveLabel}
            </p>
            <h3 className={`font-serif text-lg ${isBoosted ? 'text-amber-900' : 'text-stone-900'}`}>
              {isBoosted ? t.dashboard.boostActiveTitle : t.dashboard.boostInactiveTitle}
            </h3>
            <p className={`text-sm font-light mt-1 ${isBoosted ? 'text-amber-700' : 'text-stone-500'}`}>
              {isBoosted ? t.dashboard.boostActiveDesc : t.dashboard.boostInactiveDesc}
            </p>
          </div>
        </div>
        {!isBoosted && (
          <Link
            href="/chef/upgrade"
            className="shrink-0 inline-flex items-center gap-2 border border-stone-900 text-stone-900 px-5 py-2.5 text-sm font-semibold hover:bg-stone-900 hover:text-white transition-colors"
          >
            <Zap className="w-4 h-4" /> {t.dashboard.boostCta}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Proposer une mission au réseau ──────────────────────────────────────────
function ProposeMissionCard({ chefId, chefName }: { chefId: string; chefName: string }) {
  const { t } = useChefLocale();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ destination: '', dates: '', guests: '', budget: '', notes: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!form.destination || !form.dates) return;
    setSending(true);
    try {
      await fetch('/api/chef/propose-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, chefId, chefName }),
      });
      setSent(true);
    } catch {}
    finally { setSending(false); }
  };

  return (
    <div className="border border-stone-200 bg-white p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
          <Send className="w-5 h-5 text-stone-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">{t.dashboard.proposeNetwork}</p>
          <h3 className="text-stone-900 font-serif text-lg">{t.dashboard.proposeTitle}</h3>
          <p className="text-stone-500 text-sm font-light mt-1">
            {t.dashboard.proposeDesc}
          </p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 flex items-center gap-2 border border-stone-200 text-stone-600 px-4 py-2 text-sm hover:border-stone-900 hover:text-stone-900 transition-colors"
        >
          {open ? t.dashboard.proposeCtaClose : t.dashboard.proposeCtaOpen} <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {open && !sent && (
        <div className="border-t border-stone-100 pt-5 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest block mb-1">{t.dashboard.proposeFieldDestination}</label>
              <input
                value={form.destination}
                onChange={e => setForm(f => ({...f, destination: e.target.value}))}
                placeholder={t.dashboard.proposePlaceholderDestination}
                className="w-full px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-900"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest block mb-1">{t.dashboard.proposeFieldDates}</label>
              <input
                value={form.dates}
                onChange={e => setForm(f => ({...f, dates: e.target.value}))}
                placeholder={t.dashboard.proposePlaceholderDates}
                className="w-full px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-900"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest block mb-1">{t.dashboard.proposeFieldGuests}</label>
              <input
                value={form.guests}
                onChange={e => setForm(f => ({...f, guests: e.target.value}))}
                placeholder={t.dashboard.proposePlaceholderGuests}
                className="w-full px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-900"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 uppercase tracking-widest block mb-1">{t.dashboard.proposeFieldBudget}</label>
              <input
                value={form.budget}
                onChange={e => setForm(f => ({...f, budget: e.target.value}))}
                placeholder={t.dashboard.proposePlaceholderBudget}
                className="w-full px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-400 uppercase tracking-widest block mb-1">{t.dashboard.proposeFieldNotes}</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              placeholder={t.dashboard.proposePlaceholderNotes}
              rows={3}
              className="w-full px-4 py-2.5 border border-stone-200 text-sm focus:outline-none focus:border-stone-900 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={sending || !form.destination || !form.dates}
              className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-40"
            >
              {sending ? t.dashboard.proposeCtaSubmitting : <><Send className="w-4 h-4" /> {t.dashboard.proposeCtaSubmit}</>}
            </button>
          </div>
        </div>
      )}

      {sent && (
        <div className="border-t border-stone-100 pt-5 flex items-center gap-3 text-stone-600">
          <CheckCircle2 className="w-5 h-5 text-stone-900" />
          <p className="text-sm">{t.dashboard.proposeSuccess}</p>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function ChefDashboardPage() {
  const router = useRouter();
  const didRedirect = useRef(false);
  const { t } = useChefLocale();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      const user = data.session?.user ?? null;
      setSbUser(user);
      if (!user && !didRedirect.current) {
        didRedirect.current = true;
        router.replace('/chef/login');
        return;
      }
      setBooting(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSbUser(user);
      if (!user && !didRedirect.current) {
        didRedirect.current = true;
        router.replace('/chef/login');
      }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    if (!sbUser?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) setSettingsProfile(json?.profile ?? null);
      } catch { if (!cancelled) setSettingsProfile(null); }
    })();
    return () => { cancelled = true; };
  }, [sbUser?.id]);

  const mergedProfile = useMemo<AnyProfile>(() => {
    const firstName = (sbUser?.user_metadata as any)?.firstName ?? '';
    const lastName  = (sbUser?.user_metadata as any)?.lastName ?? '';
    return {
      id: sbUser?.id ?? '',
      email: sbUser?.email ?? '',
      firstName, lastName,
      name: (settingsProfile as any)?.name ?? `${firstName} ${lastName}`.trim(),
      status: (settingsProfile as any)?.status ?? 'draft',
      ...(settingsProfile ?? {}),
    };
  }, [sbUser, settingsProfile]);

  const profileForScore = useMemo(() => {
    const p: any = mergedProfile ?? {};
    const city = String(p.city ?? p.baseCity ?? p.location?.baseCity ?? (typeof p.location === 'string' ? p.location : '')).split(',')[0].trim();
    const images = getMergedImages(p);
    const location = typeof p.location === 'object' && p.location ? {
      baseCity: String(p.location.baseCity ?? '').trim(),
      travelRadiusKm: typeof p.location.travelRadiusKm === 'number' ? p.location.travelRadiusKm : p.location.travelRadiusKm != null ? Number(p.location.travelRadiusKm) : null,
      internationalMobility: Boolean(p.location.internationalMobility ?? false),
      coverageZones: Array.isArray(p.location.coverageZones) ? p.location.coverageZones : [],
    } : undefined;
    return {
      name: String(p.name ?? '').trim(), firstName: String(p.firstName ?? '').trim(), lastName: String(p.lastName ?? '').trim(),
      phone: String(p.phone ?? '').trim(), email: String(p.email ?? '').trim(), city, baseCity: String(p.baseCity ?? '').trim(),
      country: String(p.country ?? p.location?.country ?? '').trim(), bio: String(p.bio ?? '').trim(),
      yearsExperience: typeof p.yearsExperience === 'number' ? p.yearsExperience : null,
      cuisines: Array.isArray(p.cuisines) ? p.cuisines : [], specialties: Array.isArray(p.specialties) ? p.specialties : [],
      languages: Array.isArray(p.languages) ? p.languages : [], instagram: String(p.instagramUrl ?? p.instagram ?? '').trim(),
      website: String(p.websiteUrl ?? p.website ?? '').trim(), avatarUrl: String(p.avatarUrl ?? p.photoUrl ?? '').trim(),
      images, travelRadiusKm: typeof p.travelRadiusKm === 'number' ? p.travelRadiusKm : p.travelRadiusKm != null ? Number(p.travelRadiusKm) : null,
      internationalMobility: Boolean(p.internationalMobility ?? false), location,
    };
  }, [mergedProfile]);

  const { score } = useMemo(() => computeChefScore(profileForScore), [profileForScore]);

  const checks = useMemo(() => {
    const p: any = mergedProfile ?? {};
    const bio = String(p.bio ?? p.about ?? p.description ?? '').trim();
    const years = p.yearsExperience ?? p.experienceYears ?? 0;
    const identityOk = !!String(p.name ?? '').trim() && !!String(p.phone ?? '').trim() && (!!String(p.city ?? '').trim() || !!String(p.location?.baseCity ?? '').trim() || !!String(p.baseCity ?? '').trim());
    const experienceOk = Number(years ?? 0) > 0 || bio.length >= 80;
    const photoCount = getPortfolioPhotosCount(p);
    const portfolioOk = photoCount >= MIN_PORTFOLIO_PHOTOS;
    const pricing = p.pricing ?? null;
    const hasPricing = !!pricing && (Number(pricing?.residence?.dailyRate ?? 0) > 0 || Number(pricing?.event?.pricePerPerson ?? 0) > 0 || Number(p.dailyRate ?? 0) > 0 || Number(p.pricePerPerson ?? 0) > 0);
    const mobilityOk = !!String(p.location?.baseCity ?? '').trim() || !!String(p.baseCity ?? '').trim() || p.location?.internationalMobility === true || (p.location?.coverageZones?.length ?? 0) > 0 || (p.coverageZones?.length ?? 0) > 0;
    const preferencesOk = (p.cuisines?.length ?? 0) >= 1 && (p.languages?.length ?? 0) >= 1;

    const portfolioDesc = portfolioOk
      ? format(t.dashboard.checks.portfolio.descOk, { count: photoCount, min: MIN_PORTFOLIO_PHOTOS })
      : format(t.dashboard.checks.portfolio.descMissing, { count: photoCount, min: MIN_PORTFOLIO_PHOTOS });

    return [
      { key: 'identity',    title: t.dashboard.checks.identity.title,    desc: t.dashboard.checks.identity.desc,    path: '/chef/identity',    done: identityOk,    icon: User      },
      { key: 'experience',  title: t.dashboard.checks.experience.title,  desc: t.dashboard.checks.experience.desc,  path: '/chef/experience',  done: experienceOk,  icon: ChefHat   },
      { key: 'portfolio',   title: t.dashboard.checks.portfolio.title,   desc: portfolioDesc,                       path: '/chef/portfolio',   done: portfolioOk,   icon: ImageIcon },
      { key: 'pricing',     title: t.dashboard.checks.pricing.title,     desc: t.dashboard.checks.pricing.desc,     path: '/chef/pricing',     done: hasPricing,    icon: DollarSign},
      { key: 'mobility',    title: t.dashboard.checks.mobility.title,    desc: t.dashboard.checks.mobility.desc,    path: '/chef/mobility',    done: mobilityOk,    icon: Map       },
      { key: 'availability',title: t.dashboard.checks.availability.title,desc: t.dashboard.checks.availability.desc,path: '/chef/availability',done: true,          icon: Calendar  },
      { key: 'preferences', title: t.dashboard.checks.preferences.title, desc: t.dashboard.checks.preferences.desc, path: '/chef/preferences', done: preferencesOk, icon: Sparkles  },
    ];
  }, [mergedProfile, t]);

  const completedCount = checks.filter(c => c.done).length;
  const progress = Math.round((completedCount / checks.length) * 100);

  const onboardingTier = useMemo(() => {
    if (progress === 100) return { label: t.dashboard.onboardingTier.ready, icon: CheckCircle2 };
    if (progress >= 70)  return { label: t.dashboard.onboardingTier.almost, icon: Sparkles };
    if (progress >= 40)  return { label: t.dashboard.onboardingTier.progress, icon: Clock };
    return { label: t.dashboard.onboardingTier.todo, icon: Lock };
  }, [progress, t]);

  const TierIcon = onboardingTier.icon;
  const status   = String((mergedProfile as any).status || '');
  const plan     = (mergedProfile as any).plan;
  const planStatus = (mergedProfile as any).planStatus;
  const chefName = String((mergedProfile as any).lastName || (mergedProfile as any).name || '');

  if (booting) return <div className="p-10">{t.common.loading}</div>;
  if (!sbUser)  return null;

  const profileType = (mergedProfile as any)?.profileType as
    | 'private' | 'residence' | 'yacht' | 'pastry' | undefined;
  const seniorityRaw = String((mergedProfile as any)?.seniorityLevel || '');
  const seniorityLabel =
    seniorityRaw === 'junior'    ? t.dashboard.seniority.junior :
    seniorityRaw === 'confirmed' ? t.dashboard.seniority.confirmed :
    seniorityRaw === 'senior'    ? t.dashboard.seniority.senior :
    '';

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex items-end justify-between border-b border-stone-200 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Label className="mb-0">{t.dashboard.label}</Label>
            {plan === 'pro' && planStatus === 'active' && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-amber-600 border border-amber-300 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" /> {t.dashboard.badgeVip}
              </span>
            )}
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">
              <TierIcon className="w-3 h-3" />
              {onboardingTier.label}
            </span>
          </div>
          <h1 className="text-4xl font-serif text-stone-900 mt-2">
            {format(t.dashboard.greeting, { name: chefName })}
          </h1>
          {profileType && (
            <p className="text-stone-500 mt-2 font-light">
              {t.dashboard.profileLabel} {t.dashboard.profileTypes[profileType] || profileType}
              {seniorityLabel && (
                <><span className="mx-2">•</span>{seniorityLabel}</>
              )}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-widest text-stone-400 block mb-2">{t.dashboard.accountStatusLabel}</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Score profil */}
      <div className="bg-white border border-stone-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-stone-600" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400">{t.dashboard.profileCompletedLabel}</div>
                <div className="text-2xl font-serif text-stone-900">{Number(score || 0)}%</div>
              </div>
              <span className="ml-auto text-xs text-stone-500">
                {t.dashboard.checklistLabel} <span className="font-medium text-stone-900">{progress}%</span>
              </span>
            </div>
            <div className="w-full bg-stone-100 h-1">
              <div className="bg-stone-900 h-1 transition-all duration-700" style={{ width: `${score}%` }} />
            </div>
            <p className="text-stone-500 font-light leading-relaxed max-w-3xl">
              {t.dashboard.profileCompletionBody}{' '}
              <span className="text-stone-900 font-medium">{t.dashboard.profileCompletionGoal}</span>
            </p>
          </div>
          {completedCount < checks.length && (
            <Link href="/chef/settings">
              <Button className="bg-stone-900 hover:bg-stone-800">
                {t.dashboard.completeProfileCta} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ✅ Bannière Calendly — apparaît à 80%+ si pas encore actif */}
      <CalendlyBanner score={Number(score || 0)} status={status} />

      {/* Alert pending */}
      {status === 'pending_validation' && Number(score || 0) < 80 && (
        <div className="bg-white border border-stone-200 p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-stone-100 flex items-center justify-center rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-stone-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif text-stone-900">{t.dashboard.activationCardTitle}</h3>
              <p className="text-stone-500 font-light leading-relaxed max-w-2xl">
                {t.dashboard.activationCardBody}
              </p>
              <div className="w-full bg-stone-100 h-1 mt-4 max-w-sm">
                <div className="bg-stone-900 h-1 transition-all duration-700" style={{ width: `${score}%` }} />
              </div>
              <p className="text-xs text-stone-400">
                {format(t.dashboard.activationProgress, { score: Number(score || 0) })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ VIP Banner — uniquement si profil validé (status === 'active') */}
      {status === 'active' && (
        <>
          <VipBanner plan={plan} planStatus={planStatus} />

          {/* ✅ Boost */}
          <BoostCard
            chefId={String((mergedProfile as any).id || '')}
            boostedUntil={(mergedProfile as any).boostedUntil}
          />
        </>
      )}

      {/* Checklist */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checks.map(c => (
          <ActionCard key={c.key} icon={c.icon} title={c.title} desc={c.desc} path={c.path} done={c.done} />
        ))}
      </div>

      {/* ✅ Proposer une mission */}
      <ProposeMissionCard
        chefId={String((mergedProfile as any).id || '')}
        chefName={chefName}
      />

    </div>
  );
}

function ActionCard({ icon: Icon, title, desc, path, done }: { icon: any; title: string; desc: string; path: string; done: boolean }) {
  const { t } = useChefLocale();
  return (
    <Link href={path} className="group block bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <Icon className={`w-6 h-6 ${done ? 'text-stone-900' : 'text-stone-300'}`} strokeWidth={1.5} />
        {done
          ? <CheckCircle2 className="w-5 h-5 text-stone-900" />
          : <div className="w-5 h-5 rounded-full border border-stone-200 group-hover:border-stone-400" />
        }
      </div>
      <h3 className="text-lg font-serif text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 font-light mb-6">{desc}</p>
      <div className="text-xs uppercase tracking-widest text-stone-400 group-hover:text-stone-900 flex items-center gap-2">
        {done ? t.dashboard.actionCardEdit : t.dashboard.actionCardComplete} <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useChefLocale();
  const styles: Record<string, string> = {
    pending_validation: 'bg-stone-100 text-stone-600',
    approved: 'bg-stone-800 text-white',
    active: 'bg-stone-900 text-white',
    paused: 'bg-stone-200 text-stone-400',
    draft: 'bg-stone-100 text-stone-600',
  };
  const s = (status || '').toLowerCase();
  const labels: Record<string, string> = {
    pending_validation: t.dashboard.status.pending_validation,
    approved: t.dashboard.status.approved,
    active: t.dashboard.status.active,
    paused: t.dashboard.status.paused,
    draft: t.dashboard.status.draft,
  };
  return (
    <span className={`inline-block px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${styles[s] || styles.draft}`}>
      {labels[s] || s || '—'}
    </span>
  );
}
