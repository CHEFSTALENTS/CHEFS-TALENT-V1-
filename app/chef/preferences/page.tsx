'use client';

import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

export default function ChefPreferencesPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState({
    minBudgetPerDay: 400,
    maxGuestCount: 10,
    teamAcceptance: 'solo' as 'solo' | 'assistants' | 'brigade'
  });

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user && user.profile) {
      setData({
        minBudgetPerDay: user.profile.minBudgetPerDay || 400,
        maxGuestCount: user.profile.maxGuestCount || 10,
        teamAcceptance: user.profile.teamAcceptance || 'solo'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.getCurrentUser();
    if (user) {
      await auth.updateChefProfile(user.id, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  return (
    <ChefLayout>
      <div className="max-w-2xl">
        <Marker />
        <Label>Critères</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Préférences de Mission</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
           
           <div className="space-y-2">
              <Label>TJM Minimum (€ / jour)</Label>
              <Input 
                type="number"
                value={data.minBudgetPerDay} 
                onChange={e => setData({...data, minBudgetPerDay: parseInt(e.target.value)})} 
                className="w-32"
              />
              <p className="text-xs text-stone-400">Ce montant est indicatif pour le matching.</p>
           </div>

           <div className="space-y-2">
              <Label>Capacité maximale (Couverts)</Label>
              <Input 
                type="number"
                value={data.maxGuestCount} 
                onChange={e => setData({...data, maxGuestCount: parseInt(e.target.value)})} 
                className="w-32"
              />
              <p className="text-xs text-stone-400">Nombre de convives maximum pour un service seul.</p>
           </div>

           <div className="space-y-4">
              <Label>Travail en équipe</Label>
              <div className="space-y-3">
                 {[
                   {id: 'solo', label: 'Seul uniquement'},
                   {id: 'assistants', label: 'Accepte des assistants'},
                   {id: 'brigade', label: 'Habitué aux brigades'}
                 ].map((opt) => (
                   <label key={opt.id} className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${data.teamAcceptance === opt.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200'}`}>
                      <input 
                        type="radio" 
                        name="team"
                        className="hidden" 
                        checked={data.teamAcceptance === opt.id}
                        onChange={() => setData({...data, teamAcceptance: opt.id as any})}
                      />
                      <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${data.teamAcceptance === opt.id ? 'border-stone-900' : 'border-stone-300'}`}>
                         {data.teamAcceptance === opt.id && <div className="w-2 h-2 bg-stone-900 rounded-full" />}
                      </div>
                      <span className="text-sm font-medium text-stone-800">{opt.label}</span>
                   </label>
                 ))}
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