'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/storage';

export default function ChefRegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('Thomas');
  const [lastName, setLastName] = useState('Delcroix');
  const [email, setEmail] = useState('thomas@cheftalents.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await auth.registerChef({ email, password, firstName, lastName });

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Erreur');
      return;
    }

    router.push('/chef/missions');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Créer un compte</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border p-3 rounded" placeholder="Prénom"
          value={firstName} onChange={e => setFirstName(e.target.value)} />
        <input className="w-full border p-3 rounded" placeholder="Nom"
          value={lastName} onChange={e => setLastName(e.target.value)} />

        <input className="w-full border p-3 rounded" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />

        <input className="w-full border p-3 rounded" placeholder="Mot de passe" type="password"
          value={password} onChange={e => setPassword(e.target.value)} />

        {error && <p className="text-red-600">{error}</p>}

        <button disabled={loading} className="w-full bg-black text-white p-3 rounded">
          {loading ? 'Création...' : 'Créer'}
        </button>
      </form>
    </div>
  );
}
