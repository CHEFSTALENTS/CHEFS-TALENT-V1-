'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  Users,
  Map,
  FileText,
  Briefcase,
  Crown,
  BookOpen,
  Mail,
  Send,
  Sparkles,
  ShieldCheck,
  CreditCard,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  badge?: string | number;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export function AdminSidebar({
  badges,
}: {
  badges?: Record<string, string | number>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close du drawer mobile quand la route change (navigation réussie)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock du body scroll quand le drawer est ouvert (UX mobile)
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const sections: NavSection[] = [
    {
      label: 'Pilotage',
      items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
      label: 'Opérations',
      items: [
        { label: 'Demandes', href: '/admin/requests', icon: Inbox, badge: badges?.requestsNew },
        { label: 'Chefs', href: '/admin/chefs', icon: Users, badge: badges?.chefsPending },
        { label: 'Carte', href: '/admin/map', icon: Map, badge: badges?.chefsOnMap },
        { label: 'Proposals', href: '/admin/proposals', icon: FileText },
        { label: 'Devis', href: '/admin/quotes', icon: FileText, badge: badges?.quotesAlive },
        { label: 'Missions', href: '/admin/missions', icon: Briefcase },
        { label: 'NCC Partenaire', href: '/admin/ncc-partner', icon: ShieldCheck },
      ],
    },
    {
      label: 'VIP & Contenu',
      items: [
        { label: 'Chefs VIP', href: '/admin/vip', icon: Crown },
        { label: 'Contenu VIP', href: '/admin/vip-content', icon: BookOpen },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { label: 'Newsletter', href: '/admin/newsletter', icon: Mail },
        { label: 'Test délivrabilité', href: '/admin/email-test', icon: Send },
        { label: 'Console SEO', href: '/admin/seo', icon: Sparkles },
        { label: 'Leads', href: '/admin/leads', icon: Users },
      ],
    },
    {
      label: 'Configuration',
      items: [
        { label: 'Stripe diagnostics', href: '/admin/stripe/diagnostics', icon: CreditCard },
      ],
    },
  ];

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Crown className="w-3.5 h-3.5 text-white/80" />
            </span>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">Chefs Talents</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest">Back-office</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="px-3 space-y-5 flex-1 overflow-y-auto pb-4">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      // Padding plus large sur mobile pour des tap-targets >= 44px
                      'group flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg text-sm transition',
                      active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
                    ].join(' ')}
                  >
                    <Icon
                      className={['w-4 h-4 shrink-0', active ? 'text-white' : 'text-white/50 group-hover:text-white/80'].join(' ')}
                      strokeWidth={1.75}
                    />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge !== undefined && item.badge !== 0 && (
                      <span
                        className={[
                          'text-[10px] tabular-nums px-1.5 py-0.5 rounded-md min-w-[20px] text-center',
                          active ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 group-hover:text-white/80',
                        ].join(' ')}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
          Se déconnecter
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Header mobile (sticky en haut) — visible uniquement < md */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-neutral-950/85 backdrop-blur border-b border-white/10">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 flex-shrink-0">
            <Crown className="w-3 h-3 text-white/80" />
          </span>
          <div className="text-sm font-semibold tracking-tight text-white truncate">
            Chefs Talents · <span className="text-white/55">Admin</span>
          </div>
        </div>
        {/* Spacer pour équilibrer la flex */}
        <div className="w-10" />
      </header>

      {/* Sidebar desktop — fixe à 260px à partir de md */}
      <aside className="hidden md:flex w-[260px] shrink-0 border-r border-white/10 bg-neutral-950/70 backdrop-blur min-h-screen flex-col">
        {sidebarContent}
      </aside>

      {/* Drawer mobile — overlay full-screen quand mobileOpen=true */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            className="flex-1 bg-black/70 backdrop-blur-sm"
          />
          {/* Drawer */}
          <aside className="w-[280px] max-w-[85vw] bg-neutral-950 border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-end p-3 border-b border-white/5">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white/70 hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
