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
        // 0) Si Supabase t’envoie un code (PKCE), il est dans ?code=
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          // ✅ PKCE flow
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // Nettoie l’URL (retire le code)
          window.history.replaceState({}, document.title, '/chef/auth/callback');

        } else {
          // 1) Sinon, ancien flow: #access_token=...
          const hasHashToken =
            typeof window !== 'undefined' &&
            window.location.hash &&
            window.location.hash.includes('access_token=');

          if (hasHashToken) {
            const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
            if (error) throw error;

            // Nettoie l’URL (retire le hash)
            window.history.replaceState({}, document.title, '/chef/auth/callback');
          }
        }

        // 2) Vérifie que la session est bien stockée
        const { data: s } = await supabase.auth.getSession();
        const userId = s?.session?.user?.id;

        if (userId) {
          // ✅ Important: replace => évite de revenir au callback via "back"
          router.replace('/chef/dashboard');
          return;
        }

        // 3) Pas de session => lien expiré / mauvais domaine / redirect non autorisé
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
