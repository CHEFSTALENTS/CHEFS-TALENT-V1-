'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

export default function ChefLoginPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ 1) Si session => dashboard. Sinon => on affiche la page.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data?.session) {
          router.replace('/chef/dashboard');
          return;
        }

        setReady(true);
      } catch {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ✅ 2) Message optionnel (sans useSearchParams)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const reason = sp.get('reason');
      if (reason === 'signed_out') setMsg('Vous êtes déconnecté.');
      if (reason === 'auth_required') setMsg('Veuillez vous connecter pour accéder à votre espace.');
    } catch {}
  }, []);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg('Veuillez entrer un email.');

    setLoading(true);
    try {
      // 🔥 IMPORTANT :
      // Ici tu dois remettre TON flow email+mot de passe (signInWithPassword)
      // Je laisse volontairement une erreur claire si tu n’as pas encore le champ password.
      setMsg("Ajoute le champ 'mot de passe' + signInWithPassword ici.");
    } catch (e: any) {
      setMsg(e?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-sm text-stone-600">Chargement…</div>
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

        {msg && <div className="text-sm text-stone-600 mb-4">{msg}</div>}

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

          {/* 👉 Ajoute ici le champ password si tu es en email+password */}

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
