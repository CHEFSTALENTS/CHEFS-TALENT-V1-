'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState('Finalisation de la connexion…');

  useEffect(() => {
    const run = async () => {
      try {
        const code = sp.get('code');
        const error_description = sp.get('error_description');
        const error = sp.get('error');

        if (error || error_description) {
          setMsg(`Erreur: ${error_description || error || 'inconnue'}`);
          return;
        }

        // ✅ IMPORTANT : échange code -> session
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        }

        // ✅ si session OK -> dashboard
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace('/chef/dashboard');
          return;
        }

        // sinon -> login
        router.replace('/chef/login');
      } catch (e: any) {
        setMsg(e?.message || 'Erreur lors de la connexion.');
        router.replace('/chef/login');
      }
    };

    run();
  }, [router, sp]);

  return <div className="p-8">{msg}</div>;
}
