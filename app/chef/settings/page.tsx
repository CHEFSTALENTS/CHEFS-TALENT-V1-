'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChefLayout } from '../../../components/ChefLayout';
import { auth, api } from '../../../services/storage';
import { Marker, Label, Button } from '../../../components/ui';
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
  User,
  Briefcase,
  Image as ImageIcon,
  MapPinned,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { computeChefScore } from '@/lib/chefScore';

// ...

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
// si tu avais une ancienne clé utilisée ailleurs, tu peux en ajouter ici :
const FALLBACK_KEYS = ['ct_chef_profile', 'chef_profile', 'ct_chef_v1'];

export default function ChefSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ChefProfile>({});
  const [notice, setNotice] = useState<string | null>(null);
const { score, rules } = useMemo(() => computeChefScore(profile ?? {}), [profile]);
  
  useEffect(() => {
    (async () => {
      setLoading(true);

      const user = auth.getCurrentUser?.();

      // 1) On tente API (sans casser TS : any + optional chaining)
      const apiAny = api as any;
      let fromApi: ChefProfile | null = null;

      try {
        
        if (user?.id) {
  const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`);
  const json = await res.json();
  const fromDb = json?.data?.profile;

  if (fromDb) {
    setProfile(fromDb);
    setLoading(false);
    return;
  }
}
        if (user?.id) {
          fromApi =
            (await (apiAny.getChef?.(user.id) ??
              apiAny.getChefProfile?.(user.id) ??
              apiAny.getCurrentChef?.() ??
              Promise.resolve(null))) ?? null;
        }
      } catch {
        fromApi = null;
      }

      // 2) Fallback localStorage (on tente plusieurs clés)
      const fromLs =
        safeReadLS<ChefProfile>(STORAGE_KEY) ??
        FALLBACK_KEYS.map(k => safeReadLS<ChefProfile>(k)).find(Boolean) ??
        null;

      const merged: ChefProfile = {
        ...(fromLs ?? {}),
        ...(fromApi ?? {}),
        id: (fromApi?.id ?? fromLs?.id ?? user?.id) || undefined,
        email: (fromApi?.email ?? fromLs?.email ?? user?.email) || undefined,
      };

      setProfile(merged);
      setLoading(false);
    })();
  }, []);

  const checklist = useMemo(() => {
    // IMPORTANT : cette checklist lit le “profil”, mais Settings NE redemande PAS les champs.
    // Elle sert juste à guider vers les pages.
    const items: Array<{
      key: string;
      label: string;
      ok: boolean;
      hint?: string;
      href?: string;
      icon: React.ElementType;
    }> = [
      {
        key: 'identity',
        label: 'Identité',
        ok: !!profile.name?.trim() && !!profile.phone?.trim() && !!profile.city?.trim(),
        hint: 'Nom, téléphone, ville…',
        href: '/chef/identity',
        icon: User,
      },
      {
        key: 'experience',
        label: 'Expérience',
        ok: (profile.yearsExperience ?? 0) > 0 || (profile.bio?.trim()?.length ?? 0) >= 80,
        hint: 'Bio + expérience',
        href: '/chef/experience',
        icon: Briefcase,
      },
      {
        key: 'portfolio',
        label: 'Portfolio',
        ok: !!profile.portfolioUrl?.trim() || !!profile.instagram?.trim(),
        hint: 'Photos / Instagram / site',
        href: '/chef/portfolio',
        icon: ImageIcon,
      },
      {
        key: 'mobility',
        label: 'Zone & mobilité',
        ok: !!profile.city?.trim(), // à affiner quand on aura tes champs “zones”
        hint: 'Zones, déplacements',
        href: '/chef/mobility',
        icon: MapPinned,
      },
      {
        key: 'availability',
        label: 'Disponibilités',
        ok: true, // placeholder (à connecter quand on a tes champs)
        hint: 'Calendrier, périodes',
        href: '/chef/availability',
        icon: Calendar,
      },
      {
        key: 'preferences',
        label: 'Préférences',
        ok: (profile.cuisines?.length ?? 0) >= 1 && (profile.languages?.length ?? 0) >= 1,
        hint: 'Cuisines, langues…',
        href: '/chef/preferences',
        icon: SlidersHorizontal,
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
    if (s >= 90) return { label: 'Priorité MAX', tone: 'dark' as const, icon: Crown };
    if (s >= 70) return { label: 'Prioritaire', tone: 'violet' as const, icon: ShieldCheck };
    if (s >= 40) return { label: 'En progression', tone: 'stone' as const, icon: Sparkles };
    return { label: 'À compléter', tone: 'stone' as const, icon: Lock };
  }, [completion.score]);

  const canBecomeFounder = completion.score >= 70;

const saveProfile = async (next: ChefProfile) => {
  console.log("SAVE PROFILE CALLED", next);
  setSaving(true);
  setNotice(null);

  try {
    const user = auth.getCurrentUser?.();
    if (!user?.id) throw new Error("No user id");

    const merged = {
      ...next,
      id: user.id,
      email: user.email,
      updatedAt: new Date().toISOString(),
    };

    const res = await fetch("/api/chef/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        profile: merged,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Save failed");
    }

    setProfile(merged);
    setNotice("Enregistré ✅");
  } catch (e) {
    console.error(e);
    setNotice("Impossible d'enregistrer");
  } finally {
    setSaving(false);
    setTimeout(() => setNotice(null), 2500);
  }
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
            Plateforme en lancement : les missions arrivent bientôt. Compléter votre profil vous place en priorité lors du matching.
          </p>
        </div>

        {/* Launch Banner */}
        <div className="border border-stone-200 bg-white rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <launchTier.icon className="w-5 h-5 text-stone-500" />
                <div className="font-medium text-stone-900">Statut de lancement</div>
                <Pill tone={launchTier.tone}>{launchTier.label}</Pill>
                {profile.founder ? <Pill tone="dark">Chef Fondateur</Pill> : null}
              </div>

              <div className="text-sm text-stone-600">
                Complétion profil : <span className="font-semibold text-stone-900">{completion.score}%</span> ({completion.ok}/{completion.total})
              </div>

              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-stone-900 rounded-full transition-all"
                  style={{ width: `${completion.score}%` }}
                />
              </div>

              <div className="text-xs text-stone-500">
                Règle simple : <span className="text-stone-800 font-medium">plus ton profil est complet</span>, plus tu remontes en priorité sur les demandes (fast & standard).
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-stone-900 hover:bg-stone-800"
                onClick={() => {
  alert("CLICK OK");
  saveProfile(profile);
}}
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
                    Badge réservé aux premiers chefs : visibilité renforcée au lancement + accès prioritaire aux premières missions.
                  </p>
                </div>

                <div>
                  {profile.founder ? (
                    <Pill tone="dark">Activé</Pill>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-stone-900 hover:bg-stone-800"
                      onClick={activateFounder}
                      disabled={!canBecomeFounder || saving || loading}
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
                  {canBecomeFounder ? '✅ OK' : 'Complète encore 2–3 sections.'}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Checklist + Sections */}
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
                    <div className="text-xs text-stone-400">{item.ok ? 'OK' : item.hint ?? 'À compléter'}</div>
                  </div>

                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-xs text-stone-700 hover:text-stone-900 transition whitespace-nowrap"
                    >
                      Ouvrir →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Premium hub (pas de duplication de champs ici) */}
          <div className="lg:col-span-2 border border-stone-200 bg-white rounded-2xl p-6">
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-serif text-stone-900">Gérer votre profil</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      Les informations se remplissent dans les pages dédiées (Identité, Expérience, Portfolio…). Ici, on centralise tout.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-widest text-stone-400">Profil</div>
                    <div className="text-sm text-stone-900 font-medium">
                      {profile.name?.trim() ? profile.name : '—'}
                    </div>
                    <div className="text-xs text-stone-500">{profile.email ?? '—'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <SectionCard
                    title="Identité"
                    desc="Nom, téléphone, ville…"
                    href="/chef/identity"
                    icon={User}
                    ok={checklist.find(i => i.key === 'identity')?.ok}
                  />
                  <SectionCard
                    title="Expérience"
                    desc="Bio, années, style…"
                    href="/chef/experience"
                    icon={Briefcase}
                    ok={checklist.find(i => i.key === 'experience')?.ok}
                  />
                  <SectionCard
                    title="Portfolio"
                    desc="Photos, Instagram, site…"
                    href="/chef/portfolio"
                    icon={ImageIcon}
                    ok={checklist.find(i => i.key === 'portfolio')?.ok}
                  />
                  <SectionCard
                    title="Zone & Mobilité"
                    desc="Zones, déplacements…"
                    href="/chef/mobility"
                    icon={MapPinned}
                    ok={checklist.find(i => i.key === 'mobility')?.ok}
                  />
                  <SectionCard
                    title="Disponibilités"
                    desc="Périodes, calendrier…"
                    href="/chef/availability"
                    icon={Calendar}
                    ok={checklist.find(i => i.key === 'availability')?.ok}
                  />
                  <SectionCard
                    title="Préférences"
                    desc="Cuisines, langues…"
                    href="/chef/preferences"
                    icon={SlidersHorizontal}
                    ok={checklist.find(i => i.key === 'preferences')?.ok}
                  />
                </div>

                <div className="pt-3 flex items-center gap-2">
                  <Button
                    className="bg-stone-900 hover:bg-stone-800"
                    onClick={() => saveProfile(profile)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Enregistrer
                  </Button>
                  <div className="text-xs text-stone-500">
                    Astuce : vise <span className="font-semibold text-stone-800">70%+</span> pour être prioritaire dès l’ouverture des missions.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-xs text-stone-400">
          Note : pendant le lancement, Chef Talents se réserve le droit de prioriser les profils complets et réactifs (réponse rapide).
        </div>
      </div>
    </ChefLayout>
  );
}

/* ----------------- UI small components ----------------- */

function Pill({ children, tone = 'stone' }: { children: React.ReactNode; tone?: 'stone' | 'dark' | 'violet' }) {
  const cls =
    tone === 'dark'
      ? 'bg-stone-900 text-white border-stone-900'
      : tone === 'violet'
      ? 'bg-violet-500/15 text-violet-700 border-violet-500/20'
      : 'bg-stone-100 text-stone-700 border-stone-200';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>
      {children}
    </span>
  );
}

function SectionCard({
  title,
  desc,
  href,
  icon: Icon,
  ok,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  ok?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group border border-stone-200 rounded-2xl p-4 bg-white hover:bg-stone-50/60 transition flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center border border-stone-200">
        <Icon className="w-5 h-5 text-stone-700" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-stone-900">{title}</div>
          {ok ? <Pill tone="dark">OK</Pill> : <Pill>À compléter</Pill>}
        </div>
        <div className="text-xs text-stone-500 mt-1">{desc}</div>
        <div className="text-xs text-stone-700 mt-2 opacity-0 group-hover:opacity-100 transition">
          Ouvrir <span aria-hidden>→</span>
        </div>
      </div>
    </Link>
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
