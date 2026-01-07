'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefLayout } from '../../../components/ChefLayout';
import { Marker, Label, Button, Input } from '../../../components/ui';
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
  DollarSign,
  Upload,
} from 'lucide-react';
import { computeChefScore } from '@/lib/chefScore';
import { isProfileCompleteForValidation } from '@/lib/profileCompletion';
import { supabase } from '@/services/supabaseClient';

/* ----------------- Password Section (Supabase) ----------------- */

function PasswordSection() {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSave = async () => {
    setMsg(null);

    if (pw1.length < 8) return setMsg('Mot de passe trop court (8+ caractères).');
    if (pw1 !== pw2) return setMsg('Les mots de passe ne correspondent pas.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      setPw1('');
      setPw2('');
      setMsg('✅ Mot de passe mis à jour.');
    } catch (e: any) {
      setMsg(e?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 p-6 space-y-4 rounded-2xl">
      <div>
        <Label>Mot de passe</Label>
        <p className="text-xs text-stone-500 mt-1">
          Après votre première connexion via lien magique, vous pouvez définir un mot de passe pour vous reconnecter plus facilement.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Nouveau mot de passe</Label>
        <Input
          type="password"
          value={pw1}
          onChange={(e) => setPw1((e.target as HTMLInputElement).value)}
          placeholder="8+ caractères"
        />
      </div>

      <div className="space-y-2">
        <Label>Confirmer</Label>
        <Input
          type="password"
          value={pw2}
          onChange={(e) => setPw2((e.target as HTMLInputElement).value)}
          placeholder="Répéter"
        />
      </div>

      {msg && <div className="text-sm text-stone-600">{msg}</div>}

      <Button onClick={onSave} disabled={loading} className="bg-stone-900 hover:bg-stone-800">
        {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
      </Button>
    </div>
  );
}

/* ----------------- Types ----------------- */

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
  photoUrl?: string; // legacy
  yearsExperience?: number | null;

  images?: string[]; // portfolio photos
  founder?: boolean;

  pricing?: any;
  availability?: any;

  location?: {
    baseCity?: string;
    travelRadiusKm?: number;
    internationalMobility?: boolean;
    coverageZones?: string[];
  };

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
};

const STORAGE_KEY = 'ct_chef_profile_v1';
const FALLBACK_KEYS = ['ct_chef_profile', 'chef_profile', 'ct_chef_v1'];

/* ----------------- Helpers ----------------- */

function isPricingComplete(p: any) {
  const pricing = p?.pricing ?? null;
  const dailyRate = pricing?.residence?.dailyRate;
  const ppp = pricing?.event?.pricePerPerson;

  const okDaily = typeof dailyRate === 'number' && dailyRate > 0;
  const okPpp = typeof ppp === 'number' && ppp > 0;

  return okDaily || okPpp;
}

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

/* ----------------- Page ----------------- */

export default function ChefSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sbUser, setSbUser] = useState<any | null>(null);

  const [profile, setProfile] = useState<ChefProfile>({});
  const [notice, setNotice] = useState<string | null>(null);

  // ✅ Normalisation pour score / compat legacy
  const scoreInput = useMemo(() => {
    const p: any = profile ?? {};
    return {
      ...p,
      city: p.city ?? p.baseCity ?? p.location?.baseCity ?? '',
      avatarUrl: p.avatarUrl ?? p.photoUrl ?? '',
      portfolioUrl: p.portfolioUrl ?? p.portfolio ?? p.driveUrl ?? p.drive ?? '',
      images: p.images ?? p.photos ?? p.gallery ?? p.portfolioImages ?? [],
    };
  }, [profile]);

  // (si tu l’utilises ailleurs)
  const validationCompletion = useMemo(() => {
    const { details, ok } = isProfileCompleteForValidation(profile ?? {});
    const items = Object.entries(details).map(([k, v]) => ({ key: k, ok: Boolean(v) }));
    const okCount = items.filter((i) => i.ok).length;
    const total = items.length || 1;
    return { ok, okCount, total, score: Math.round((okCount / total) * 100), details };
  }, [profile]);

  const { score, rules } = useMemo(() => computeChefScore(scoreInput), [scoreInput]);

  // ✅ Source de vérité = DB (Supabase session + /api/chef/profile)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user ?? null;

        if (!u?.id) {
          if (!cancelled) setLoading(false);
          router.replace('/chef/login');
          return;
        }

        if (!cancelled) setSbUser(u);

        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(u.id)}`, { cache: 'no-store' });
        const json = await res.json();
        const fromDb = json?.profile ?? null;

        if (cancelled) return;

        if (fromDb) {
          setProfile(fromDb);
        } else {
          // fallback localStorage (au cas où)
          const fromLs =
            safeReadLS<ChefProfile>(STORAGE_KEY) ??
            FALLBACK_KEYS.map((k) => safeReadLS<ChefProfile>(k)).find(Boolean) ??
            null;

          const merged: ChefProfile = {
            ...(fromLs ?? {}),
            id: u.id,
            email: u.email ?? '',
            updatedAt: new Date().toISOString(),
          };

          setProfile(merged);
        }

        setLoading(false);
      } catch (e) {
        console.error('LOAD PROFILE ERROR', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ✅ Checklist tolérante (bio / images / avatar / location / pricing etc.)
  const checklist = useMemo(() => {
    const bio = String(profile.bio ?? (profile as any).about ?? (profile as any).description ?? '').trim();

    const years =
      Number(profile.yearsExperience ?? (profile as any).experienceYears ?? (profile as any).years ?? 0) || 0;

    const imagesRaw =
      (profile as any).photos ??
      (profile as any).images ??
      (profile as any).gallery ??
      (profile as any).portfolioImages ??
      [];

const MIN_PORTFOLIO = 5;
const imageCount = Array.isArray(imagesRaw) ? imagesRaw.filter(Boolean).length : 0;
const hasMinImages = imageCount >= MIN_PORTFOLIO;
    
    const photoUrl = String((profile as any).photoUrl ?? (profile as any).avatarUrl ?? '').trim();

    const instagram = String((profile as any).instagram ?? '').trim();
    const website = String((profile as any).website ?? '').trim();
    const portfolioUrl = String((profile as any).portfolioUrl ?? '').trim();

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
        ok:
          !!String((profile as any).name ?? '').trim() &&
          !!String(profile.phone ?? '').trim() &&
          (!!String((profile as any).city ?? '').trim() || !!String(profile.location?.baseCity ?? '').trim()),
        hint: 'Nom, téléphone, ville…',
        href: '/chef/identity',
        icon: User,
      },
      {
        key: 'experience',
        label: 'Expérience',
        ok: years > 0 || bio.length >= 80 || (profile.specialties?.length ?? 0) >= 1,
        hint: 'Bio + expérience',
        href: '/chef/experience',
        icon: Briefcase,
      },
      {
        key: 'portfolio',
        label: 'Portfolio',
        ok: hasMinImages,
hint: `5 photos minimum (${imageCount}/${MIN_PORTFOLIO})`,
        href: '/chef/portfolio',
        icon: ImageIcon,
      },
      {
        key: 'mobility',
        label: 'Zone & mobilité',
        ok:
          !!String(profile.location?.baseCity ?? '').trim() ||
          profile.location?.internationalMobility === true ||
          (profile.location?.coverageZones?.length ?? 0) > 0,
        hint: 'Zones, déplacements',
        href: '/chef/mobility',
        icon: MapPinned,
      },
      {
        key: 'pricing',
        label: 'Tarifs',
        ok: isPricingComplete(profile),
        hint: 'Prix / jour ou prix / personne',
        href: '/chef/pricing',
        icon: DollarSign,
      },
      {
        key: 'availability',
        label: 'Disponibilités',
        ok: true, // volontairement non-bloquant
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
    const ok = checklist.filter((i) => i.ok).length;
    const scorePct = total === 0 ? 0 : Math.round((ok / total) * 100);
    return { total, ok, score: scorePct };
  }, [checklist]);

  const launchTier = useMemo(() => {
    const s = completion.score;
    if (s >= 90) return { label: 'Priorité MAX', tone: 'dark' as const, icon: Crown };
    if (s >= 70) return { label: 'Prioritaire', tone: 'violet' as const, icon: ShieldCheck };
    if (s >= 40) return { label: 'En progression', tone: 'stone' as const, icon: Sparkles };
    return { label: 'À compléter', tone: 'stone' as const, icon: Lock };
  }, [completion.score]);

  const canBecomeFounder = completion.score >= 70 && isPricingComplete(profile);

  const saveProfile = async (patch: ChefProfile) => {
    setSaving(true);
    setNotice(null);

    try {
      if (!sbUser?.id) throw new Error('No user');

      const merged: ChefProfile = {
        ...profile,
        ...patch,
        id: sbUser.id,
        email: sbUser.email ?? profile.email ?? '',
        updatedAt: new Date().toISOString(),
      };

      // ✅ cache local
      safeWriteLS(STORAGE_KEY, merged);

      // ✅ DB
      const res = await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sbUser.id, profile: merged }),
      });

      if (!res.ok) throw new Error(await res.text());

      setProfile(merged);
      setNotice('Enregistré ✅');
    } catch (e) {
      console.error('SAVE ERROR', e);
      setNotice('Erreur d’enregistrement');
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
                <div className="h-2 bg-stone-900 rounded-full transition-all" style={{ width: `${completion.score}%` }} />
              </div>

              <div className="text-xs text-stone-500">
                Règle simple : <span className="text-stone-800 font-medium">plus ton profil est complet</span>, plus tu remontes en priorité sur les demandes (fast & standard).
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => saveProfile(profile)}
                disabled={saving || loading}
                className="bg-stone-900 hover:bg-stone-800"
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
              {checklist.map((item) => (
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
                    <Link href={item.href} className="text-xs text-stone-700 hover:text-stone-900 transition whitespace-nowrap">
                      Ouvrir →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Hub */}
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
                    <div className="text-sm text-stone-900 font-medium">{profile.name?.trim() ? profile.name : '—'}</div>
                    <div className="text-xs text-stone-500">{profile.email ?? '—'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <SectionCard
                    title="Identité"
                    desc="Nom, téléphone, ville…"
                    href="/chef/identity"
                    icon={User}
                    ok={checklist.find((i) => i.key === 'identity')?.ok}
                  />
                  <SectionCard
                    title="Expérience"
                    desc="Bio, années, style…"
                    href="/chef/experience"
                    icon={Briefcase}
                    ok={checklist.find((i) => i.key === 'experience')?.ok}
                  />
                  <SectionCard
                    title="Portfolio"
                    desc="Photos, Instagram, site…"
                    href="/chef/portfolio"
                    icon={ImageIcon}
                    ok={checklist.find((i) => i.key === 'portfolio')?.ok}
                  />
                  <SectionCard
                    title="Zone & Mobilité"
                    desc="Zones, déplacements…"
                    href="/chef/mobility"
                    icon={MapPinned}
                    ok={checklist.find((i) => i.key === 'mobility')?.ok}
                  />
                  <SectionCard
                    title="Disponibilités"
                    desc="Périodes, calendrier…"
                    href="/chef/availability"
                    icon={Calendar}
                    ok={checklist.find((i) => i.key === 'availability')?.ok}
                  />
                  <SectionCard
                    title="Préférences"
                    desc="Cuisines, langues…"
                    href="/chef/preferences"
                    icon={SlidersHorizontal}
                    ok={checklist.find((i) => i.key === 'preferences')?.ok}
                  />
                  <SectionCard
                    title="Tarifs"
                    desc="Positionnement & prix"
                    href="/chef/pricing"
                    icon={DollarSign}
                    ok={checklist.find((i) => i.key === 'pricing')?.ok}
                  />
                </div>

                <div className="pt-3 flex items-center gap-2">
                  <Button className="bg-stone-900 hover:bg-stone-800" onClick={() => saveProfile(profile)} disabled={saving}>
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

        {/* ✅ Password */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1" />
          <div className="lg:col-span-2">
            <PasswordSection />
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

  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{children}</span>;
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
