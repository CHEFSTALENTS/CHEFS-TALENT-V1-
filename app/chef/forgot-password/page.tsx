"use client";
import { useState } from "react";
import { createClientSupabase } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
const supabase = createClientSupabase();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) return setError(error.message);
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
      <p className="mt-2 opacity-80">Entrez votre email pour recevoir un lien de réinitialisation.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.com"
          className="w-full border rounded-lg p-3"
        />

        <button className="w-full rounded-lg p-3 bg-black text-white">
          Envoyer le lien
        </button>

        {sent && <p className="text-sm">Si l’email existe, un lien vient d’être envoyé.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
