'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AccessInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const area = (sp.get('area') || 'public') as 'admin' | 'chef' | 'public';
  const next = sp.get('next') || '/';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, code, next }),
        cache: 'no-store',
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || 'Code invalide.');
        setLoading(false);
        return;
      }

      router.replace(next);
    } catch {
      setError('Erreur réseau.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto focus / reset quand change d’area
    setCode('');
    setError(null);
  }, [area, next]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-6">
        <div className="text-xs uppercase tracking-widest text-stone-400 mb-2">
          Accès {area}
        </div>
        <h1 className="text-2xl font-serif text-stone-900">Code d’accès</h1>
        <p className="text-sm text-stone-500 mt-2">
          Entrez le code pour continuer.
        </p>

        <div className="mt-5 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="••••••"
            className="w-full h-12 px-4 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            type="button"
            onClick={submit}
            disabled={loading || !code.trim()}
            className="w-full h-12 rounded-xl bg-stone-900 text-white disabled:opacity-40"
          >
            {loading ? 'Vérification…' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense fallback={<div className="p-8">Accès…</div>}>
      <AccessInner />
    </Suspense>
  );
}
