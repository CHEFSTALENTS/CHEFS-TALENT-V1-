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

  // Authentification via OAuth Google : utile si l'utilisateur a créé son
  // compte Supabase via Google et n'a pas de mot de passe email/password.
  // Nécessite que le provider Google soit activé dans Supabase Dashboard
  // → Authentication → Providers → Google.
  const onGoogleLogin = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/chef/dashboard`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo ? { redirectTo } : undefined,
      });

      if (error) throw error;
      // signInWithOAuth redirige automatiquement vers Google ;
      // pas besoin de router.replace manuel.
    } catch (e: any) {
      setMsg(e?.message || 'Erreur de connexion Google');
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

        {/* Séparateur "ou" */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[10px] uppercase tracking-widest text-stone-400">ou</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        {/* Connexion Google OAuth */}
        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-stone-300 bg-white text-stone-900 py-3 hover:bg-stone-50 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          <span className="text-sm font-medium">Continuer avec Google</span>
        </button>

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
