'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth, api } from '../../../services/storage';
import { Marker, Label, Button, Badge } from '../../../components/ui';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
  Crown,
  Save,
  Loader2,
} from 'lucide-react';

type ChefProfile = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  bio?: string;
  cuisines?: string[];
  specialties?: string[];
  languages?: string[];
  instagram?: string;
  website?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
  yearsExperience?: number | null;
  founder?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const STORAGE_KEY = 'ct_chef_profile_v1';

export default function ChefSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ChefProfile>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const user = auth.getCurrentUser?.();
        const apiAny = api as any;

        // 1) API (si dispo) - on n'appelle que des méthodes potentielles
        let fromApi: ChefProfile | null = null;
        if (user?.id) {
          fromApi =
            (await (apiAny.getChef?.(user.id) ??
              apiAny.getChefById?.(user.id) ??
              apiAny.getCurrentChef?.() ??
              Promise.resolve(null))) ?? null;
        }

        // 2) localStorage fallback
        const fromLS = safeReadLS<ChefProfile>(STORAGE_KEY);

        const base: ChefProfile = {
          ...(fromLS ?? {}),
          ...(fromApi ?? {}),
          id: (fromApi?.id ?? fromLS?.id ?? user?.id) || undefined,
          email: (fromApi?.email ?? fromLS?.email ?? user?.email) || undefined,
          updatedAt: new Date().toISOString(),
        };

        if (alive) setProfile(base);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const checklist = useMemo(() => {
    const items: Array<{ key: string; label: string; ok: boolean; hint?: string }> = [
      { key: 'name', label: 'Nom complet', ok: !!profile.name?.trim(), hint: 'Ex: Thomas Delcroix' },
      { key: 'phone', label: 'Téléphone', ok: !!profile.phone?.trim(), hint: 'Format international conseillé' },
      { key: 'city', label: 'Ville / zone', ok: !!profile.city?.trim(), hint: 'Ex: Bordeaux, Paris, Ibiza…' },
      { key: 'bio', label: 'Bio courte', ok: (profile.bio?.trim()?.length ?? 0) >= 80, hint: '80+ caractères' },
      { key: 'cuisines', label: 'Cuisines', ok: (profile.cuisines?.length ?? 0) >= 1, hint: 'Min 1 cuisine' },
      {
        key: 'specialties',
        label: 'Spécialités',
        ok: (profile.specialties?.length ?? 0) >= 1,
        hint: 'Min 1 spécialité',
      },
      { key: 'languages', label: 'Langues', ok: (profile.languages?.length ?? 0) >= 1, hint: 'FR/EN recommandé' },
      { key: 'instagram', label: 'Instagram', ok: !!profile.instagram?.trim(), hint: '@toncompte' },
      {
        key: 'portfolioUrl',
        label: 'Portfolio / photos',
        ok: !!profile.portfolioUrl?.trim(),
        hint: 'Drive, Notion, site…',
      },
    ];
    return items;
  }, [profile]);

  const completion = useMemo(() => {
    const total = checklist.length;
    const ok = checklist.filter(i => i.ok).length;
    const score = total === 0 ? 0 : Math.round((ok / total) * 100);
    return { total, ok, score };
  }, [checklist]);

 const launchTier = useMemo(() => {
  const s = completion.score;

  if (s >= 90) {
    return { label: 'Priorité MAX', variant: 'default' as const, icon: Crown };
  }
  if (s >= 70) {
    return { label: 'Prioritaire', variant: 'outline' as const, icon: ShieldCheck };
  }
  if (s >= 40) {
    return { label: 'En progression', variant: 'secondary' as const, icon: Sparkles };
  }
  return { label: 'À compléter', variant: 'secondary' as const, icon: Lock };
}, [completion.score]);

  const canBecomeFounder = completion.score >= 70;

  const saveProfile = async (next: ChefProfile) => {
    setSaving(true);
    setNotice(null);

    try {
      // 1) persist local
      safeWriteLS(STORAGE_KEY, next);
      setProfile(next);

      // 2) persist API si dispo
      const user = auth.getCurrentUser?.();
      const id = next.id ?? user?.id;

      if (id) {
        const apiAny = api as any;
        await (apiAny.updateChefProfile?.(id, next) ??
          apiAny.updateChef?.(id, next) ??
          apiAny.saveChef?.(id, next) ??
          Promise.resolve());
      }

      setNotice('Enregistré ✅');
    } catch (e) {
      console.error(e);
      setNotice("Impossible d'enregistrer pour le moment.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setNotice(null), 2500);
    }
  };

  // IMPORTANT: virgule après le générique pour éviter la confusion TSX
  const updateField = <K extends keyof ChefProfile,>(key: K, value: ChefProfile[K]) => {
    const next = { ...profile, [key]: value, updatedAt: new Date().toISOString() };
    setProfile(next);
  };

  const addToken = (key: 'cuisines' | 'specialties' | 'languages', raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const current = Array.isArray(profile[key]) ? profile[key]! : [];
    if (current.map(s => s.toLowerCase()).includes(v.toLowerCase())) return;
    updateField(key, [...current, v]);
  };

  const removeToken = (key: 'cuisines' | 'specialties' | 'languages', value: string) => {
    const current = Array.isArray(profile[key]) ? profile[key]! : [];
    updateField(key, current.filter(s => s !== value));
  };

  const activateFounder = async () => {
    const next = { ...profile, founder: true, updatedAt: new Date().toISOString() };
    await saveProfile(next);
  };

  return (
    <ChefLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div>
          <Marker />
          <Label>Paramètres</Label>
          <h1 className="text-3xl font-serif text-stone-900">Votre profil Chef</h1>
          <p className="text-sm text-stone-500 mt-2 max-w-2xl">
            Plateforme en lancement : les missions arrivent bientôt. En attendant, compléter votre profil vous place en
            priorité lors du matching.
          </p>
        </div>

      {/* Launch Banner */}
<div className="border border-stone-200 bg-white rounded-2xl p-5">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <launchTier.icon className="w-5 h-5 text-stone-500" />
        <div className="font-medium text-stone-900">Statut de lancement</div>

        {/* Badge principal */}
        <Badge variant={launchTier.variant}>{launchTier.label}</Badge>

        {/* Badge fondateur */}
        {profile.founder ? <Badge variant="default">Chef Fondateur</Badge> : null}
      </div>

      <div className="text-sm text-stone-600">
        Complétion profil : <span className="font-semibold text-stone-900">{completion.score}%</span> (
        {completion.ok}/{completion.total})
      </div>

      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-2 bg-stone-900 rounded-full transition-all"
          style={{ width: `${completion.score}%` }}
        />
      </div>

      <div className="text-xs text-stone-500">
        Règle simple : <span className="text-stone-800 font-medium">plus ton profil est complet</span>, plus tu
        remontes en priorité sur les demandes (fast & standard).
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-stone-900 hover:bg-stone-800"
        onClick={() => saveProfile(profile)}
        disabled={saving || loading}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Enregistrer
      </Button>
      {notice ? <div className="text-sm text-stone-600">{notice}</div> : null}
    </div>
  </div>
</div>
        {/* Founder / Early access */}
        <div className="border border-stone-200 bg-stone-50/50 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-stone-700 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-serif text-stone-900">Chef Fondateur</h2>
                  <p className="text-sm text-stone-600 mt-1">
                    Badge réservé aux premiers chefs : visibilité renforcée au lancement + accès prioritaire aux premières
                    missions.
                  </p>
                </div>
                <div>
                  {profile.founder ? (
                    <Badge variant="default">Activé</Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-stone-900 hover:bg-stone-800"
                      onClick={activateFounder}
                      disabled={!canBecomeFounder || saving}
                    >
                      Activer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {!profile.founder ? (
                <div className="mt-3 text-xs text-stone-500">
                  Condition : profil ≥ <span className="font-semibold text-stone-800">70%</span>.{' '}
                  {canBecomeFounder ? '✅ OK' : 'Complète encore 2–3 champs.'}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Checklist + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checklist */}
          <div className="lg:col-span-1 border border-stone-200 bg-white rounded-2xl p-6">
            <h3 className="text-base font-semibold text-stone-900">Checklist (Priorité)</h3>
            <p className="text-sm text-stone-500 mt-1">Atteins 70% pour être prioritaire.</p>

            <div className="mt-4 space-y-3">
              {checklist.map(item => (
                <div key={item.key} className="flex items-start gap-3">
                  {item.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-stone-900 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-300 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-stone-900 font-medium">{item.label}</div>
                    {item.ok ? (
                      <div className="text-xs text-stone-500">OK</div>
                    ) : (
                      <div className="text-xs text-stone-400">{item.hint ?? 'À compléter'}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 border border-stone-200 bg-white rounded-2xl p-6">
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nom complet"
                    value={profile.name ?? ''}
                    onChange={v => updateField('name', v)}
                    placeholder="Ex: Thomas Delcroix"
                  />
                  <Field
                    label="Téléphone"
                    value={profile.phone ?? ''}
                    onChange={v => updateField('phone', v)}
                    placeholder="+33 6…"
                  />
                  <Field
                    label="Ville / zone"
                    value={profile.city ?? ''}
                    onChange={v => updateField('city', v)}
                    placeholder="Bordeaux / Paris / Ibiza…"
                  />
                  <Field
                    label="Instagram"
                    value={profile.instagram ?? ''}
                    onChange={v => updateField('instagram', v)}
                    placeholder="@toncompte"
                  />
                  <Field
                    label="Portfolio / photos"
                    value={profile.portfolioUrl ?? ''}
                    onChange={v => updateField('portfolioUrl', v)}
                    placeholder="https://…"
                  />
                  <Field
                    label="Site (optionnel)"
                    value={profile.website ?? ''}
                    onChange={v => updateField('website', v)}
                    placeholder="https://…"
                  />
                </div>

                <TextArea
                  label="Bio courte"
                  value={profile.bio ?? ''}
                  onChange={v => updateField('bio', v)}
                  placeholder="Décris ton style, ton expérience, ton univers… (idéal 120–200 mots)"
                />

                <TokenBox
                  label="Cuisines"
                  value={profile.cuisines ?? []}
                  placeholder="Ajouter une cuisine (Entrée)"
                  onAdd={v => addToken('cuisines', v)}
                  onRemove={v => removeToken('cuisines', v)}
                />

                <TokenBox
                  label="Spécialités"
                  value={profile.specialties ?? []}
                  placeholder="Ajouter une spécialité (Entrée)"
                  onAdd={v => addToken('specialties', v)}
                  onRemove={v => removeToken('specialties', v)}
                />

                <TokenBox
                  label="Langues"
                  value={profile.languages ?? []}
                  placeholder="Ajouter une langue (Entrée)"
                  onAdd={v => addToken('languages', v)}
                  onRemove={v => removeToken('languages', v)}
                />

                <div className="flex items-center gap-2 pt-2">
                  <Button className="bg-stone-900 hover:bg-stone-800" onClick={() => saveProfile(profile)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Enregistrer
                  </Button>
                  <div className="text-xs text-stone-500">
                    Astuce : vise <span className="font-semibold text-stone-800">70%+</span> pour être prioritaire dès
                    l’ouverture des missions.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-xs text-stone-400">
          Note : pendant le lancement, Chef Talents se réserve le droit de prioriser les profils complets et réactifs
          (réponse rapide).
        </div>
      </div>
    </ChefLayout>
  );
}

/* ----------------- UI small components ----------------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1">
      <div className="text-xs uppercase tracking-widest text-stone-400">{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 block">
      <div className="text-xs uppercase tracking-widest text-stone-400">{label}</div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
      />
      <div className="text-xs text-stone-400">Recommandé : 80+ caractères (idéal 120–200 mots).</div>
    </label>
  );
}

function TokenBox({
  label,
  value,
  placeholder,
  onAdd,
  onRemove,
}: {
  label: string;
  value: string[];
  placeholder: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [input, setInput] = useState('');

  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-widest text-stone-400">{label}</div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd(input);
              setInput('');
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
        />
        <Button
          size="sm"
          variant="outline"
          className="border-stone-200"
          onClick={() => {
            onAdd(input);
            setInput('');
          }}
        >
          Ajouter
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <div className="text-sm text-stone-400">Aucun.</div>
        ) : (
          value.map(v => (
            <span
              key={v}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-700"
            >
              {v}
              <button
                className="text-stone-400 hover:text-stone-700 transition"
                onClick={() => onRemove(v)}
                aria-label="Remove"
                type="button"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ----------------- localStorage helpers ----------------- */

function safeReadLS<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWriteLS(key: string, value: any) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
