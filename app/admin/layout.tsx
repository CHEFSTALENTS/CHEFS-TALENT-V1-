import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminSidebar } from './_components/AdminSidebar';
import { AdminGate } from './_components/AdminGate';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-stone-100">
      {/* Stack vertical sur mobile (sidebar rendue en header + drawer),
          horizontal à partir de md (sidebar fixe à gauche). */}
      <div className="md:flex">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          <div className="mx-auto max-w-6xl">
            <AdminGate>{children}</AdminGate>
          </div>
        </main>
      </div>
    </div>
  );
}
