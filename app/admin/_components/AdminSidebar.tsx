'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
  badge?: string | number;
};

export function AdminSidebar({ badges }: { badges?: Record<string, string | number> }) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Demandes', href: '/admin/requests', badge: badges?.requestsNew },
    { label: 'Chefs', href: '/admin/chefs', badge: badges?.chefsPending },
    { label: 'Proposals', href: '/admin/proposals' },
    { label: 'Missions', href: '/admin/missions' },
  ];

  return (
    <aside className="w-[260px] shrink-0 border-r border-white/10 bg-neutral-950/70 backdrop-blur">
      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="text-sm font-semibold tracking-wide">Chef Talents</div>
          <div className="text-xs text-white/60 mt-0.5">Back-office Admin</div>
        </div>
      </div>

      <nav className="px-3 space-y-2">
        {nav.map(item => {
          const active =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition',
                active
                  ? 'bg-white/10 border-white/15 text-white'
                  : 'bg-transparent border-transparent text-white/75 hover:bg-white/5 hover:border-white/10 hover:text-white',
              ].join(' ')}
            >
              <span className="font-medium">{item.label}</span>

              {item.badge !== undefined && item.badge !== 0 && (
                <span
                  className={[
                    'text-[11px] px-2 py-0.5 rounded-full border',
                    active
                      ? 'bg-white/10 text-white border-white/15'
                      : 'bg-white/5 text-white/70 border-white/10 group-hover:text-white',
                  ].join(' ')}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-4">
        <button className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition">
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
