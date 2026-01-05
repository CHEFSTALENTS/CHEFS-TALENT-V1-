'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Marker, Button, Input } from '../../../components/ui';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

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

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function monthLabel(d: Date) {
  // ex: "janvier 2026"
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/**
 * Retourne une grille de 6 semaines (42 cases) pour un mois donné,
 * en démarrant la semaine le lundi.
 */
function buildMonthGrid(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // JS: 0=dim ... 6=sam. On veut lundi=0 ... dimanche=6
  const jsDay = firstOfMonth.getDay(); // 0..6
  const mondayIndex = (jsDay + 6) % 7; // lundi=0

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - mondayIndex);

  const days: Array<{
    date: Date;
    inMonth: boolean;
    iso: string;
  }> = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);

    days.push({
      date: d,
      inMonth: d >= firstOfMonth && d <= lastOfMonth,
      iso: toISODate(d),
    });
  }

  return days;
}

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
  const [month, setMonth] = useState<Date>(() => new Date()); // ✅ mois courant par défaut

  const monthGrid = useMemo(() => buildMonthGrid(month), [month]);

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

        // ✅ no-store bien placé
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
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

          // ✅ optionnel : se caler sur le mois de "nextAvailableFrom" si rempli
          if (a.nextAvailableFrom) {
            const d = new Date(String(a.nextAvailableFrom));
            if (!Number.isNaN(d.getTime())) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
          }
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
        ...profile,
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

  const goPrevMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToday = () => setMonth(new Date(today.getFullYear(), today.getMonth(), 1));

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
                <input type="checkbox" checked={availableNow} onChange={() => setAvailableNow(v => !v)} />
                <div>
                  <div className="text-sm font-medium text-stone-900">Disponible immédiatement</div>
                  <div className="text-xs text-stone-500">Active si tu peux accepter une mission maintenant.</div>
                </div>
              </div>
            </label>

            <div className="p-4 border border-stone-200">
              <Label>Prochaine disponibilité</Label>
              <Input type="date" value={nextAvailableFrom} onChange={e => setNextAvailableFrom(e.target.value)} />
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
            <div className="text-center md:text-left">
              <p className="text-stone-600 font-light mb-3">
                Par défaut, vous êtes considéré comme <strong>disponible</strong>. Cliquez sur une date pour la marquer comme{' '}
                <span className="text-red-500 font-medium">indisponible</span>.
              </p>
            </div>

            {/* Header mois */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <button
                type="button"
                onClick={goPrevMonth}
                className="p-2 rounded-md border border-stone-200 hover:bg-stone-50 transition"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center">
                <div className="text-sm font-medium text-stone-900 capitalize">
                  {monthLabel(month)}
                </div>
                <button
                  type="button"
                  onClick={goToday}
                  className="mt-1 text-xs text-stone-500 hover:text-stone-900 underline underline-offset-2"
                >
                  Revenir à aujourd’hui
                </button>
              </div>

              <button
                type="button"
                onClick={goNextMonth}
                className="p-2 rounded-md border border-stone-200 hover:bg-stone-50 transition"
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-stone-200 border border-stone-200">
              {WEEKDAYS.map(day => (
                <div
                  key={day}
                  className="bg-stone-50 px-2 py-3 text-center text-xs font-medium uppercase tracking-widest text-stone-500"
                >
                  {day}
                </div>
              ))}

              {monthGrid.map(({ date, inMonth, iso }) => {
                const isUnavailable = unavailableDates.includes(iso);
                const isToday =
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => toggleDate(iso)}
                    className={[
                      'h-20 md:h-24 p-3 text-left relative transition-colors',
                      'hover:bg-stone-50',
                      inMonth ? 'bg-white' : 'bg-stone-50/60',
                      isUnavailable ? 'bg-stone-100' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          'text-sm font-medium',
                          inMonth ? 'text-stone-900' : 'text-stone-400',
                          isUnavailable ? 'text-stone-400' : '',
                        ].join(' ')}
                      >
                        {date.getDate()}
                      </span>

                      {isToday ? (
                        <span className="text-[10px] uppercase tracking-widest text-stone-700 border border-stone-300 px-2 py-0.5">
                          Aujourd’hui
                        </span>
                      ) : null}
                    </div>

                    {isUnavailable ? (
                      <div className="absolute inset-x-3 bottom-3">
                        <span className="text-[10px] uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 inline-block">
                          Indisponible
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-x-3 bottom-3">
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">
                          Disponible
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

        <div className="text-xs text-stone-400 mt-4">{/* note / placeholder */}</div>
      </div>
    </ChefLayout>
  );
}
