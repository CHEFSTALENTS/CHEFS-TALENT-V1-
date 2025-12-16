import type { ReactNode } from 'react';
import { AdminSidebar } from './_components/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  );
}
