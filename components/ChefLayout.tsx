'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, api } from '../services/storage';
import { ChefUser } from '../types';
import { 
  LogOut, 
  LayoutDashboard, 
  User, 
  Settings, 
  Calendar, 
  ChefHat, 
  Image, 
  Map, 
  SlidersHorizontal,
  Briefcase,
  Euro
} from 'lucide-react';

interface ChefLayoutProps {
  children?: React.ReactNode;
}

export const ChefLayout = ({ children }: ChefLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ChefUser | null>(null);
  const [offeredCount, setOfferedCount] = useState(0);

  useEffect(() => {
    // 1. Check Auth
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/chef/login');
      return;
    }
    setUser(currentUser);

    // 2. Security: No Index
    const meta = document.createElement('meta');
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    // 3. Fetch Mission Offers count
    const fetchOffers = async () => {
      if(currentUser) {
        const missions = await api.getChefMissions(currentUser.id);
        const offers = missions.filter(m => m.status === 'offered');
        setOfferedCount(offers.length);
      }
    };
    fetchOffers();

    return () => {
      // Safety check if head still exists
      if (document.head.contains(meta)) {
        document.head.removeChild(meta);
      }
    };
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  if (!user) return null;

  const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/chef/dashboard' },
    { icon: Briefcase, label: 'Missions', path: '/chef/missions', badge: offeredCount > 0 ? offeredCount : null },
    { icon: Euro, label: 'Revenus', path: '/chef/earnings' },
    
    // Separator Concept in rendering
    { icon: User, label: 'Identité', path: '/chef/identity' },
    { icon: ChefHat, label: 'Expérience', path: '/chef/experience' },
    { icon: Image, label: 'Portfolio', path: '/chef/portfolio' },
    { icon: Map, label: 'Zone & Mobilité', path: '/chef/mobility' },
    { icon: Calendar, label: 'Disponibilités', path: '/chef/availability' },
    { icon: SlidersHorizontal, label: 'Préférences', path: '/chef/preferences' },
    { icon: Settings, label: 'Paramètres', path: '/chef/settings' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col fixed h-full z-10">
        <div className="p-8 border-b border-stone-800">
          <Link href="/" className="font-serif text-xl text-stone-50 tracking-tight">CHEF TALENTS</Link>
          <span className="text-[10px] uppercase tracking-widest text-stone-500 block mt-1">Portal</span>
        </div>
        
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
            // Visual separation between Ops and Profile sections
            const isProfileStart = item.path === '/chef/identity';

            return (
              <React.Fragment key={item.path}>
                {isProfileStart && <div className="h-px bg-stone-800 my-4 mx-4" />}
                <Link 
                  href={item.path}
                  className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 opacity-70" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </React.Fragment>
            )
          })}
        </nav>

        <div className="p-6 border-t border-stone-800">
           <div className="flex items-center gap-3 mb-6 px-4">
              <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-400">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-stone-500 truncate">{user.email}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-300 w-full px-4">
             <LogOut className="w-3 h-3" /> Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
