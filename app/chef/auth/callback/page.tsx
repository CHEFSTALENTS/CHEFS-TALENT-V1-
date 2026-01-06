'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

function parseHashTokens() {
  // Exemple: https://.../chef/auth/callback#access_token=...&refresh_token=...&expires_in=...
  const hash = window.location.hash?.replace(/^#/, '') || '';
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  return { access_token, refresh_token };
}

export default function ChefAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = new URL(window.location.href);

        // ✅ PKCE support (si un jour tu passes en ?code=)
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // ✅ Implicit flow support (#access_token)
          const { access_token, refresh_token } = parseHashTokens();

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
          }
        }

        // Vérifie session
        const { data } = await supabase.auth.getSession();

        if (!alive) return;

        if (data?.session) {
          // Nettoie l'URL (enlève le hash access_token)
          window.history.replaceState({}, document.title, '/chef/auth/callback');
          router.replace('/chef/dashboard');
        } else {
          router.replace('/chef/login');
        }
      } catch (e) {
        console.error('[chef/auth/callback] error', e);
        router.replace('/chef/login');
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      Connexion en cours…
    </div>
  );
}
