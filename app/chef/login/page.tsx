'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefLoginPage() {
  const router = useRouter();

  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ Attendre INITIAL_SESSION avant de décider de redirect
  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        setAuthReady(true);
        if (session?.user) router.replace('/chef/dashboard');
      }

      // si on se connecte depuis cette page
      if (event === 'SIGNED_IN') {
        router.replace('/chef/dashboard');
      }
    });

    // déclenche l'INITIAL_SESSION
    supabase.auth.getSession().catch(() => {});

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error('Veuillez entrer un email.');
      if (!password) throw new Error('Veuillez entrer un mot de passe.');

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;

      // redirect géré par SIGNED_IN
    } catch (e: any) {
      setMsg(e?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-stone-200 bg-white p-8">
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest uppercase text-stone-400">Espace Chef</div>
          <h1 className="text-3xl font-serif text-stone-900 mt-2">Connexion</h1>
        </div>

        {!authReady ? (
          <div className="text-sm text-stone-600">Chargement…</div>
        ) : (
          <form onSubmit={onLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stone-400">Email</label>
              <input
                className="w-full border-b border-stone-300 bg-transparent py-3 outline-none"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: chef@exemple.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stone-400">Mot de passe</label>
              <input
                className="w-full border-b border-stone-300 bg-transparent py-3 outline-none"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
            </div>

            {msg && <div className="text-sm text-stone-600">{msg}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 text-white py-3 hover:bg-stone-800 disabled:opacity-50"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="text-center text-xs text-stone-500">
              Pas encore de compte ?{' '}
              <Link href="/chef/signup" className="underline">
                Créer un compte
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
