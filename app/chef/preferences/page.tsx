'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';

type ChefProfile = {
  id?: string;
  email?: string;
  cuisines?: string[];
  languages?: string[];
  specialties?: string[];
  missionTypes?: string[];
  updatedAt?: string;
  [key: string]: any;
};

const MISSION_TYPE_KEYS = ['one_shot', 'residence', 'yacht', 'event_catering'] as const;
type MissionTypeKey = (typeof MISSION_TYPE_KEYS)[number];

function normalizeList(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function ChefPreferencesPage() {
  const router = useRouter();
  const { t } = useChefLocale();

  const [booting, setBooting] = useState(true);
  const [sbUserId, setSbUserId] = useState<string | null>(null);
  const [sbEmail, setSbEmail] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [baseProfile, setBaseProfile] = useState<ChefProfile>({});
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [missionTypes, setMissionTypes] = useState<string[]>([]);

  const [customCuisine, setCustomCuisine] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');

  const MISSION_TYPES_PRESET: Array<{ key: MissionTypeKey; label: string }> = MISSION_TYPE_KEYS.map(
    (k) => ({ key: k, label: t.preferences.missionTypes[k] }),
  );
  const CUISINES_PRESET = t.preferences.cuisinesPreset;
  const LANGUAGES_PRESET = t.preferences.languagesPreset;
  const SPECIALTIES_PRESET = t.preferences.specialtiesPreset;

  // 0) Boot session
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const user = data.session?.user ?? null;
      if (!user) {
        router.replace('/chef/login');
        return;
      }

      setSbUserId(user.id);
      setSbEmail(user.email ?? '');
      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const user = session?.user ?? null;
      if (!user) router.replace('/chef/login');
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // 1) Load profile DB
  useEffect(() => {
    if (!sbUserId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUserId)}`, { cache: 'no-store' });
        const json = await res.json();
        const fromDb: ChefProfile | null = json?.profile ?? null;

        const p: ChefProfile = fromDb ?? { id: sbUserId, email: sbEmail };

        const initialCuisines = uniq(normalizeList(p.cuisines ?? (p as any)?.cuisineTypes ?? (p as any)?.styles));
        const initialLanguages = uniq(normalizeList(p.languages ?? (p as any)?.langues));
        const initialSpecialties = uniq(normalizeList(p.specialties ?? (p as any)?.speciality));
        const initialMissionTypes = uniq(
          normalizeList((p as any)?.missionTypes ?? (p as any)?.missions ?? (p as any)?.mission_types)
        );

        if (!cancelled) {
          setBaseProfile(p);
          setCuisines(initialCuisines);
          setLanguages(initialLanguages);
          setSpecialties(initialSpecialties);
          setMissionTypes(initialMissionTypes);
          setLoading(false);
        }
      } catch (e) {
        console.error('PREFERENCES LOAD ERROR', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUserId, sbEmail]);

  const canSave = useMemo(() => {
    return cuisines.length >= 1 && languages.length >= 1 && missionTypes.length >= 1;
  }, [cuisines, languages, missionTypes]);

  const addCustom = (kind: 'cuisine' | 'language' | 'specialty') => {
    const raw = kind === 'cuisine' ? customCuisine : kind === 'language' ? customLanguage : customSpecialty;
    const v = raw.trim();
    if (!v) return;

    if (kind === 'cuisine') {
      setCuisines((prev) => (prev.includes(v) ? prev : [...prev, v]));
      setCustomCuisine('');
    } else if (kind === 'language') {
      setLanguages((prev) => (prev.includes(v) ? prev : [...prev, v]));
      setCustomLanguage('');
    } else {
      setSpecialties((prev) => (prev.includes(v) ? prev : [...prev, v]));
      setCustomSpecialty('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      if (!sbUserId) throw new Error('No user');

      const merged: ChefProfile = {
        ...baseProfile,
        id: sbUserId,
        email: sbEmail,
        cuisines: uniq(cuisines),
        languages: uniq(languages),
        specialties: uniq(specialties),
        missionTypes: uniq(missionTypes),
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sbUserId, profile: merged }),
      });

      if (!res.ok) throw new Error(await res.text());

      setBaseProfile(merged);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      console.error('PREFERENCES SAVE ERROR', e);
      alert(t.preferences.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (booting) {
    return (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
        </div>
    );
  }

  return (

      <div className="max-w-3xl">
        <Marker />
        <Label>{t.preferences.pageLabel}</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">{t.preferences.pageTitle}</h1>

        <div className="space-y-8 bg-white p-8 border border-stone-200">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
            </div>
          ) : (
            <>
              {/* Types de missions souhaitées */}
              <div className="space-y-3 pt-6 border-t border-stone-100">
                <Label>{t.preferences.missionTypesLabel}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MISSION_TYPES_PRESET.map((x) => {
                    const on = missionTypes.includes(x.key);
                    return (
                      <button
                        key={x.key}
                        type="button"
                        onClick={() => setMissionTypes((prev) => toggle(prev, x.key))}
                        className={`p-3 border text-left transition ${
                          on ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="text-sm font-medium text-stone-900">{x.label}</div>
                        <div className="text-xs text-stone-500">{on ? t.preferences.selected : t.preferences.clickToSelect}</div>
                      </button>
                    );
                  })}
                </div>

                {missionTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missionTypes.map((k) => {
                      const label = MISSION_TYPES_PRESET.find((x) => x.key === k)?.label ?? k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setMissionTypes((prev) => prev.filter((v) => v !== k))}
                          className="text-xs px-2 py-1 border border-stone-200 rounded-full hover:border-stone-400"
                        >
                          {label} ✕
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">{t.preferences.missionTypesEmpty}</p>
                )}
              </div>

              {/* Cuisines */}
              <div className="space-y-3 pt-6 border-t border-stone-100">
                <Label>{t.preferences.cuisinesLabel}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CUISINES_PRESET.map((x) => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setCuisines((prev) => toggle(prev, x))}
                      className={`p-3 border text-left transition ${
                        cuisines.includes(x) ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-stone-900">{x}</div>
                      <div className="text-xs text-stone-500">{cuisines.includes(x) ? t.preferences.selected : t.preferences.clickToSelect}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input value={customCuisine} onChange={(e) => setCustomCuisine(e.target.value)} placeholder={t.preferences.addCuisinePlaceholder} />
                  <Button type="button" onClick={() => addCustom('cuisine')}>
                    {t.preferences.addCta}
                  </Button>
                </div>

                {cuisines.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cuisines.map((x) => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => setCuisines((prev) => prev.filter((v) => v !== x))}
                        className="text-xs px-2 py-1 border border-stone-200 rounded-full hover:border-stone-400"
                      >
                        {x} ✕
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Langues */}
              <div className="space-y-3 pt-6 border-t border-stone-100">
                <Label>{t.preferences.languagesLabel}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {LANGUAGES_PRESET.map((x) => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setLanguages((prev) => toggle(prev, x))}
                      className={`p-3 border text-left transition ${
                        languages.includes(x) ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-stone-900">{x}</div>
                      <div className="text-xs text-stone-500">{languages.includes(x) ? t.preferences.selected : t.preferences.clickToSelect}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input value={customLanguage} onChange={(e) => setCustomLanguage(e.target.value)} placeholder={t.preferences.addLanguagePlaceholder} />
                  <Button type="button" onClick={() => addCustom('language')}>
                    {t.preferences.addCta}
                  </Button>
                </div>

                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((x) => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => setLanguages((prev) => prev.filter((v) => v !== x))}
                        className="text-xs px-2 py-1 border border-stone-200 rounded-full hover:border-stone-400"
                      >
                        {x} ✕
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Spécialités */}
              <div className="space-y-3 pt-6 border-t border-stone-100">
                <Label>{t.preferences.specialtiesLabel}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SPECIALTIES_PRESET.map((x) => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setSpecialties((prev) => toggle(prev, x))}
                      className={`p-3 border text-left transition ${
                        specialties.includes(x) ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-stone-900">{x}</div>
                      <div className="text-xs text-stone-500">{specialties.includes(x) ? t.preferences.selected : t.preferences.clickToSelect}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    placeholder={t.preferences.addSpecialtyPlaceholder}
                  />
                  <Button type="button" onClick={() => addCustom('specialty')}>
                    {t.preferences.addCta}
                  </Button>
                </div>

                {specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((x) => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => setSpecialties((prev) => prev.filter((v) => v !== x))}
                        className="text-xs px-2 py-1 border border-stone-200 rounded-full hover:border-stone-400"
                      >
                        {x} ✕
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Save */}
              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                <div className="text-xs text-stone-500">
                  {t.preferences.checklistLabel}{' '}
                  <span className={canSave ? 'text-green-700' : 'text-stone-500'}>
                    {canSave ? t.preferences.checklistOk : t.preferences.checklistMissing}
                  </span>
                  {success ? <span className="ml-2 text-green-700">{t.preferences.saved}</span> : null}
                </div>

                <Button type="button" onClick={handleSave} disabled={saving || loading || !canSave} className="w-32">
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : t.common.save}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

  );
}
