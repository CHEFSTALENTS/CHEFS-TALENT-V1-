'use client';

import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';
import { ChefProfileType, ChefSeniority } from '../../../types';

export default function ChefProfilePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photoUrl: '',
    languages: '',
    profileType: 'private' as ChefProfileType,
    seniorityLevel: 'confirmed' as ChefSeniority
  });

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      setData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        photoUrl: user.profile?.photoUrl || '',
        languages: user.profile?.languages?.join(', ') || '',
        profileType: user.profile?.profileType || 'private',
        seniorityLevel: user.profile?.seniorityLevel || 'confirmed'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.getCurrentUser();
    if (user) {
      await auth.updateChefProfile(user.id, {
        phone: data.phone,
        photoUrl: data.photoUrl,
        languages: data.languages.split(',').map(s => s.trim()).filter(Boolean),
        profileType: data.profileType,
        seniorityLevel: data.seniorityLevel
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
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Identité & Classification</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
           {/* Section 1: Classification (New) */}
           <div className="space-y-6 pb-8 border-b border-stone-100">
             <h3 className="text-lg font-serif text-stone-900">Classification</h3>
             
             <div className="space-y-4">
                <Label>Type de Profil</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {[
                     { id: 'private', label: 'Chef Privé', sub: 'Dîners & Événements' },
                     { id: 'residence', label: 'Chef Résidence', sub: 'Séjours & Longue durée' },
                     { id: 'yacht', label: 'Chef Yacht', sub: 'Saison ou Charter' },
                     { id: 'pastry', label: 'Chef Pâtissier', sub: 'Spécialiste sucré' }
                   ].map((opt) => (
                     <label key={opt.id} className={`p-4 border cursor-pointer transition-colors ${data.profileType === opt.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="block font-medium text-stone-900 text-sm">{opt.label}</span>
                            <span className="block text-[10px] text-stone-500 uppercase tracking-wide mt-1">{opt.sub}</span>
                          </div>
                          <input 
                            type="radio" 
                            name="profileType" 
                            className="hidden" 
                            checked={data.profileType === opt.id}
                            onChange={() => setData({...data, profileType: opt.id as ChefProfileType})}
                          />
                          <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${data.profileType === opt.id ? 'border-stone-900' : 'border-stone-300'}`}>
                             {data.profileType === opt.id && <div className="w-2 h-2 bg-stone-900 rounded-full" />}
                          </div>
                        </div>
                     </label>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <Label>Niveau d'expérience (Déclaratif)</Label>
                <div className="flex gap-4">
                   {[
                     { id: 'junior', label: 'Junior (1-4 ans)' },
                     { id: 'confirmed', label: 'Confirmé (5-10 ans)' },
                     { id: 'senior', label: 'Senior (10+ ans)' }
                   ].map((opt) => (
                     <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="seniority"
                          className="hidden"
                          checked={data.seniorityLevel === opt.id}
                          onChange={() => setData({...data, seniorityLevel: opt.id as ChefSeniority})}
                        />
                        <div className={`w-4 h-4 border flex items-center justify-center ${data.seniorityLevel === opt.id ? 'border-stone-900 bg-stone-900' : 'border-stone-300'}`}>
                           {data.seniorityLevel === opt.id && <div className="w-1.5 h-1.5 bg-white" />}
                        </div>
                        <span className={`text-sm ${data.seniorityLevel === opt.id ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>{opt.label}</span>
                     </label>
                   ))}
                </div>
             </div>
           </div>

           {/* Section 2: Personal Info */}
           <div className="space-y-6">
             <h3 className="text-lg font-serif text-stone-900">Informations Personnelles</h3>
             
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label>Prénom</Label>
                   <Input disabled value={data.firstName} className="bg-stone-50 text-stone-500" />
                </div>
                <div className="space-y-2">
                   <Label>Nom</Label>
                   <Input disabled value={data.lastName} className="bg-stone-50 text-stone-500" />
                </div>
             </div>
             
             <div className="space-y-2">
                <Label>Email (Identifiant)</Label>
                <Input disabled value={data.email} className="bg-stone-50 text-stone-500" />
             </div>

             <div className="space-y-2">
                <Label>Téléphone mobile</Label>
                <Input 
                  value={data.phone} 
                  onChange={e => setData({...data, phone: e.target.value})} 
                  placeholder="+33 6..." 
                />
             </div>

             <div className="space-y-2">
                <Label>Langues parlées</Label>
                <Input 
                  value={data.languages} 
                  onChange={e => setData({...data, languages: e.target.value})} 
                  placeholder="Français, Anglais, Italien..." 
                />
                <p className="text-xs text-stone-400">Séparez les langues par des virgules.</p>
             </div>
             
             <div className="space-y-2">
                <Label>Photo de profil (URL)</Label>
                <Input 
                  value={data.photoUrl} 
                  onChange={e => setData({...data, photoUrl: e.target.value})} 
                  placeholder="https://..." 
                />
                <p className="text-xs text-stone-400">Lien direct vers votre photo (JPG/PNG). Privilégiez un portrait professionnel sur fond neutre.</p>
             </div>
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
