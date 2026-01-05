'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // échange le "code" du lien contre une session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;

        // ✅ une fois la session créée -> dashboard direct
        router.replace('/chef/dashboard');
      } catch (e) {
        console.error('[auth callback] error', e);
        router.replace('/chef/login?error=callback');
      }
    };

    run();
  }, [router]);

  return (
    <div className="p-8">
      Connexion en cours…
    </div>
  );
}
