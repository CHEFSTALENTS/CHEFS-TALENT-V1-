'use client';

import { useState } from 'react';

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const next =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next') || '/'
      : '/';

  const submit = async () => {
    setLoading(true);
    setErr(null);

    const res = await fetch('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    setLoading(false);

    if (!res.ok) {
      setErr('Code invalide.');
      return;
    }

    window.location.href = next;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6">
        <h1 className="text-2xl font-serif text-stone-900">Accès privé</h1>
        <p className="text-sm text-stone-500 mt-2">
          Le site est en cours de finalisation. Entrez le code d’accès.
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Code d’accès…"
            className="w-full px-3 py-2 rounded-xl border border-stone-200"
            onKeyDown={e => {
              if (e.key === 'Enter') submit();
            }}
          />
          <button
            onClick={submit}
            disabled={loading}
            className="w-full px-3 py-2 rounded-xl bg-stone-900 text-white disabled:opacity-50"
          >
            {loading ? 'Vérification…' : 'Entrer'}
          </button>

          {err ? <div className="text-sm text-red-600">{err}</div> : null}
        </div>
      </div>
    </div>
  );
}
