'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Marker, Label } from '../../../components/ui';
import { auth } from '../../../services/storage';
import { Loader2 } from 'lucide-react';

export default function ChefLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await auth.loginChef(formData.email, formData.password);
    setLoading(false);

    if (res.success) {
      router.push('/chef/dashboard');
    } else {
      setError(res.error || "Identifiants invalides");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-md bg-white p-12 border border-stone-200 shadow-sm space-y-8">
         <div className="text-center">
           <Marker className="mx-auto" />
           <Label>Espace Chef</Label>
           <h1 className="text-3xl font-serif text-stone-900 mt-4">Connexion</h1>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                 type="email" 
                 required 
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input 
                 type="password" 
                 required 
                 value={formData.password}
                 onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 border border-red-100">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Se connecter"}
            </Button>
         </form>

         <div className="text-center border-t border-stone-100 pt-8">
            <p className="text-stone-400 text-sm mb-4">Pas encore membre ?</p>
            <Link href="/chef/signup">
              <Button variant="outline" className="w-full">Créer un compte</Button>
            </Link>
         </div>
      </div>
    </div>
  );
}