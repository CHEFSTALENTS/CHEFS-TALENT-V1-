'use client';

import { useState } from 'react';

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    const r = await fetch('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!r.ok) {
      setErr('Code incorrect');
      return;
    }
    window.location.href = '/';
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', fontFamily: 'system-ui' }}>
      <h1>Accès privé</h1>
      <p>Entrez le code pour accéder au site.</p>
      <input
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Code"
        style={{ width: '100%', padding: 12, marginTop: 12 }}
      />
      <button onClick={submit} style={{ width: '100%', padding: 12, marginTop: 12 }}>
        Entrer
      </button>
      {err ? <p style={{ color: 'crimson' }}>{err}</p> : null}
    </div>
  );
}
