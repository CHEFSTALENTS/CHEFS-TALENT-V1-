'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const href = window.location.href;
        const url = new URL(href);

        // 1) PKCE: ?code=...
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // 2) Ancien format: #access_token=...
          // supabase-js peut auto-détecter si detectSessionInUrl=true,
          // mais on force un tick pour laisser le client stocker la session
          await new Promise((r) => setTimeout(r, 50));
        }

        // 3) Check session
        const { data } = await supabase.auth.getSession();

        if (!alive) return;

        if (data.session) {
          router.replace('/chef/dashboard');
        } else {
          // si toujours pas de session, on renvoie login
          router.replace('/chef/login');
        }
      } catch (e) {
        console.error('[chef/auth/callback] error', e);
        router.replace('/chef/login');
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [router]);

  return <div className="min-h-[60vh] flex items-center justify-center">Connexion en cours…</div>;
}
