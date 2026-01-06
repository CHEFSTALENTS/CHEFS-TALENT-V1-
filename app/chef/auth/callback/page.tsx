'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefAuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Connexion en cours…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // 1) Si session déjà présente, go dashboard
        const { data: s1 } = await supabase.auth.getSession();
        if (s1.session) {
          router.replace('/chef/dashboard');
          return;
        }

        // 2) Convertir le hash (#access_token=...) en session
        const hash = window.location.hash || '';
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          // petit tick pour laisser Supabase persister la session
          await new Promise((r) => setTimeout(r, 50));

          router.replace('/chef/dashboard');
          return;
        }

        // 3) Fallback : si rien, renvoyer vers login
        setMsg("Lien invalide ou expiré. Redirection…");
        setTimeout(() => {
          if (!cancelled) router.replace('/chef/login');
        }, 700);
      } catch (e: any) {
        console.error('[auth callback] error', e);
        setMsg("Erreur lors de la connexion. Redirection…");
        setTimeout(() => {
          if (!cancelled) router.replace('/chef/login');
        }, 700);
      }
    };

    run();

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
