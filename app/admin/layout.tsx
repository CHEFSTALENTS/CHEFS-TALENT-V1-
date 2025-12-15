'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { auth, isAdminUser } from '@/services/storage';

const NavItem = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded text-sm border ${
        active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white hover:bg-stone-50'
      }`}
    >
      {label}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const u = auth.getCurrentUser?.() || null;
    if (!isAdminUser?.(u)) router.replace('/chef/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white border rounded p-4 space-y-3">
            <div className="text-sm font-semibold">Chef Talents — Admin</div>
            <div className="space-y-2">
              <NavItem href="/admin" label="Dashboard" />
              <NavItem href="/admin/requests" label="Demandes (B2C/B2B)" />
              <NavItem href="/admin/chefs" label="Chefs" />
              <NavItem href="/admin/proposals" label="Proposals" />
              <NavItem href="/admin/missions" label="Missions" />
            </div>

            <button
              onClick={() => {
                auth.logout?.();
                router.replace('/chef/login');
              }}
              className="w-full mt-3 px-3 py-2 rounded border text-sm bg-white hover:bg-stone-50"
            >
              Se déconnecter
            </button>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">{children}</main>
      </div>
    </div>
  );
}
