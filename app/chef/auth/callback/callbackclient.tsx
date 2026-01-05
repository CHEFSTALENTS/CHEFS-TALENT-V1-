'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Connexion en cours…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Supabase (PKCE) renvoie souvent un ?code=...
        const code = sp.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // fallback: parfois session déjà posée
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        if (!cancelled) router.replace('/chef/dashboard');
      } catch (e: any) {
        console.error('[auth callback] error', e);
        if (!cancelled) setMsg(e?.message || 'Erreur de connexion');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  return (
    <div className="p-8">
      <div className="text-sm text-stone-600">{msg}</div>
    </div>
  );
}
