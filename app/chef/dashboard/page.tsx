'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { ChefLayout } from '../../../components/ChefLayout';
import { Label, Button } from '../../../components/ui';
import { computeChefScore } from '@/lib/chefScore';
import { Crown, Sparkles, Clock, Lock, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

type AnyProfile = Record<string, any>;

export default function ChefDashboardPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  // 1) Session supabase obligatoire
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (!data?.session?.user) {
        router.replace('/chef/login');
        return;
      }

      setSbUser(data.session.user);
      setBooting(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  // 2) Charger profil DB une fois qu’on a l’id supabase
  useEffect(() => {
    if (!sbUser?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`,
          { cache: 'no-store' }
        );
        const json = await res.json();
        if (!cancelled) setSettingsProfile(json?.profile ?? null);
      } catch (e) {
        console.error('DASH PROFILE FETCH ERROR', e);
        if (!cancelled) setSettingsProfile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  if (booting) {
    return (
      <ChefLayout>
        <div className="p-10 text-sm text-stone-500">Chargement…</div>
      </ChefLayout>
    );
  }

  // 3) merged profile : Supabase user + DB profile
  const mergedProfile = useMemo(() => {
    const p = settingsProfile ?? {};
    return {
      ...p,
      email: p.email ?? sbUser?.email ?? '',
      name: p.name ?? sbUser?.user_metadata?.name ?? '',
    };
  }, [settingsProfile, sbUser]);

  const profileForScore = useMemo(() => {
    const p: any = mergedProfile ?? {};
    return {
      name: String(p.name ?? '').trim(),
      phone: String(p.phone ?? '').trim(),
      city: String(p.city ?? p.location?.baseCity ?? '').trim(),
      bio: String(p.bio ?? '').trim(),
      cuisines: Array.isArray(p.cuisines) ? p.cuisines : [],
      languages: Array.isArray(p.languages) ? p.languages : [],
      avatarUrl: String(p.avatarUrl ?? p.photoUrl ?? '').trim(),
    };
  }, [mergedProfile]);

  const { score } = useMemo(() => computeChefScore(profileForScore), [profileForScore]);

  const tier = useMemo(() => {
    if (score >= 90) return { label: 'Priorité MAX', icon: Crown };
    if (score >= 70) return { label: 'Prioritaire', icon: Sparkles };
    if (score >= 40) return { label: 'En progression', icon: Clock };
    return { label: 'À compléter', icon: Lock };
  }, [score]);

  const TierIcon = tier.icon;

  return (
    <ChefLayout>
      <div className="p-10 space-y-6">
        <div className="flex items-center gap-3">
          <Label className="mb-0">Tableau de bord</Label>
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">
            <TierIcon className="w-3 h-3" />
            {tier.label}
          </span>
        </div>

        <div className="text-2xl font-serif text-stone-900">
          Bonjour {mergedProfile?.name || 'Chef'}.
        </div>

        <div className="text-sm text-stone-500">Score : {score}/100</div>

        <Link href="/chef/settings">
          <Button className="bg-stone-900 hover:bg-stone-800">
            Compléter le profil <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </ChefLayout>
  );
}
