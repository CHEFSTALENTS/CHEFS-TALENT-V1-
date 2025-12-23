'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Marker, Button, Input } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

type ChefProfile = {
  id?: string;
  email?: string;
  availability?: {
    availableNow?: boolean;
    nextAvailableFrom?: string | null;
    preferredPeriods?: string[];
    unavailableDates?: string[];
  };
  updatedAt?: string;
  [key: string]: any;
};

const PERIODS = [
  { key: 'weekdays', label: 'Semaine' },
  { key: 'weekends', label: 'Week-ends' },
  { key: 'evenings', label: 'Soirs' },
  { key: 'season_winter', label: 'Saison hiver' },
  { key: 'season_summer', label: 'Saison été' },
];

export default function ChefAvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState<ChefProfile>({});
  const [availableNow, setAvailableNow] = useState<boolean>(false);
  const [nextAvailableFrom, setNextAvailableFrom] = useState<string>('');
  const [preferredPeriods, setPreferredPeriods] = useState<string[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  const today = useMemo(() => new Date(), []);

  // 35 prochains jours
  const days = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, [today]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const user = auth.getCurrentUser?.();
        if (!user?.id) {
          if (!cancelled) setLoading(false);
          return;
        }

        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`);
        const json = await res.json();
        const fromDb: ChefProfile | null = json?.profile ?? null;

        const base = fromDb ?? { id: user.id, email: user.email ?? null };

        const a = base.availability ?? {};
        if (!cancelled) {
          setProfile(base);
          setAvailableNow(!!a.availableNow);
          setNextAvailableFrom(a.nextAvailableFrom ?? '');
          setPreferredPeriods(a.preferredPeriods ?? []);
          setUnavailableDates(a.unavailableDates ?? []);
          setLoading(false);
        }
      } catch (e) {
        console.error('LOAD AVAILABILITY ERROR', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const togglePeriod = (k: string) => {
    setPreferredPeriods(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]));
  };

  const toggleDate = (dateStr: string) => {
    setUnavailableDates(prev => (prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]));
  };

  const save = async (patch?: Partial<ChefProfile['availability']>) => {
    setSaving(true);
    setSuccess(false);

    try {
      const user = auth.getCurrentUser?.();
      if (!user?.id) throw new Error('No user');

      const nextAvailability = {
        availableNow,
        nextAvailableFrom: nextAvailableFrom || null,
        preferredPeriods,
        unavailableDates,
        ...(patch ?? {}),
      };

      const merged: ChefProfile = {
        ...profile, // garde le reste du profil
        id: user.id,
        email: user.email ?? profile.email ?? null,
        availability: nextAvailability,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, profile: merged }),
      });

      if (!res.ok) throw new Error(await res.text());

      setProfile(merged);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      console.error('AVAILABILITY SAVE ERROR', e);
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save();
  };

  if (loading) {
    return (
      <ChefLayout>
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
      </ChefLayout>
    );
  }

  return (
    <ChefLayout>
      <div className="max-w-4xl">
        <Marker />
        <Label>Planning</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Disponibilités</h1>

        <form onSubmit={onSubmit} className="bg-white p-8 border border-stone-200 space-y-8">
          {/* Quick status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="p-4 border border-stone-200 bg-stone-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={availableNow}
                  onChange={() => setAvailableNow(v => !v)}
                />
                <div>
                  <div className="text-sm font-medium text-stone-900">Disponible immédiatement</div>
                  <div className="text-xs text-stone-500">Active si tu peux accepter une mission maintenant.</div>
                </div>
              </div>
            </label>

            <div className="p-4 border border-stone-200">
              <Label>Prochaine disponibilité</Label>
              <Input
                type="date"
                value={nextAvailableFrom}
                onChange={e => setNextAvailableFrom(e.target.value)}
              />
              <div className="text-xs text-stone-500 mt-1">Laisse vide si tu es flexible.</div>
            </div>

            <div className="p-4 border border-stone-200">
              <Label>Périodes préférées</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PERIODS.map(p => {
                  const on = preferredPeriods.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => togglePeriod(p.key)}
                      className={`px-3 py-1 text-xs border transition ${
                        on ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div>
            <p className="text-stone-500 font-light mb-4">
              Par défaut, vous êtes considéré comme <strong>disponible</strong>. Cliquez sur les dates pour les marquer comme{' '}
              <span className="text-red-500 font-medium">indisponibles</span>.
            </p>

            <div className="grid grid-cols-7 gap-px bg-stone-200 border border-stone-200">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div
                  key={day}
                  className="bg-stone-50 p-4 text-center text-xs font-medium uppercase tracking-widest text-stone-400"
                >
                  {day}
                </div>
              ))}

              {days.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const isUnavailable = unavailableDates.includes(dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => toggleDate(dateStr)}
                    className={`h-28 p-4 text-left transition-colors relative hover:bg-stone-50 ${
                      isUnavailable ? 'bg-stone-100' : 'bg-white'
                    }`}
                  >
                    <span className={`text-sm font-medium ${isUnavailable ? 'text-stone-400' : 'text-stone-900'}`}>
                      {date.getDate()}
                    </span>

                    {isUnavailable && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs uppercase tracking-widest text-red-400 bg-red-50 px-2 py-1">
                          Occupé
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {success ? <span className="text-sm text-green-600">Enregistré ✅</span> : <span />}
              <Button type="submit" disabled={saving} className="w-32">
                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </form>

        {/* autosave option (si tu veux) */}
        <div className="text-xs text-stone-400 mt-4">
         
        </div>
      </div>
    </ChefLayout>
  );
}
