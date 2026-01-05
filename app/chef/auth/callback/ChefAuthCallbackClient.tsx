'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Validation du lien…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = sp.get('next') || '/chef/dashboard';

        // 1) Supabase PKCE: on récupère le "code" dans l’URL
        const code = sp.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // 2) Vérifie qu'on a bien une session
        const { data, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;

        if (!data.session) {
          setMsg("Impossible d’ouvrir la session. Le lien a peut-être expiré.");
          return;
        }

        if (!cancelled) router.replace(next);
      } catch (e: any) {
        console.error('[auth callback] error:', e);
        setMsg(e?.message || "Erreur lors de l’authentification.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  return <div className="p-8">{msg}</div>;
}
