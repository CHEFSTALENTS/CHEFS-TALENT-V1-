"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabase } from "@/utils/supabase/client";
import { useChefLocale } from "@/lib/ChefLocaleContext";

export default function ResetPasswordClient() {
  const supabase = useMemo(() => createClientSupabase(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useChefLocale();

  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        // 1) Cas où Supabase renvoie des tokens dans le hash (#access_token=...)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token=")) {
          const params = new URLSearchParams(hash.replace("#", ""));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
          }
        }

        // 2) Cas PKCE: ?code=...
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
      } catch (e: any) {
        if (alive) setError(e?.message || t.resetPassword.invalidOrExpired);
      } finally {
        if (alive) setReady(true);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [searchParams, supabase, t.resetPassword.invalidOrExpired]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }

      setDone(true);
      setTimeout(() => router.replace("/chef/login"), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-sm text-stone-500">{t.resetPassword.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold">{t.resetPassword.pageTitle}</h1>
      <p className="mt-2 text-sm text-stone-600">{t.resetPassword.pageSubtitle}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.resetPassword.passwordPlaceholder}
          className="w-full border rounded-lg p-3"
        />

        <button
          type="submit"
          disabled={done || submitting}
          className="w-full rounded-lg p-3 bg-black text-white disabled:opacity-50"
        >
          {done ? t.resetPassword.success : submitting ? t.resetPassword.submitting : t.resetPassword.submit}
        </button>

        {done && (
          <p className="text-sm">{t.resetPassword.successRedirecting}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
