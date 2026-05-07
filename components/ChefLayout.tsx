'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/services/supabaseClient';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_FULL_LABELS,
  format,
  type Locale,
} from '@/lib/chef-i18n';

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
  status: string;
};

interface ChefLayoutProps {
  children?: React.ReactNode;
}

const CURRENT_TERMS_VERSION = '09/01/2026';
const PUBLIC_CHEF_ROUTES = [
  '/chef/login',
  '/chef/signup',
  '/chef/forgot-password',
  '/chef/reset-password',
  '/chef/terms',
];

const DATE_LOCALE_MAP: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
};

// ─── Locale switcher (sidebar) ────────────────────────────────────────
function LocaleSwitcher({
  locale,
  setLocale,
  ariaLabel,
  compact = false,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  ariaLabel: string;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-full border border-stone-700 bg-stone-800/40 overflow-hidden ${
        compact ? 'text-[10px]' : 'text-[11px]'
      }`}
    >
      {LOCALES.map((l) => {
        const isActive = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => !isActive && setLocale(l)}
            aria-pressed={isActive}
            title={LOCALE_FULL_LABELS[l]}
            className={`px-3 py-1.5 font-medium tracking-wide transition-colors ${
              isActive
                ? 'bg-white text-stone-900'
                : 'text-stone-400 hover:text-white hover:bg-stone-700/40'
            }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}

export const ChefLayout = ({ children }: ChefLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useChefLocale();

  const isPublicRoute = useMemo(() => {
    const p = pathname || '';
    return PUBLIC_CHEF_ROUTES.some((r) => p.startsWith(r));
  }, [pathname]);

  const [user, setUser] = useState<PseudoChefUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [offeredCount] = useState(0);

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // Terms state
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [termsAcceptedVersion, setTermsAcceptedVersion] = useState<string | null>(null);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);

  // Modal
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // ---- AUTH + LOAD PROFILE (status + terms + preferredLocale) ----
  useEffect(() => {
    let alive = true;

    const run = async () => {
      // ✅ Routes publiques: pas de session obligatoire, pas de load profil
      if (isPublicRoute) {
        if (!alive) return;
        setBooting(false);
        setTermsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
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

        try {
          const res = await fetch(`/api/chef/me?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
          const json = await res.json();

          if (!alive) return;

          if (json?.status) {
            setUser((prev) => (prev ? { ...prev, status: String(json.status) } : prev));
          }

          setTermsAccepted(Boolean(json?.termsAccepted));
          setTermsAcceptedVersion((json?.termsAcceptedVersion ?? null) as string | null);
          setTermsAcceptedAt((json?.termsAcceptedAt ?? null) as string | null);

          // Hydrate locale from server profile if present (priorité serveur > localStorage)
          const serverLocale = json?.preferredLocale;
          if (serverLocale === 'fr' || serverLocale === 'en' || serverLocale === 'es') {
            if (serverLocale !== locale) setLocale(serverLocale);
          }
        } catch {
          setTermsAccepted(false);
          setTermsAcceptedVersion(null);
          setTermsAcceptedAt(null);
        } finally {
          if (alive) setTermsLoaded(true);
        }
      } catch {
        router.replace('/chef/login');
      } finally {
        if (alive) setBooting(false);
      }
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (isPublicRoute) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, isPublicRoute]);

  // ✅ Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ✅ Prevent body scroll when drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const mustAcceptTerms = useMemo(() => {
    if (!termsLoaded) return false;
    if (!termsAccepted) return true;
    if ((termsAcceptedVersion ?? null) !== CURRENT_TERMS_VERSION) return true;
    return false;
  }, [termsLoaded, termsAccepted, termsAcceptedVersion]);

  // ✅ Open terms modal only on private routes
  useEffect(() => {
    if (isPublicRoute) return;
    if (!termsLoaded) return;
    if (!user) return;

    const excluded =
      pathname?.startsWith('/chef/terms') ||
      pathname?.startsWith('/chef/login') ||
      pathname?.startsWith('/chef/signup');

    if (!excluded && mustAcceptTerms) setTermsOpen(true);
    else setTermsOpen(false);
  }, [isPublicRoute, termsLoaded, mustAcceptTerms, pathname, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/chef/login');
  };

  const acceptTerms = async () => {
    if (!user?.id) return;

    setTermsLoading(true);
    setTermsError(null);

    try {
      const res = await fetch('/api/chef/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ userId: user.id, version: CURRENT_TERMS_VERSION }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'ACCEPT_FAIL');

      setTermsAccepted(true);
      setTermsAcceptedVersion(CURRENT_TERMS_VERSION);
      setTermsAcceptedAt(new Date().toISOString());
      setTermsOpen(false);

      try {
        localStorage.setItem('ct_chef_terms_version', CURRENT_TERMS_VERSION);
      } catch {}
    } catch {
      setTermsError(t.termsModal.error);
    } finally {
      setTermsLoading(false);
    }
  };

  // ---------------- RENDER (aucun hook après ceci) ----------------

  // ✅ Routes publiques: no sidebar
  if (isPublicRoute) return <>{children}</>;

  // ✅ Evite page blanche
  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-sm text-stone-500">{t.common.loading}</div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { icon: LayoutDashboard, label: t.nav.dashboard, path: '/chef/dashboard' },
    { icon: Briefcase, label: t.nav.missions, path: '/chef/missions', badge: offeredCount > 0 ? offeredCount : null },
    { icon: Euro, label: t.nav.earnings, path: '/chef/earnings' },
    { icon: Euro, label: t.nav.pricing, path: '/chef/pricing' },

    { icon: User, label: t.nav.identity, path: '/chef/identity' },
    { icon: ChefHat, label: t.nav.experience, path: '/chef/experience' },
    { icon: Image, label: t.nav.portfolio, path: '/chef/portfolio' },
    { icon: Map, label: t.nav.mobility, path: '/chef/mobility' },
    { icon: Calendar, label: t.nav.availability, path: '/chef/availability' },
    { icon: SlidersHorizontal, label: t.nav.preferences, path: '/chef/preferences' },
    { icon: Settings, label: t.nav.settings, path: '/chef/settings' },
    { icon: FileText, label: t.nav.terms, path: '/chef/terms' },
  ];

  const dateLocale = DATE_LOCALE_MAP[locale];

  const SidebarContent = ({ compact = false }: { compact?: boolean }) => (
    <div className="h-full flex flex-col">
      <div className={`border-b border-stone-800 ${compact ? 'p-5' : 'p-8'}`}>
        <Link href="/" className="font-serif text-xl text-stone-50 tracking-tight">
          CHEF TALENTS
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-stone-500 block mt-1 mb-4">
          {t.nav.portal}
        </span>
        <LocaleSwitcher
          locale={locale}
          setLocale={setLocale}
          ariaLabel={t.switcher.ariaLabel}
          compact={compact}
        />
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
        <div className="mb-4 px-2 text-xs text-stone-500">
          {termsLoaded ? (
            termsAccepted && termsAcceptedVersion === CURRENT_TERMS_VERSION ? (
              <span>
                {t.nav.termsLabel} <span className="text-stone-200">{t.nav.termsAccepted}</span>
                {termsAcceptedAt ? (
                  <span className="block text-[11px] text-stone-600 mt-1">
                    {new Date(termsAcceptedAt).toLocaleString(dateLocale)}
                  </span>
                ) : null}
              </span>
            ) : (
              <span>
                {t.nav.termsLabel} <span className="text-red-400">{t.nav.termsToValidate}</span>
              </span>
            )
          ) : (
            <span>{t.nav.loading}</span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-400">
            {(user.firstName?.[0] ?? '')}
            {(user.lastName?.[0] ?? '')}
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
          <LogOut className="w-3 h-3" /> {t.nav.logout}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-20 bg-stone-50/95 backdrop-blur border-b border-stone-200">
        <div className="relative flex items-center px-4 py-3">
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <div className="text-xs uppercase tracking-widest text-stone-400">{t.nav.portal}</div>
            <div className="text-sm font-medium text-stone-900 truncate max-w-[220px]">
              {user.firstName} {user.lastName}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 border border-stone-200 bg-white"
              aria-label={t.nav.openMenu}
            >
              <Menu className="w-5 h-5 text-stone-800" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center w-10 h-10 border border-stone-200 bg-white"
              aria-label={t.nav.logout}
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
              aria-label={t.nav.closeMenu}
            />
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-stone-900 text-stone-300 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-stone-800">
                <div className="text-stone-50 font-serif text-lg">CHEF TALENTS</div>
                <button
                  type="button"
                  className="w-10 h-10 inline-flex items-center justify-center border border-stone-800"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t.common.close}
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

      {termsOpen ? (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="text-[10px] uppercase tracking-[0.24em] text-stone-400 mb-3">
                  {t.termsModal.tagline}
                </div>

                <h2 className="text-2xl md:text-3xl font-serif text-stone-900">
                  {t.termsModal.title}
                </h2>

                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  {t.termsModal.description}
                </p>

                {termsError ? <div className="mt-4 text-sm text-red-600">{termsError}</div> : null}

                <div className="mt-7 grid gap-3">
                  <Link
                    href={`/chef/terms?next=${encodeURIComponent(pathname || '/chef/dashboard')}`}
                    className="w-full text-center rounded-2xl border border-stone-200 bg-stone-50 py-3 text-sm font-medium text-stone-900 hover:bg-stone-100"
                  >
                    {t.termsModal.readTerms}
                  </Link>

                  <button
                    type="button"
                    disabled={termsLoading}
                    onClick={acceptTerms}
                    className="w-full rounded-2xl bg-stone-900 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {termsLoading ? t.termsModal.accepting : t.termsModal.accept}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-2xl py-3 text-sm font-medium text-stone-500 hover:text-stone-900"
                  >
                    {t.nav.logout}
                  </button>
                </div>

                <div className="mt-6 text-xs text-stone-400">
                  {format(t.termsModal.versionInForce, { version: CURRENT_TERMS_VERSION })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
