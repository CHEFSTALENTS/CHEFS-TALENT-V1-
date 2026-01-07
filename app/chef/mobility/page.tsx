'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefLayout } from '../../../components/ChefLayout';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2, Info, X } from 'lucide-react';

type ChefProfileMobility = {
  baseCity?: string;
  travelRadiusKm?: number;
  internationalMobility?: boolean;
  location?: {
    baseCity?: string;
    travelRadiusKm?: number;
    internationalMobility?: boolean;
  };
  [key: string]: any;
};

function normalizeStr(v: any) {
  return String(v || '').trim();
}
function normalizeCityKey(city: string) {
  return normalizeStr(city).toLowerCase();
}
function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function getSuggestedZones(baseCity: string, radiusKm: number, international: boolean): string[] {
  const key = normalizeCityKey(baseCity);
  const suggested: string[] = [];

  const isParis = key.includes('paris') || key.includes('île-de-france') || key.includes('ile de france');
  const isRiviera =
    key.includes('nice') ||
    key.includes('cannes') ||
    key.includes('antibes') ||
    key.includes('saint-tropez') ||
    key.includes('st tropez') ||
    key.includes('monaco') ||
    key.includes('menton');

  const isProvence =
    key.includes('marseille') ||
    key.includes('aix') ||
    key.includes('avignon') ||
    key.includes('arles') ||
    key.includes('alpilles') ||
    key.includes('provence');

  const isAlps =
    key.includes('courchevel') ||
    key.includes('megeve') ||
    key.includes('mégève') ||
    key.includes('chamonix') ||
    key.includes('val d') ||
    key.includes('alpes') ||
    key.includes('geneve') ||
    key.includes('genève');

  const isSwiss =
    key.includes('geneve') ||
    key.includes('genève') ||
    key.includes('lausanne') ||
    key.includes('gstaad') ||
    key.includes('zurich');

  const isIbiza =
    key.includes('ibiza') ||
    key.includes('balear') ||
    key.includes('palma') ||
    key.includes('majorque') ||
    key.includes('mallorca');

  const isLondon = key.includes('london') || key.includes('londres');

  const isItaly = key.includes('milan') || key.includes('milano') || key.includes('rome') || key.includes('roma') || key.includes('tosc') || key.includes('ital');

  const isSpain = key.includes('barcelona') || key.includes('madrid') || key.includes('marbella') || key.includes('esp');

  if (isParis) suggested.push("Paris / Île-de-France");
  if (isRiviera) suggested.push("Côte d'Azur / Monaco");
  if (isProvence) suggested.push('Provence / Alpilles');
  if (isAlps) suggested.push('Alpes (Courchevel, Megève)');
  if (isSwiss) suggested.push('Suisse (Genève, Gstaad)');
  if (isIbiza) suggested.push('Ibiza / Baléares');
  if (isLondon) suggested.push('Londres');
  if (isItaly) suggested.push('Italie (Milan, Rome, Toscane)');
  if (isSpain) suggested.push('Espagne (Barcelone, Marbella)');

  if (radiusKm >= 300) {
    if (isParis) suggested.push('Alpes (Courchevel, Megève)', 'Suisse (Genève, Gstaad)');
    if (isRiviera) suggested.push('Provence / Alpilles', 'Italie (Milan, Rome, Toscane)', 'Suisse (Genève, Gstaad)');
    if (isProvence) suggested.push("Côte d'Azur / Monaco", 'Alpes (Courchevel, Megève)');
  }

  if (international) suggested.push('International');

  if (suggested.length === 0) {
    if (international) return ['International'];
    return ["Paris / Île-de-France", "Côte d'Azur / Monaco"];
  }

  return uniq(suggested);
}

/* ----------------- Modal info (simple, sans dépendance) ----------------- */

function InfoModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      {/* overlay (clic outside) */}
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative w-[92vw] max-w-xl rounded-2xl bg-white border border-stone-200 shadow-xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-stone-100">
          <div>
            <div className="text-sm font-semibold text-stone-900">{title}</div>
            <div className="text-xs text-stone-500 mt-1">
              Nous utilisons ces infos pour te proposer les missions les plus pertinentes.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-stone-700">{children}</div>

        <div className="p-5 pt-0 flex justify-end">
          <Button type="button" onClick={onClose} className="bg-stone-900 hover:bg-stone-800">
            J’ai compris
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChefMobilityPage() {
  const router = useRouter();

  // session (source de vérité)
  const [booting, setBooting] = useState(true);
  const [sbUserId, setSbUserId] = useState<string | null>(null);
  const [sbEmail, setSbEmail] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [baseProfile, setBaseProfile] = useState<ChefProfileMobility>({});

  const [data, setData] = useState({
    baseCity: '',
    travelRadiusKm: 50,
    internationalMobility: false,
  });

  const [infoOpen, setInfoOpen] = useState(false);

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
        const p: ChefProfileMobility = (json?.profile ?? { id: sbUserId, email: sbEmail }) as any;

        if (!cancelled) {
          setBaseProfile(p);

          setData({
            baseCity: p.location?.baseCity ?? p.baseCity ?? '',
            travelRadiusKm: Number(p.location?.travelRadiusKm ?? p.travelRadiusKm ?? 50),
            internationalMobility: Boolean(p.location?.internationalMobility ?? p.internationalMobility ?? false),
          });

          setLoading(false);
        }
      } catch (e) {
        console.error('MOBILITY LOAD ERROR', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sbUserId, sbEmail]);

  const suggestedZones = useMemo(() => {
    return getSuggestedZones(data.baseCity, Number(data.travelRadiusKm || 0), !!data.internationalMobility);
  }, [data.baseCity, data.travelRadiusKm, data.internationalMobility]);

  // petit “résumé” clair pour que le chef comprenne
  const positioning = useMemo(() => {
    const r = Number(data.travelRadiusKm || 0);
    const intl = !!data.internationalMobility;

    if (intl) return { label: 'International', desc: 'Très visible : missions premium + déplacements.' };
    if (r >= 300) return { label: 'Large / multi-zones', desc: 'Très visible : résidences/saisons et missions multi-destinations.' };
    if (r >= 150) return { label: 'Régional', desc: 'Visible : missions dans plusieurs zones autour de ta base.' };
    return { label: 'Local', desc: 'Priorité : missions proches de ta ville de base.' };
  }, [data.travelRadiusKm, data.internationalMobility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      if (!sbUserId) throw new Error('No user');

      const patch = {
        // ✅ source de vérité
        location: {
          baseCity: normalizeStr(data.baseCity),
          travelRadiusKm: Number(data.travelRadiusKm || 0),
          internationalMobility: !!data.internationalMobility,
        },

        // ✅ compat legacy
        baseCity: normalizeStr(data.baseCity),
        travelRadiusKm: Number(data.travelRadiusKm || 0),
        internationalMobility: !!data.internationalMobility,
      };

      // 🔒 merge DB pour ne rien écraser
      const merged: any = {
        ...baseProfile,
        ...patch,
        id: sbUserId,
        email: sbEmail,
        updatedAt: new Date().toISOString(),
      };

      const resPut = await fetch('/api/chef/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sbUserId, profile: merged }),
      });

      if (!resPut.ok) throw new Error(await resPut.text());

      setBaseProfile(merged);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      console.error('MOBILITY SAVE ERROR', e);
      alert(e?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (booting) {
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
      <div className="max-w-2xl">
        <Marker />
        <Label>Logistique</Label>

        {/* Titre + (i) */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-serif text-stone-900">Zone & Mobilité</h1>

          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition"
            aria-label="Informations"
            title="Comment ça marche ?"
          >
            <Info className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Popup info */}
        <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} title="Comment tu es positionné grâce à ta mobilité">
          <div className="space-y-3">
            <div>
              <div className="font-medium text-stone-900">1) Ville de base</div>
              <div className="text-stone-600">
                Elle sert de point de départ. On te propose en priorité des missions proches de cette zone.
              </div>
            </div>

            <div>
              <div className="font-medium text-stone-900">2) Rayon (km)</div>
              <div className="text-stone-600">
                Plus ton rayon est grand, plus tu apparais sur des missions (ex: villas, chalets, résidences, event).
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Repères : 50km = local • 150km = régional • 300km+ = multi-zones
              </div>
            </div>

            <div>
              <div className="font-medium text-stone-900">3) Mobilité internationale</div>
              <div className="text-stone-600">
                Active si tu es prêt à voyager (missions premium : yachts, saisons, résidences longues).
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="font-medium text-stone-900">✅ Important</div>
              <div className="text-stone-700 mt-1">Tu restes libre d’accepter ou refuser une mission à tout moment.</div>
              <div className="text-xs text-stone-500 mt-2">
                Les “zones suggérées” ci-dessous sont une aide automatique (pas un engagement).
              </div>
            </div>
          </div>
        </InfoModal>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border border-stone-200">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
            </div>
          ) : (
            <>
              {/* résumé positionnement */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <div className="text-xs uppercase tracking-widest text-stone-500">Positionnement actuel</div>
                <div className="mt-1 text-lg font-semibold text-stone-900">{positioning.label}</div>
                <div className="mt-1 text-sm text-stone-600">{positioning.desc}</div>
              </div>

              <div className="space-y-2">
                <Label>Ville de base</Label>
                <Input
                  value={data.baseCity}
                  onChange={(e) => setData({ ...data, baseCity: e.target.value })}
                  placeholder="Ex: Paris, Nice, Genève..."
                />
                <p className="text-xs text-stone-400">Cette ville sert à suggérer automatiquement des zones.</p>
              </div>

              <div className="space-y-2">
                <Label>Rayon de déplacement (km)</Label>
                <Input
                  type="number"
                  value={data.travelRadiusKm}
                  onChange={(e) => setData({ ...data, travelRadiusKm: parseInt(e.target.value || '0', 10) || 0 })}
                  placeholder="50"
                />
                <p className="text-xs text-stone-400">Ex : 50 = local • 150 = régional • 300+ = multi-zones</p>
              </div>

              <label className="flex items-center gap-4 p-6 bg-stone-50 border border-stone-100 cursor-pointer">
                <div
                  className={`w-5 h-5 border flex items-center justify-center ${
                    data.internationalMobility ? 'bg-stone-900 border-stone-900' : 'border-stone-300'
                  }`}
                >
                  {data.internationalMobility && <div className="w-2 h-2 bg-white" />}
                </div>

                <input
                  type="checkbox"
                  className="hidden"
                  checked={data.internationalMobility}
                  onChange={() => setData({ ...data, internationalMobility: !data.internationalMobility })}
                />

                <div>
                  <span className="block font-medium text-stone-900">Mobilité Internationale</span>
                  <span className="text-xs text-stone-500">Prêt à voyager pour des missions (passeport valide requis).</span>
                </div>
              </label>

              {/* Zones suggérées (affichage uniquement) */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between gap-3">
                  <Label>Zones suggérées</Label>
                  <Button type="button" disabled className="w-auto px-4 opacity-50 cursor-not-allowed">
                    Auto
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {suggestedZones.map((z) => (
                    <span key={z} className="text-xs px-2.5 py-1 border border-stone-200 bg-stone-50 text-stone-700">
                      {z}
                    </span>
                  ))}
                  {suggestedZones.length === 0 ? (
                    <span className="text-xs text-stone-400">Indique une ville pour obtenir des suggestions.</span>
                  ) : null}
                </div>

                <p className="text-xs text-stone-400">
                  Les zones suggérées sont calculées automatiquement à partir de votre ville et de votre rayon.
                </p>
              </div>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                {success && <span className="text-sm text-green-600">Modifications enregistrées.</span>}
                <Button type="submit" disabled={saving} className="ml-auto w-32">
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : 'Enregistrer'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </ChefLayout>
  );
}
