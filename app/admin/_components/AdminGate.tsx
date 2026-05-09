'use client';

// app/admin/_components/AdminGate.tsx
// Gate côté client pour toutes les pages /admin/*.
//
// Vérifie que l'utilisateur :
// 1. A une session Supabase active (sinon → redirect /chef/login)
// 2. A un email dans la allowlist admin (sinon → redirect /chef/dashboard)
//
// Pendant le check, affiche un loader. Si OK, render les children.
//
// Note : ce gate est côté client (useEffect après mount). Pour une
// vraie protection server-side, on s'appuie en plus sur :
// - les routes API admin protégées par requireAdmin (Bearer obligatoire)
// - les headers HTTP no-cache + noindex
// Cette défense en profondeur empêche l'accès aux données ; le gate
// client est purement une bonne UX (rediriger l'utilisateur non admin
// vers la bonne page plutôt que d'afficher une UI vide ou un fallback).

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { isAdminEmail } from '@/lib/auth/adminEmails';

type GateState =
  | { status: 'checking' }
  | { status: 'redirecting'; reason: 'no-session' | 'not-admin' }
  | { status: 'authorized'; email: string };

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GateState>({ status: 'checking' });

  useEffect(() => {
    let alive = true;

    // Vérification initiale au mount
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      const session = data?.session;
      const user = session?.user;

      if (error || !session || !user) {
        setState({ status: 'redirecting', reason: 'no-session' });
        const next = pathname && pathname.startsWith('/admin') ? pathname : '/admin';
        router.replace(`/chef/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (!isAdminEmail(user.email)) {
        setState({ status: 'redirecting', reason: 'not-admin' });
        // Cet utilisateur est un chef normal, pas un admin → renvoyer
        // vers son dashboard plutôt que de rester sur /admin
        router.replace('/chef/dashboard');
        return;
      }

      setState({ status: 'authorized', email: user.email || '' });
    })();

    // Sur changement de session (logout depuis un autre onglet, expiration),
    // on re-check pour redirect immédiatement.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (!session?.user) {
        setState({ status: 'redirecting', reason: 'no-session' });
        const next = pathname && pathname.startsWith('/admin') ? pathname : '/admin';
        router.replace(`/chef/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!isAdminEmail(session.user.email)) {
        setState({ status: 'redirecting', reason: 'not-admin' });
        router.replace('/chef/dashboard');
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (state.status === 'checking') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-stone-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (state.status === 'redirecting') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-stone-400 text-sm">
        {state.reason === 'no-session'
          ? 'Session non trouvée — redirection vers la connexion…'
          : 'Accès admin requis — redirection…'}
      </div>
    );
  }

  return <>{children}</>;
}
