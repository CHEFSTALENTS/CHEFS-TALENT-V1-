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
        // 0) si session existe déjà => dashboard
        const { data: s0 } = await supabase.auth.getSession();
        if (s0.session) {
          router.replace('/chef/dashboard');
          return;
        }

        // 1) PKCE flow: ?code=...
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // petit tick pour persister la session
          await new Promise((r) => setTimeout(r, 50));

          router.replace('/chef/dashboard');
          return;
        }

        // 2) fallback legacy hash: #access_token=... (au cas où)
        const hash = window.location.hash || '';
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;

          await new Promise((r) => setTimeout(r, 50));
          router.replace('/chef/dashboard');
          return;
        }

        // 3) rien trouvé => lien invalide/expiré
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
