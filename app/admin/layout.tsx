'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/storage';

const ADMIN_EMAIL = 'thomas@chef-talents.com'; // ← mets ton email admin ici

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = auth.getCurrentUser();
if (!user || user.email !== 'thomas@chef-talents.com') router.replace('/chef/login');
    // admin = email fixe (pas un role)
    if (!user || user.email !== ADMIN_EMAIL) {
      router.replace('/chef/login');
    }
  }, [router]);

  return <div className="min-h-screen">{children}</div>;
}
