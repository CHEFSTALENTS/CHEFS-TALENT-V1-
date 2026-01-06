'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChefLayout } from '../../../components/ChefLayout';
import { Label, Button } from '../../../components/ui';

import { computeChefScore } from '@/lib/chefScore';
import { isProfileCompleteForValidation } from '@/lib/profileCompletion';
import { supabase } from '@/services/supabaseClient';

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

type PendingProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: string;
};

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

/** crée/merge un profil minimal via ton API */
async function ensureChefProfileExists(params: {
  userId: string;
  email: string;
  pending: PendingProfile | null;
}) {
  const { userId, email, pending } = params;

  const payload = {
    id: userId,
    email: email || null,
    profile: {
      firstName: pending?.firstName?.trim() || null,
      lastName: pending?.lastName?.trim() || null,
      email: email || null,
      createdAt: pending?.createdAt || new Date().toISOString(),
    },
  };

  const res = await fetch('/api/chef/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ensureChefProfileExists failed: ${res.status} ${txt}`);
  }

  return res.json();
}

/** pose le cookie gate chef (middleware) si ton endpoint existe */
async function ensureChefGateCookie() {
  try {
    await fetch('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area: 'chef' }),
      cache: 'no-store',
    });
  } catch {
    // silencieux
  }
}

export default function ChefDashboardPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  // anti double-call ensure profile
  const profileBootRef = useRef<Record<string, boolean>>({});

  // 1) ✅ Source de vérité = Supabase session
  useEffect(() => {
    let cancelled = false;
    let unsub: { unsubscribe: () => void } | null = null;

    const finish = () => {
      if (!cancelled) setBooting(false);
    };

    const handleUser = async (user: any | null) => {
      if (cancelled) return;

      // ❌ pas de session => on va SIGNUP (pas login)
    if (!user?.id) {
  setSbUser(null);
  finish();
  return; // laisse le middleware / le user décider
}

      // ✅ session ok
      setSbUser(user);

      // ✅ cookie gate chef (middleware)
      await ensureChefGateCookie();

      // ✅ Ensure profile (1 seule fois)
      if (!profileBootRef.current[user.id]) {
        profileBootRef.current[user.id] = true;
        try {
          const raw = localStorage.getItem('chef_pending_profile');
          const pending: PendingProfile | null = raw ? JSON.parse(raw) : null;

          await ensureChefProfileExists({
            userId: user.id,
            email: user.email ?? pending?.email ?? '',
            pending,
          });

          localStorage.removeItem('chef_pending_profile');
        } catch (e) {
          console.error('[Dashboard] ensure profile error:', e);
        }
      }

      finish();
    };

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('[Dashboard] getSession error:', error);

        await handleUser(data?.session?.user ?? null);

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          handleUser(session?.user ?? null);
        });

        unsub = sub?.subscription ?? null;
      } catch (e) {
        console.error('[Dashboard] boot fatal:', e);
        finish();
        router.replace('/chef/signup');
      }
    })();

    return () => {
      cancelled = true;
      try {
        unsub?.unsubscribe?.();
      } catch {}
    };
  }, [router]);

  // 2) Load profil DB (si session ok)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!sbUser?.id) return;

        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        const fromDb = json?.profile ?? null;

        if (!cancelled) {
          setSettingsProfile(fromDb || safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
        }
      } catch {
        if (!cancelled) setSettingsProfile(safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  // UI loading
  if (booting) {
    return (
      <ChefLayout>
        <div className="p-8">Chargement…</div>
      </ChefLayout>
    );
  }

  // si pas de session, on laisse le redirect faire son job
  if (!sbUser?.id) {
    return (
      <ChefLayout>
        <div className="p-8">Redirection…</div>
      </ChefLayout>
    );
  }

  // Labels
  const profileTypeLabels: Record<string, string> = {
    private: 'Chef Privé',
    residence: 'Chef Résidence',
    yacht: 'Chef Yacht',
    pastry: 'Chef Pâtissier',
  };

  // merged profile = DB/LS + infos supabase
  const mergedProfile = useMemo<AnyProfile>(() => {
    const p = settingsProfile ?? {};
    const fullName = `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim();

    return {
      ...p,
      email: p?.email ?? sbUser?.email ?? '',
      name: p?.name ?? (fullName || p?.name || ''),
    };
  }, [settingsProfile, sbUser?.email]);

  const completion = useMemo(() => {
    const { ok, details } = isProfileCompleteForValidation(mergedProfile ?? {});
    const items = Object.entries(details).map(([k, v]) => ({ key: k, ok: Boolean(v) }));
    const done = items.filter((i) => i.ok).length;
    const total = items.length || 1;
    return { ok, done, total, score: Math.round((done / total) * 100) };
  }, [mergedProfile]);

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

  const { score } = useMemo(() => computeChefScore(profileForScore), [profileForScore]);

  const checks = useMemo(() => {
    const bio = String(mergedProfile.bio ?? (mergedProfile as any).about ?? (mergedProfile as any).description ?? '').trim();
    const years = mergedProfile.yearsExperience ?? (mergedProfile as any).experienceYears ?? 0;

    const identityOk =
      !!String(mergedProfile.name ?? '').trim() &&
      !!String(mergedProfile.phone ?? '').trim() &&
      (!!String(mergedProfile.city ?? '').trim() || !!String(mergedProfile.location?.baseCity ?? '').trim());

    const experienceOk = (Number(years) || 0) > 0 || bio.length >= 80;

    const images =
      (mergedProfile as any).images ??
      (mergedProfile as any).photos ??
      (mergedProfile as any).gallery ??
      (mergedProfile as any).portfolioImages ??
      [];
    const hasImages = Array.isArray(images) && images.filter(Boolean).length > 0;

    const portfolioOk =
      hasImages ||
      !!String((mergedProfile as any).photoUrl ?? mergedProfile.avatarUrl ?? '').trim() ||
      !!String(mergedProfile.portfolioUrl ?? '').trim() ||
      !!String(mergedProfile.instagram ?? '').trim() ||
      !!String(mergedProfile.website ?? '').trim();

    const pricing = (mergedProfile as any).pricing ?? null;
    const hasPricing =
      !!pricing &&
      (Number(pricing?.residence?.dailyRate ?? 0) > 0 ||
        Number(pricing?.event?.pricePerPerson ?? 0) > 0 ||
        Number((mergedProfile as any).dailyRate ?? 0) > 0 ||
        Number((mergedProfile as any).pricePerPerson ?? 0) > 0);

    const mobilityOk =
      !!String(mergedProfile.location?.baseCity ?? '').trim() ||
      mergedProfile.location?.internationalMobility === true ||
      (mergedProfile.location?.coverageZones?.length ?? 0) > 0;

    const preferencesOk = (mergedProfile.cuisines?.length ?? 0) >= 1 && (mergedProfile.languages?.length ?? 0) >= 1;

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
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Label className="mb-0">Tableau de bord</Label>

              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">
                <TierIcon className="w-3 h-3" />
                {tier.label}
              </span>
            </div>

            <h1 className="text-4xl font-serif text-stone-900 mt-2">
              Bonjour, Chef {(mergedProfile?.name?.split(' ').slice(-1)[0] ?? '')}.
            </h1>

            {(mergedProfile as any)?.profileType && (
              <p className="text-stone-500 mt-2 font-light">
                Profil : {profileTypeLabels[(mergedProfile as any).profileType] || (mergedProfile as any).profileType}
              </p>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs uppercase tracking-widest text-stone-400 block mb-2">Compte</span>
            <span className="text-xs text-stone-600">{sbUser?.email}</span>
          </div>
        </div>

        {/* Score */}
        <div className="bg-white border border-stone-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400">Score profil</div>
                  <div className="text-2xl font-serif text-stone-900">{Number(score || 0)}/100</div>
                </div>

                <span className="ml-auto text-xs text-stone-500">
                  Checklist : <span className="font-medium text-stone-900">{progress}%</span>
                </span>
              </div>

              <div className="w-full bg-stone-100 h-1">
                <div className="bg-stone-900 h-1 transition-all duration-700" style={{ width: `${score}%` }} />
              </div>

              <p className="text-stone-500 font-light leading-relaxed max-w-3xl">
                Objectif : <span className="text-stone-900 font-medium">70%+</span> pour être prioritaire au lancement.
              </p>

              <p className="text-xs text-stone-400">
                Complétion validation : {completion.score}% ({completion.done}/{completion.total})
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
        </div>

        {/* Alerts */}
        {score < 70 && (
          <div className="bg-white border border-stone-200 p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-stone-100 flex items-center justify-center rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-bronze" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif text-stone-900">Complétez votre profil</h3>
                <p className="text-stone-500 font-light leading-relaxed max-w-2xl">
                  Pour garantir la qualité du réseau, nous demandons un profil suffisamment complet avant validation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
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
    <Link
      href={path}
      className="group block bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-6">
        <Icon className={`w-6 h-6 ${done ? 'text-stone-900' : 'text-stone-300'}`} strokeWidth={1.5} />
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-stone-900" />
        ) : (
          <div className="w-5 h-5 rounded-full border border-stone-200 group-hover:border-stone-400" />
        )}
      </div>

      <h3 className="text-lg font-serif text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-500 font-light mb-6">{desc}</p>

      <div className="text-xs uppercase tracking-widest text-stone-400 group-hover:text-stone-900 flex items-center gap-2">
        {done ? 'Modifier' : 'Compléter'} <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}
