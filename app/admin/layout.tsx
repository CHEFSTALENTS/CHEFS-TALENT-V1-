'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/services/storage';

type NavItem = {
  label: string;
  href: string;
  badgeKey?: string; // clé dans badges
  tone?: 'default' | 'danger';
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function AdminSidebar({
  badges,
}: {
  badges?: Record<string, string | number>;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const groups: NavGroup[] = [
    {
      title: 'Cockpit',
      items: [
        { label: 'Dashboard', href: '/admin' },
      ],
    },
    {
      title: 'Opérations',
      items: [
        { label: 'Demandes', href: '/admin/requests', badgeKey: 'requestsNew' },
        // ⭐️ nouveau : cœur du back-office
        { label: 'Matching', href: '/admin/matching' },
        { label: 'Proposals', href: '/admin/proposals' },
        { label: 'Missions', href: '/admin/missions' },
      ],
    },
    {
      title: 'Ressources',
      items: [
        { label: 'Chefs', href: '/admin/chefs', badgeKey: 'chefsPending' },
        // optionnel (si tu crées la page)
        { label: 'Finance', href: '/admin/finance' },
      ],
    },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href));

  const onLogout = () => {
    try {
      auth.logout?.();
    } finally {
      router.push('/login'); // adapte si ta route est différente
    }
  };

  return (
    <aside className="w-[260px] border-r bg-white">
      {/* Brand */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border bg-stone-50 flex items-center justify-center">
            <span className="text-xs font-semibold">CT</span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight">Chef Talents</div>
            <div className="text-xs text-stone-500">Back-office Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-4">
        {groups.map(group => (
          <div key={group.title}>
            <div className="px-2 text-[11px] font-semibold tracking-wide text-stone-500 uppercase">
              {group.title}
            </div>

            <div className="mt-2 space-y-1">
              {group.items.map(item => {
                const active = isActive(item.href);
                const badge =
                  item.badgeKey ? badges?.[item.badgeKey] : undefined;
                const showBadge =
                  badge !== undefined &&
                  badge !== 0 &&
                  String(badge).trim() !== '';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition',
                      active
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:bg-stone-50',
                    ].join(' ')}
                  >
                    <span className="truncate">{item.label}</span>

                    {showBadge && (
                      <span
                        className={[
                          'text-[11px] px-2 py-0.5 rounded-full',
                          active
                            ? 'bg-white/15 text-white'
                            : 'bg-stone-100 text-stone-700',
                        ].join(' ')}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t">
        <button
          onClick={onLogout}
          className="w-full px-3 py-2 rounded-lg text-sm border hover:bg-stone-50"
        >
          Se déconnecter
        </button>

        <div className="mt-2 text-[11px] text-stone-500">
          MVP localStorage • v1
        </div>
      </div>
    </aside>
  );
}
