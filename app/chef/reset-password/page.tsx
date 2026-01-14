"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabase } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClientSupabase(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 1) Quand on arrive depuis l'email, on échange le "code" contre une session
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
      } catch (e: any) {
        if (alive) setError(e?.message || "Lien invalide ou expiré.");
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [searchParams, supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(error.message);

    setDone(true);

    // ✅ Option: renvoyer vers login après quelques secondes
    setTimeout(() => router.replace("/chef/login"), 1200);
  };

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-sm text-stone-500">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-stone-600">
        Choisissez un nouveau mot de passe pour votre compte Chef Talents.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 caractères"
          className="w-full border rounded-lg p-3"
        />

        <button
          type="submit"
          disabled={done}
          className="w-full rounded-lg p-3 bg-black text-white disabled:opacity-50"
        >
          {done ? "Mis à jour ✅" : "Mettre à jour"}
        </button>

        {done && (
          <p className="text-sm">
            Mot de passe mis à jour. Redirection vers la page de connexion…
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
