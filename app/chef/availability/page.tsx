'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefLayout } from '../../../components/ChefLayout';
import { supabase } from '@/services/supabaseClient';
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
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** grille 6 semaines (42 cases), semaine commence lundi */
function buildMonthGrid(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const jsDay = firstOfMonth.getDay(); // 0=dim..6=sam
  const mondayIndex = (jsDay + 6) % 7; // lundi=0..dim=6

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - mondayIndex);

  const days: Array<{ date: Date; inMonth: boolean; iso: string }> = [];
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

function uniq(arr: string[]) {
  return Array.from(new Set((arr || []).map(String).map(s => s.trim()).filter(Boolean)));
}

export default function ChefAvailabilityPage() {
  const router = useRouter();
  const didRedirect = useRef(false);

  // ✅ si tu veux auto-save à chaque clic (date/période/toggle), passe à true
  const AUTO_SAVE = false;

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState<ChefProfile>({});
  const [availableNow, setAvailableNow] = useState<boolean>(false);
  const [nextAvailableFrom, setNextAvailableFrom] = useState<string>('');
  const [preferredPeriods, setPreferredPeriods] = useState<string[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState<Date>(() => new Date());
  const monthGrid = useMemo(() => buildMonthGrid(month), [month]);

  // 1) session supabase = vérité
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const u = data.session?.user ?? null;
      setSbUser(u);

      if (!u && !didRedirect.current) {
        didRedirect.current = true;
        router.replace('/chef/login');
        return;
      }

      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setSbUser(u);
      if (!u && !didRedirect.current) {
        didRedirect.current = true;
        router.replace('/chef/login');
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // 2) load DB profile (source de vérité)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!sbUser?.id) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        const fromDb: ChefProfile | null = json?.profile ?? null;

        const base: ChefProfile = fromDb ?? { id: sbUser.id, email: sbUser.email ?? '' };

        // compat : certains historiques peuvent stocker à plat
        const a = (base.availability ?? {}) as any;

        const available =
          a.availableNow ?? (base as any).availableNow ?? false;

        const nextFrom =
          a.nextAvailableFrom ?? (base as any).nextAvailableFrom ?? '';

        const periods =
          a.preferredPeriods ?? (base as any).preferredPeriods ?? [];

        const unav =
          a.unavailableDates ??
          (base as any).unavailableDates ??
          (base as any).unavailable_dates ??
          [];

        if (!cancelled) {
          setProfile(base);
          setAvailableNow(!!available);
          setNextAvailableFrom(nextFrom ? String(nextFrom) : '');
          setPreferredPeriods(uniq(periods));
          setUnavailableDates(uniq(unav));
          setLoading(false);

          if (nextFrom) {
            const d = new Date(String(nextFrom));
            if (!Number.isNaN(d.getTime())) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
          }
        }
      } catch (e) {
        console.error('[availability] load error', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  async function saveAvailability(next: {
    availableNow: boolean;
    nextAvailableFrom: string;
    preferredPeriods: string[];
    unavailableDates: string[];
  }) {
    if (!sbUser?.id) throw new Error('No user');

    setSaving(true);
    setSuccess(false);

    try {
      // 1) GET current (merge safe)
      const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
      const jsonGet = await resGet.json();
      const current = jsonGet?.profile ?? {};

      const nextAvailability = {
        availableNow: !!next.availableNow,
        nextAvailableFrom: next.nextAvailableFrom ? String(next.nextAvailableFrom) : null,
        preferredPeriods: uniq(next.preferredPeriods),
        unavailableDates: uniq(next.unavailableDates),
      };

      const merged: ChefProfile = {
        ...current,
        id: sbUser.id,
        email: sbUser.email ?? current.email ?? '',
        availability: nextAvailability,

        // ✅ compat legacy (si d'autres pages lisent à plat)
        availableNow: nextAvailability.availableNow,
        nextAvailableFrom: nextAvailability.nextAvailableFrom,
        preferredPeriods: nextAvailability.preferredPeriods,
        unavailableDates: nextAvailability.unavailableDates,

        updatedAt: new Date().toISOString(),
      };

      // 2) PUT
      const resPut = await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sbUser.id, profile: merged }),
      });
      if (!resPut.ok) throw new Error(await resPut.text());

      setProfile(merged);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const togglePeriod = async (k: string) => {
    const next = preferredPeriods.includes(k)
      ? preferredPeriods.filter(x => x !== k)
      : [...preferredPeriods, k];

    setPreferredPeriods(next);
    if (AUTO_SAVE) {
      await saveAvailability({ availableNow, nextAvailableFrom, preferredPeriods: next, unavailableDates });
    }
  };

  const toggleDate = async (dateStr: string) => {
    const next = unavailableDates.includes(dateStr)
      ? unavailableDates.filter(d => d !== dateStr)
      : [...unavailableDates, dateStr];

    setUnavailableDates(next);
    if (AUTO_SAVE) {
      await saveAvailability({ availableNow, nextAvailableFrom, preferredPeriods, unavailableDates: next });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveAvailability({ availableNow, nextAvailableFrom, preferredPeriods, unavailableDates });
    } catch (e) {
      console.error('AVAILABILITY SAVE ERROR', e);
      alert((e as any)?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const goPrevMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToday = () => setMonth(new Date(today.getFullYear(), today.getMonth(), 1));

  if (booting || loading) {
    return (
      <>
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
      </>
    );
  }

  if (!sbUser) return null;

  return (
    <>
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
                  onChange={(e) => {
                    const v = e.target.checked;
                    setAvailableNow(v);
                    if (AUTO_SAVE) {
                      saveAvailability({ availableNow: v, nextAvailableFrom, preferredPeriods, unavailableDates }).catch(() => {});
                    }
                  }}
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
                onChange={(e) => {
                  const v = e.target.value;
                  setNextAvailableFrom(v);
                  if (AUTO_SAVE) {
                    saveAvailability({ availableNow, nextAvailableFrom: v, preferredPeriods, unavailableDates }).catch(() => {});
                  }
                }}
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
                <div className="text-sm font-medium text-stone-900 capitalize">{monthLabel(month)}</div>
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
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">Disponible</span>
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

        <div className="text-xs text-stone-400 mt-4" />
      </div>
    </ChefLayout>
  );
}
