'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Marker, Label } from '../../../components/ui';
import { auth } from '../../../services/storage';
import { Loader2, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

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
    setLoading(true);
    setError('');

    const res = await auth.registerChef(formData);
    setLoading(false);

    if (res.success) {
      router.push('/chef/dashboard');
    } else {
      setError(res.error || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      {/* Left: calm premium panel */}
      <div className="hidden md:block bg-stone-950 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
          alt="Kitchen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/70" />

        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-stone-300">
              Chef Talents • Accès privé
            </div>

            <h2 className="text-4xl font-serif mt-6 leading-tight">
              Un réseau discret,
              <br />
              des missions premium.
            </h2>

            <p className="text-stone-300 font-light mt-5 max-w-md leading-relaxed">
              Villas, résidences et yachts. Matching selon vos disponibilités, demandes qualifiées.
            </p>

            <div className="mt-8 space-y-3 text-sm text-stone-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stone-300" />
                <span>Accès aux missions dès l’ouverture</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-300" />
                <span>Profil non public • données protégées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-stone-300" />
                <span>Inscription en 2 minutes (profil complet ensuite)</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Ce lien est réservé aux chefs invités.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8 md:p-24">
        <div className="w-full max-w-md space-y-7">
          <div className="text-center md:text-left">
            <Marker className="mx-auto md:mx-0" />
            <Label>Candidature Chef</Label>

            <div className="mt-4 space-y-2">
              <h1 className="text-3xl font-serif text-stone-900">Créer votre accès</h1>
              <p className="text-sm text-stone-500 font-light leading-relaxed">
                Étape 1/3 — Compte. <span className="text-stone-700">Vous complèterez votre profil juste après.</span>
              </p>
            </div>
          </div>

          <div className="border border-stone-200 bg-white rounded-2xl p-4">
            <div className="text-xs uppercase tracking-widest text-stone-400">Après création</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="text-stone-900 font-medium">2/3</div>
                <div className="text-stone-500">Profil</div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="text-stone-900 font-medium">3/3</div>
                <div className="text-stone-500">Tarifs</div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="text-stone-900 font-medium">Validation</div>
                <div className="text-stone-500">Admin</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  required
                  placeholder="ex : Thomas"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  required
                  placeholder="ex : Delcroix"
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
              <div className="text-xs text-stone-400">
                🔒 Accès privé • votre profil ne sera pas visible publiquement.
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 border border-red-100 rounded-xl">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Commencer mon inscription'}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-stone-500">
                Besoin d’aide ? <span className="text-stone-700">Contact admin</span>
              </div>

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
