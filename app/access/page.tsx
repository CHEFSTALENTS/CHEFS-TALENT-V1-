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
      ? 'Zone réservée à l’équipe.'
      : 'Chef Talents est en cours de lancement. Accès sur code uniquement.';
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
      // IMPORTANT :
      // Sans DB ou webhook, l’email ne peut pas être stocké “pour de vrai”.
      // Ce endpoint peut forward vers un webhook (Make/Zapier) si tu mets WAITLIST_WEBHOOK_URL.
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
      setError("On n’a pas pu enregistrer l’email. Réessaie (ou dis-moi si tu veux le brancher à Make/Supabase).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* LEFT: Brand / message */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75">
              <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
              Lancement en cours — accès privé
            </div>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
              {title}
            </h1>

            <p className="text-white/70 text-lg leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-white/80">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/45 mb-2">
                  Pré-lancement
                </div>
                <p className="leading-relaxed">
                  Nous finalisons actuellement l’onboarding des chefs et l’activation des premières zones.
                  Si vous êtes une <b>conciergerie / agence</b>, laissez votre email : on vous donnera un accès prioritaire
                  dès l’ouverture officielle.
                </p>
              </div>
            </div>

            <div className="text-xs text-white/40">
              © Chef Talents — Accès limité. Toute demande soumise en avance peut être mise en attente.
            </div>
          </div>

          {/* RIGHT: Card access + waitlist */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-sm text-white/60">Entrer le code</div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code d’accès"
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/30 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
              />
              {error ? <div className="text-sm text-red-300">{error}</div> : null}
              <button
                onClick={handleAccess}
                disabled={loading || !code.trim()}
                className="w-full px-4 py-3 rounded-2xl bg-white text-black font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Vérification…' : 'Accéder'}
              </button>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-3">
              <div className="text-sm text-white/70">
                Pas de code ? <span className="text-white/90 font-medium">Être prévenu du lancement</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                >
                  <option value="concierge">Conciergerie / Agence</option>
                  <option value="client">Client privé</option>
                  <option value="other">Autre</option>
                </select>

                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Société (optionnel)"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/30 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-black/30 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/10"
              />

              <button
                onClick={handleWaitlist}
                disabled={loading || !email.trim()}
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10 text-white font-medium hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Enregistrement…' : 'Me prévenir au lancement'}
              </button>

              {waitlistOk ? (
                <div className="text-sm text-emerald-300">
                  Merci — on vous préviendra dès l’ouverture.
                </div>
              ) : null}

              <div className="text-xs text-white/35">
                En soumettant votre email, vous acceptez d’être contacté au sujet du lancement.
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
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0C] text-white p-10">Accès…</div>}>
      <AccessInner />
    </Suspense>
  );
}
