'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/services/supabaseClient';

export default function ChefSignupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg('Veuillez entrer un email.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/chef/auth/callback`,
          shouldCreateUser: true, // signup = crée si inexistant
        },
      });

      if (error) throw error;
      setMsg('✅ Compte créé. Vérifiez vos emails (et les spams) pour ouvrir le lien.');
    } catch (e: any) {
      setMsg(e?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-stone-200 bg-white p-8">
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest uppercase text-stone-400">Espace Chef</div>
          <h1 className="text-3xl font-serif text-stone-900 mt-2">Créer un compte</h1>
        </div>

        <form onSubmit={onSignup} className="space-y-5">
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

          {msg && <div className="text-sm text-stone-600">{msg}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 hover:bg-stone-800 disabled:opacity-50"
          >
            {loading ? 'Envoi…' : 'Créer mon compte'}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-stone-500">
          Déjà un compte ?{' '}
          <Link href="/chef/login" className="underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
