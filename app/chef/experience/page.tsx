'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Input, Textarea, Marker } from '../../../components/ui';
import { Loader2 } from 'lucide-react';

type CertificationKey =
  | 'HACCP'
  | 'Food Safety'
  | 'STCW'
  | 'ENG1'
  | 'First Aid'
  | 'Fire Safety'
  | 'Lifeguard'
  | 'Security';

const CERTS: { id: CertificationKey; label: string; hint?: string }[] = [
  { id: 'HACCP', label: 'HACCP', hint: 'Hygiène alimentaire' },
  { id: 'Food Safety', label: 'Food Safety', hint: 'Certification hygiène (UK/Int.)' },
  { id: 'STCW', label: 'STCW', hint: 'Obligatoire pour de nombreux yachts' },
  { id: 'ENG1', label: 'ENG1', hint: 'Certificat médical maritime' },
  { id: 'First Aid', label: 'Premiers secours', hint: 'PSC1 / équivalent' },
  { id: 'Fire Safety', label: 'Sécurité incendie', hint: 'Formation incendie' },
  { id: 'Lifeguard', label: 'Sauvetage / Lifeguard', hint: 'Utile yacht / beach / pool' },
  { id: 'Security', label: 'Sécurité', hint: 'Formation sécurité / sûreté (optionnel)' },
];

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
        const certItems = ensureArray(existingCert?.items)
          .map((x) => x as CertificationKey)
          .filter((x) => CERTS.some((c) => c.id === x));

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

    // 1) GET existing profile from DB
    const resGet = await fetch(`/api/chef/profile?id=${encodeURIComponent(sbUser.id)}`, { cache: 'no-store' });
    const json = await resGet.json();
    const current = json?.profile ?? {};

    // 2) MERGE
    const merged = {
      ...current,
      ...patch,
      id: sbUser.id,
      email: sbUser.email ?? '',
      updatedAt: new Date().toISOString(),
    };

    // 3) PUT
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
      if (!sbUser?.id) throw new Error('Session expirée. Reconnecte-toi.');

      // ✅ Normalize environments safely
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
      setError(err?.message || 'Erreur inconnue lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  if (booting) return <div className="p-10">Chargement…</div>;
  if (!sbUser) return null;

  return (

      <div className="max-w-2xl">
        <Marker />
        <Label>Profil</Label>
        <h1 className="text-3xl font-serif text-stone-900 mb-8">Expérience & Parcours</h1>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          <div className="space-y-2">
            <Label>Années d'expérience (Cuisine)</Label>
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
            <Label>Environnements Maîtrisés</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'restaurant', label: 'Restaurant Gastronomique' },
                { id: 'hotel', label: 'Hôtellerie de Luxe' },
                { id: 'private_villa', label: 'Villa Privée' },
                { id: 'yacht', label: 'Yachting (>30m)' },
                { id: 'chalet', label: 'Chalet Montagne' },
                { id: 'events', label: 'Traiteur / Événementiel' },
              ].map((env) => (
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
            <Label>Diplômes & certifications</Label>

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
              <Label>Autres / précisions (optionnel)</Label>
              <Textarea
                value={data.certNotes}
                onChange={(e) => setData({ ...data, certNotes: e.target.value })}
                placeholder="Ex: Permis B, Permis bateau, etc."
                className="h-24"
              />
              <p className="text-xs text-stone-400">Ces infos nous aident à mieux vous matcher (yacht, sécurité, conformité).</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bio Professionnelle</Label>
            <Textarea
              value={data.bio}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              placeholder="Décrivez votre parcours, votre philosophie et vos expériences marquantes..."
              className="h-40"
            />
            <p className="text-xs text-stone-400">Ce texte sera visible par les clients. Soyez précis et professionnel.</p>
          </div>

          <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-3">
            <div className="text-sm">
              {error ? <span className="text-red-600">{error}</span> : null}
              {success ? <span className="text-green-600">Modifications enregistrées.</span> : null}
            </div>

            <Button type="submit" disabled={loading} className="ml-auto w-32">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>

  );
}
