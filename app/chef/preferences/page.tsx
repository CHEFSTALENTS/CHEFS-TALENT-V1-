'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth } from '../../../services/storage';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

type ChefProfile = {
  id?: string;
  email?: string;
  cuisines?: string[] | string;
  languages?: string[] | string;
  specialties?: string[] | string;
  updatedAt?: string;
  [key: string]: any;
};

const CUISINES_PRESET = [
  'Française',
  'Italienne',
  'Japonaise',
  'Méditerranéenne',
  'Asiatique',
  'Végétarienne',
  'Healthy',
  'Fusion',
];

const LANGUAGES_PRESET = ['Français', 'Anglais', 'Espagnol', 'Italien', 'Allemand', 'Arabe'];

const SPECIALTIES_PRESET = [
  'Fine dining',
  'Family style',
  'Brunch',
  'Private villa',
  'Yacht',
  'Chalet',
  'Event / catering',
  'Menu dégustation',
];

/* ---------------- helpers ---------------- */

function normalizeList(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)));
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

function isPreset(list: string[], v: string) {
  return list.includes(v);
}

export default function ChefPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // profil DB (source de vérité) pour MERGE à l’enregistrement
  const [baseProfile, setBaseProfile] = useState<ChefProfile>({});

  // states UI
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  const [customCuisine, setCustomCuisine] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');

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

        // ✅ DB (no-store) — important pour éviter les incohérences/caches
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        const fromDb: ChefProfile | null = json?.profile ?? null;

        const p: ChefProfile = fromDb ?? { id: user.id, email: user.email };

        if (!cancelled) {
          setBaseProfile(p);

          // ✅ tolérant (string OU array)
          setCuisines(uniq(normalizeList(p.cuisines)));
          setLanguages(uniq(normalizeList(p.languages ?? (p as any).langues)));
          setSpecialties(uniq(normalizeList(p.specialties)));

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
  }, []);

  // ✅ minimum requis pour checklist (1 cuisine + 1 langue)
  const canSave = useMemo(() => cuisines.length >= 1 && languages.length >= 1, [cuisines, languages]);

  // champs "autres langues" = tout ce qui n’est pas dans le preset
  const customLanguagesValue = useMemo(() => {
    return languages.filter(l => !isPreset(LANGUAGES_PRESET, l)).join(', ');
  }, [languages]);

  const addCustomCuisine = () => {
    const v = customCuisine.trim();
    if (!v) return;
    setCuisines(prev => uniq(prev.includes(v) ? prev : [...prev, v]));
    setCustomCuisine('');
  };

  const addCustomSpecialty = () => {
    const v = customSpecialty.trim();
    if (!v) return;
    setSpecialties(prev => uniq(prev.includes(v) ? prev : [...prev, v]));
    setCustomSpecialty('');
  };

  const onCustomLanguagesChange = (raw: string) => {
    // garde les presets déjà sélectionnés
    const keptPreset = languages.filter(l => isPreset(LANGUAGES_PRESET, l));
    // remplace uniquement les customs
    const custom = normalizeList(raw).filter(l => !isPreset(LANGUAGES_PRESET, l));
    setLanguages(uniq([...keptPreset, ...custom]));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const user = auth.getCurrentUser?.();
      if (!user?.id) throw new Error('No user');

      // ✅ IMPORTANT : on MERGE avec le profil DB pour ne rien écraser
      // ✅ on stocke cuisines/languages/specialties TOUJOURS en array (pas string)
      const merged: ChefProfile = {
        ...baseProfile,
        id: user.id,
        email: user.email,
        cuisines: uniq(cuisines),
        languages: uniq(languages),
        specialties: uniq(specialties),
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, profile: merged }),
      });

      if (!res.ok) throw new Error(await res.text());

      setBaseProfile(merged);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      console.error('PREFERENCES SAVE ERROR', e);
      alert("Erreur d’enregistrement (check console)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ChefLayout>
      <div className="max-w-3xl">
        <Marker />
        <Label>Préférences</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Cuisines & Langues</h1>

        <div className="space-y-8 bg-white p-8 border border-stone-200">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
            </div>
          ) : (
            <>
              {/* Cuisines */}
              <div className="space-y-3">
                <Label>Cuisines (min. 1)</Label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CUISINES_PRESET.map(x => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setCuisines(prev => uniq(toggle(prev, x)))}
                      className={`p-3 border text-left transition ${
                        cuisines.includes(x)
                          ? 'border-stone-900 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-stone-900">{x}</div>
                      <div className="text-xs text-stone-500">{cuisines.includes(x) ? 'Sélectionné' : 'Cliquer'}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={customCuisine}
                    onChange={e => setCustomCuisine(e.target.value)}
                    placeholder="Ajouter une cuisine…"
                  />
                  <Button type="button" onClick={addCustomCuisine}>
                    Ajouter
                  </Button>
                </div>

                {cuisines.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cuisines.map(x => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => setCuisines(prev => prev.filter(v => v !== x))}
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
                <Label>Langues (min. 1)</Label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {LANGUAGES_PRESET.map(x => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setLanguages(prev => uniq(toggle(prev, x)))}
                      className={`p-3 border text-left transition ${
                        languages.includes(x)
                          ? 'border-stone-900 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-stone-900">{x}</div>
                      <div className="text-xs text-stone-500">{languages.includes(x) ? 'Sélectionné' : 'Cliquer'}</div>
                    </button>
                  ))}
                </div>

                {/* ✅ Autres langues (CSV) */}
                <div className="space-y-2">
                  <Label>Autres langues (optionnel)</Label>
                  <Input
                    value={customLanguagesValue}
                    onChange={e => onCustomLanguagesChange(e.target.value)}
                    placeholder="Portugais, Russe..."
                  />
                  <p className="text-xs text-stone-400">Sépare par des virgules. Les langues “preset” restent en boutons.</p>
                </div>

                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {languages.map(x => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => setLanguages(prev => prev.filter(v => v !== x))}
                        className="text-xs px-2 py-1 border border-stone-200 rounded-full hover:border-stone-400"
                      >
                        {x} ✕
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Spécialités (optionnel) */}
              <div className="space-y-3 pt-6 border-t border-stone-100">
                <Label>Spécialités (optionnel)</Label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SPECIALTIES_PRESET.map(x => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => setSpecialties(prev => uniq(toggle(prev, x)))}
                      className={`p-3 border text-left transition ${
                        specialties.includes(x)
                          ? 'border-stone-900 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-stone-900">{x}</div>
                      <div className="text-xs text-stone-500">{specialties.includes(x) ? 'Sélectionné' : 'Cliquer'}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={customSpecialty}
                    onChange={e => setCustomSpecialty(e.target.value)}
                    placeholder="Ajouter une spécialité…"
                  />
                  <Button type="button" onClick={addCustomSpecialty}>
                    Ajouter
                  </Button>
                </div>

                {specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {specialties.map(x => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => setSpecialties(prev => prev.filter(v => v !== x))}
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
                  Checklist :{' '}
                  <span className={canSave ? 'text-green-700' : 'text-stone-500'}>
                    {canSave ? 'OK ✅' : 'Il faut 1 cuisine + 1 langue'}
                  </span>
                  {success ? <span className="ml-2 text-green-700">Enregistré ✅</span> : null}
                </div>

                <Button type="button" onClick={handleSave} disabled={saving || loading || !canSave} className="w-32">
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ChefLayout>
  );
}
