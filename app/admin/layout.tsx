import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-stone-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[260px] shrink-0 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">Chef Talents</div>
            <div className="text-xs text-white/60">Back-office Admin</div>
          </div>

          <nav className="mt-4 space-y-2">
            <NavItem href="/admin">Dashboard</NavItem>
            <NavItem href="/admin/requests">Demandes</NavItem>
            <NavItem href="/admin/chefs">Chefs</NavItem>
            <NavItem href="/admin/proposals">Proposals</NavItem>
            <NavItem href="/admin/missions">Missions</NavItem>
          </nav>

          <div className="mt-6">
            <button className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition">
              Se déconnecter
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
    >
      {children}
    </Link>
  );
}
