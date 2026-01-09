'use client';

import React, { useEffect, useState } from 'react';

const TERMS_TEXT_KEY = 'ct_terms_chefs_text';
const TERMS_VERSION_KEY = 'ct_terms_chefs_version';

export default function AdminTermsPage() {
  const [text, setText] = useState('');
  const [version, setVersion] = useState('v1');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TERMS_TEXT_KEY) || '';
      const v = localStorage.getItem(TERMS_VERSION_KEY) || 'v1';
      setText(t);
      setVersion(v);
    } catch {}
  }, []);

  const save = () => {
    setSaved(false);
    try {
      localStorage.setItem(TERMS_TEXT_KEY, text);
      localStorage.setItem(TERMS_VERSION_KEY, version || 'v1');
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Conditions Chefs</h1>
          <p className="text-white/60 text-sm mt-1">
            Colle ici tes conditions générales. Les chefs devront accepter avant d’accéder au portail.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-white/60">Version</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5"
              placeholder="v1"
            />
            <p className="text-xs text-white/40 mt-2">
              Change la version (ex: v2) si tu modifies les CG → les chefs devront re-accepter.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-white/60">Texte</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-2 w-full min-h-[520px] px-3 py-3 rounded-xl border border-white/10 bg-white/5"
              placeholder="Colle tes conditions ici…"
            />
          </div>
        </div>

        <button
          onClick={save}
          className="px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90"
        >
          Enregistrer
        </button>

        {saved ? <div className="text-sm text-emerald-300">✅ Enregistré</div> : null}
      </div>
    </div>
  );
}
