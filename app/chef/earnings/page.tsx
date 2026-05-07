'use client';

import React, { useState, useEffect } from 'react';
import { auth, api } from '../../../services/storage';
import type { Mission } from '@/types';
import { Marker, Label } from '../../../components/ui';
import { Euro, TrendingUp, CalendarCheck, BarChart3, Loader2 } from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';

export default function ChefEarningsPage() {
  const { t } = useChefLocale();
  const dateLocale = t.availability.dateLocale;
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
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <Marker />
          <Label>{t.earnings.pageLabel}</Label>
          <h1 className="text-3xl font-serif text-stone-900">{t.earnings.pageTitle}</h1>
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
                 label={t.earnings.kpis.totalLabel}
                 value={`${totalRevenue.toLocaleString(dateLocale)} €`}
                 icon={Euro}
                 desc={t.earnings.kpis.totalDesc}
               />
               <StatCard
                 label={t.earnings.kpis.last30Label}
                 value={`${revenue30d.toLocaleString(dateLocale)} €`}
                 icon={TrendingUp}
                 desc={t.earnings.kpis.last30Desc}
               />
               <StatCard
                 label={t.earnings.kpis.missionsLabel}
                 value={completedMissions.length.toString()}
                 icon={CalendarCheck}
                 desc={t.earnings.kpis.missionsDesc}
               />
               <StatCard
                 label={t.earnings.kpis.averageLabel}
                 value={`${averageBasket} €`}
                 icon={BarChart3}
                 desc={t.earnings.kpis.averageDesc}
               />
            </div>

            {/* Recent Earnings Table */}
            <div className="bg-white border border-stone-200 mt-12">
               <div className="p-6 border-b border-stone-100">
                  <h3 className="text-lg font-serif text-stone-900">{t.earnings.detailsTitle}</h3>
               </div>

               {completedMissions.length > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-xs border-b border-stone-200">
                       <tr>
                         <th className="p-4 font-medium">{t.earnings.tableDate}</th>
                         <th className="p-4 font-medium">{t.earnings.tableMission}</th>
                         <th className="p-4 font-medium">{t.earnings.tableLocation}</th>
                         <th className="p-4 font-medium text-right">{t.earnings.tableAmount}</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-100">
                       {completedMissions.map((mission) => (
                         <tr key={mission.id} className="hover:bg-stone-50 transition-colors">
                           <td className="p-4 text-stone-500 font-mono text-xs">
                             {new Date(mission.startDate).toLocaleDateString(dateLocale)}
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
                   {t.earnings.empty}
                 </div>
               )}
            </div>
          </>
        )}
      </div>
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
