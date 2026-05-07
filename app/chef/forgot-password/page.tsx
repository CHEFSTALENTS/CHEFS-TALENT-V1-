'use client';
import { useState } from 'react';
import { createClientSupabase } from '@/utils/supabase/client';
import { useChefLocale } from '@/lib/ChefLocaleContext';

export default function ForgotPasswordPage() {
  const supabase = createClientSupabase();
  const { t } = useChefLocale();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) return setError(error.message);
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold">{t.auth.forgotTitle}</h1>
      <p className="mt-2 opacity-80">{t.auth.forgotDesc}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.auth.forgotEmailPlaceholder}
          className="w-full border rounded-lg p-3"
        />

        <button className="w-full rounded-lg p-3 bg-black text-white">
          {t.auth.forgotCta}
        </button>

        {sent && <p className="text-sm">{t.auth.forgotSent}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
