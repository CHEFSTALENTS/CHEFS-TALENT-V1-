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
    <aside className="w-[240px] border-r bg-white p-3 space-y-2">
      <div className="px-2 py-2 font-semibold">Chef Talents — Admin</div>

      <nav className="space-y-1">
        {nav.map(item => {
          const active =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center justify-between px-3 py-2 rounded-lg text-sm border',
                active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:bg-stone-50',
              ].join(' ')}
            >
              <span>{item.label}</span>

              {item.badge !== undefined && item.badge !== 0 && (
                <span
                  className={[
                    'text-[11px] px-2 py-0.5 rounded-full',
                    active ? 'bg-white/15 text-white' : 'bg-stone-100 text-stone-700',
                  ].join(' ')}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-3">
        <button className="w-full px-3 py-2 rounded-lg border text-sm hover:bg-stone-50">
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
