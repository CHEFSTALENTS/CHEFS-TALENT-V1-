"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(error.message);

    setDone(true);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>

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

        <button className="w-full rounded-lg p-3 bg-black text-white">
          Mettre à jour
        </button>

        {done && <p className="text-sm">Mot de passe mis à jour. Vous pouvez vous connecter.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
