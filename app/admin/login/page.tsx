'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      setError('Accès refusé');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        width: '320px',
        textAlign: 'center'
      }}>
        <h2>Admin Portal</h2>
        <p style={{ opacity: 0.6 }}>Accès sécurisé réservé</p>

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '20px',
            marginBottom: '10px'
          }}
        />

        {error && (
          <p style={{ color: 'red', marginBottom: '10px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            background: '#111',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ENTRER
        </button>
      </form>
    </div>
  );
}
