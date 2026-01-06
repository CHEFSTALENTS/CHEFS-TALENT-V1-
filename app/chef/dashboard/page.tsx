
  'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChefLayout } from '../../../components/ChefLayout';
import { Label, Button } from '../../../components/ui';

import { supabase } from '@/services/supabaseClient';
import { computeChefScore } from '@/lib/chefScore';

import {
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  ChefHat,
  Image as ImageIcon,
  Map,
  Calendar,
  AlertTriangle,
  Crown,
  Sparkles,
  Lock,
  DollarSign,
} from 'lucide-react';

type AnyProfile = Record<string, any>;
const SETTINGS_STORAGE_KEY = 'ct_chef_profile_v1';

function safeReadLS<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function ChefDashboardPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);

  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ✅ 1) Source de vérité = Supabase session
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();

      if (!alive) return;

      const user = data?.session?.user ?? null;
      if (!user) {
        router.replace('/chef/login');
        return;
      }

      setSbUser(user);
      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSbUser(user);

      if (!user) router.replace('/chef/login');
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  // ✅ 2) Charger le profil DB via userId Supabase
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!sbUser?.id) return;

      setProfileLoading(true);
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        const fromDb = json?.profile ?? null;

        if (!cancelled) {
          setSettingsProfile(fromDb ?? safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
        }
      } catch {
        if (!cancelled) setSettingsProfile(safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  // ✅ UI boot
  if (booting) {
    return (
      <ChefLayout>
        <div className="p-8">Chargement…</div>
      </ChefLayout>
    );
  }

  // Si pas de user (normalement redirect déjà)
  if (!sbUser) return null;

  // ✅ 3) mergedProfile = DB + infos supabase
  const mergedProfile = useMemo<AnyProfile>(() => {
    const email = sbUser?.email ?? '';
    const nameFromMeta =
      sbUser?.user_metadata?.name ||
      `${sbUser?.user_metadata?.firstName || ''} ${sbUser?.user_metadata?.lastName || ''}`.trim();

    return {
      ...(settingsProfile ?? {}),
      id: sbUser.id,
      email: (settingsProfile as any)?.email ?? email,
      name: (settingsProfile as any)?.name ?? nameFromMeta,
    };
  }, [settingsProfile, sbUser]);

  // ✅ 4) score
  const profileForScore = useMemo(() => {
    const p: any = mergedProfile ?? {};
    const city = String(p.city ?? p.baseCity ?? p.location?.baseCity ?? '').split(',')[0].trim();

    return {
      name: String(p.name ?? '').trim(),
      phone: String(p.phone ?? '').trim(),
      city,
      country: String(p.country ?? p.location?.country ?? '').trim(),
      bio: String(p.bio ?? '').trim(),
      yearsExperience: typeof p.yearsExperience === 'number' ? p.yearsExperience : null,
      cuisines: Array.isArray(p.cuisines) ? p.cuisines : [],
      specialties: Array.isArray(p.specialties) ? p.specialties : [],
      languages: Array.isArray(p.languages) ? p.languages : [],
      instagram: String(p.instagram ?? '').trim(),
      website: String(p.website ?? '').trim(),
      portfolioUrl: String(p.portfolioUrl ?? p.portfolio ?? '').trim(),
      avatarUrl: String(p.avatarUrl ?? p.photoUrl ?? '').trim(),
    };
  }, [mergedProfile]);

  const { score } = useMemo(() => computeChefScore(profileForScore as any), [profileForScore]);

  // ✅ 5) checks (tu peux garder les tiens)
  const checks = useMemo(() => {
    const bio = String((mergedProfile as any).bio ?? (mergedProfile as any).about ?? '').trim();
    const years = Number((mergedProfile as any).yearsExperience ?? 0);

    const identityOk =
      !!String((mergedProfile as any).name ?? '').trim() &&
      !!String((mergedProfile as any).phone ?? '').trim() &&
      (!!String((mergedProfile as any).city ?? '').trim() || !!String((mergedProfile as any).location?.baseCity ?? '').trim());

    const experienceOk = years > 0 || bio.length >= 80;

    const images =
      (mergedProfile as any).images ??
      (mergedProfile as any).photos ??
      (mergedProfile as any).gallery ??
      (mergedProfile as any).portfolioImages ??
      [];

    const hasImages = Array.isArray(images) && images.filter(Boolean).length > 0;

    const portfolioOk =
      hasImages ||
      !!String((mergedProfile as any).photoUrl ?? (mergedProfile as any).avatarUrl ?? '').trim() ||
      !!String((mergedProfile as any).portfolioUrl ?? '').trim() ||
      !!String((mergedProfile as any).instagram ?? '').trim() ||
      !!String((mergedProfile as any).website ?? '').trim();

    const pricing = (mergedProfile as any).pricing ?? null;
    const hasPricing =
      !!pricing &&
      (Number(pricing?.residence?.dailyRate ?? 0) > 0 ||
        Number(pricing?.event?.pricePerPerson ?? 0) > 0 ||
        Number((mergedProfile as any).dailyRate ?? 0) > 0 ||
        Number((mergedProfile as any).pricePerPerson ?? 0) > 0);

    const mobilityOk =
      !!String((mergedProfile as any).location?.baseCity ?? '').trim() ||
      ((mergedProfile as any).location?.coverageZones?.length ?? 0) > 0 ||
      ((mergedProfile as any).coverageZones?.length ?? 0) > 0 ||
      (mergedProfile as any).location?.internationalMobility === true;

    const preferencesOk = ((mergedProfile as any).cuisines?.length ?? 0) >= 1 && ((mergedProfile as any).languages?.length ?? 0) >= 1;

    return [
      { key: 'identity', title: 'Identité & Coordonnées', desc: 'Nom, téléphone, ville…', path: '/chef/identity', done: identityOk, icon: User },
      { key: 'experience', title: 'Expérience', desc: 'Bio + expérience', path: '/chef/experience', done: experienceOk, icon: ChefHat },
      { key: 'portfolio', title: 'Portfolio / Photos', desc: 'Lien Drive / site / Notion.', path: '/chef/portfolio', done: portfolioOk, icon: ImageIcon },
      { key: 'pricing', title: 'Tarifs', desc: 'Prix / jour ou prix / personne', path: '/chef/pricing', done: hasPricing, icon: DollarSign },
      { key: 'mobility', title: 'Zone & Mobilité', desc: 'Zones, déplacements', path: '/chef/mobility', done: mobilityOk, icon: Map },
      { key: 'availability', title: 'Disponibilités', desc: 'Ouverture des missions bientôt.', path: '/chef/availability', done: true, icon: Calendar },
      { key: 'preferences', title: 'Préférences', desc: 'Cuisines + langues', path: '/chef/preferences', done: preferencesOk, icon: Sparkles },
    ];
  }, [mergedProfile]);

  const completedCount = checks.filter((c) => c.done).length;
  const progress = Math.round((completedCount / checks.length) * 100);

  const tier = useMemo(() => {
    if (score >= 90) return { label: 'Priorité MAX', icon: Crown };
    if (score >= 70) return { label: 'Prioritaire', icon: Sparkles };
    if (score >= 40) return { label: 'En progression', icon: Clock };
    return { label: 'À compléter', icon: Lock };
  }, [score]);

  const TierIcon = tier.icon;

  return (
    <ChefLayout>
      <div className="space-y-10">
        <div className="flex items-end justify-between border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Label className="mb-0">Tableau de bord</Label>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">
                <TierIcon className="w-3 h-3" />
                {tier.label}
              </span>
              {profileLoading && <span className="text-xs text-stone-400">Sync profil…</span>}
            </div>

            <h1 className="text-4xl font-serif text-stone-900 mt-2">
              Bonjour, Chef {(String(mergedProfile?.name ?? '').split(' ').slice(-1)[0] ?? '').trim()}.
            </h1>

            <p className="text-stone-500 mt-2 font-light">
              Score : <span className="text-stone-900 font-medium">{Number(score || 0)}/100</span> • Checklist :{' '}
              <span className="text-stone-900 font-medium">{progress}%</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/chef/settings">
              <Button className="bg-stone-900 hover:bg-stone-800">
                Compléter le profil <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checks.map((c) => (
            <ActionCard key={c.key} icon={c.icon} title={c.title} desc={c.desc} path={c.path} done={c.done} />
          ))}
        </div>
      </div>
    </ChefLayout>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  path,
  done,
}: {
  icon: any;
  title: string;
  desc: string;
  path: string;
  done: boolean;
}) {
  return (
    <Link href={path} className="group block bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <Icon className={`w-6 h-6 ${done ? 'text-stone-900' : 'text-stone-300'}`} strokeWidth={1.5} />
        {done ? <CheckCircle2 className="w-5 h-5 text-stone-900" /> : <div className="w-5 h-5 rounded-full border border-stone-200 group-hover:border-stone-400" />}
      </div>
      <h3 className="text-lg font-serif text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 font-light mb-6">{desc}</p>
      <div className="text-xs uppercase tracking-widest text-stone-400 group-hover:text-stone-900 flex items-center gap-2">
        {done ? 'Modifier' : 'Compléter'} <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}
