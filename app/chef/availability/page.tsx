'use client';

import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import * as storage from '@/services/storage';
import { Label, Marker } from '../../../components/ui';

export default function ChefAvailabilityPage() {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const today = new Date();

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user && user.profile?.unavailableDates) {
      setUnavailableDates(user.profile.unavailableDates);
    }
  }, []);

  const toggleDate = async (dateStr: string) => {
    const user = auth.getCurrentUser();
    if (!user) return;

let updated: string[] = [];
    if (unavailableDates.includes(dateStr)) {
      updated = unavailableDates.filter(d => d !== dateStr);
    } else {
      updated = [...unavailableDates, dateStr];
    }
    
    setUnavailableDates(updated);
    await auth.updateChefProfile(user.id, { unavailableDates: updated });
  };

  // Generate next 35 days
  const days = Array.from({ length: 35 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <ChefLayout>
      <div className="max-w-4xl">
        <Marker />
        <Label>Planning</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Disponibilités</h1>
        
        <div className="bg-white p-8 border border-stone-200">
           <div className="mb-8">
              <p className="text-stone-500 font-light">
                Par défaut, vous êtes considéré comme <strong>disponible</strong>. 
                Cliquez sur les dates pour les marquer comme <span className="text-red-500 font-medium">indisponibles</span>.
              </p>
           </div>

           <div className="grid grid-cols-7 gap-px bg-stone-200 border border-stone-200">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                 <div key={day} className="bg-stone-50 p-4 text-center text-xs font-medium uppercase tracking-widest text-stone-400">
                    {day}
                 </div>
              ))}
              {days.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const isUnavailable = unavailableDates.includes(dateStr);
                return (
                  <button 
                    key={dateStr}
                    onClick={() => toggleDate(dateStr)}
                    className={`h-32 p-4 text-left transition-colors relative group hover:bg-stone-50 ${isUnavailable ? 'bg-stone-100' : 'bg-white'}`}
                  >
                    <span className={`text-sm font-medium ${isUnavailable ? 'text-stone-400' : 'text-stone-900'}`}>
                      {date.getDate()}
                    </span>
                    
                    {isUnavailable && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <span className="text-xs uppercase tracking-widest text-red-400 bg-red-50 px-2 py-1">Occupé</span>
                      </div>
                    )}
                  </button>
                );
              })}
           </div>
        </div>
      </div>
    </ChefLayout>
  );
}
