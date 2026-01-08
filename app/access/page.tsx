'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AccessInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const area = (sp.get('area') || 'public') as 'admin' | 'public';
  const next = sp.get('next') || '/';

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<'concierge' | 'client' | 'other'>('concierge');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitlistOk, setWaitlistOk] = useState(false);

  const title = useMemo(() => {
    return area === 'admin' ? 'Accès Admin' : 'Accès Privé';
  }, [area]);

  const subtitle = useMemo(() => {
    return area === 'admin'
      ? "Zone réservée à l’équipe."
      : 'Chef Talents est en lancement privé. Accès sur code uniquement.';
  }, [area]);

  const handleAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ area, code, next }),
      });

      const json = await res.json().catch(() => null);
      if (!json?.success) {
        setError('Code incorrect. Merci de réessayer.');
        setLoading(false);
        return;
      }

      router.replace(next);
    } catch {
      setError("Impossible de vérifier le code. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    setLoading(true);
    setError(null);
    setWaitlistOk(false);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          email,
          company,
          role,
          source: 'access_gate',
        }),
      });

      if (!res.ok) throw new Error('WAITLIST_FAIL');
      setWaitlistOk(true);
    } catch {
      setError("On n’a pas pu enregistrer l’email. Réessaie (ou branche Make/Supabase).");
    } finally {
      setLoading(false);
    }
  };

  const cardInput =
    'w-full px-4 py-3 rounded-2xl border border-stone-300 bg-[#FAFAF9] text-stone-900 placeholder:text-stone-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-[#C7A44A]/30 focus:border-[#C7A44A]/50 transition';

  return (
    <div className="min-h-screen text-stone-900 bg-gradient-to-br from-[#F6F4EF] via-[#FAF9F7] to-[#EFEDE8]">
      {/* subtle grain / vignette */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.35),transparent_55%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* LEFT */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6C9A3]/45 bg-[#FFF9E8] px-4 py-2 text-xs text-[#7A6A3A] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#C7A44A]" />
              Lancement en cours — accès privé
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-stone-900">
              {title}
            </h1>

            <p className="text-stone-600 text-lg leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-400 mb-2">
                Pré-lancement
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                Nous finalisons actuellement l’onboarding des chefs et l’activation des premières zones.
                Si vous êtes une <b>conciergerie / agence</b>, laissez votre email : on vous donnera un accès prioritaire
                dès l’ouverture officielle.
              </p>

              <div className="mt-4 text-xs text-stone-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                  Positionnement : premium & confidentiel
                </span>
              </div>
            </div>

            <div className="text-xs text-stone-400">
              © Chef Talents — Accès limité. Toute demande soumise en avance peut être mise en attente.
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 md:p-8 space-y-6 shadow-xl">
            {/* Access */}
            <div className="space-y-2">
              <div className="text-sm text-stone-500">Entrer le code</div>

              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code d’accès"
                className={cardInput}
              />

              {error ? <div className="text-sm text-red-600">{error}</div> : null}

              <button
                onClick={handleAccess}
                disabled={loading || !code.trim()}
                className="w-full px-4 py-3 rounded-2xl bg-[#C7A44A] text-white font-medium hover:bg-[#B8963E]
                           disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {loading ? 'Vérification…' : 'Accéder'}
              </button>

              <div className="text-[11px] text-stone-400">
                Accès sur invitation — si vous n’avez pas de code, rejoignez la liste d’attente.
              </div>
            </div>

            <div className="h-px bg-stone-200" />

            {/* Waitlist */}
            <div className="space-y-3">
              <div className="text-sm text-stone-600">
                Pas de code ? <span className="text-stone-900 font-medium">Être prévenu du lancement</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className={cardInput}
                >
                  <option value="concierge">Conciergerie / Agence</option>
                  <option value="client">Client privé</option>
                  <option value="other">Autre</option>
                </select>

                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Société (optionnel)"
                  className={cardInput}
                />
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className={cardInput}
              />

              <button
                onClick={handleWaitlist}
                disabled={loading || !email.trim()}
                className="w-full px-4 py-3 rounded-2xl border border-stone-300 bg-stone-100 text-stone-900
                           font-medium hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Enregistrement…' : 'Me prévenir au lancement'}
              </button>

              {waitlistOk ? (
                <div className="text-sm text-emerald-700">
                  Merci — on vous préviendra dès l’ouverture.
                </div>
              ) : null}

              <div className="text-xs text-stone-400 leading-relaxed">
                En soumettant votre email, vous acceptez d’être contacté au sujet du lancement.
              </div>

              <div className="text-[11px] text-stone-400">
                Astuce : pour les conciergeries, indiquez votre société pour qu’on vous priorise.
              </div>
            </div>

            {/* Small luxury footer */}
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                Chef Talents — Private Release
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F4EF] text-stone-700 p-10">Accès…</div>}>
      <AccessInner />
    </Suspense>
  );
}
