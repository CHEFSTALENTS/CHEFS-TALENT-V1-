'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/services/supabaseClient';

export default function ChefLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg('Veuillez entrer un email.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          // IMPORTANT : doit être dans Supabase > Auth > URL Configuration (Redirect URLs)
          emailRedirectTo: `${window.location.origin}/chef/auth/callback`,
        },
      });

      if (error) throw error;

      setMsg('✅ Lien envoyé. Vérifiez vos emails (et les spams).');
    } catch (e: any) {
      setMsg(e?.message || 'Erreur lors de l’envoi du lien.');
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) router.replace('/chef/dashboard');
  });
}, []);
  
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-stone-200 bg-white p-8">
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest uppercase text-stone-400">Espace Chef</div>
          <h1 className="text-3xl font-serif text-stone-900 mt-2">Connexion</h1>
        </div>

        <form onSubmit={onSendMagicLink} className="space-y-5">
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
            {loading ? 'Envoi…' : 'Recevoir un lien de connexion'}
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
