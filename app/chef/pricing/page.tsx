'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

type PricingTier = 'essential' | 'premium' | 'luxury' | 'ultra';

type ChefPricing = {
  tier: PricingTier | null;
  residence: { dailyRate: number | null; currency: 'EUR'; minDays: number | null };
  event: { pricePerPerson: number | null; minGuests: number | null };
  flags: { highSeason?: boolean; international?: boolean; yacht?: boolean; brigade?: boolean };
  notes?: string; // ignore côté chef
  updatedAt: string;
};

const defaultPricing = (): ChefPricing => ({
  tier: null,
  residence: { dailyRate: null, currency: 'EUR', minDays: null },
  event: { pricePerPerson: null, minGuests: null },
  flags: { highSeason: false, international: false, yacht: false, brigade: false },
  updatedAt: new Date().toISOString(),
});
const PRICING_BENCHMARK: Record<PricingTier, {
  residence: { min: number; max: number };
  event: { min: number; max: number };
  label: string;
}> = {
  essential: {
    label: "Essential",
    residence: { min: 250, max: 450 },
    event: { min: 80, max: 130 },
  },
  premium: {
    label: "Premium",
    residence: { min: 450, max: 800 },
    event: { min: 130, max: 220 },
  },
  luxury: {
    label: "Luxury",
    residence: { min: 800, max: 1500 },
    event: { min: 220, max: 400 },
  },
  ultra: {
    label: "Ultra",
    residence: { min: 1500, max: 3000 },
    event: { min: 400, max: 800 },
  },
};

const PRICING_MULTIPLIERS = {
  highSeason: 1.15,      // +15%
  international: 1.2,    // +20%
  yacht: 1.25,           // +25%
  brigade: 1.2,          // +20%
};

function computeMultiplier(flags: ChefPricing["flags"]) {
  let m = 1;
  if (flags.highSeason) m *= PRICING_MULTIPLIERS.highSeason;
  if (flags.international) m *= PRICING_MULTIPLIERS.international;
  if (flags.yacht) m *= PRICING_MULTIPLIERS.yacht;
  if (flags.brigade) m *= PRICING_MULTIPLIERS.brigade;
  return m;
}

function roundTo(v: number, step: number) {
  return Math.round(v / step) * step;
}

function getSuggestedForTier(tier: PricingTier, flags: ChefPricing["flags"]) {
  const base = PRICING_BENCHMARK[tier];
  const m = computeMultiplier(flags);

  // suggestion = milieu de range * multiplicateur, arrondi
  const dailyMid = (base.residence.min + base.residence.max) / 2;
  const ppMid = (base.event.min + base.event.max) / 2;

  return {
    residenceDaily: roundTo(dailyMid * m, 25),
    eventPP: roundTo(ppMid * m, 5),
    multiplier: m,
    base,
  };
}


async function saveChefProfilePatch(patch: any) {
  const user = auth.getCurrentUser?.();
  if (!user?.id) throw new Error("No user");

  // 1) GET existing profile from DB
  const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`);
  const json = await resGet.json();
  const current = json?.profile ?? {};

  // 2) merge
  const merged = {
    ...current,
    ...patch,
    id: user.id,
    email: user.email,
    updatedAt: new Date().toISOString(),
  };

  // 3) PUT
  const resPut = await fetch("/api/chef/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, profile: merged }),
  });

  if (!resPut.ok) throw new Error(await resPut.text());
  return merged;
}


function toNumberOrNull(v: any): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function getRangeStatus(value: number | null, min: number, max: number) {
  if (value === null) return { state: 'empty' as const, text: 'Non renseigné' };
  if (value < min) return { state: 'low' as const, text: `Plutôt bas (marché: ${min}–${max})` };
  if (value > max) return { state: 'high' as const, text: `Plutôt haut (marché: ${min}–${max})` };
  return { state: 'ok' as const, text: `Dans le marché (${min}–${max})` };
}

function statusClass(state: 'empty' | 'low' | 'high' | 'ok') {
  if (state === 'ok') return 'text-green-700';
  if (state === 'low') return 'text-amber-700';
  if (state === 'high') return 'text-amber-700';
  return 'text-stone-400';
}

function TierCard({
  id,
  title,
  subtitle,
  active,
  onClick,
}: {
  id: PricingTier;
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 border transition w-full ${
        active ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="text-sm font-semibold text-stone-900">{title}</div>
      <div className="text-xs text-stone-500 mt-1">{subtitle}</div>
    </button>
  );
}

function FlagToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
        checked ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <span className="text-sm font-medium text-stone-800">{label}</span>
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <div className={`w-4 h-4 border flex items-center justify-center ${checked ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
        {checked ? <div className="w-1.5 h-1.5 bg-white" /> : null}
      </div>
    </label>
  );
}

export default function ChefPricingPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
const [mode, setMode] = useState<'simple' | 'target'>('simple');
const [targetNetPerDay, setTargetNetPerDay] = useState<number | null>(null);
const [estimatedCostsPerDay, setEstimatedCostsPerDay] = useState<number | null>(null); // ex: transport/logement/temps prep
  const suggestion = useMemo(() => {
  if (!pricing.tier) return null;
  return getSuggestedForTier(pricing.tier, pricing.flags);
}, [pricing.tier, pricing.flags]);
  
  const [pricing, setPricing] = useState<ChefPricing>(defaultPricing());

  // charge depuis le profil local (storage) si présent, sinon on laisse vide
  useEffect(() => {
    const user = auth.getCurrentUser?.();
    const p = (user as any)?.profile ?? null;
    const existing = p?.pricing ?? null;

    if (existing && typeof existing === 'object') {
      // normalise proprement
      setPricing({
        ...defaultPricing(),
        ...existing,
        residence: { ...defaultPricing().residence, ...(existing.residence ?? {}) },
        event: { ...defaultPricing().event, ...(existing.event ?? {}) },
        flags: { ...defaultPricing().flags, ...(existing.flags ?? {}) },
        updatedAt: existing.updatedAt || new Date().toISOString(),
      });
    }
  }, []);

  const tierHelp = useMemo(() => {
    return (
      <div className="text-xs text-stone-500 mt-2">
        Ce choix sert à <b>positionner</b> votre offre (pas à vous noter). Il n’impacte pas votre score.
      </div>
    );
  }, []);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ payload depuis le state (source de vérité)
      const payload: ChefPricing = {
        ...pricing,
        residence: {
          dailyRate: pricing.residence.dailyRate ?? null,
          currency: 'EUR',
          minDays: pricing.residence.minDays ?? null,
        },
        event: {
          pricePerPerson: pricing.event.pricePerPerson ?? null,
          minGuests: pricing.event.minGuests ?? null,
        },
        flags: {
          highSeason: !!pricing.flags.highSeason,
          international: !!pricing.flags.international,
          yacht: !!pricing.flags.yacht,
          brigade: !!pricing.flags.brigade,
        },
        updatedAt: new Date().toISOString(),
      };

      // ✅ 1 seule écriture DB
      await saveChefProfilePatch({ pricing: payload });

      // ✅ update local storage (si dispo)
      const user = auth.getCurrentUser?.();
      if (user?.id) {
        await auth.updateChefProfile?.(user.id, { pricing: payload } as any);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.warn('[ChefPricing] save failed', err?.message || err);
      alert(err?.message || 'Erreur lors de l’enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChefLayout>
      <div className="max-w-2xl">
        <Marker />
        <Label>Tarifs</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Positionnement & Pricing</h1>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          {/* Tier */}
          <div className="space-y-3">
            <Label>Votre positionnement</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TierCard
                id="essential"
                title="Essential"
                subtitle="Déjeuners / dîners privés, familles, petits groupes"
                active={pricing.tier === 'essential'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'essential' }))}
              />
              <TierCard
                id="premium"
                title="Premium"
                subtitle="Villas, conciergeries, expériences soignées"
                active={pricing.tier === 'premium'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'premium' }))}
              />
              <TierCard
                id="luxury"
                title="Luxury"
                subtitle="Chalets, yachts, UHNW, exigences élevées"
                active={pricing.tier === 'luxury'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'luxury' }))}
              />
              <TierCard
                id="ultra"
                title="Ultra"
                subtitle="Résidences longues, yachts >40m, brigade possible"
                active={pricing.tier === 'ultra'}
                onClick={() => setPricing((p) => ({ ...p, tier: 'ultra' }))}
              />
            </div>
            {tierHelp}
            {pricing.tier && suggestion ? (
  <div className="mt-3 rounded-xl border border-stone-200 bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-stone-900">Suggestions (Premium)</div>
        <div className="text-xs text-stone-500 mt-1">
          Base marché: Résidence <b>{suggestion.base.residence.min}–{suggestion.base.residence.max} €/jour</b> •
          Événementiel <b>{suggestion.base.event.min}–{suggestion.base.event.max} €/pers</b>
        </div>
        <div className="text-xs text-stone-500 mt-1">
          Ajustement options: <b>x{suggestion.multiplier.toFixed(2)}</b> (haute saison / international / yacht / brigade)
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() =>
            setPricing((p) => ({
              ...p,
              residence: { ...p.residence, dailyRate: suggestion.residenceDaily },
              event: { ...p.event, pricePerPerson: suggestion.eventPP },
            }))
          }
          className="px-3 py-2 text-sm border border-stone-200 bg-stone-50 hover:bg-stone-100"
        >
          Appliquer suggestions
        </button>

        <button
          type="button"
          onClick={() =>
            setPricing((p) => ({
              ...p,
              residence: { ...p.residence, dailyRate: null, minDays: null },
              event: { ...p.event, pricePerPerson: null, minGuests: null },
            }))
          }
          className="px-3 py-2 text-sm border border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
        >
          Réinitialiser
        </button>
      </div>
    </div>

    {/* Mode toggle */}
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => setMode('simple')}
        className={`px-3 py-2 text-xs border ${mode === 'simple' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'}`}
      >
        Mode simple
      </button>
      <button
        type="button"
        onClick={() => setMode('target')}
        className={`px-3 py-2 text-xs border ${mode === 'target' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'}`}
      >
        Objectif de revenu
      </button>
    </div>

    {/* Mode objectif */}
    {mode === 'target' ? (
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-stone-500">Objectif net / jour (€)</div>
          <Input
            type="number"
            min={0}
            value={targetNetPerDay ?? ''}
            onChange={(e) => setTargetNetPerDay(toNumberOrNull(e.target.value))}
            placeholder="ex: 600"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-stone-500">Coûts estimés / jour (€)</div>
          <Input
            type="number"
            min={0}
            value={estimatedCostsPerDay ?? ''}
            onChange={(e) => setEstimatedCostsPerDay(toNumberOrNull(e.target.value))}
            placeholder="ex: 120"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-stone-500">Tarif conseillé</div>
          <div className="border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900">
            {(() => {
              const net = targetNetPerDay ?? null;
              if (!net) return '—';
              const costs = estimatedCostsPerDay ?? 0;
              // tarif conseillé = (net + coûts) * multiplicateur, arrondi
              const suggested = roundTo((net + costs) * suggestion.multiplier, 25);
              return `${suggested} €/jour`;
            })()}
          </div>

          <button
            type="button"
            className="mt-2 px-3 py-2 text-xs border border-stone-200 bg-white hover:bg-stone-50"
            onClick={() => {
              const net = targetNetPerDay ?? null;
              if (!net) return;
              const costs = estimatedCostsPerDay ?? 0;
              const suggested = roundTo((net + costs) * suggestion.multiplier, 25);
              setPricing((p) => ({ ...p, residence: { ...p.residence, dailyRate: suggested } }));
            }}
          >
            Appliquer au tarif journalier
          </button>
        </div>
      </div>
    ) : null}

    <div className="mt-3 text-[11px] text-stone-500">
      *Indicatif. Tu restes libre. Ça sert à aider le matching et à éviter l’inconnu pour concierges/clients.
    </div>
  </div>
) : null}
            
          </div>

          {/* Residence */}
          <div className="space-y-3 pt-6 border-t border-stone-100">
            <Label>Résidence privée</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tarif journalier (€/jour)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.residence.dailyRate ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      residence: { ...p.residence, dailyRate: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder="ex: 500"
                />
                <p className="text-xs text-stone-400">Indiquez votre base hors achats matière première si besoin.</p>
              </div>
{pricing.tier ? (() => {
  const r = PRICING_BENCHMARK[pricing.tier].residence;
  const s = getRangeStatus(pricing.residence.dailyRate, r.min, r.max);
  return <div className={`text-xs mt-1 ${statusClass(s.state)}`}>{s.text}</div>;
})() : (
  <div className="text-xs mt-1 text-stone-400">Choisissez un positionnement pour voir la référence marché.</div>
)}
              
              <div className="space-y-2">
                <Label>Minimum de jours (optionnel)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.residence.minDays ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      residence: { ...p.residence, minDays: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder="ex: 3"
                />
                <p className="text-xs text-stone-400">Ex: 2 jours minimum pour déplacement.</p>
              </div>
            </div>
          </div>

          {/* Event */}
          <div className="space-y-3 pt-6 border-t border-stone-100">
            <Label>Événementiel</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prix par personne (€/pers)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.event.pricePerPerson ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      event: { ...p.event, pricePerPerson: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder="ex: 120"
                />
              </div>
{pricing.tier ? (() => {
  const r = PRICING_BENCHMARK[pricing.tier].event;
  const s = getRangeStatus(pricing.event.pricePerPerson, r.min, r.max);
  return <div className={`text-xs mt-1 ${statusClass(s.state)}`}>{s.text}</div>;
})() : null}
              
              <div className="space-y-2">
                <Label>Minimum de convives (optionnel)</Label>
                <Input
                  type="number"
                  min={0}
                  value={pricing.event.minGuests ?? ''}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      event: { ...p.event, minGuests: toNumberOrNull(e.target.value) },
                    }))
                  }
                  placeholder="ex: 12"
                />
              </div>
            </div>
            <p className="text-xs text-stone-400">
              Si vous ne faites pas d’événementiel, laissez vide.
            </p>
          </div>

          {/* Flags */}
          <div className="space-y-3 pt-6 border-t border-stone-100">
            <Label>Options</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FlagToggle
                label="Haute saison"
                checked={!!pricing.flags.highSeason}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, highSeason: !p.flags.highSeason } }))}
              />
              <FlagToggle
                label="International"
                checked={!!pricing.flags.international}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, international: !p.flags.international } }))}
              />
              <FlagToggle
                label="Yacht"
                checked={!!pricing.flags.yacht}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, yacht: !p.flags.yacht } }))}
              />
              <FlagToggle
                label="Brigade possible"
                checked={!!pricing.flags.brigade}
                onChange={() => setPricing((p) => ({ ...p, flags: { ...p.flags, brigade: !p.flags.brigade } }))}
              />
            </div>
          </div>
<div className="pt-6 border-t border-stone-100">
  <Label>Résumé (visible concierge)</Label>
  <div className="mt-2 rounded-xl border border-stone-200 bg-white p-4 text-sm">
    <div className="flex flex-wrap gap-2 items-center">
      <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">
        Tier: <b>{pricing.tier ?? '—'}</b>
      </span>
      {pricing.flags.highSeason ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">Haute saison</span> : null}
      {pricing.flags.international ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">International</span> : null}
      {pricing.flags.yacht ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">Yacht</span> : null}
      {pricing.flags.brigade ? <span className="px-2 py-1 border border-stone-200 bg-stone-50 text-xs">Brigade</span> : null}
    </div>

    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="border border-stone-200 bg-stone-50 p-3">
        <div className="text-xs text-stone-500">Résidence</div>
        <div className="mt-1">
          <b>{pricing.residence.dailyRate ? `${pricing.residence.dailyRate} €/jour` : '—'}</b>
          {pricing.residence.minDays ? <span className="text-stone-600"> • min {pricing.residence.minDays} jours</span> : null}
        </div>
      </div>

      <div className="border border-stone-200 bg-stone-50 p-3">
        <div className="text-xs text-stone-500">Événementiel</div>
        <div className="mt-1">
          <b>{pricing.event.pricePerPerson ? `${pricing.event.pricePerPerson} €/pers` : '—'}</b>
          {pricing.event.minGuests ? <span className="text-stone-600"> • min {pricing.event.minGuests} pers</span> : null}
        </div>
      </div>
    </div>
  </div>
</div>
          
          {/* Save */}
          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            {success ? <span className="text-sm text-green-600">Modifications enregistrées.</span> : <span />}
            <Button type="submit" disabled={loading} className="ml-auto w-32">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </ChefLayout>
  );
}
