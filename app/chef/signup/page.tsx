'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Marker, Label } from '../../../components/ui';
import { Loader2, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { LOCALES, LOCALE_LABELS, LOCALE_FULL_LABELS } from '@/lib/chef-i18n';

export default function ChefSignupPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useChefLocale();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      if (!email) throw new Error(t.auth.errEmailMissingSignup);
      if (!password || password.length < 8) throw new Error(t.auth.errPasswordTooShort);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            role: 'chef',
            preferredLocale: locale,
          },
        },
      });

      if (signUpError) throw signUpError;

      const userId = data.user?.id;
      if (!userId) {
        router.replace('/chef/login?checkEmail=1');
        return;
      }

      await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          profile: {
            id: userId,
            email,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            preferredLocale: locale,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        router.replace('/chef/dashboard');
      } else {
        router.replace('/chef/login?justSignedUp=1');
      }
    } catch (err: any) {
      setError(err?.message || t.auth.errSignup);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      {/* Left */}
      <div className="hidden md:block relative overflow-hidden bg-stone-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/55 to-black/70" />

        <div className="absolute inset-0 p-12 flex items-center justify-center">
          <div className="max-w-lg text-center">
            <div className="text-[10px] uppercase tracking-[0.35em] text-stone-200/80">
              {t.auth.signupSidebarLabel}
            </div>

            <h2 className="text-4xl font-serif mt-6 leading-tight text-stone-50 whitespace-pre-line">
              {t.auth.signupSidebarTitle}
            </h2>

            <p className="mt-5 text-stone-100/80 font-light leading-relaxed">
              {t.auth.signupSidebarDesc}
            </p>

            <div className="mt-8 space-y-3 text-sm text-stone-100/80 inline-block text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stone-200/80" />
                <span>{t.auth.signupBenefit1}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-200/80" />
                <span>{t.auth.signupBenefit2}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-stone-200/80" />
                <span>{t.auth.signupBenefit3}</span>
              </div>
            </div>

            <div className="mt-10 text-xs text-stone-200/70 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.auth.signupSidebarFooter}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-8 md:p-24">
        <div className="w-full max-w-md space-y-7">
          {/* Locale switcher (compact) */}
          <div className="flex justify-end">
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

          <div className="text-center md:text-left">
            <Marker className="mx-auto md:mx-0" />
            <Label>{t.auth.signupCandidateLabel}</Label>

            <div className="mt-4 space-y-2">
              <h1 className="text-3xl font-serif text-stone-900">{t.auth.signupTitle}</h1>
              <p className="text-sm text-stone-500 font-light leading-relaxed">
                {t.auth.signupSubtitle}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.auth.firstNameLabel}</Label>
                <Input
                  required
                  placeholder={t.auth.firstNamePlaceholder}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.auth.lastNameLabel}</Label>
                <Input
                  required
                  placeholder={t.auth.lastNamePlaceholder}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.auth.emailLabel}</Label>
              <Input
                type="email"
                required
                placeholder={t.auth.emailSignupPlaceholder}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.auth.passwordLabel}</Label>
              <Input
                type="password"
                required
                placeholder={t.auth.passwordSignupPlaceholder}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <div className="text-xs text-stone-400">{t.auth.privateNote}</div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 border border-red-100 rounded-xl">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : t.auth.signupCta}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/chef/login"
                className="text-xs text-stone-600 hover:text-stone-900 border-b border-transparent hover:border-stone-900 transition-all"
              >
                {t.auth.haveAccount}
              </Link>
            </div>
          </form>

          <div className="text-[11px] text-stone-400 leading-relaxed">
            {t.auth.signupLegalNote}
          </div>
        </div>
      </div>
    </div>
  );
}
