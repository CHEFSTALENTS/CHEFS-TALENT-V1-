'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

function parseHashParams(hash: string) {
  // hash = "#access_token=...&refresh_token=...&token_type=bearer&expires_in=3600"
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    token_type: params.get('token_type'),
    expires_in: params.get('expires_in'),
  };
}

export default function ChefAuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState('Connexion en cours…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        // 1) ✅ PKCE flow (?code=...)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // Nettoie l’URL
          window.history.replaceState({}, document.title, '/chef/auth/callback');
        } else {
          // 2) ✅ Implicit flow (#access_token=...)
          const hash = window.location.hash || '';
          const { access_token, refresh_token } = parseHashParams(hash);

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;

            // Nettoie l’URL (retire le hash)
            window.history.replaceState({}, document.title, '/chef/auth/callback');
          }
        }

        // 3) Vérifie qu’on a bien une session persistée
        const { data: s } = await supabase.auth.getSession();
        const userId = s?.session?.user?.id;

        if (userId) {
          router.replace('/chef/dashboard');
          return;
        }

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
