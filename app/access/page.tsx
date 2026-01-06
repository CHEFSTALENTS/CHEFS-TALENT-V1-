'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AccessInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const area = (sp.get('area') || 'public') as 'admin' | 'chef' | 'public';
    const next = sp.get('next') || '/';

    (async () => {
      try {
        // On appelle l'API qui pose le cookie gate
        await fetch('/api/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ area, code: '', next }), // code vide => si PUBLIC_CODE requis, voir note plus bas
          cache: 'no-store',
        });
      } catch (e) {
        // silencieux
      }

      // Puis on redirige
      router.replace(next);
    })();
  }, [router, sp]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-sm text-stone-600">Accès…</div>
    </div>
  );
}

export default function AccessPage() {
  // ✅ nécessaire pour éviter l'erreur Next 14 useSearchParams() sans Suspense
  return (
    <Suspense fallback={<div className="p-8">Accès…</div>}>
      <AccessInner />
    </Suspense>
  );
}
