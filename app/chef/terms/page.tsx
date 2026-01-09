'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function TermsInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // Exemple: tu peux récupérer un "next" si tu veux rediriger après acceptation
  const next = sp.get('next') || '/chef';

  const [accepted, setAccepted] = useState(false);

  const title = useMemo(() => 'Conditions de collaboration — Chefs', []);

  const handleAccept = async () => {
    // Ici tu peux appeler une route /api/chef/terms pour enregistrer l’acceptation (Supabase)
    // await fetch('/api/chef/terms', { method: 'POST', ... })

    // Pour l’instant: simple redirection
    router.replace(next);
  };

  return (
    <div className="min-h-screen bg-[#F6F3EF] text-stone-900">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
            Chef Talents
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-stone-600">
            Merci de lire et accepter avant d’accéder au portail.
          </p>
        </div>

        {/* CONTENU */}
        <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-4">
            {/* ✅ Colle ici tes CG “chef” (ou importe depuis un composant/MD) */}
            <div className="prose prose-stone max-w-none">
              <p className="text-sm text-stone-600">
                (Ton texte des conditions ici)
              </p>
            </div>
          </div>

          <div className="border-t border-stone-200 p-6 md:p-8 bg-stone-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                J’ai lu et j’accepte les conditions de collaboration Chef Talents.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!accepted}
              className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Continuer
            </button>
          </div>
        </div>

        <div className="mt-8 text-xs text-stone-500">
          © Chef Talents — Accès réservé aux chefs validés.
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F6F3EF] text-stone-600">
          Chargement…
        </div>
      }
    >
      <TermsInner />
    </Suspense>
  );
}
