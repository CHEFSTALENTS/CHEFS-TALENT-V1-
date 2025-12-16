import type { ReactNode } from 'react';
import { AdminSidebar } from './_components/AdminSidebar'; // ← adapte si besoin

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="shrink-0">
          <AdminSidebar />
        </div>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
