'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ Si session déjà présente => dashboard
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data?.session) {
        router.replace('/chef/dashboard');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg('Veuillez entrer votre email.');
    if (!password) return setMsg('Veuillez entrer votre mot de passe.');

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      // ✅ session ok => dashboard
      if (data?.session) {
        router.replace('/chef/dashboard');
        return;
      }

      setMsg("Connexion impossible. Veuillez réessayer.");
    } catch (e: any) {
      const m = String(e?.message || '');
      // messages plus “humains”
      if (m.toLowerCase().includes('invalid')) {
        setMsg('Identifiants invalides. Vérifiez email et mot de passe.');
      } else {
        setMsg(m || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    setMsg(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg('Entrez votre email pour recevoir un lien de réinitialisation.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/chef/settings`, // ou une page dédiée si tu en as une
      });
      if (error) throw error;
      setMsg('✅ Email envoyé. Vérifiez votre boîte mail (et spams).');
    } catch (e: any) {
      setMsg(e?.message || 'Erreur lors de l’envoi du lien.');
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

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading}
            className="w-full border border-stone-200 py-3 text-sm text-stone-700 hover:border-stone-400 disabled:opacity-50"
          >
            Mot de passe oublié
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
