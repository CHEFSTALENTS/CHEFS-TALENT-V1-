'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, auth } from '../../../services/storage';
import { RequestEntity, ChefUser, Mission } from '../../../types';
import { Marker, Label, Button } from '../../../components/ui';
import { MessageSquare, ChefHat, Briefcase, AlertCircle, ArrowRight, Bell } from 'lucide-react';

export default function Dashboard() {
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const loadData = async () => {
      const [r, c, m] = await Promise.all([
        api.getRequests(),
        auth.getAllChefs(),
        api.getAllMissions()
      ]);
      setRequests(r);
      setChefs(c);
      setMissions(m);
    };
    loadData();
  }, []);

  if (!isClient) return null;

  // --- KPI LOGIC ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pendingChefs = chefs.filter(c => c.status === 'pending_validation').length;
  const newRequests = requests.filter(r => r.status === 'new').length;
  const newRequestsLast7d = requests.filter(r => new Date(r.createdAt) > sevenDaysAgo).length;
  const activeMissions = missions.filter(m => ['confirmed', 'accepted'].includes(m.status)).length;

  // --- ALERT LOGIC ---
  const unassignedRequests = requests.filter(r => ['new', 'in_review'].includes(r.status));
  const staleOffers = missions.filter(m => {
     if (m.status !== 'offered') return false;
     const created = new Date(m.createdAt);
     const diffTime = Math.abs(Date.now() - created.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     return diffDays > 3;
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div>
        <Marker />
        <Label>Vue d'ensemble</Label>
        <h1 className="text-3xl font-serif text-stone-900">Tableau de bord</h1>
      </div>

      {/* Alerts Section */}
      {(unassignedRequests.length > 0 || staleOffers.length > 0) && (
        <div className="bg-orange-50 border border-orange-100 p-6 flex flex-col gap-4">
           <div className="flex items-center gap-2 text-orange-800 font-medium">
              <Bell className="w-4 h-4" /> Actions requises
           </div>
           <div className="flex flex-wrap gap-4">
              {unassignedRequests.length > 0 && (
                 <Link href="/admin/requests" className="bg-white px-4 py-2 text-sm text-stone-600 border border-orange-200 hover:border-orange-400 flex items-center gap-2 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {unassignedRequests.length} demande(s) non assignée(s)
                 </Link>
              )}
              {staleOffers.length > 0 && (
                 <Link href="/admin/missions" className="bg-white px-4 py-2 text-sm text-stone-600 border border-orange-200 hover:border-orange-400 flex items-center gap-2 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {staleOffers.length} offre(s) en attente (> 3j)
                 </Link>
              )}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <KPICard 
           title="Nouvelles Demandes (7j)" 
           value={newRequestsLast7d} 
           icon={MessageSquare} 
           link="/admin/requests"
           alert={newRequests > 0}
         />
         <KPICard 
           title="Chefs en attente" 
           value={pendingChefs} 
           icon={ChefHat} 
           link="/admin/chefs"
           alert={pendingChefs > 0}
         />
         <KPICard 
           title="Missions Actives" 
           value={activeMissions} 
           icon={Briefcase} 
           link="/admin/missions"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Recent Requests */}
         <div className="bg-white border border-stone-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl">Dernières Demandes</h3>
              <Link href="/admin/requests" className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900">Voir tout</Link>
            </div>
            <div className="space-y-4">
              {requests.slice(0, 5).map(req => (
                <div key={req.id} className="flex justify-between items-center py-3 border-b border-stone-50 last:border-0">
                   <div>
                      <div className="font-medium text-stone-900 text-sm">{req.contact.name}</div>
                      <div className="text-xs text-stone-400">{req.location} • {new Date(req.createdAt).toLocaleDateString()}</div>
                   </div>
                   <span className={`text-[10px] px-2 py-1 uppercase tracking-wider ${req.status === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-stone-50 text-stone-500'}`}>
                     {req.status.replace('_', ' ')}
                   </span>
                </div>
              ))}
              {requests.length === 0 && <p className="text-sm text-stone-400 italic">Aucune demande récente.</p>}
            </div>
         </div>

         {/* Mission Status */}
         <div className="bg-white border border-stone-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl">Statut Missions</h3>
              <Link href="/admin/missions" className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900">Gérer</Link>
            </div>
            
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600">Propositions en attente</span>
                  <span className="font-medium">{missions.filter(m => m.status === 'offered').length}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600">Missions confirmées (à venir)</span>
                  <span className="font-medium text-stone-900">{missions.filter(m => m.status === 'confirmed').length}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600">Missions réalisées</span>
                  <span className="font-medium text-stone-400">{missions.filter(m => m.status === 'completed').length}</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, link, alert }: any) => (
  <Link href={link} className={`block p-6 border transition-all hover:shadow-sm ${alert ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-200'}`}>
     <div className="flex justify-between items-start mb-4">
        <Icon className={`w-5 h-5 ${alert ? 'text-orange-500' : 'text-stone-400'}`} />
        {alert && <AlertCircle className="w-4 h-4 text-orange-500" />}
     </div>
     <div className="text-3xl font-serif text-stone-900 mb-1">{value}</div>
     <div className={`text-xs uppercase tracking-widest ${alert ? 'text-orange-700' : 'text-stone-500'}`}>{title}</div>
     {alert && <div className="mt-4 text-xs font-medium text-orange-600 flex items-center gap-1">Action requise <ArrowRight className="w-3 h-3" /></div>}
  </Link>
);