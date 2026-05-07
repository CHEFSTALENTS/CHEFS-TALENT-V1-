'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Marker, Button, Input } from '../../../components/ui';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import { format } from '@/lib/chef-i18n';

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

const PERIOD_KEYS = ['weekdays', 'weekends', 'evenings', 'season_winter', 'season_summer'] as const;
type PeriodKey = (typeof PERIOD_KEYS)[number];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function buildMonthGrid(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const jsDay = firstOfMonth.getDay();
  const mondayIndex = (jsDay + 6) % 7;

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
  const { t } = useChefLocale();

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

  const monthLabel = (d: Date) =>
    d.toLocaleDateString(t.availability.dateLocale, { month: 'long', year: 'numeric' });

  const PERIODS: Array<{ key: PeriodKey; label: string }> = PERIOD_KEYS.map((k) => ({
    key: k,
    label: t.availability.periods[k],
  }));

  // 1) session supabase
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

  // 2) load DB profile
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

        availableNow: nextAvailability.availableNow,
        nextAvailableFrom: nextAvailability.nextAvailableFrom,
        preferredPeriods: nextAvailability.preferredPeriods,
        unavailableDates: nextAvailability.unavailableDates,

        updatedAt: new Date().toISOString(),
      };

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
      alert((e as any)?.message || t.common.saveError);
    }
  };

  const goPrevMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToday = () => setMonth(new Date(today.getFullYear(), today.getMonth(), 1));

  if (booting || loading) {
    return (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>

    );
  }

  if (!sbUser) return null;

  // Help line with split tokens (for colored fragments)
  const helpParts = t.availability.calendarHelp1.split(/(\{available\}|\{unavailable\})/);

  return (

      <div className="max-w-4xl">
        <Marker />
        <Label>{t.availability.pageLabel}</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">{t.availability.pageTitle}</h1>

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
                  <div className="text-sm font-medium text-stone-900">{t.availability.availableNowLabel}</div>
                  <div className="text-xs text-stone-500">{t.availability.availableNowDesc}</div>
                </div>
              </div>
            </label>

            <div className="p-4 border border-stone-200">
              <Label>{t.availability.nextAvailableLabel}</Label>
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
              <div className="text-xs text-stone-500 mt-1">{t.availability.nextAvailableHint}</div>
            </div>

            <div className="p-4 border border-stone-200">
              <Label>{t.availability.preferredPeriodsLabel}</Label>
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
                {helpParts.map((part, i) => {
                  if (part === '{available}') return <strong key={i}>{t.availability.calendarHelpAvailable}</strong>;
                  if (part === '{unavailable}') return <span key={i} className="text-red-500 font-medium">{t.availability.calendarHelpUnavailable}</span>;
                  return <React.Fragment key={i}>{part}</React.Fragment>;
                })}
              </p>
            </div>

            {/* Header mois */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <button
                type="button"
                onClick={goPrevMonth}
                className="p-2 rounded-md border border-stone-200 hover:bg-stone-50 transition"
                aria-label={t.availability.prevMonth}
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
                  {t.availability.backToToday}
                </button>
              </div>

              <button
                type="button"
                onClick={goNextMonth}
                className="p-2 rounded-md border border-stone-200 hover:bg-stone-50 transition"
                aria-label={t.availability.nextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-stone-200 border border-stone-200">
              {t.availability.weekdays.map(day => (
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
                          {t.availability.todayBadge}
                        </span>
                      ) : null}
                    </div>

                    {isUnavailable ? (
                      <div className="absolute inset-x-3 bottom-3">
                        <span className="text-[10px] uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 inline-block">
                          {t.availability.unavailable}
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-x-3 bottom-3">
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">{t.availability.available}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {success ? <span className="text-sm text-green-600">{t.availability.saved}</span> : <span />}
              <Button type="submit" disabled={saving} className="w-32">
                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : t.common.save}
              </Button>
            </div>
          </div>
        </form>

        <div className="text-xs text-stone-400 mt-4" />
      </div>

  );
}
