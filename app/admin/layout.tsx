'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/storage';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.replace('/chef/login'); // adapte si ton chemin login est différent
    }
  }, [router]);

  return <div className="min-h-screen">{children}</div>;
}
