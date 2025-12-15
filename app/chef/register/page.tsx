'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/storage';

export default function ChefRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('thomas@cheftalents.com');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('Thomas');
  const [lastName, setLastName] = useState('Delcroix');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await auth.registerChef({
      email,
      password,
      firstName,
      lastName,
    });

    if (!res.success) {
      setError(res.error || 'Erreur');
      return;
    }

    router.push('/chef/login');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-6">Créer un compte Chef</h1>

      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border p-3 rounded"
          value={firstName} onChange={e => setFirstName(e.target.value)}
          placeholder="Prénom" />

        <input className="w-full border p-3 rounded"
          value={lastName} onChange={e => setLastName(e.target.value)}
          placeholder="Nom" />

        <input className="w-full border p-3 rounded"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email" />

        <input type="password" className="w-full border p-3 rounded"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe" />

        {error && <p className="text-red-600">{error}</p>}

        <button className="w-full bg-black text-white p-3 rounded">
          Créer le compte
        </button>
      </form>
    </div>
  );
}
