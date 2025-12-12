'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError('Accès refusé');
      return;
    }

    router.push(next);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <form onSubmit={submit} style={{ width: 360, padding: 24, border: '1px solid #eee' }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Admin Portal</h1>
        <p style={{ color: '#666', marginBottom: 16 }}>Accès sécurisé réservé.</p>

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />

        <button type="submit" style={{ width: '100%', padding: 12 }}>
          Entrer
        </button>

        {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}
      </form>
    </div>
  );
}
