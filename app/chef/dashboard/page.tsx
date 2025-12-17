'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button } from '../../../components/ui';
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
} from 'lucide-react';

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

type AnyProfile = Record<string, any>;

export default function ChefDashboardPage() {
  const user = auth.getCurrentUser();

  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  useEffect(() => {
    // Profil premium (settings) -> localStorage
    const fromLS = safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY);
    setSettingsProfile(fromLS);
  }, []);

  if (!user) return null;

  // Profil "onboarding" (historique)
  const onboardingProfile: AnyProfile = (user as any).profile || {};

  // ✅ Source de vérité unique : on fusionne
  // - onboarding (ancien flow)
  // - settings (nouveau flow premium)
 const mergedProfile = useMemo<AnyProfile>(() => {
  const fullName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim();

  return {
    ...onboardingProfile,
    ...(settingsProfile ?? {}),
    // fallbacks utiles
    email: (settingsProfile as any)?.email ?? (user as any)?.email ?? onboardingProfile.email,
    name: (settingsProfile as any)?.name ?? (fullName || onboardingProfile.name),
  };
}, [onboardingProfile, settingsProfile, user]);

  // ✅ Score unique (admin + chef = même)
  const { score, rules } = useMemo(() => computeChefScore(mergedProfile ?? {}), [mergedProfile]);

  const profileTypeLabels: Record<string, string> = {
    private: 'Chef Privé',
    residence: 'Chef Résidence',
    yacht: 'Chef Yacht',
    pastry: 'Chef Pâtissier',
  };

  // ✅ Cards basées sur le scoring (évite le doublon “langues ici et là”)
  // On mappe “règles” -> sections à compléter
  const checks = useMemo(() => {
    const getOk = (keys: string[]) => keys.every(k => Boolean((rules as any)?.[k]?.ok));

    return [
      {
        label: 'Profil (essentiel)',
        title: 'Identité & Coordonnées',
        desc: 'Nom, téléphone, ville, bio.',
        path: '/chef/settings',
        done: getOk(['name', 'phone', 'city', 'bio']),
        icon: User,
      },
      {
        label: 'Positionnement',
        title: 'Cuisines & Spécialités',
        desc: 'Ton univers culinaire + ce que tu fais le mieux.',
        path: '/chef/settings',
        done: getOk(['cuisines', 'specialties']),
        icon: ChefHat,
      },
      {
        label: 'Portfolio',
        title: 'Portfolio / Photos',
        desc: 'Lien Drive / site / Notion.',
        path: '/chef/settings',
        done: getOk(['portfolioUrl']),
        icon: ImageIcon,
      },
      {
        label: 'Langues',
        title: 'Langues',
        desc: 'FR/EN recommandé.',
        path: '/chef/settings',
        done: getOk(['languages']),
        icon: Sparkles,
      },
      {
        label: 'Disponibilités',
        title: 'Disponibilités',
        desc: 'Ouverture des missions bientôt.',
        path: '/chef/missions',
        // pas bloquant au lancement
        done: true,
        icon: Calendar,
      },
    ];
  }, [rules]);

  const completedCount = checks.filter(c => c.done).length;
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

              {(user as any).plan === 'pro' && (user as any).planStatus === 'active' && (
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
              Bonjour, Chef {(user as any).lastName || (mergedProfile?.name?.split(' ').slice(-1)[0] ?? '')}.
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
            <StatusBadge status={String((user as any).status || '')} />
          </div>
        </div>

        {/* Score banner (source unique) */}
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
                Ce score est le même que celui vu côté admin (matching/priorité). Objectif :{' '}
                <span className="text-stone-900 font-medium">70%+</span> pour remonter dans les premiers matchs au lancement.
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
        {String((user as any).status) === 'pending_validation' && (
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

        {/* Subscription Coming Soon - Informational */}
        <div className="bg-stone-50 border border-stone-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 bg-white border border-stone-100 flex items-center justify-center rounded-full shrink-0">
              <Sparkles className="w-5 h-5 text-stone-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif text-stone-900">Abonnement (à venir)</h3>
              <p className="text-stone-500 font-light text-sm max-w-lg">
                Chef Talents est actuellement gratuit pour les chefs. Une offre d’abonnement optionnelle pourra arriver plus tard
                (outils, visibilité, automatisations…).
              </p>
            </div>
          </div>
          <Button variant="outline" disabled className="whitespace-nowrap opacity-50">
            Bientôt disponible
          </Button>
        </div>

        {/* Action List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checks.map((c: any) => (
            <ActionCard
              key={c.label}
              icon={c.icon}
              title={c.title}
              desc={c.desc}
              path={c.path}
              done={c.done}
            />
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
    <span className={`inline-block px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${styles[s] || styles.pending_validation}`}>
      {labels[s] || s || '—'}
    </span>
  );
}
