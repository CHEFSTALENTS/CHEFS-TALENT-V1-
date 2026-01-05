'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      // Supabase met la session à jour automatiquement via le lien OTP.
      // Ici on force juste un refresh session (safe) puis on redirige.
      await supabase.auth.getSession();

      // Si tu veux lire un param optionnel (ex: next=/chef/dashboard), tu peux :
      const next = searchParams.get('next') || '/chef/dashboard';
      router.replace(next);
    })();
  }, [router, searchParams]);

  return (
    <div className="p-8 text-sm text-stone-600">
      Connexion en cours…
    </div>
  );
}
