import type { ReactNode } from 'react';
import { AdminSidebar } from './_components/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-100">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8">
        {/* “container” visuel */}
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
