'use client';

import React, { useEffect, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

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
    const merged = {
  ...data,
  location: {
    baseCity: data.baseCity,
    travelRadiusKm: data.travelRadiusKm,
    internationalMobility: data.internationalMobility,
    coverageZones: data.coverageZones,
  },
  meta: {
    updatedAt: new Date().toISOString(),
  }
};
    const user = auth.getCurrentUser?.();
    if (user?.profile) {
      setData({
        baseCity: user.profile.baseCity || '',
        travelRadiusKm: user.profile.travelRadiusKm || 50,
        internationalMobility: user.profile.internationalMobility || false,
        coverageZones: user.profile.coverageZones || [],
      });
    }
  }, []);

  const toggleZone = (zone: string) => {
    setData(prev => ({
      ...prev,
      coverageZones: prev.coverageZones.includes(zone)
        ? prev.coverageZones.filter(z => z !== zone)
        : [...prev.coverageZones, zone],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const user = auth.getCurrentUser?.();
    if (!user?.id) throw new Error("No user");

    const merged = {
      id: user.id,
      email: user.email ?? null,
      location: {
        baseCity: data.baseCity,
        travelRadiusKm: data.travelRadiusKm,
        internationalMobility: data.internationalMobility,
        coverageZones: data.coverageZones,
      },
      updatedAt: new Date().toISOString(),
    };

    const res = await fetch("/api/chef/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, profile: merged }),
    });

    if (!res.ok) throw new Error(await res.text());

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  } catch (e) {
    console.error("MOBILITY SAVE ERROR", e);
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
              onChange={e => setData({ ...data, baseCity: e.target.value })}
              placeholder="Ex: Paris, Nice, Genève..."
            />
          </div>

          <div className="space-y-2">
            <Label>Rayon de déplacement (km)</Label>
            <Input
              type="number"
              value={data.travelRadiusKm}
              onChange={e =>
                setData({ ...data, travelRadiusKm: parseInt(e.target.value || '0', 10) || 0 })
              }
              placeholder="50"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-stone-100">
            <Label>Zones de Couverture</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Paris / Île-de-France",
                "Côte d'Azur / Monaco",
                "Provence / Alpilles",
                "Alpes (Courchevel, Megève)",
                "Suisse (Genève, Gstaad)",
                "International",
              ].map(zone => (
                <label
                  key={zone}
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                    data.coverageZones.includes(zone)
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
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
