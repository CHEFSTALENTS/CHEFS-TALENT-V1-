'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
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

/**
 * Crée/merge un profil minimal via ton API (service role).
 * IMPORTANT: on ne touche plus la DB direct côté client.
 */
async function ensureChefProfileExists(params: { userId: string; email: string; pending: PendingProfile | null }) {
  const { userId, email, pending } = params;

  const payload = {
    id: userId,
    email: email || null,
    profile: {
      firstName: pending?.firstName?.trim() || null,
      lastName: pending?.lastName?.trim() || null,
      email: email || pending?.email || null,
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

export default function ChefDashboardPage() {
  // App user (ancien système) + fallback supabase
  const [appUser, setAppUser] = useState<any>(() => auth.getCurrentUser?.() ?? null);

  const [booting, setBooting] = useState(true);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);
  const [sbUserId, setSbUserId] = useState<string | null>(null);

  /**
   * A) Boot Magic Link
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const sbUser = sessionData?.session?.user;
        if (!sbUser?.id) return;

        setSbUserId(sbUser.id);

        const raw = localStorage.getItem('chef_pending_profile');
        const pending: PendingProfile | null = raw ? JSON.parse(raw) : null;

        await ensureChefProfileExists({
          userId: sbUser.id,
          email: sbUser.email ?? pending?.email ?? '',
          pending,
        });

        localStorage.removeItem('chef_pending_profile');

        // fallback user objet si ton "auth" local n'est pas rempli par Supabase
        setAppUser((prev: any) => prev ?? { id: sbUser.id, email: sbUser.email, status: 'draft' });
      } catch (e: any) {
        console.error('[Dashboard boot] error:', e?.message || e, e);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * B) Charger le profil pour l’UI (DB -> fallback localStorage)
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const u = auth.getCurrentUser?.();
        const id = u?.id || sbUserId;
        if (!id) return;

        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
        const json = await res.json();
        const fromDb = json?.profile ?? null;

        if (!cancelled) {
          if (fromDb) setSettingsProfile(fromDb);
          else setSettingsProfile(safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
        }
      } catch {
        if (!cancelled) setSettingsProfile(safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUserId]);


  const profileTypeLabels: Record<string, string> = {
    private: 'Chef Privé',
    residence: 'Chef Résidence',
    yacht: 'Chef Yacht',
    pastry: 'Chef Pâtissier',
  };

  const onboardingProfile: AnyProfile = (appUser as any).profile || {};

  return (
  <ChefLayout>
    {!isReady ? (
      <div className="p-8">
        {booting ? 'Chargement…' : 'Non connecté.'}
      </div>
    ) : (
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* 👇 ici tu remets TOUT ton dashboard existant tel quel */}
        ...
      </div>
    )}
  </ChefLayout>
);Profile = useMemo<AnyProfile>(() => {
    const fullName = `${(appUser as any)?.firstName || ''} ${(appUser as any)?.lastName || ''}`.trim();


  // Completion
  const completion = useMemo(() => {
    return isProfileCompleteForValidation(mergedProfile ?? {});
  }, [mergedProfile]);

  // Score
  const profileForScore = useMemo(() => {
    const p: any = mergedProfile ?? {};

    const city = String(
      p.city ?? p.baseCity ?? p.location?.baseCity ?? (typeof p.location === 'string' ? p.location : '')
    )
      .split(',')[0]
      .trim();

    const isReady = !booting && !!appUser;

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

  // Checks
  const checks = useMemo(() => {
    const bio = String(mergedProfile.bio ?? (mergedProfile as any).about ?? (mergedProfile as any).description ?? '').trim();
    const years = (mergedProfile.yearsExperience ?? (mergedProfile as any).experienceYears ?? 0) as number;

    const identityOk =
      !!String(mergedProfile.name ?? '').trim() &&
      !!String(mergedProfile.phone ?? '').trim() &&
      (!!String(mergedProfile.city ?? '').trim() ||
        !!String(mergedProfile.location?.baseCity ?? '').trim() ||
        !!String((mergedProfile as any).baseCity ?? '').trim());

    const experienceOk = (years ?? 0) > 0 || bio.length >= 80;

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
      !!String((mergedProfile as any).baseCity ?? '').trim() ||
      mergedProfile.location?.internationalMobility === true ||
      (mergedProfile.location?.coverageZones?.length ?? 0) > 0 ||
      ((mergedProfile as any).coverageZones?.length ?? 0) > 0;

    const preferencesOk = (mergedProfile.cuisines?.length ?? 0) >= 1 && (mergedProfile.languages?.length ?? 0) >= 1;

    const availabilityOk = true;

    return [
      { key: 'identity', title: 'Identité & Coordonnées', desc: 'Nom, téléphone, ville…', path: '/chef/identity', done: identityOk, icon: User },
      { key: 'experience', title: 'Expérience', desc: 'Bio + expérience', path: '/chef/experience', done: experienceOk, icon: ChefHat },
      { key: 'portfolio', title: 'Portfolio / Photos', desc: 'Lien Drive / site / Notion.', path: '/chef/portfolio', done: portfolioOk, icon: ImageIcon },
      { key: 'pricing', title: 'Tarifs', desc: 'Prix / jour ou prix / personne', path: '/chef/pricing', done: hasPricing, icon: DollarSign },
      { key: 'mobility', title: 'Zone & Mobilité', desc: 'Zones, déplacements', path: '/chef/mobility', done: mobilityOk, icon: Map },
      { key: 'availability', title: 'Disponibilités', desc: 'Ouverture des missions bientôt.', path: '/chef/availability', done: availabilityOk, icon: Calendar },
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
        {/* Welcome Header */}
        <div className="flex items-end justify-between border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Label className="mb-0">Tableau de bord</Label>

              {(appUser as any).plan === 'pro' && (appUser as any).planStatus === 'active' && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-bronze border border-bronze px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" /> Pro
                </span>
              )}

              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">
                <TierIcon className="w-3 h-3" />
                {tier.label}
              </span>
            </div>

            <h1 className="text-4xl font-serif text-stone-900 mt-2">
              Bonjour, Chef {(appUser as any).lastName || (mergedProfile?.name?.split(' ').slice(-1)[0] ?? '')}.
            </h1>

            {(mergedProfile as any)?.profileType && (
              <p className="text-stone-500 mt-2 font-light">
                Profil : {profileTypeLabels[(mergedProfile as any).profileType] || (mergedProfile as any).profileType}
                <span className="mx-2">•</span>
                {(mergedProfile as any)?.seniorityLevel
                  ? String((mergedProfile as any).seniorityLevel).charAt(0).toUpperCase() +
                    String((mergedProfile as any).seniorityLevel).slice(1)
                  : ''}
              </p>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs uppercase tracking-widest text-stone-400 block mb-2">Statut du compte</span>
            <StatusBadge status={String((appUser as any).status || '')} />
          </div>
        </div>

        {/* Score banner */}
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
                Objectif : <span className="text-stone-900 font-medium">70%+</span> pour remonter dans les premiers matchs lors du lancement.
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

        {/* Status Alerts */}
        {String((appUser as any).status) === 'pending_validation' && (
          <div className="bg-white border border-stone-200 p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-stone-100 flex items-center justify-center rounded-full shrink-0">
                {score >= 70 ? (
                  <Clock className="w-6 h-6 text-stone-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-bronze" />
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-serif text-stone-900">
                  {score >= 70 ? "Dossier en cours d'examen" : 'Complétez votre profil pour activation'}
                </h3>
                <p className="text-stone-500 font-light leading-relaxed max-w-2xl">
                  {score >= 70
                    ? "Votre profil est prêt. Notre équipe examine votre dossier. Vous recevrez une notification sous 48h."
                    : 'Pour garantir la qualité du réseau, nous demandons un profil suffisamment complet avant validation.'}
                </p>

                {score < 70 && (
                  <div className="w-full bg-stone-100 h-1 mt-4">
                    <div className="bg-stone-900 h-1 transition-all duration-700" style={{ width: `${score}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Coming Soon */}
        <div className="bg-stone-50 border border-stone-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 bg-white border border-stone-100 flex items-center justify-center rounded-full shrink-0">
              <Sparkles className="w-5 h-5 text-stone-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif text-stone-900">Abonnement (à venir)</h3>
              <p className="text-stone-500 font-light text-sm max-w-lg">
                Chef Talents est actuellement gratuit pour les chefs. Une offre d’abonnement optionnelle pourra arriver plus tard (outils,
                visibilité, automatisations…).
              </p>
            </div>
          </div>
          <Button variant="outline" disabled className="whitespace-nowrap opacity-50">
            Bientôt disponible
          </Button>
        </div>

        {/* Action List */}
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
    <ChefLayout>
      {!isReady ? (
        <div className="p-8">
          {booting ? 'Chargement…' : 'Non connecté.'}
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-700">
          {/* 👇 COLLE ICI TOUT TON DASHBOARD EXISTANT (le contenu que tu avais dans <ChefLayout>) */}
          {/* Exemple : Welcome Header, Score banner, Alerts, Cards, etc. */}
        </div>
      )}
    </ChefLayout>
  );
}

/* =======================
   Helpers UI (hors composant)
   ======================= */

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
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_validation: 'bg-stone-100 text-stone-600',
    approved: 'bg-stone-800 text-white',
    active: 'bg-stone-900 text-white',
    paused: 'bg-stone-200 text-stone-400',
  };

  const labels: Record<string, string> = {
    pending_validation: 'En Attente',
    approved: 'Validé',
    active: 'Actif',
    paused: 'En Pause',
  };

  const s = (status || '').toLowerCase();

  return (
    <span
      className={`inline-block px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${
        styles[s] || styles.pending_validation
      }`}
    >
      {labels[s] || s || '—'}
    </span>
  );
}
