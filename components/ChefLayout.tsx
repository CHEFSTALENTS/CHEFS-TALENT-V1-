'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  FileText,
} from 'lucide-react';

type PseudoChefUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string; // draft | pending_validation | approved | active | paused ...
};

interface ChefLayoutProps {
  children?: React.ReactNode;
}

// ✅ Version courante (modifie ici le jour où tu updates les conditions)
const CHEF_TERMS_VERSION = '09/01/2026';

export const ChefLayout = ({ children }: ChefLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<PseudoChefUser | null>(null);
  const [offeredCount] = useState(0);

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // Terms gate
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);
  const [termsAcceptedVersion, setTermsAcceptedVersion] = useState<string | null>(null);

  const [termsOpen, setTermsOpen] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const shouldBlockWithTermsModal = useMemo(() => {
    if (!user) return false;
    if (pathname.startsWith('/chef/terms')) return false;
    if (pathname.startsWith('/chef/login')) return false;

    // null = en cours de check
    if (termsAccepted === null) return false;

   const CURRENT_TERMS_VERSION = '2026-01-09';

const mustAcceptTerms =
  !json.termsAccepted ||
  json.termsAcceptedVersion !== CURRENT_TERMS_VERSION;

setTermsAccepted(!mustAcceptTerms);
    
    return mustAccept && termsOpen;
  }, [user, pathname, termsAccepted, termsAcceptedVersion, termsOpen]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const sbUser = data.session?.user ?? null;

      if (!sbUser) {
        router.replace('/chef/login');
        return;
      }

      const pseudo: PseudoChefUser = {
        id: sbUser.id,
        email: sbUser.email ?? '',
        firstName: (sbUser.user_metadata as any)?.firstName ?? '',
        lastName: (sbUser.user_metadata as any)?.lastName ?? '',
        status: 'draft',
      };

      setUser(pseudo);

      // reset terms while loading
      setTermsAccepted(null);
      setTermsAcceptedAt(null);
      setTermsAcceptedVersion(null);
      setTermsOpen(false);

      // ✅ resync status + termsAccepted depuis DB
      try {
        const res = await fetch(`/api/chef/me?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!alive) return;

        // status
        if (json?.status) {
          setUser((prev) => (prev ? { ...prev, status: String(json.status) } : prev));
        }

        const accepted = Boolean(json?.termsAccepted);
        const acceptedAt = (json?.termsAcceptedAt as string) || null;
        const acceptedVersion = (json?.termsAcceptedVersion as string) || null;

        setTermsAccepted(accepted);
        setTermsAcceptedAt(acceptedAt);
        setTermsAcceptedVersion(acceptedVersion);

        const mustAccept =
          !accepted || (acceptedVersion ?? '') !== CHEF_TERMS_VERSION;

        // ✅ ouvre le popup uniquement si nécessaire
        if (mustAccept) setTermsOpen(true);
      } catch {
        // si l’API échoue, on ne bloque pas hard.
        // (tu peux mettre setTermsOpen(true) si tu veux bloquer absolument)
        setTermsAccepted(true);
        setTermsOpen(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const sbUser = session?.user ?? null;
      if (!sbUser) router.replace('/chef/login');
    });

    // robots noindex
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

  const acceptTerms = async () => {
    if (!user) return;

    setTermsLoading(true);
    setTermsError(null);

    try {
      const res = await fetch('/api/chef/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          userId: user.id,
          version: CHEF_TERMS_VERSION,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error('ACCEPT_FAIL');

      setTermsAccepted(true);
      setTermsAcceptedAt(new Date().toISOString());
      setTermsAcceptedVersion(CHEF_TERMS_VERSION);
      setTermsOpen(false);

      // petit fallback local (optionnel)
      try {
        localStorage.setItem('ct_chef_terms_accepted', '1');
        localStorage.setItem('ct_chef_terms_version', CHEF_TERMS_VERSION);
      } catch {}
    } catch {
      setTermsError("Impossible d'enregistrer l'acceptation. Réessaie.");
    } finally {
      setTermsLoading(false);
    }
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

    // ✅ accès permanent aux conditions
    { icon: FileText, label: 'Conditions', path: '/chef/terms' },

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
        {navItems.map((item) => {
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

        {/* ✅ petit rappel status terms (optionnel) */}
        <div className="mt-4 px-2">
          <div className="text-[10px] uppercase tracking-widest text-stone-500">Conditions</div>
          <div className="text-xs text-stone-400 mt-1">
            {termsAccepted === null ? (
              <span>Vérification…</span>
            ) : termsAccepted && (termsAcceptedVersion ?? '') === CHEF_TERMS_VERSION ? (
              <span>
                Acceptées · {termsAcceptedAt ? new Date(termsAcceptedAt).toLocaleDateString('fr-FR') : '—'}
              </span>
            ) : (
              <span className="text-amber-300">À accepter</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-20 bg-stone-50/95 backdrop-blur border-b border-stone-200">
        <div className="relative flex items-center px-4 py-3">
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="text-xs uppercase tracking-widest text-stone-400">Chef Portal</div>
            <div className="text-sm font-medium text-stone-900 truncate max-w-[220px]">
              {user.firstName} {user.lastName}
            </div>
          </div>

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

      <div className="flex">
        <aside className="hidden md:flex w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex-col fixed h-full z-10">
          <SidebarContent />
        </aside>

        {mobileOpen ? (
          <div className="md:hidden fixed inset-0 z-30">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
            />
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

        <main className="flex-1 md:ml-64 px-4 py-6 md:p-12">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>

      {/* ✅ TERMS MODAL (bloquante, seulement si nouvelle version ou non accepté) */}
      {shouldBlockWithTermsModal ? (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="text-[10px] uppercase tracking-[0.24em] text-stone-400 mb-3">
                  Chef Talents · Portail Chef
                </div>

                <h2 className="text-2xl md:text-3xl font-serif text-stone-900">
                  Conditions de collaboration
                </h2>

                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  Pour accéder au portail et recevoir des missions, vous devez lire et accepter les conditions de collaboration Chef Talents.
                </p>

                <div className="mt-4 text-xs text-stone-400">
                  Version requise : <span className="text-stone-700 font-medium">{CHEF_TERMS_VERSION}</span>
                  {termsAcceptedVersion ? (
                    <>
                      {' · '}Votre version : <span className="text-stone-700 font-medium">{termsAcceptedVersion}</span>
                    </>
                  ) : null}
                </div>

                {termsError ? (
                  <div className="mt-4 text-sm text-red-600">{termsError}</div>
                ) : null}

                <div className="mt-7 grid gap-3">
                  <Link
                    href={`/chef/terms?next=${encodeURIComponent(pathname || '/chef/dashboard')}`}
                    className="w-full text-center rounded-2xl border border-stone-200 bg-stone-50 py-3 text-sm font-medium text-stone-900 hover:bg-stone-100"
                  >
                    Lire les conditions
                  </Link>

                  <button
                    type="button"
                    disabled={termsLoading}
                    onClick={acceptTerms}
                    className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {termsLoading ? 'Enregistrement…' : 'J’ai lu et j’accepte'}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-2xl py-3 text-sm font-medium text-stone-500 hover:text-stone-900"
                  >
                    Se déconnecter
                  </button>
                </div>

                <div className="mt-6 text-xs text-stone-400">
                  En acceptant, vous confirmez avoir lu et compris les conditions de collaboration Chef Talents.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
