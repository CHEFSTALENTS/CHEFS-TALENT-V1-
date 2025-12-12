'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();
    useEffect(() => {
        // Redirect logic handled by AdminLayout essentially, 
        // but explicit redirect is cleaner
        router.push('/admin/dashboard');
    }, [router]);
    return null;
}