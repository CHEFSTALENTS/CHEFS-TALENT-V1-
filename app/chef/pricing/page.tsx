'use client';

import React, { useEffect, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Textarea, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

type Tier = 'essential' | 'premium' | 'luxury' | 'ultra';

function toNumberOrNull(v: any) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function saveChefProfilePatch(patch: any) {
  const user = auth.getCurrentUser?.();
  if (!user?.id) throw new Error('No user');

  const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`);
  const json = await resGet.json();
  const current = json?.profile ?? {};

  const merged = {
    ...current,
    ...patch,
    id: user.id,
    email: user.email,
    updatedAt: new Date().toISOString(),
  };

  const resPut = await fetch('/api/chef/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: user.id, profile: merged }),
  });

  if (!resPut.ok) throw new Error(await resPut.text());
  return merged;
}

export default function ChefPricingPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [tier, setTier] = useState<Tier>('premium');

  const [dailyRate, setDailyRate] = useState<string>('');
  const [minDays, setMinDays] = useState<string>('');

  const [pp, setPp] = useState<string>('');
  const [minGuests, setMinGuests] = useState<string>('');

  const [flagHighSeason, setFlagHighSeason] = useState(false);
  const [flagInternational, setFlagInternational] = useState(false);
  const [flagYacht, setFlagYacht] = useState(false);
  const [flagBrigade, setFlagBrigade] = useState(false);

  const [notes, setNotes] = useState('');

  useEffect(() => {
    const user = auth.getCurrentUser?.();
    const p = user?.profile ?? {};
    const pricing = p.pricing ?? {};

    const t = (pricing?.tier ?? 'premium') as Tier;
    setTier(t);

    setDailyRate(pricing?.residence?.dailyRate != null ? String(pricing.residence.dailyRate) : '');
    setMinDays(pricing?.residence?.minDays != null ? String(pricing.residence.minDays) : '');

    setPp(pricing?.event?.pricePerPerson != null ? String(pricing.event.pricePerPerson) : '');
    setMinGuests(pricing?.event?.minGuests != null ? String(pricing.event.minGuests) : '');

    setFlagHighSeason(Boolean(pricing?.flags?.highSeason));
    setFlagInternational(Boolean(pricing?.flags?.international));
    setFlagYacht(Boolean(pricing?.flags?.yacht));
    setFlagBrigade(Boolean(pricing?.flags?.brigade));

    setNotes(String(pricing?.notes ?? ''));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        pricing: {
          tier,
          residence: {
            dailyRate: toNumberOrNull(dailyRate),
            currency: 'EUR' as const,
            minDays: toNumberOrNull(minDays),
          },
          event: {
            pricePerPerson: toNumberOrNull(pp),
            minGuests: toNumberOrNull(minGuests),
          },
          flags: {
            highSeason: flagHighSeason,
            international: flagInternational,
            yacht: flagYacht,
            brigade: flagBrigade,
          },
          notes: notes?.trim() ? notes.trim() : '',
          updatedAt: new Date().toISOString(),
        },
      };

      const merged = await saveChefProfilePatch(payload);

      // optionnel: garder synchro localStorage (si ton auth stocke le user)
      await auth.updateChefProfile?.(merged.id, merged);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Impossible d'enregistrer le pricing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChefLayout>
      <div className="max-w-2xl">
        <Marker />
        <Label>Profil</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Tarifs & Positionnement</h1>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          <div className="space-y-2">
            <Label>Gamme tarifaire</Label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              className="w-full px-3 py-2 border border-stone-200"
            >
              <option value="essential">Essential</option>
              <option value="premium">Premium</option>
              <option value="luxury">Luxury</option>
              <option value="ultra">Ultra</option>
            </select>
            <p className="text-xs text-stone-400">
              Cette gamme sert au matching. Elle ne juge pas la qualité du chef.
            </p>
          </div>

          <div className="space-y-4">
            <Label>Résidence</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tarif journalier (€ / jour)</Label>
                <Input value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="ex: 650" />
              </div>
              <div className="space-y-2">
                <Label>Minimum de jours (optionnel)</Label>
                <Input value={minDays} onChange={(e) => setMinDays(e.target.value)} placeholder="ex: 3" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Événement</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prix par personne (€ / pers)</Label>
                <Input value={pp} onChange={(e) => setPp(e.target.value)} placeholder="ex: 120" />
              </div>
              <div className="space-y-2">
                <Label>Minimum convives</Label>
                <Input value={minGuests} onChange={(e) => setMinGuests(e.target.value)} placeholder="ex: 10" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Options (pour le matching)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={flagHighSeason} onChange={(e) => setFlagHighSeason(e.target.checked)} />
                Haute saison
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={flagInternational} onChange={(e) => setFlagInternational(e.target.checked)} />
                International
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={flagYacht} onChange={(e) => setFlagYacht(e.target.checked)} />
                Yacht
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={flagBrigade} onChange={(e) => setFlagBrigade(e.target.checked)} />
                Brigade possible
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Infos utiles (ex: déplacement, équipe, conditions)..."
              className="h-24"
            />
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            {success && <span className="text-sm text-green-600">Tarifs enregistrés.</span>}
            <Button type="submit" disabled={loading} className="ml-auto w-32">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </ChefLayout>
  );
}
