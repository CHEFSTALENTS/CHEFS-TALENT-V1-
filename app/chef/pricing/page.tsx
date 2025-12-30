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

async function saveChefProfilePatch(patch: any) {
  const user = auth.getCurrentUser?.();
  if (!user?.id) throw new Error('No user');

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
  const resPut = await fetch('/api/chef/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
      const payload: ChefPricing = {
        ...pricing,
        residence: {
          dailyRate: pricing.residence.dailyRate,
          currency: 'EUR',
          minDays: pricing.residence.minDays,
        },
        updatedAt: new Date().toISOString(),
      };

      await saveChefProfilePatch({ pricing: payload });

      // update local storage profile as well (si ton auth le supporte)
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
                  placeholder="ex: 650"
                />
                <p className="text-xs text-stone-400">Indiquez votre base hors achats matière première si besoin.</p>
              </div>

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
