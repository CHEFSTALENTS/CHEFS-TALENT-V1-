'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AccessClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const next = sp.get('next') || '/';
  const area = (sp.get('area') || 'chef') as 'admin' | 'chef' | 'public';

  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, code, next }),
      });

      if (!res.ok) throw new Error(await res.text());

      // cookie posé par l’API → on redirige
      router.push(next);
      router.refresh();
    } catch (e: any) {
      setErr('Code invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Accès {area}</h1>

      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code d’accès"
          className="border px-3 py-2 rounded"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="border px-3 py-2 rounded"
        >
          {loading ? '…' : 'Valider'}
        </button>
      </div>

      {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
    </div>
  );
}
