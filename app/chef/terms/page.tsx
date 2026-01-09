'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/services/storage';

const TERMS_TEXT_KEY = 'ct_terms_chefs_text';
const TERMS_VERSION_KEY = 'ct_terms_chefs_version';

export default function ChefTermsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/chef';

  const [text, setText] = useState('');
  const [version, setVersion] = useState('v1');
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  const user = useMemo(() => auth.getCurrentUser(), []);
  const displayName = useMemo(() => {
    const n = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    return n || user?.email || 'Chef';
  }, [user]);

  useEffect(() => {
    try {
      setText(localStorage.getItem(TERMS_TEXT_KEY) || '');
      setVersion(localStorage.getItem(TERMS_VERSION_KEY) || 'v1');
    } catch {}
  }, []);

  const accept = async () => {
    if (!checked) return;
    setLoading(true);
    try {
      const u = auth.getCurrentUser();
      if (!u?.id) return;

      const acceptedAt = new Date().toISOString();

      // On stocke l’acceptation sur le user localStorage (MVP)
      auth.setCurrentUser({
        ...u,
        termsAcceptedAt: acceptedAt,
        termsVersionAccepted: version,
      });

      // Et on sync aussi dans la DB chefs (chef_talents_users_db) via updateChefProfile ou status
      // Ici on réutilise updateChefProfile pour stocker dans profile (simple MVP)
      await auth.updateChefProfile(u.id, {
        // @ts-ignore
        termsAcceptedAt: acceptedAt,
        // @ts-ignore
        termsVersionAccepted: version,
      } as any);

      setOk(true);
      setTimeout(() => router.replace(next), 400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-stone-900 px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-stone-500">Chef Talents</div>
            <h1 className="text-3xl md:text-4xl font-serif mt-2">
              Conditions de collaboration — Chefs
            </h1>
            <p className="text-stone-600 mt-3">
              Bonjour <span className="font-medium">{displayName}</span> — merci de lire et d’accepter pour accéder au portail.
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-stone-500">Version</div>
            <div className="text-sm font-medium">{version}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-sm">
          {text?.trim() ? (
            <div className="prose prose-stone max-w-none">
              {/* rendu simple : préserve les retours */}
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
                {text}
              </pre>
            </div>
          ) : (
            <div className="text-stone-600">
              Les conditions ne sont pas encore définies.  
              Va sur <b>/admin/terms</b> pour les coller.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm text-stone-700">
              J’ai lu et j’accepte les <b>conditions de collaboration Chef Talents</b> (version {version}).
            </span>
          </label>

          <button
            onClick={accept}
            disabled={!checked || loading || !text?.trim()}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Validation…' : ok ? '✅ Accepté' : 'Accepter et continuer'}
          </button>

          <div className="text-xs text-stone-500">
            Ton acceptation est enregistrée avec un horodatage.
          </div>
        </div>
      </div>
    </div>
  );
}
