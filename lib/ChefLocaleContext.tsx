'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  Locale,
  Dictionary,
  dictionaries,
  isLocale,
} from './chef-i18n';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
};

const ChefLocaleContext = createContext<Ctx | null>(null);

export function ChefLocaleProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initial ?? DEFAULT_LOCALE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored)) setLocaleState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    // Sync vers Supabase (profile.preferredLocale) — fire & forget
    fetch('/api/chef/me/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {
      /* offline ou pas auth, on garde juste localStorage */
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale, setLocale],
  );

  return (
    <ChefLocaleContext.Provider value={value}>
      {children}
    </ChefLocaleContext.Provider>
  );
}

export function useChefLocale(): Ctx {
  const ctx = useContext(ChefLocaleContext);
  if (!ctx) {
    throw new Error(
      'useChefLocale must be used within a <ChefLocaleProvider />. Check that app/chef/layout.tsx wraps the tree.',
    );
  }
  return ctx;
}
