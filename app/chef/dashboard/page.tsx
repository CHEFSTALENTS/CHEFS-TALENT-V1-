'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button } from '../../../components/ui';
import { supabase } from '@/services/supabaseClient';

import { computeChefScore } from '@/lib/chefScore';
import { isProfileCompleteForValidation } from '@/lib/profileCompletion';

import {
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  ChefHat,
  Image as ImageIcon,
  Map,
  Calendar,
  Sparkles,
  Crown,
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
  } catch { return null; }
}

// Composant simple pour le statut
const StatusBadge = ({ status }: { status: string }) => (
  <span className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-600 border border-stone-200">
    {status || 'Incomplet'}
  </span>
);

export default function ChefDashboardPage() {
  const router = useRouter();

  // 1. États
  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  // 2. LOGIQUE DE PROTECTION (Source de vérité Supabase)
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (mounted) router.replace('/chef/login');
        return;
      }

      if (mounted) {
        setSbUser(session.user);
        setBooting(false); // On libère l'affichage seulement si session OK
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.replace('/chef/login');
    });

    return () => { 
      mounted = false; 
      subscription.unsubscribe(); 
    };
  }, [router]);

  // 3. CHARGEMENT PROFIL (Ta structure actuelle)
  useEffect(() => {
    if (!sbUser?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.profile) setSettingsProfile(json.profile);
        else setSettingsProfile(safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
      } catch (e) {
        setSettingsProfile(safeReadLS<AnyProfile>(SETTINGS_STORAGE_KEY));
      }
    })();
  }, [sbUser?.id]);

  // PROTECTION RENDU
  if (booting || !sbUser) return null;

  // 4. TA STRUCTURE DE DONNÉES ACTUELLE (Gardée à 100%)
  const user = auth.getCurrentUser?.();
  const onboardingProfile: AnyProfile = (user as any)?.profile || {};

  const mergedProfile = useMemo<AnyProfile>(() => {
    const fullName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim();
    return {
      ...onboardingProfile,
      ...(settingsProfile ?? {}),
      email: (settingsProfile as any)?.email ?? sbUser?.email ?? (user as any)?.email ?? onboardingProfile.email,
      name: (settingsProfile as any)?.name ?? (fullName || onboardingProfile.name),
    };
  }, [onboardingProfile, settingsProfile, sbUser?.email, user]);

  const profileTypeLabels: Record<string, string> = {
    private: 'Chef Privé',
    residence: 'Chef Résidence',
    yacht: 'Chef Yacht',
    pastry: 'Chef Pâtissier',
  };

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

  const { score } = computeChefScore(profileForScore);

  const checks = useMemo(() => {
    const p = mergedProfile;
    const bio = (p.bio ?? (p as any).about ?? '').trim();
    const years = p.yearsExperience ?? 0;
    const images = (p as any).images ?? (p as any).photos ?? [];
    
    const pricing = (p as any).pricing ?? null;
    const hasPricing = !!pricing && (Number(pricing?.residence?.dailyRate) > 0 || Number(pricing?.event?.pricePerPerson) > 0);

    return [
      { key: 'identity', title: 'Identité & Coordonnées', desc: 'Nom, téléphone, ville…', path: '/chef/identity', done: !!p.name?.trim() && !!p.phone?.trim(), icon: User },
      { key: 'experience', title: 'Expérience', desc: 'Bio + expérience', path: '/chef/experience', done: years > 0 || bio.length >= 80, icon: ChefHat },
      { key: 'portfolio', title: 'Portfolio / Photos', desc: 'Lien Drive / site / Instagram', path: '/chef/portfolio', done: images.length > 0 || !!p.avatarUrl, icon: ImageIcon },
      { key: 'pricing', title: 'Tarifs', desc: 'Prix / jour ou prix / personne', path: '/chef/pricing', done: hasPricing, icon: DollarSign },
      { key: 'mobility', title: 'Zone & Mobilité', desc: 'Zones, déplacements', path: '/chef/mobility', done: !!p.location?.baseCity, icon: Map },
      { key: 'preferences', title: 'Préférences', desc: 'Cuisines + langues', path: '/chef/preferences', done: (p.cuisines?.length ?? 0) >= 1, icon: Sparkles },
    ];
  }, [mergedProfile]);

  const progress = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
  const tier = score >= 70 ? { label: 'Prioritaire', icon: Sparkles } : { label: 'À compléter', icon: Lock };
  const TierIcon = tier.icon;

  return (
    <ChefLayout>
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="flex items-end justify-between border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Label className="mb-0">Tableau de bord</Label>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">
                <TierIcon className="w-3 h-3" /> {tier.label}
              </span>
            </div>
            <h1 className="text-4xl font-serif text-stone-900 mt-2">
              Bonjour, Chef {(user as any)?.lastName || ''}.
            </h1>
          </div>
          <div className="text-right">
            <StatusBadge status={String((user as any)?.status || '')} />
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-stone-600" />
                <div className="text-2xl font-serif">{score}/100</div>
                <span className="ml-auto text-xs text-stone-500">Checklist : {progress}%</span>
              </div>
              <div className="w-full bg-stone-100 h-1">
                <div className="bg-stone-900 h-1 transition-all" style={{ width: `${score}%` }} />
              </div>
            </div>
            <Link href="/chef/settings">
              <Button className="bg-stone-900 text-white hover:bg-stone-800">Compléter le profil <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checks.map((c) => (
            <ActionCard key={c.key} {...c} />
          ))}
        </div>
      </div>
    </ChefLayout>
  );
}

function ActionCard({ icon: Icon, title, desc, path, done }: any) {
  return (
    <Link href={path} className="group block bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all">
      <div className="flex justify-between items-start mb-6">
        <Icon className={`w-6 h-6 ${done ? 'text-stone-900' : 'text-stone-300'}`} />
        {done ? <CheckCircle2 className="w-5 h-5 text-stone-900" /> : <div className="w-5 h-5 rounded-full border border-stone-200" />}
      </div>
      <h3 className="text-lg font-serif mb-2">{title}</h3>
      <p className="text-sm text-stone-500 font-light mb-6">{desc}</p>
      <div className="text-xs uppercase tracking-widest text-stone-400 group-hover:text-stone-900 flex items-center gap-2">
        {done ? 'Modifier' : 'Compléter'} <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}
