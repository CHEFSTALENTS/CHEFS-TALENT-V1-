'use client';

import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Textarea, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

export default function ChefExperiencePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState({
    yearsExperience: 0,
    bio: '',
    specialties: '',
    environments: [] as string[]
  });

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user && user.profile) {
      setData({
        yearsExperience: user.profile.yearsExperience || 0,
        bio: user.profile.bio || '',
        specialties: user.profile.specialties?.join(', ') || '',
        environments: user.profile.environments || []
      });
    }
  }, []);
  
async function saveChefProfilePatch(patch: any) {
  const user = auth.getCurrentUser?.();
  if (!user?.id) throw new Error("No user");

  // 1) GET existing profile from DB
  const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`);
  const json = await resGet.json();
  const current = json?.profile ?? {};

  // 2) merge
  const merged = {
    ...current,
    ...patch,
    id: user.id,
    email: user.email,
    updatedAt: new Date().toISOString(),
  };

  // 3) PUT
  const resPut = await fetch("/api/chef/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, profile: merged }),
  });

  if (!resPut.ok) throw new Error(await resPut.text());

  return merged;
}
  const toggleEnv = (env: string) => {
    setData(prev => ({
      ...prev,
      environments: prev.environments.includes(env) 
        ? prev.environments.filter(e => e !== env)
        : [...prev.environments, env]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.getCurrentUser();
    if (user) {
      await auth.updateChefProfile(user.id, {
        yearsExperience: data.yearsExperience,
        bio: data.bio,
        environments: data.environments,
        specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean)
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  return (
    <ChefLayout>
      <div className="max-w-2xl">
        <Marker />
        <Label>Profil</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Expérience & Parcours</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
           
           <div className="space-y-2">
              <Label>Années d'expérience (Cuisine)</Label>
              <Input 
                type="number"
                min={0}
                value={data.yearsExperience} 
                onChange={e => setData({...data, yearsExperience: parseInt(e.target.value)})} 
                className="w-24"
              />
           </div>

           <div className="space-y-4">
              <Label>Environnements Maîtrisés</Label>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   {id: 'restaurant', label: 'Restaurant Gastronomique'},
                   {id: 'hotel', label: 'Hôtellerie de Luxe'},
                   {id: 'private_villa', label: 'Villa Privée'},
                   {id: 'yacht', label: 'Yachting (>30m)'},
                   {id: 'chalet', label: 'Chalet Montagne'},
                   {id: 'events', label: 'Traiteur / Événementiel'}
                 ].map((env) => (
                   <label key={env.id} className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${data.environments.includes(env.id) ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                      <span className="text-sm font-medium text-stone-800">{env.label}</span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={data.environments.includes(env.id)}
                        onChange={() => toggleEnv(env.id)}
                      />
                      <div className={`w-4 h-4 border flex items-center justify-center ${data.environments.includes(env.id) ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
                         {data.environments.includes(env.id) && <div className="w-1.5 h-1.5 bg-white" />}
                      </div>
                   </label>
                 ))}
              </div>
           </div>

           <div className="space-y-2">
              <Label>Spécialités Culinaires</Label>
              <Input 
                value={data.specialties} 
                onChange={e => setData({...data, specialties: e.target.value})} 
                placeholder="Méditerranéenne, Japonaise, Pâtisserie..." 
              />
              <p className="text-xs text-stone-400">Séparez par des virgules.</p>
           </div>
           
           <div className="space-y-2">
              <Label>Bio Professionnelle</Label>
              <Textarea 
                value={data.bio} 
                onChange={e => setData({...data, bio: e.target.value})} 
                placeholder="Décrivez votre parcours, votre philosophie et vos expériences marquantes..."
                className="h-40" 
              />
              <p className="text-xs text-stone-400">Ce texte sera visible par les clients. Soyez précis et professionnel.</p>
           </div>

           <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
              {success && <span className="text-sm text-green-600">Modifications enregistrées.</span>}
              <Button type="submit" disabled={loading} className="ml-auto w-32">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
              </Button>
           </div>
        </form>
      </div>
    </ChefLayout>
  );
}
