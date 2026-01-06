'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Marker, Label } from '../../../components/ui';
import { Loader2, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

export default function ChefSignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ✅ Si déjà connecté, on renvoie au dashboard
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) router.replace('/chef/dashboard');
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  // ✅ pose le cookie gate chef (middleware) si ton endpoint existe
  const ensureChefGateCookie = async () => {
    try {
      // ton middleware autorise /api/access
      // adapte si ton endpoint est différent (mais chez toi c'est /api/access)
      await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: 'chef' }),
        cache: 'no-store',
      });
    } catch {
      // silencieux: si ça échoue, on laisse quand même tenter le dashboard
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccessMsg(null);

  try {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) throw new Error('Veuillez entrer un email.');
    if (password.length < 8) throw new Error('Mot de passe trop court (8+ caractères).');

    // 1) stocke le mini profil (optionnel mais utile)
    localStorage.setItem(
      'chef_pending_profile',
      JSON.stringify({
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
      })
    );

    // 2) SignUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstName, lastName, role: 'chef' },
      },
    });

    if (signUpError) throw signUpError;

    // ✅ 3) Si Supabase renvoie déjà une session → go dashboard
    if (signUpData?.session) {
      router.replace('/chef/dashboard');
      return;
    }

    // ✅ 4) Sinon : on force une session en login email/password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    if (signInData?.session) {
      router.replace('/chef/dashboard');
      return;
    }

    // Si malgré tout pas de session (cas rare)
    setSuccessMsg(`✅ Compte créé, mais connexion impossible automatiquement. Réessayez.`);
  } catch (err: any) {
    console.error(err);
    setError(err?.message || 'Une erreur est survenue');
  } finally {
    setLoading(false);
  }
};
  
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      {/* Left */}
      <div className="hidden md:block relative overflow-hidden bg-stone-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/55 to-black/70" />

        <div className="absolute inset-0 p-12 flex items-center justify-center">
          <div className="max-w-lg text-center">
            <div className="text-[10px] uppercase tracking-[0.35em] text-stone-200/80">
              Chef Talents • Accès privé
            </div>

            <h2 className="text-4xl font-serif mt-6 leading-tight text-stone-50">
              Un réseau discret,
              <br />
              des missions premium.
            </h2>

            <p className="mt-5 text-stone-100/80 font-light leading-relaxed">
              Villas, résidences et yachts. Matching selon vos disponibilités, demandes qualifiées.
            </p>

            <div className="mt-8 space-y-3 text-sm text-stone-100/80 inline-block text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stone-200/80" />
                <span>Accès aux missions dès l’ouverture</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-200/80" />
                <span>Profil non public • données protégées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-stone-200/80" />
                <span>Inscription en 2 minutes (profil à compléter ensuite)</span>
              </div>
            </div>

            <div className="mt-10 text-xs text-stone-200/70 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Ce lien est réservé aux chefs invités.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-8 md:p-24">
        <div className="w-full max-w-md space-y-7">
          <div className="text-center md:text-left">
            <Marker className="mx-auto md:mx-0" />
            <Label>Candidature Chef</Label>

            <div className="mt-4 space-y-2">
              <h1 className="text-3xl font-serif text-stone-900">Créer votre compte</h1>
              <p className="text-sm text-stone-500 font-light leading-relaxed">
                Créez votre accès, puis complétez votre profil depuis votre Dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  required
                  placeholder="ex : Jean"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  required
                  placeholder="ex : Dupont"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                placeholder="ex : chef@domaine.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                required
                placeholder="8+ caractères"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <div className="text-xs text-stone-400">🔒 Accès privé • connexion par email + mot de passe.</div>
            </div>

            {successMsg && !error && (
              <p className="text-green-700 text-sm bg-green-50 p-3 border border-green-100 rounded-xl">
                {successMsg}
              </p>
            )}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 border border-red-100 rounded-xl">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Commencer mon inscription'}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/chef/login"
                className="text-xs text-stone-600 hover:text-stone-900 border-b border-transparent hover:border-stone-900 transition-all"
              >
                J’ai déjà un compte
              </Link>
            </div>
          </form>

          <div className="text-[11px] text-stone-400 leading-relaxed">
            En créant un compte, vous confirmez que ce lien vous a été partagé par Chef Talents.
          </div>
        </div>
      </div>
    </div>
  );
}
