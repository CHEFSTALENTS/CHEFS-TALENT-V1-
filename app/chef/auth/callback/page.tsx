'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefAuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Supabase met généralement ?code=... dans l’URL (OAuth / Magic link)
        const code = search.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // optionnel: next=/chef/dashboard
        const next = search.get('next') || '/chef/dashboard';
        if (!cancelled) router.replace(next);
      } catch (e: any) {
        console.error('[auth callback] error', e);
        if (!cancelled) setError(e?.message || 'Erreur de connexion');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, search]);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Erreur</h1>
        <p className="mt-2 text-stone-600">{error}</p>
        <p className="mt-4 text-sm text-stone-500">
          Tu peux réessayer depuis <a className="underline" href="/chef/login">/chef/login</a>.
        </p>
      </div>
    );
  }

  return <div className="p-8">Connexion en cours…</div>;
}
