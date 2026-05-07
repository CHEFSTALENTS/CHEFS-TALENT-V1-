'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { LOCALES, LOCALE_LABELS, LOCALE_FULL_LABELS } from '@/lib/chef-i18n';

export const dynamic = 'force-dynamic';

export default function ChefLoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useChefLocale();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (data?.session?.user) {
        router.replace('/chef/dashboard');
        return;
      }

      setChecking(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg(t.auth.errEmailMissing);
    if (!password) return setMsg(t.auth.errPasswordMissing);

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      const session = data?.session ?? (await supabase.auth.getSession()).data.session;
      if (!session?.user) throw new Error(t.auth.errSessionMissing);

      router.replace('/chef/dashboard');
    } catch (e: any) {
      setMsg(e?.message || t.auth.errLogin);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-sm text-stone-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md border border-stone-200 bg-white p-8">
        {/* Locale switcher (compact) */}
        <div className="flex justify-end mb-4">
          <div
            role="group"
            aria-label={t.switcher.ariaLabel}
            className="inline-flex items-center rounded-full border border-stone-200 bg-white overflow-hidden text-[10px]"
          >
            {LOCALES.map((l) => {
              const isActive = l === locale;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => !isActive && setLocale(l)}
                  aria-pressed={isActive}
                  title={LOCALE_FULL_LABELS[l]}
                  className={`px-2.5 py-1 font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {LOCALE_LABELS[l]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-xs tracking-widest uppercase text-stone-400">{t.auth.sectionLabel}</div>
          <h1 className="text-3xl font-serif text-stone-900 mt-2">{t.auth.loginTitle}</h1>
        </div>

        <form onSubmit={onLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-stone-400">{t.auth.emailLabel}</label>
            <input
              className="w-full border-b border-stone-300 bg-transparent py-3 outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <label className="text-xs uppercase tracking-widest text-stone-400">
                {t.auth.passwordLabel}
              </label>

              <Link
                href="/chef/forgot-password"
                className="text-xs underline text-stone-500 hover:text-stone-900"
              >
                {t.auth.forgotPassword}
              </Link>
            </div>

            <input
              className="w-full border-b border-stone-300 bg-transparent py-3 outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPlaceholder}
              autoComplete="current-password"
            />
          </div>

          {msg && <div className="text-sm text-stone-600">{msg}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 hover:bg-stone-800 disabled:opacity-50"
          >
            {loading ? t.auth.loginLoading : t.auth.loginCta}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-stone-500">
          {t.auth.noAccount}{' '}
          <Link href="/chef/signup" className="underline">
            {t.auth.createAccountLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
