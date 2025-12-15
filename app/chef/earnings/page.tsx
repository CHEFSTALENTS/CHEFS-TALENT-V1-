'use client';

import React, { useState, useEffect } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth, api } from '../../../services/storage';
import type { Mission } from '../../../types';
import { Marker, Label } from '../../../components/ui';
import { Euro, TrendingUp, CalendarCheck, BarChart3, Loader2 } from 'lucide-react';

export default function ChefEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    const fetchMissions = async () => {
      const user = auth.getCurrentUser();
      if (user) {
        const data = await api.getChefMissions(user.id);
        setMissions(data);
      }
      setLoading(false);
    };
    fetchMissions();
  }, []);

  // KPIs
  const completedMissions = missions.filter(m => m.status === 'completed');
  
  const totalRevenue = completedMissions.reduce((acc, m) => acc + m.estimatedAmount, 0);
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  const revenue30d = completedMissions
    .filter(m => new Date(m.startDate) > thirtyDaysAgo)
    .reduce((acc, m) => acc + m.estimatedAmount, 0);

  const averageBasket = completedMissions.length > 0 
    ? Math.round(totalRevenue / completedMissions.length) 
    : 0;

  return (
    <ChefLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <Marker />
          <Label>Performance</Label>
          <h1 className="text-3xl font-serif text-stone-900">Revenus & Activité</h1>
        </div>

        {loading ? (
           <div className="py-20 flex justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
           </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               <StatCard 
                 label="CA Total" 
                 value={`${totalRevenue.toLocaleString()} €`} 
                 icon={Euro} 
                 desc="Missions réalisées"
               />
               <StatCard 
                 label="30 Derniers Jours" 
                 value={`${revenue30d.toLocaleString()} €`} 
                 icon={TrendingUp} 
                 desc="Revenus glissants"
               />
               <StatCard 
                 label="Missions" 
                 value={completedMissions.length.toString()} 
                 icon={CalendarCheck} 
                 desc="Complétées"
               />
               <StatCard 
                 label="Panier Moyen" 
                 value={`${averageBasket} €`} 
                 icon={BarChart3} 
                 desc="Par mission"
               />
            </div>

            {/* Recent Earnings Table */}
            <div className="bg-white border border-stone-200 mt-12">
               <div className="p-6 border-b border-stone-100">
                  <h3 className="text-lg font-serif text-stone-900">Détail des revenus</h3>
               </div>
               
               {completedMissions.length > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
                       <tr>
                         <th className="p-4 font-medium">Date</th>
                         <th className="p-4 font-medium">Mission</th>
                         <th className="p-4 font-medium">Lieu</th>
                         <th className="p-4 font-medium text-right">Montant</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-100">
                       {completedMissions.map((mission) => (
                         <tr key={mission.id} className="hover:bg-stone-50 transition-colors">
                           <td className="p-4 text-stone-500 font-mono text-xs">
                             {new Date(mission.startDate).toLocaleDateString()}
                           </td>
                           <td className="p-4 font-medium text-stone-900">
                             {mission.title}
                           </td>
                           <td className="p-4 text-stone-600">
                             {mission.location}
                           </td>
                           <td className="p-4 text-right font-medium text-stone-900">
                             {mission.estimatedAmount} €
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <div className="p-12 text-center text-stone-400 font-light">
                   Aucune donnée de revenu disponible.
                 </div>
               )}
            </div>
          </>
        )}
      </div>
    </ChefLayout>
  );
}

const StatCard = ({ label, value, icon: Icon, desc }: any) => (
  <div className="bg-white border border-stone-200 p-6 flex flex-col justify-between h-32">
     <div className="flex justify-between items-start">
        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">{label}</span>
        <Icon className="w-4 h-4 text-stone-300" />
     </div>
     <div>
        <div className="text-2xl md:text-3xl font-serif text-stone-900">{value}</div>
        <div className="text-xs text-stone-400 font-light mt-1">{desc}</div>
     </div>
  </div>
);
