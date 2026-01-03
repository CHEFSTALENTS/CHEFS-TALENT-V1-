'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

type ChefProfileMobility = {
  baseCity?: string;
  travelRadiusKm?: number;
  internationalMobility?: boolean;
  coverageZones?: string[];
  location?: {
    baseCity?: string;
    travelRadiusKm?: number;
    internationalMobility?: boolean;
    coverageZones?: string[];
  };
};

const ZONES = [
  "Paris / Île-de-France",
  "Côte d'Azur / Monaco",
  'Provence / Alpilles',
  'Alpes (Courchevel, Megève)',
  'Suisse (Genève, Gstaad)',
  'Ibiza / Baléares',
  'Londres',
  'Italie (Milan, Rome, Toscane)',
  'Espagne (Barcelone, Marbella)',
  'Moyen-Orient (Dubaï, Doha)',
  'International',
] as const;

function normalizeStr(v: any) {
  return String(v || '').trim();
}
function normalizeCityKey(city: string) {
  return normalizeStr(city).toLowerCase();
}
function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function getSuggestedZones(baseCity: string, radiusKm: number, international: boolean): string[] {
  const key = normalizeCityKey(baseCity);

  const suggested: string[] = [];

  // Heuristiques simples (pas de géocoding, mais très lisible et efficace)
  const isParis = key.includes('paris') || key.includes('île-de-france') || key.includes('ile de france');
  const isRiviera =
    key.includes('nice') ||
    key.includes('cannes') ||
    key.includes('antibes') ||
    key.includes('saint-tropez') ||
    key.includes('st tropez') ||
    key.includes('monaco') ||
    key.includes('menton');

  const isProvence =
    key.includes('marseille') ||
    key.includes('aix') ||
    key.includes('avignon') ||
    key.includes('arles') ||
    key.includes('alpilles') ||
    key.includes('provence');

  const isAlps =
    key.includes('courchevel') ||
    key.includes('megeve') ||
    key.includes('mégève') ||
    key.includes('chamonix') ||
    key.includes('val d') ||
    key.includes('alpes') ||
    key.includes('geneve') ||
    key.includes('genève');

  const isSwiss = key.includes('geneve') || key.includes('genève') || key.includes('lausanne') || key.includes('gstaad') || key.includes('zurich');

  const isIbiza = key.includes('ibiza') || key.includes('balear') || key.includes('palma') || key.includes('majorque') || key.includes('mallorca');

  const isLondon = key.includes('london') || key.includes('londres');

  const isItaly = key.includes('milan') || key.includes('milano') || key.includes('rome') || key.includes('roma') || key.includes('tosc') || key.includes('ital');

  const isSpain = key.includes('barcelona') || key.includes('madrid') || key.includes('marbella') || key.includes('esp');

  if (isParis) suggested.push("Paris / Île-de-France");
  if (isRiviera) suggested.push("Côte d'Azur / Monaco");
  if (isProvence) suggested.push('Provence / Alpilles');
  if (isAlps) suggested.push('Alpes (Courchevel, Megève)');
  if (isSwiss) suggested.push('Suisse (Genève, Gstaad)');
  if (isIbiza) suggested.push('Ibiza / Baléares');
  if (isLondon) suggested.push('Londres');
  if (isItaly) suggested.push('Italie (Milan, Rome, Toscane)');
  if (isSpain) suggested.push('Espagne (Barcelone, Marbella)');

  // Si radius grand, on peut ajouter une zone “proche” pertinente
  if (radiusKm >= 300) {
    // Paris => Alpes / Suisse souvent demandés
    if (isParis) suggested.push('Alpes (Courchevel, Megève)', 'Suisse (Genève, Gstaad)');
    // Côte d'Azur => Provence + Italie + Suisse
    if (isRiviera) suggested.push('Provence / Alpilles', 'Italie (Milan, Rome, Toscane)', 'Suisse (Genève, Gstaad)');
    // Provence => Côte d'Azur + Alpes
    if (isProvence) suggested.push("Côte d'Azur / Monaco", 'Alpes (Courchevel, Megève)');
  }

  if (international) suggested.push('International');

  // fallback si rien reconnu
  if (suggested.length === 0) {
    if (international) return ['International'];
    // sinon on propose les 2 zones “générales” qui parlent à tout le monde
    return ["Paris / Île-de-France", "Côte d'Azur / Monaco"];
  }

  return uniq(suggested);
}

export default function ChefMobilityPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [data, setData] = useState({
    baseCity: '',
    travelRadiusKm: 50,
    internationalMobility: false,
    coverageZones: [] as string[],
  });

  useEffect(() => {
    const user = auth.getCurrentUser?.();
    const p = (user?.profile ?? {}) as ChefProfileMobility;

    setData({
      baseCity: p.location?.baseCity ?? p.baseCity ?? '',
      travelRadiusKm: p.location?.travelRadiusKm ?? p.travelRadiusKm ?? 50,
      internationalMobility: p.location?.internationalMobility ?? p.internationalMobility ?? false,
      coverageZones: (p.location?.coverageZones ?? p.coverageZones ?? []) as string[],
    });
  }, []);

  const suggestedZones = useMemo(() => {
    return getSuggestedZones(data.baseCity, Number(data.travelRadiusKm || 0), !!data.internationalMobility);
  }, [data.baseCity, data.travelRadiusKm, data.internationalMobility]);

  const toggleZone = (zone: string) => {
    setData((prev) => ({
      ...prev,
      coverageZones: prev.coverageZones.includes(zone)
        ? prev.coverageZones.filter((z) => z !== zone)
        : [...prev.coverageZones, zone],
    }));
  };

  async function saveChefProfilePatch(patch: any) {
    const user = auth.getCurrentUser?.();
    if (!user?.id) throw new Error('No user');

    // 1) GET existing profile from DB
    const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
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

  const applySuggested = () => {
    setData((prev) => ({
      ...prev,
      coverageZones: uniq(suggestedZones),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.getCurrentUser?.();
      if (!user?.id) throw new Error('No user');

      const patch = {
        // ✅ on garde location comme source de vérité
        location: {
          baseCity: normalizeStr(data.baseCity),
          travelRadiusKm: Number(data.travelRadiusKm || 0),
          internationalMobility: !!data.internationalMobility,
          coverageZones: uniq(data.coverageZones),
        },

        // ✅ compat: certains écrans lisent encore ces champs au top-level
        baseCity: normalizeStr(data.baseCity),
        travelRadiusKm: Number(data.travelRadiusKm || 0),
        internationalMobility: !!data.internationalMobility,
        coverageZones: uniq(data.coverageZones),
      };

      // ✅ DB (merge)
      await saveChefProfilePatch(patch);

      // ✅ local sync (UX)
      await auth.updateChefProfile?.(user.id, patch as any);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('MOBILITY SAVE ERROR', e);
      alert((e as any)?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChefLayout>
      <div className="max-w-2xl">
        <Marker />
        <Label>Logistique</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Zone & Mobilité</h1>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          <div className="space-y-2">
            <Label>Ville de base</Label>
            <Input
              value={data.baseCity}
              onChange={(e) => setData({ ...data, baseCity: e.target.value })}
              placeholder="Ex: Paris, Nice, Genève..."
            />
            <p className="text-xs text-stone-400">
              Cette ville sert à suggérer automatiquement des zones de couverture.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rayon de déplacement (km)</Label>
            <Input
              type="number"
              value={data.travelRadiusKm}
              onChange={(e) => setData({ ...data, travelRadiusKm: parseInt(e.target.value || '0', 10) || 0 })}
              placeholder="50"
            />
          </div>

          <label className="flex items-center gap-4 p-6 bg-stone-50 border border-stone-100 cursor-pointer">
            <div
              className={`w-5 h-5 border flex items-center justify-center ${
                data.internationalMobility ? 'bg-stone-900 border-stone-900' : 'border-stone-300'
              }`}
            >
              {data.internationalMobility && <div className="w-2 h-2 bg-white" />}
            </div>

            <input
              type="checkbox"
              className="hidden"
              checked={data.internationalMobility}
              onChange={() => setData({ ...data, internationalMobility: !data.internationalMobility })}
            />

            <div>
              <span className="block font-medium text-stone-900">Mobilité Internationale</span>
              <span className="text-xs text-stone-500">Prêt à voyager pour des missions (passeport valide requis).</span>
            </div>
          </label>

          {/* ✅ Suggested zones */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between gap-3">
              <Label>Zones suggérées</Label>
              <Button type="button" onClick={applySuggested} className="w-auto px-4" disabled={suggestedZones.length === 0}>
                Appliquer
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestedZones.map((z) => (
                <span
                  key={z}
                  className="text-xs px-2.5 py-1 border border-stone-200 bg-stone-50 text-stone-700"
                >
                  {z}
                </span>
              ))}
              {suggestedZones.length === 0 ? (
                <span className="text-xs text-stone-400">Indique une ville pour obtenir des suggestions.</span>
              ) : null}
            </div>

            <p className="text-xs text-stone-400">
              Tu peux appliquer puis ajuster manuellement en dessous.
            </p>
          </div>

          {/* ✅ All zones */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <Label>Zones de Couverture (sélection)</Label>
            <div className="grid grid-cols-2 gap-3">
              {ZONES.map((zone) => (
                <label
                  key={zone}
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                    data.coverageZones.includes(zone) ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-sm font-medium text-stone-800">{zone}</span>

                  <input
                    type="checkbox"
                    className="hidden"
                    checked={data.coverageZones.includes(zone)}
                    onChange={() => toggleZone(zone)}
                  />

                  <div
                    className={`w-4 h-4 border flex items-center justify-center ${
                      data.coverageZones.includes(zone) ? 'bg-stone-900 border-stone-900' : 'border-stone-300'
                    }`}
                  >
                    {data.coverageZones.includes(zone) && <div className="w-1.5 h-1.5 bg-white" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
            {success && <span className="text-sm text-green-600">Modifications enregistrées.</span>}
            <Button type="submit" disabled={loading} className="ml-auto w-32">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </ChefLayout>
  );
}
