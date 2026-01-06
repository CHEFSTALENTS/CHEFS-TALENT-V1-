'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const area = sp.get('area') || 'public';
    const next = sp.get('next') || '/';

    (async () => {
      try {
        await fetch(`/api/access?area=${encodeURIComponent(area)}`, { method: 'POST' });
      } catch {}
      router.replace(next);
    })();
  }, [router, sp]);

  return <div className="p-8">Chargement…</div>;
}
