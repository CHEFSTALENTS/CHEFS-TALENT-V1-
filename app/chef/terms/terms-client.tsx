'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

const CURRENT_TERMS_VERSION = '09/01/2026';
const LS_TERMS_KEY = `ct_chef_terms_v_${CURRENT_TERMS_VERSION}`;

export default function TermsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/chef/dashboard';

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => 'Conditions de collaboration – Chefs', []);

  const accept = async () => {
    setErr(null);

    if (!checked) {
      setErr("Merci de cocher la case d’acceptation.");
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

      const res = await fetch('/api/chef/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          userId,
          version: CURRENT_TERMS_VERSION,
          accepted: true,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'ACCEPT_FAIL');
      }

      try {
        localStorage.setItem(LS_TERMS_KEY, '1');
      } catch {}

      router.replace(next);
    } catch {
      setErr("Impossible d’enregistrer l’acceptation. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-stone-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-stone-200 bg-white shadow-sm p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-stone-400">Chef Talents</div>

          <h1 className="mt-2 text-3xl md:text-4xl font-serif">{title}</h1>

          <p className="mt-2 text-sm text-stone-500">Dernière mise à jour : {CURRENT_TERMS_VERSION}</p>

          <div className="mt-10 border-t border-stone-200 pt-6 space-y-4">
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1"
              />
              <span>J’ai lu et j’accepte les Conditions de Collaboration Chef Talents.</span>
            </label>

            {err ? <div className="text-sm text-red-600">{err}</div> : null}

            <button
              onClick={accept}
              disabled={loading || !checked}
              className="w-full rounded-2xl bg-stone-900 text-white py-3 font-medium hover:bg-stone-800 disabled:opacity-40"
            >
              {loading ? 'Enregistrement…' : 'Accepter et continuer'}
            </button>

            <div className="text-xs text-stone-400">Version en vigueur : {CURRENT_TERMS_VERSION}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
