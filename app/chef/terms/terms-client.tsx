'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { TOC, BodyFR, BodyEN, BodyES, type Locale } from './_content';
import { chefFetchRaw } from '@/lib/chefFetch';

const CURRENT_TERMS_VERSION = '08/05/2026';
const LS_TERMS_KEY = `ct_chef_terms_v_${CURRENT_TERMS_VERSION}`;

// Wording du UI shell (titres, boutons, mentions) par locale
const UI = {
  fr: {
    eyebrow: 'Chefs Talents',
    title: 'Conditions de collaboration — Chefs',
    lastUpdated: 'Dernière mise à jour',
    tocLabel: 'Sommaire',
    acceptCheckbox: 'J’ai lu et j’accepte les Conditions de Collaboration Chefs Talents.',
    acceptCta: 'Accepter et continuer',
    accepting: 'Enregistrement…',
    versionLabel: 'Version en vigueur',
    errorMissingCheckbox: 'Merci de cocher la case d’acceptation.',
    errorAccept: 'Impossible d’enregistrer l’acceptation. Réessaie.',
  },
  en: {
    eyebrow: 'Chefs Talents',
    title: 'Terms of Collaboration — Chefs',
    lastUpdated: 'Last updated',
    tocLabel: 'Contents',
    acceptCheckbox: 'I have read and accept the Chefs Talents Terms of Collaboration.',
    acceptCta: 'Accept and continue',
    accepting: 'Saving…',
    versionLabel: 'Active version',
    errorMissingCheckbox: 'Please tick the acceptance box.',
    errorAccept: 'Could not save acceptance. Please retry.',
  },
  es: {
    eyebrow: 'Chefs Talents',
    title: 'Condiciones de Colaboración — Chefs',
    lastUpdated: 'Última actualización',
    tocLabel: 'Sumario',
    acceptCheckbox: 'He leído y acepto las Condiciones de Colaboración de Chefs Talents.',
    acceptCta: 'Aceptar y continuar',
    accepting: 'Guardando…',
    versionLabel: 'Versión vigente',
    errorMissingCheckbox: 'Por favor marca la casilla de aceptación.',
    errorAccept: 'No se pudo guardar la aceptación. Inténtalo de nuevo.',
  },
} as const;

export default function TermsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/chef/dashboard';

  const [locale, setLocale] = useState<Locale>('fr');
  const t = UI[locale];

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const Body = useMemo(() => {
    if (locale === 'en') return BodyEN;
    if (locale === 'es') return BodyES;
    return BodyFR;
  }, [locale]);

  const accept = async () => {
    setErr(null);

    if (!checked) {
      setErr(t.errorMissingCheckbox);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) {
        router.replace('/chef/login');
        return;
      }

      const res = await chefFetchRaw('/api/chef/terms/accept', {
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({
          version: CURRENT_TERMS_VERSION,
          accepted: true,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'ACCEPT_FAIL');
      }

      // UX fallback
      try {
        localStorage.setItem(LS_TERMS_KEY, '1');
      } catch {}

      router.replace(next);
    } catch {
      setErr(t.errorAccept);
    } finally {
      setLoading(false);
    }
  };

  const localeOptions: Array<{ code: Locale; label: string }> = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-stone-900">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">

          {/* ────── Header ────── */}
          <header className="px-8 md:px-14 pt-10 md:pt-14 pb-10 border-b border-stone-200">
            <div className="flex items-center justify-between gap-4 mb-10">
              <div className="text-[11px] uppercase tracking-[0.25em] text-stone-400">
                {t.eyebrow}
              </div>

              {/* Sélecteur de langue */}
              <div className="inline-flex border border-stone-200 rounded-full overflow-hidden">
                {localeOptions.map((opt) => {
                  const active = locale === opt.code;
                  return (
                    <button
                      key={opt.code}
                      onClick={() => setLocale(opt.code)}
                      className={`px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                        active
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      {opt.code.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <h1 className="text-3xl md:text-[2.25rem] font-serif text-stone-900 leading-tight tracking-tight">
              {t.title}
            </h1>

            <p className="mt-4 text-sm text-stone-500">
              {t.lastUpdated} : <span className="text-stone-700">{CURRENT_TERMS_VERSION}</span>
            </p>
          </header>

          {/* ────── Sommaire ────── */}
          <nav className="px-8 md:px-14 py-10 border-b border-stone-200 bg-stone-50/50">
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500 mb-5">
              {t.tocLabel}
            </p>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2.5 text-[14px]">
              {TOC.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    className="group flex items-baseline gap-3 text-stone-700 hover:text-stone-900 transition-colors"
                  >
                    <span className="text-stone-400 tabular-nums w-5 shrink-0">
                      {entry.number}.
                    </span>
                    <span className="group-hover:underline decoration-stone-400 underline-offset-4">
                      {entry.label[locale]}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* ────── Corps des conditions ────── */}
          <article className="px-8 md:px-14 py-12 md:py-16">
            <Body />
          </article>

          {/* ────── Acceptation ────── */}
          <footer className="px-8 md:px-14 py-10 border-t border-stone-200 bg-stone-50/50 rounded-b-2xl space-y-5">
            <label className="flex items-start gap-3 text-[14px] text-stone-700 leading-6">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 accent-stone-900"
              />
              <span>{t.acceptCheckbox}</span>
            </label>

            {err ? <div className="text-sm text-red-600">{err}</div> : null}

            <button
              onClick={accept}
              disabled={loading || !checked}
              className="w-full md:w-auto md:px-12 rounded-full bg-stone-900 text-white py-3 text-sm font-medium tracking-wide hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              {loading ? t.accepting : t.acceptCta}
            </button>

            <div className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
              {t.versionLabel} : {CURRENT_TERMS_VERSION}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
