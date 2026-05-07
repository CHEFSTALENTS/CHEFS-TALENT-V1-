'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Label, Button, Input, Marker } from '../../../components/ui';
import { Loader2, Info, X } from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';

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

/* ----------------- Modal info ----------------- */

function InfoModal({
  open,
  onClose,
  title,
  subtitle,
  closeAriaLabel,
  understoodCta,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  closeAriaLabel: string;
  understoodCta: string;
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
      <button
        type="button"
        aria-label={closeAriaLabel}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-[92vw] max-w-xl rounded-2xl bg-white border border-stone-200 shadow-xl">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-stone-100">
          <div>
            <div className="text-sm font-semibold text-stone-900">{title}</div>
            <div className="text-xs text-stone-500 mt-1">{subtitle}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
            aria-label={closeAriaLabel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-stone-700">{children}</div>

        <div className="p-5 pt-0 flex justify-end">
          <Button type="button" onClick={onClose} className="bg-stone-900 hover:bg-stone-800">
            {understoodCta}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChefMobilityPage() {
  const router = useRouter();
  const { t } = useChefLocale();

  const [booting, setBooting] = useState(true);
  const [sbUserId, setSbUserId] = useState<string | null>(null);
  const [sbEmail, setSbEmail] = useState<string>('');

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

  // Boot session
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

  // Load profile DB
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

  const positioning = useMemo(() => {
    const r = Number(data.travelRadiusKm || 0);
    const intl = !!data.internationalMobility;

    if (intl) return t.mobility.positioning.international;
    if (r >= 300) return t.mobility.positioning.large;
    if (r >= 150) return t.mobility.positioning.regional;
    return t.mobility.positioning.local;
  }, [data.travelRadiusKm, data.internationalMobility, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      if (!sbUserId) throw new Error('No user');

      const patch = {
        location: {
          baseCity: normalizeStr(data.baseCity),
          travelRadiusKm: Number(data.travelRadiusKm || 0),
          internationalMobility: !!data.internationalMobility,
        },
        baseCity: normalizeStr(data.baseCity),
        travelRadiusKm: Number(data.travelRadiusKm || 0),
        internationalMobility: !!data.internationalMobility,
      };

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
      alert(e?.message || t.mobility.saveError);
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
      <div className="max-w-2xl">
        <Marker />
        <Label>{t.mobility.pageLabel}</Label>

        {/* Titre + (i) */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-serif text-stone-900">{t.mobility.pageTitle}</h1>

          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-stone-50 transition"
            aria-label={t.mobility.helpAriaLabel}
            title={t.mobility.helpTitle}
          >
            <Info className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Popup info */}
        <InfoModal
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          title={t.mobility.helpModalTitle}
          subtitle={t.mobility.helpModalSubtitle}
          closeAriaLabel={t.common.close}
          understoodCta={t.mobility.helpUnderstood}
        >
          <div className="space-y-3">
            <div>
              <div className="font-medium text-stone-900">{t.mobility.helpStep1Title}</div>
              <div className="text-stone-600">{t.mobility.helpStep1Desc}</div>
            </div>

            <div>
              <div className="font-medium text-stone-900">{t.mobility.helpStep2Title}</div>
              <div className="text-stone-600">{t.mobility.helpStep2Desc}</div>
              <div className="text-xs text-stone-500 mt-1">{t.mobility.helpStep2Refs}</div>
            </div>

            <div>
              <div className="font-medium text-stone-900">{t.mobility.helpStep3Title}</div>
              <div className="text-stone-600">{t.mobility.helpStep3Desc}</div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="font-medium text-stone-900">{t.mobility.helpImportantTitle}</div>
              <div className="text-stone-700 mt-1">{t.mobility.helpImportantBody}</div>
              <div className="text-xs text-stone-500 mt-2">{t.mobility.helpImportantNote}</div>
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
                <div className="text-xs uppercase tracking-widest text-stone-500">{t.mobility.positioningLabel}</div>
                <div className="mt-1 text-lg font-semibold text-stone-900">{positioning.label}</div>
                <div className="mt-1 text-sm text-stone-600">{positioning.desc}</div>
              </div>

              <div className="space-y-2">
                <Label>{t.mobility.baseCityLabel}</Label>
                <Input
                  value={data.baseCity}
                  onChange={(e) => setData({ ...data, baseCity: e.target.value })}
                  placeholder={t.mobility.baseCityPlaceholder}
                />
                <p className="text-xs text-stone-400">{t.mobility.baseCityHint}</p>
              </div>

              <div className="space-y-2">
                <Label>{t.mobility.radiusLabel}</Label>
                <Input
                  type="number"
                  value={data.travelRadiusKm}
                  onChange={(e) => setData({ ...data, travelRadiusKm: parseInt(e.target.value || '0', 10) || 0 })}
                  placeholder={t.mobility.radiusPlaceholder}
                />
                <p className="text-xs text-stone-400">{t.mobility.radiusHint}</p>
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
                  <span className="block font-medium text-stone-900">{t.mobility.intlLabel}</span>
                  <span className="text-xs text-stone-500">{t.mobility.intlDesc}</span>
                </div>
              </label>

              {/* Zones suggérées (affichage uniquement) */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t.mobility.suggestedZonesLabel}</Label>
                  <Button type="button" disabled className="w-auto px-4 opacity-50 cursor-not-allowed">
                    {t.mobility.suggestedZonesAuto}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {suggestedZones.map((z) => (
                    <span key={z} className="text-xs px-2.5 py-1 border border-stone-200 bg-stone-50 text-stone-700">
                      {z}
                    </span>
                  ))}
                  {suggestedZones.length === 0 ? (
                    <span className="text-xs text-stone-400">{t.mobility.suggestedZonesEmpty}</span>
                  ) : null}
                </div>

                <p className="text-xs text-stone-400">{t.mobility.suggestedZonesHint}</p>
              </div>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                {success && <span className="text-sm text-green-600">{t.common.savedSuccess}</span>}
                <Button type="submit" disabled={saving} className="ml-auto w-32">
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : t.common.save}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
  );
}
