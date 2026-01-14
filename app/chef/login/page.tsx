'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

// ✅ Empêche Next de tenter du pre-render/export statique sur cette page
export const dynamic = 'force-dynamic';

export default function ChefLoginPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ Si déjà connecté -> dashboard (sans clignotement)
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (data?.session?.user) {
        router.replace('/chef/dashboard');
        return;
      }

      setChecking(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg('Veuillez entrer un email.');
    if (!password) return setMsg('Veuillez entrer votre mot de passe.');

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      // ✅ sécurité: si session pas instant, on re-check
      const session = data?.session ?? (await supabase.auth.getSession()).data.session;
      if (!session?.user) throw new Error('Session non créée.');

      router.replace('/chef/dashboard');
    } catch (e: any) {
      setMsg(e?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ écran de vérif session (évite page blanche / blink)
  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-sm text-stone-500">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-stone-200 bg-white p-8">
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest uppercase text-stone-400">Espace Chef</div>
          <h1 className="text-3xl font-serif text-stone-900 mt-2">Connexion</h1>
        </div>

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
            <div className="flex items-end justify-between gap-3">
              <label className="text-xs uppercase tracking-widest text-stone-400">
                Mot de passe
              </label>

              {/* ✅ Lien mot de passe oublié (dans le JSX, donc visible) */}
              <Link
                href="/chef/forgot-password"
                className="text-xs underline text-stone-500 hover:text-stone-900"
              >
                Mot de passe oublié ?
              </Link>
            </div>

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
        </form>

        <div className="text-center mt-6 text-xs text-stone-500">
          Pas encore de compte ?{' '}
          <Link href="/chef/signup" className="underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
