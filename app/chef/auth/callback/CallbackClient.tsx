'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/chef/dashboard';

  useEffect(() => {
    (async () => {
      // Avec Supabase v2, la session est généralement déjà créée après callback.
      // On check juste et on redirige.
      const { data } = await supabase.auth.getSession();
      if (data?.session) router.replace(next);
      else router.replace('/chef/login');
    })();
  }, [router, next]);

  return <div className="p-8">Connexion…</div>;
}
