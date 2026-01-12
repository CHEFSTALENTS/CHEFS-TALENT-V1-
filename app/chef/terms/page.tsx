// app/chef/terms/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ChefTermsPage() {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/terms?area=chef', { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        setHtml(String(json?.html || ''));
      } catch {
        setHtml('');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif text-stone-900">Conditions de collaboration — Chefs</h1>
          <Link href="/chef/dashboard" className="text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900">
            ← Retour
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8">
          {html ? (
            <div className="prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="text-stone-500">Aucune condition trouvée. Vérifie l’API /api/terms?area=chef.</p>
          )}
        </div>
      </div>
    </div>
  );
}
