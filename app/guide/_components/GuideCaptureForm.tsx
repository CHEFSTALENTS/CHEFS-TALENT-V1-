'use client';

// Formulaire de capture email pour le lead magnet « Guide chef privé ».
// Sur soumission OK → redirige vers /guide/merci?ref=download.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function GuideCaptureForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Capture les UTM depuis l'URL pour les passer au backend (côté client
  // uniquement — pas besoin de Suspense boundary).
  const [utm, setUtm] = useState<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer?: string;
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setUtm({
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      referrer: document.referrer || undefined,
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          name: name.trim() || undefined,
          source: 'guide',
          ...utm,
        }),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      setDone(true);
      // Redirige après 1.5s pour laisser le temps de voir la confirmation
      setTimeout(() => {
        router.push(`/guide/merci?ref=${json.alreadyRegistered ? 'existing' : 'new'}`);
      }, 1500);
    } catch (e: any) {
      setError(e?.message || 'Erreur. Réessayez dans un instant.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-xl font-serif text-stone-900 mb-2">Merci !</h3>
        <p className="text-sm text-stone-600">
          Redirection vers votre guide…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">
          Téléchargement gratuit
        </div>
        <h2 className="text-2xl font-serif text-stone-900 leading-tight">
          Recevez le guide
        </h2>
        <p className="text-sm text-stone-500 mt-2">
          Lecture en ligne, ~12 minutes. Vous pourrez nous écrire directement
          si un projet se précise.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs uppercase tracking-[0.15em] text-stone-500 mb-1">
            Prénom (optionnel)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pour personnaliser l'email"
            className="w-full px-3 py-2.5 rounded border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.15em] text-stone-500 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="vous@exemple.com"
            className="w-full px-3 py-2.5 rounded border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900"
          />
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center px-4 py-3 rounded bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 transition"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {submitting ? 'Envoi en cours…' : 'Recevoir le guide'}
      </button>

      <p className="text-[11px] text-stone-400 leading-relaxed">
        En soumettant ce formulaire, vous acceptez de recevoir le guide par
        email + jusqu'à 3 emails de suivi (vous pouvez vous désinscrire à
        tout moment). Aucun spam, aucune revente.
      </p>
    </form>
  );
}
