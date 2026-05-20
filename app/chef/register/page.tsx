'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/storage';
import { useChefLocale } from '@/lib/ChefLocaleContext';

export default function ChefRegisterPage() {
  const router = useRouter();
  const { t } = useChefLocale();
  // ⚠️ Inputs vides par défaut (au lieu de valeurs de test « thomas@cheftalents.com »
  // précédemment hardcodées) pour permettre une vraie inscription chef.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await auth.registerChef({ email, password, firstName, lastName });

      if (!res.success) {
        setError(res.error || t.register.errorFallback);
        return;
      }

      router.push('/chef/login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-6">{t.register.pageTitle}</h1>

      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border p-3 rounded"
          value={firstName} onChange={e => setFirstName(e.target.value)}
          placeholder={t.register.firstNamePlaceholder} />

        <input className="w-full border p-3 rounded"
          value={lastName} onChange={e => setLastName(e.target.value)}
          placeholder={t.register.lastNamePlaceholder} />

        <input className="w-full border p-3 rounded"
          type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder={t.register.emailPlaceholder} />

        <input type="password" className="w-full border p-3 rounded"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder={t.register.passwordPlaceholder} />

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white p-3 rounded disabled:opacity-50"
        >
          {submitting ? t.register.submitting : t.register.submit}
        </button>
      </form>
    </div>
  );
}
