'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AccessPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const next = sp.get('next') || '/';
  const area = (sp.get('area') as 'admin' | 'chef' | 'public') || 'public';

  const title = useMemo(() => {
    if (area === 'admin') return 'Accès Admin requis';
    if (area === 'chef') return 'Accès Chefs requis';
    return 'Accès requis';
  }, [area]);

  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, code, next }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || 'Code invalide');
      }

      // redirect
      router.replace(next);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
      <div className="w-full max-w-md border border-white/10 bg-white/5 rounded-2xl p-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-white/60 mt-2">
          Entrez votre code pour continuer.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code d'accès…"
            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          {err ? <div className="text-sm text-red-200">{err}</div> : null}
          <button
            onClick={submit}
            disabled={loading || !code.trim()}
            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 transition disabled:opacity-40"
          >
            {loading ? 'Vérification…' : 'Accéder'}
          </button>
        </div>
      </div>
    </div>
  );
}
