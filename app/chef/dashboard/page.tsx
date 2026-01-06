'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { ChefLayout } from '../../../components/ChefLayout';

type AnyProfile = Record<string, any>;

export default function ChefDashboardPage() {
  const router = useRouter();
  const didRedirect = useRef(false);

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);
  const [settingsProfile, setSettingsProfile] = useState<AnyProfile | null>(null);

  // 1) Session Supabase = source de vérité
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

  // 2) Charger le profil DB quand on a l'user
  useEffect(() => {
    if (!sbUser?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, {
          cache: 'no-store',
        });
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

  // 3) Hooks OK (toujours appelés, pas de return “tôt” avant useMemo)
  const mergedProfile = useMemo(() => {
    return {
      email: sbUser?.email ?? '',
      ...(settingsProfile ?? {}),
    };
  }, [sbUser?.email, settingsProfile]);

  if (booting) return <div className="p-10">Chargement…</div>;
  if (!sbUser) return null; // OK car après tous les hooks

  return (
    <ChefLayout>
      <div className="p-10">
        <h1 className="text-2xl">Dashboard</h1>
        <pre className="mt-6 text-xs opacity-70">{JSON.stringify(mergedProfile, null, 2)}</pre>
      </div>
    </ChefLayout>
  );
}
