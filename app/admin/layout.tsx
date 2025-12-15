'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/storage';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = auth.getCurrentUser();
const ADMIN_EMAIL = 'thomas@chef-talents.com'; // TON email admin

useEffect(() => {
  const user = auth.getCurrentUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    router.replace('/chef/login');
  }
}, [router]);

  return <div className="min-h-screen">{children}</div>;
}
