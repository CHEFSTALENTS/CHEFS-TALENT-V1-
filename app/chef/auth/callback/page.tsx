'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefAuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Connexion en cours…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Récupère la session depuis l’URL (#access_token=...)
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (error) throw error;

        // 2) Vérifie que la session est bien stockée
        const { data: s } = await supabase.auth.getSession();

        if (s?.session?.user?.id) {
          router.replace('/chef/dashboard');
          return;
        }

        // 3) Si pas de session, lien invalide/expiré
        setMsg('Lien invalide ou expiré. Redirection…');
        setTimeout(() => {
          if (!cancelled) router.replace('/chef/login');
        }, 700);
      } catch (e: any) {
        console.error('[chef callback] error', e);
        setMsg('Erreur de connexion. Redirection…');
        setTimeout(() => {
          if (!cancelled) router.replace('/chef/login');
        }, 700);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-sm text-stone-600">{msg}</div>
    </div>
  );
}
