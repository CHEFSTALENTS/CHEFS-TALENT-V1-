'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, api } from '../services/storage';
import { ChefUser } from '../types';
import { supabase } from '@/services/supabaseClient';
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
  Euro,
  Menu,
  X,
} from 'lucide-react';

interface ChefLayoutProps {
  children?: React.ReactNode;
}

export const ChefLayout = ({ children }: ChefLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ChefUser | null>(null);
  const [offeredCount, setOfferedCount] = useState(0);

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

 useEffect(() => {
  let alive = true;

  (async () => {
    const { data } = await supabase.auth.getSession();
    if (!alive) return;

    const sbUser = data.session?.user ?? null;

    // ✅ si pas de session => login
    if (!sbUser) {
      router.replace('/chef/login');
      return;
    }

    // ✅ On construit un "user" compatible UI à partir de Supabase
    const pseudoUser: any = {
      id: sbUser.id,
      email: sbUser.email ?? '',
      firstName: (sbUser.user_metadata as any)?.firstName ?? '',
      lastName: (sbUser.user_metadata as any)?.lastName ?? '',
      status: 'draft',
    };

    setUser(pseudoUser);

    // (optionnel) resync status depuis DB
    try {
      const res = await fetch(`/api/chef/me?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
      const json = await res.json();
      if (alive && json?.status) setUser((prev: any) => ({ ...prev, status: json.status }));
    } catch {}
  })();

  const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
    const sbUser = session?.user ?? null;
    if (!sbUser) router.replace('/chef/login');
  });

  // robots noindex (ok)
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);

  return () => {
    alive = false;
    sub.subscription.unsubscribe();
    if (document.head.contains(meta)) document.head.removeChild(meta);
  };
}, [router]);
    

    // No index
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    const fetchOffers = async () => {
      try {
        const missions = await api.getChefMissions(currentUser.id);
        const offers = missions.filter(m => m.status === 'offered');
        setOfferedCount(offers.length);
      } catch (e) {
        console.error('fetchOffers error', e);
      }
    };

    fetchOffers();

    return () => {
      if (document.head.contains(meta)) document.head.removeChild(meta);
    };
  }, [router]);

  // Close drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open (mobile)
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.replace('/chef/login');
};

  if (!user) return null;

  const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/chef/dashboard' },
    { icon: Briefcase, label: 'Missions', path: '/chef/missions', badge: offeredCount > 0 ? offeredCount : null },
    { icon: Euro, label: 'Revenus', path: '/chef/earnings' },
{ icon: Euro, label: 'Tarifs', path: '/chef/pricing' },
    
    { icon: User, label: 'Identité', path: '/chef/identity' },
    { icon: ChefHat, label: 'Expérience', path: '/chef/experience' },
    { icon: Image, label: 'Portfolio', path: '/chef/portfolio' },
    { icon: Map, label: 'Zone & Mobilité', path: '/chef/mobility' },
    { icon: Calendar, label: 'Disponibilités', path: '/chef/availability' },
    { icon: SlidersHorizontal, label: 'Préférences', path: '/chef/preferences' },
    { icon: Settings, label: 'Paramètres', path: '/chef/settings' },
  ];

  const SidebarContent = ({ compact = false }: { compact?: boolean }) => (
    <div className="h-full flex flex-col">
      <div className={`border-b border-stone-800 ${compact ? 'p-5' : 'p-8'}`}>
        <Link href="/" className="font-serif text-xl text-stone-50 tracking-tight">
          CHEF TALENTS
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-stone-500 block mt-1">Portal</span>
      </div>

      <nav className={`flex-1 overflow-y-auto ${compact ? 'p-4' : 'p-6'} space-y-1`}>
        {navItems.map(item => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          const isProfileStart = item.path === '/chef/identity';

          return (
            <React.Fragment key={item.path}>
              {isProfileStart && <div className="h-px bg-stone-800 my-4 mx-2" />}
              <Link
                href={item.path}
                className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-stone-800 text-white' : 'hover:bg-stone-800/50 hover:text-white text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 opacity-70" />
                  {item.label}
                </div>
                {item.badge ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      <div className={`border-t border-stone-800 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-400">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-stone-500 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-200 w-full px-2 py-2"
        >
          <LogOut className="w-3 h-3" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Mobile header (menu à droite + titre centré) */}
      <div className="md:hidden sticky top-0 z-20 bg-stone-50/95 backdrop-blur border-b border-stone-200">
        <div className="relative flex items-center px-4 py-3">
          {/* Centre parfait */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="text-xs uppercase tracking-widest text-stone-400">Chef Portal</div>
            <div className="text-sm font-medium text-stone-900 truncate max-w-[220px]">
              {user.firstName} {user.lastName}
            </div>
          </div>

          {/* Droite : menu + logout */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 border border-stone-200 bg-white"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5 text-stone-800" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center w-10 h-10 border border-stone-200 bg-white"
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5 text-stone-800" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex-col fixed h-full z-10">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="md:hidden fixed inset-0 z-30">
            {/* Backdrop */}
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
            />
            {/* Panel */}
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-stone-900 text-stone-300 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-stone-800">
                <div className="text-stone-50 font-serif text-lg">CHEF TALENTS</div>
                <button
                  type="button"
                  className="w-10 h-10 inline-flex items-center justify-center border border-stone-800"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-stone-200" />
                </button>
              </div>
              <SidebarContent compact />
            </div>
          </div>
        ) : null}

        {/* Main content */}
        <main className="flex-1 md:ml-64 px-4 py-6 md:p-12">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
