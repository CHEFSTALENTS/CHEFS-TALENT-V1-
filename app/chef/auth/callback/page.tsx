'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        // 🔥 CRUCIAL : sans ça => pas de session => retour login
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session) {
          router.replace('/chef/dashboard');
        } else {
          router.replace('/chef/login');
        }
      } catch (e) {
        console.error('[chef/auth/callback] error', e);
        router.replace('/chef/login');
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      Connexion en cours…
    </div>
  );
}
