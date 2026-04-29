'use client';

import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      if (!email) throw new Error('Email manquant.');
      if (!password || password.length < 8) throw new Error('Mot de passe: 8+ caractères.');

      // ✅ 1) Création du vrai compte Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            role: 'chef',
          },
        },
      });

      if (signUpError) throw signUpError;

      const userId = data.user?.id;
      if (!userId) {
        // Cas fréquent si "email confirmation" activé: user peut être null selon config
        // On redirige vers login + message
        router.replace('/chef/login?checkEmail=1');
        return;
      }

      // ✅ 2) Optionnel: créer le profil en DB (si ton endpoint existe)
      // (si tu n'as pas encore /api/chef/profile, commente ce bloc)
      await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          profile: {
            id: userId,
            email,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      // ✅ 3) Redirection
      // Si confirmation email ON, l'utilisateur n'aura pas de session -> login
      // Sinon il peut être direct dashboard
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        router.replace('/chef/dashboard');
      } else {
        router.replace('/chef/login?justSignedUp=1');
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création du compte.');
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
                <span>Accès aux missions au cas par cas</span>
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
              <div className="text-xs text-stone-400">🔒 Accès privé • votre profil ne sera pas public.</div>
            </div>

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
