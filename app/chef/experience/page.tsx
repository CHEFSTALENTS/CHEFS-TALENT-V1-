'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Input, Textarea, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';

type CertificationKey =
  | 'HACCP'
  | 'Food Safety'
  | 'STCW'
  | 'ENG1'
  | 'First Aid'
  | 'Fire Safety'
  | 'Lifeguard'
  | 'Security';

function ensureArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}

export default function ChefExperiencePage() {
  const router = useRouter();
  const { t } = useChefLocale();

  const [booting, setBooting] = useState(true);
  const [sbUser, setSbUser] = useState<any | null>(null);

  const [loading, setLoading] = useState(false); // saving
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState({
    yearsExperience: 0,
    bio: '',
    environments: [] as string[],

    certItems: [] as CertificationKey[],
    certNotes: '',
  });

  const ENV_OPTIONS: Array<{ id: string; label: string }> = [
    { id: 'restaurant',    label: t.experience.environments.restaurant },
    { id: 'hotel',         label: t.experience.environments.hotel },
    { id: 'private_villa', label: t.experience.environments.private_villa },
    { id: 'yacht',         label: t.experience.environments.yacht },
    { id: 'chalet',        label: t.experience.environments.chalet },
    { id: 'events',        label: t.experience.environments.events },
  ];

  const CERTS: { id: CertificationKey; label: string; hint?: string }[] = [
    { id: 'HACCP',       label: t.experience.certs.HACCP.label,       hint: t.experience.certs.HACCP.hint },
    { id: 'Food Safety', label: t.experience.certs.foodSafety.label,  hint: t.experience.certs.foodSafety.hint },
    { id: 'STCW',        label: t.experience.certs.STCW.label,        hint: t.experience.certs.STCW.hint },
    { id: 'ENG1',        label: t.experience.certs.ENG1.label,        hint: t.experience.certs.ENG1.hint },
    { id: 'First Aid',   label: t.experience.certs.firstAid.label,    hint: t.experience.certs.firstAid.hint },
    { id: 'Fire Safety', label: t.experience.certs.fireSafety.label,  hint: t.experience.certs.fireSafety.hint },
    { id: 'Lifeguard',   label: t.experience.certs.lifeguard.label,   hint: t.experience.certs.lifeguard.hint },
    { id: 'Security',    label: t.experience.certs.security.label,    hint: t.experience.certs.security.hint },
  ];

  // 1) Session supabase
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const u = data.session?.user ?? null;
      setSbUser(u);

      if (!u) {
        router.replace('/chef/login');
        return;
      }

      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setSbUser(u);
      if (!u) router.replace('/chef/login');
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // 2) Charger le profil DB (source de vérité)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!sbUser?.id) return;

      try {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
        const json = await res.json();
        const prof: any = json?.profile ?? {};

        const existingCert = prof?.certifications ?? {};
        const validIds: CertificationKey[] = ['HACCP', 'Food Safety', 'STCW', 'ENG1', 'First Aid', 'Fire Safety', 'Lifeguard', 'Security'];
        const certItems = ensureArray(existingCert?.items)
          .map((x) => x as CertificationKey)
          .filter((x) => validIds.includes(x));

        if (!cancelled) {
          setData({
            yearsExperience: Number(prof.yearsExperience || 0),
            bio: String(prof.bio || ''),
            environments: Array.isArray(prof.environments) ? prof.environments : ensureArray(prof.environments),

            certItems,
            certNotes: String(existingCert?.notes || ''),
          });
        }
      } catch (e) {
        console.warn('[experience] load profile failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUser?.id]);

  async function saveChefProfilePatch(patch: any) {
    if (!sbUser?.id) throw new Error('No user');

    const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
    const json = await resGet.json();
    const current = json?.profile ?? {};

    const merged = {
      ...current,
      ...patch,
      id: sbUser.id,
      email: sbUser.email ?? '',
      updatedAt: new Date().toISOString(),
    };

    const resPut = await fetch('/api/chef/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sbUser.id, profile: merged }),
    });

    if (!resPut.ok) throw new Error(await resPut.text());

    return merged;
  }

  const toggleEnv = (env: string) => {
    setData((prev) => ({
      ...prev,
      environments: prev.environments.includes(env)
        ? prev.environments.filter((e) => e !== env)
        : [...prev.environments, env],
    }));
  };

  const toggleCert = (id: CertificationKey) => {
    setData((prev) => ({
      ...prev,
      certItems: prev.certItems.includes(id)
        ? prev.certItems.filter((x) => x !== id)
        : [...prev.certItems, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      if (!sbUser?.id) throw new Error(t.experience.sessionExpired);

      const environments = uniq(
        Array.isArray(data.environments)
          ? data.environments.map(String)
          : String((data as any).environments ?? '').split(',')
      );

      const patch = {
        yearsExperience: Number.isFinite(Number(data.yearsExperience)) ? Number(data.yearsExperience) : 0,
        bio: String(data.bio || ''),
        environments,

        certifications: {
          items: (data.certItems || []).map(String),
          notes: String(data.certNotes || '').trim() || undefined,
          updatedAt: new Date().toISOString(),
        },
      };

      await saveChefProfilePatch(patch);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('[ChefExperiencePage] save failed:', err);
      setError(err?.message || t.common.saveError);
    } finally {
      setLoading(false);
    }
  };

  if (booting) return <div className="p-10">{t.common.loading}</div>;
  if (!sbUser) return null;

  return (

      <div className="max-w-2xl">
        <Marker />
        <Label>{t.common.sectionLabel}</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">{t.experience.pageTitle}</h1>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          <div className="space-y-2">
            <Label>{t.experience.yearsLabel}</Label>
            <Input
              type="number"
              min={0}
              value={data.yearsExperience}
              onChange={(e) => {
                const n = parseInt(e.target.value || '0', 10);
                setData({ ...data, yearsExperience: Number.isFinite(n) ? n : 0 });
              }}
              className="w-24"
            />
          </div>

          <div className="space-y-4">
            <Label>{t.experience.environmentsLabel}</Label>
            <div className="grid grid-cols-2 gap-3">
              {ENV_OPTIONS.map((env) => (
                <label
                  key={env.id}
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                    data.environments.includes(env.id)
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-sm font-medium text-stone-800">{env.label}</span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={data.environments.includes(env.id)}
                    onChange={() => toggleEnv(env.id)}
                  />
                  <div
                    className={`w-4 h-4 border flex items-center justify-center ${
                      data.environments.includes(env.id) ? 'bg-stone-900 border-stone-900' : 'border-stone-300'
                    }`}
                  >
                    {data.environments.includes(env.id) && <div className="w-1.5 h-1.5 bg-white" />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-stone-100">
            <Label>{t.experience.certificationsLabel}</Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CERTS.map((c) => {
                const checked = data.certItems.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`p-4 border cursor-pointer transition-colors ${
                      checked ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-stone-900">{c.label}</div>
                        {c.hint ? <div className="text-xs text-stone-500 mt-1">{c.hint}</div> : null}
                      </div>

                      <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleCert(c.id)} />
                      <div
                        className={`w-4 h-4 border flex items-center justify-center ${
                          checked ? 'bg-stone-900 border-stone-900' : 'border-stone-300'
                        }`}
                      >
                        {checked ? <div className="w-1.5 h-1.5 bg-white" /> : null}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>{t.experience.certsNotesLabel}</Label>
              <Textarea
                value={data.certNotes}
                onChange={(e) => setData({ ...data, certNotes: e.target.value })}
                placeholder={t.experience.certsNotesPlaceholder}
                className="h-24"
              />
              <p className="text-xs text-stone-400">{t.experience.certsNotesHint}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.experience.bioLabel}</Label>
            <Textarea
              value={data.bio}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              placeholder={t.experience.bioPlaceholder}
              className="h-40"
            />
            <p className="text-xs text-stone-400">{t.experience.bioHint}</p>
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-3">
            <div className="text-sm">
              {error ? <span className="text-red-600">{error}</span> : null}
              {success ? <span className="text-green-600">{t.common.savedSuccess}</span> : null}
            </div>

            <Button type="submit" disabled={loading} className="ml-auto w-32">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : t.common.save}
            </Button>
          </div>
        </form>
      </div>

  );
}
