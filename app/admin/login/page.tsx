'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/admin';
      } else {
        setError('Mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur serveur');
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
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: '40px',
          width: '320px',
          borderRadius: '8px',
          textAlign: 'center'
        }}
      >
        <h2>Admin Portal</h2>
        <p style={{ color: '#666' }}>Accès sécurisé réservé</p>

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '20px',
            marginBottom: '10px'
          }}
        />

        {error && (
          <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>
        )}

        <button
          type="submit"
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
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
