'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { ChefLayout } from '../../../components/ChefLayout';
import { computeChefScore } from '@/lib/chefScore';

type AnyProfile = Record<string, any>;

export default function ChefDashboardPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  // 1) Session
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

  // 2) Profil DB
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
        console.error('PROFILE FETCH ERROR', e);
        if (!cancelled) setSettingsProfile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  // 3) memos (toujours exécutés, même si sbUser null)
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

  // 4) render (là tu peux return ce que tu veux)
  if (booting) {
    return (
      <ChefLayout>
        <div className="p-10 text-sm text-stone-500">Chargement…</div>
      </ChefLayout>
    );
  }

  return (
    <ChefLayout>
      <div className="p-10">
        Dashboard OK — score: {score}
      </div>
    </ChefLayout>
  );
}
