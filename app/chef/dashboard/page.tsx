'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { ChefLayout } from '../../../components/ChefLayout';
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
  DollarSign,
} from 'lucide-react';

type AnyProfile = Record<string, any>;

export default function ChefDashboardPage() {
  const router = useRouter();
  const didRedirect = useRef(false);

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  // 1) Session Supabase
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

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // 2) Profile DB
  useEffect(() => {
    if (!sbUser?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) setSettingsProfile(json?.profile ?? null);
      } catch {
        if (!cancelled) setSettingsProfile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  // 3) merge profile
  const mergedProfile = useMemo(() => {
    const firstName = (sbUser?.user_metadata as any)?.firstName ?? '';
    const lastName = (sbUser?.user_metadata as any)?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: sbUser?.id ?? '',
      email: sbUser?.email ?? '',
      firstName,
      lastName,
      name: settingsProfile?.name ?? fullName,
      status: settingsProfile?.status ?? 'draft',
      ...(settingsProfile ?? {}),
    };
  }, [sbUser, settingsProfile]);

  // 4) score
  const profileForScore = useMemo(() => {
    const p: any = mergedProfile ?? {};

    const city = String(
      p.city ?? p.baseCity ?? p.location?.baseCity ?? (typeof p.location === 'string' ? p.location : '')
    )
      .split(',')[0]
      .trim();

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

  // 5) checks
  const checks = useMemo(() => {
    const bio = String(mergedProfile.bio ?? mergedProfile.about ?? mergedProfile.description ?? '').trim();
    const years = mergedProfile.yearsExperience ?? mergedProfile.experienceYears ?? 0;

    const identityOk =
      !!String(mergedProfile.name ?? '').trim() &&
      !!String(mergedProfile.phone ?? '').trim() &&
      !!String(mergedProfile.city ?? mergedProfile.baseCity ?? mergedProfile.location?.baseCity ?? '').trim();

    const experienceOk = (Number(years ?? 0) > 0) || bio.length >= 80;

    const images =
      mergedProfile.images ??
      mergedProfile.photos ??
      mergedProfile.gallery ??
      mergedProfile.portfolioImages ??
      [];

    const hasImages = Array.isArray(images) && images.filter(Boolean).length > 0;

    const portfolioOk =
      hasImages ||
      !!String(mergedProfile.photoUrl ?? mergedProfile.avatarUrl ?? '').trim() ||
      !!String(mergedProfile.portfolioUrl ?? '').trim() ||
      !!String(mergedProfile.instagram ?? '').trim() ||
      !!String(mergedProfile.website ?? '').trim();

    const pricing = mergedProfile.pricing ?? null;

    const hasPricing =
      !!pricing &&
      (Number(pricing?.residence?.dailyRate ?? 0) > 0 ||
        Number(pricing?.event?.pricePerPerson ?? 0) > 0 ||
        Number(mergedProfile.dailyRate ?? 0) > 0 ||
        Number(mergedProfile.pricePerPerson ?? 0) > 0);

    const mobilityOk =
      !!String(mergedProfile.location?.baseCity ?? mergedProfile.baseCity ?? '').trim() ||
      mergedProfile.location?.internationalMobility === true ||
      (mergedProfile.location?.coverageZones?.length ?? 0) > 0 ||
      (mergedProfile.coverageZones?.length ?? 0) > 0;

    const preferencesOk =
      (mergedProfile.cuisines?.length ?? 0) >= 1 &&
      (mergedProfile.languages?.length ?? 0) >= 1;

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

  // ✅ Hooks OK, returns après
  if (booting) return <div className="p-10">Chargement…</div>;
  if (!sbUser) return null;

  const profileTypeLabels: Record<string, string> = {
    private: 'Chef Privé',
    residence: 'Chef Résidence',
    yacht: 'Chef Yacht',
    pastry: 'Chef Pâtissier',
  };

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
              Bonjour, Chef {mergedProfile.lastName || (String(mergedProfile.name ?? '').split(' ').slice(-1)[0] ?? '')}.
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
            <StatusBadge status={String((mergedProfile as any).status || 'draft')} />
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

        {/* Alert status */}
        {String((mergedProfile as any).status) === 'pending_validation' && (
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

        {/* Subscription (coming soon) */}
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-600',
    pending_validation: 'bg-stone-100 text-stone-600',
    approved: 'bg-stone-800 text-white',
    active: 'bg-stone-900 text-white',
    paused: 'bg-stone-200 text-stone-400',
  };

  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending_validation: 'En Attente',
    approved: 'Validé',
    active: 'Actif',
    paused: 'En Pause',
  };

  const s = (status || '').toLowerCase();

  return (
    <span className={`inline-block px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${styles[s] || styles.draft}`}>
      {labels[s] || s || '—'}
    </span>
  );
}
