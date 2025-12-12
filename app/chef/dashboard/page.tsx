'use client';

import React from 'react';
import Link from 'next/link';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button } from '../../../components/ui';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  User,
  ChefHat,
  Image,
  Map,
  Calendar,
  AlertTriangle,
  Crown,
  Sparkles
} from 'lucide-react';

export default function ChefDashboardPage() {
  const user = auth.getCurrentUser();

  if (!user) return null;

  // Calculate Progress
  const p = user.profile || {};
  const checks = [
    { label: 'Identité', path: '/chef/profile', done: !!(p.phone && p.profileType && (p.languages?.length ?? 0) > 0)
    { label: 'Expérience', path: '/chef/experience', done: !!(p.yearsExperience && p.bio) },
    { label: 'Portfolio', path: '/chef/portfolio', done: !!(p.images && p.images.length > 0) },
    { label: 'Zone & Mobilité', path: '/chef/coverage', done: !!(p.baseCity && p.coverageZones?.length > 0) },
    { label: 'Disponibilités', path: '/chef/availability', done: true }, // Always "done" as default is open
  ];

  const completedCount = checks.filter(c => c.done).length;
  const progress = Math.round((completedCount / checks.length) * 100);

  const profileTypeLabels: Record<string, string> = {
    private: 'Chef Privé',
    residence: 'Chef Résidence',
    yacht: 'Chef Yacht',
    pastry: 'Chef Pâtissier'
  };

  return (
    <ChefLayout>
      <div className="space-y-12 animate-in fade-in duration-700">
        
        {/* Welcome Header */}
        <div className="flex items-end justify-between border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Label className="mb-0">Tableau de bord</Label>
               {user.plan === 'pro' && user.planStatus === 'active' && (
                 <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-bronze border border-bronze px-2 py-0.5 rounded-full">
                   <Crown className="w-3 h-3" /> Pro
                 </span>
               )}
            </div>
            <h1 className="text-4xl font-serif text-stone-900 mt-2">Bonjour, Chef {user.lastName}.</h1>
            {p.profileType && (
               <p className="text-stone-500 mt-2 font-light">
                 Profil : {profileTypeLabels[p.profileType] || p.profileType} 
                 <span className="mx-2">•</span> 
                 {p.seniorityLevel ? p.seniorityLevel.charAt(0).toUpperCase() + p.seniorityLevel.slice(1) : ''}
               </p>
            )}
          </div>
          <div className="text-right">
             <span className="text-xs uppercase tracking-widest text-stone-400 block mb-2">Statut du compte</span>
             <StatusBadge status={user.status} />
          </div>
        </div>

        {/* Status Alerts */}
        {user.status === 'pending_validation' && (
          <div className="bg-white border border-stone-200 p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-stone-100 flex items-center justify-center rounded-full shrink-0">
                 {progress === 100 ? (
                   <Clock className="w-6 h-6 text-stone-600" />
                 ) : (
                   <AlertTriangle className="w-6 h-6 text-bronze" />
                 )}
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-serif text-stone-900">
                  {progress === 100 
                    ? "Dossier en cours d'examen" 
                    : "Complétez votre profil pour activation"
                  }
                </h3>
                <p className="text-stone-500 font-light leading-relaxed max-w-2xl">
                  {progress === 100 
                    ? "Votre profil est complet. Notre équipe Talent Acquisition examine actuellement votre dossier. Vous recevrez une notification sous 48h concernant votre éligibilité à la Sélection Select."
                    : "Pour garantir la qualité de notre réseau, nous demandons un profil complet avant toute validation. Veuillez remplir les sections manquantes ci-dessous."
                  }
                </p>
                {progress < 100 && (
                  <div className="w-full bg-stone-100 h-1 mt-4">
                    <div className="bg-stone-900 h-1 transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Coming Soon - Informational */}
        <div className="bg-stone-50 border border-stone-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex gap-6 items-start">
             <div className="w-12 h-12 bg-white border border-stone-100 flex items-center justify-center rounded-full shrink-0">
               <Sparkles className="w-5 h-5 text-stone-400" />
             </div>
             <div className="space-y-2">
               <h3 className="text-lg font-serif text-stone-900">Abonnement (à venir)</h3>
               <p className="text-stone-500 font-light text-sm max-w-lg">
                 Chef Talents est actuellement gratuit pour les chefs.
                 Une offre d’abonnement optionnelle sera proposée ultérieurement pour accéder à des fonctionnalités avancées.
               </p>
             </div>
           </div>
           <Button variant="outline" disabled className="whitespace-nowrap opacity-50">
             Bientôt disponible
           </Button>
        </div>

        {/* Action List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           <ActionCard 
             icon={User} 
             title="Identité & Type" 
             desc="Coordonnées, langues, type de profil."
             path="/chef/profile"
             done={checks[0].done}
           />
           <ActionCard 
             icon={ChefHat} 
             title="Expérience" 
             desc="Parcours, bio et spécialités."
             path="/chef/experience"
             done={checks[1].done}
           />
           <ActionCard 
             icon={Image} 
             title="Portfolio" 
             desc="Vos créations en images."
             path="/chef/portfolio"
             done={checks[2].done}
           />
           <ActionCard 
             icon={Map} 
             title="Zone & Mobilité" 
             desc="Où pouvez-vous intervenir ?"
             path="/chef/coverage"
             done={checks[3].done}
           />
           <ActionCard 
             icon={Calendar} 
             title="Disponibilités" 
             desc="Gérez votre calendrier."
             path="/chef/availability"
             done={checks[4].done}
           />
        </div>
      </div>
    </ChefLayout>
  );
}

const ActionCard = ({ icon: Icon, title, desc, path, done }: any) => (
  <Link href={path} className="group block bg-white border border-stone-200 p-8 hover:border-stone-400 transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <Icon className={`w-6 h-6 ${done ? 'text-stone-900' : 'text-stone-300'}`} strokeWidth={1.5} />
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-stone-900" />
      ) : (
        <div className="w-5 h-5 rounded-full border border-stone-200 group-hover:border-stone-400" />
      )}
    </div>
    <h3 className="text-lg font-serif text-stone-900 mb-2">{title}</h3>
    <p className="text-sm text-stone-500 font-light mb-6">{desc}</p>
    <div className="text-xs uppercase tracking-widest text-stone-400 group-hover:text-stone-900 flex items-center gap-2">
      {done ? 'Modifier' : 'Compléter'} <ArrowRight className="w-3 h-3" />
    </div>
  </Link>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending_validation: 'bg-stone-100 text-stone-600',
    approved: 'bg-stone-800 text-white',
    active: 'bg-stone-900 text-white',
    paused: 'bg-stone-200 text-stone-400'
  };
  
  const labels: Record<string, string> = {
    pending_validation: 'En Attente',
    approved: 'Validé',
    active: 'Actif',
    paused: 'En Pause'
  };

  return (
    <span className={`inline-block px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};
