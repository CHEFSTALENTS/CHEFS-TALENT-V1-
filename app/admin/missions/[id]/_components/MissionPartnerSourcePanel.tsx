'use client';

// MissionPartnerSourcePanel — Permet de rattacher une mission à un
// apporteur (partner) et de choisir son canal d'acquisition (source).
// Affiché sur la fiche mission.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, UserCheck, Plus, ExternalLink } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

type PartnerLite = { id: string; name: string; type: string };

const SOURCE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'partner', label: 'Apporteur (partner)' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'direct', label: 'Direct (clientèle propre)' },
  { value: 'word_of_mouth', label: 'Bouche-à-oreille' },
  { value: 'press', label: 'Presse' },
  { value: 'other', label: 'Autre' },
];

export default function MissionPartnerSourcePanel({
  missionId,
  initialPartnerId,
  initialSource,
  onSaved,
}: {
  missionId: string;
  initialPartnerId: string | null;
  initialSource: string | null;
  onSaved: () => void;
}) {
  const [partnerId, setPartnerId] = useState<string>(initialPartnerId || '');
  const [source, setSource] = useState<string>(initialSource || '');
  const [partners, setPartners] = useState<PartnerLite[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const fetchPartners = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      params.set('limit', '50');
      params.set('status', 'active');
      const json = await adminFetch<{ ok: boolean; partners: PartnerLite[] }>(
        `/api/admin/partners?${params.toString()}`,
      );
      setPartners(json.partners || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPartners(search), 250);
    return () => clearTimeout(t);
  }, [search, fetchPartners]);

  const dirty = partnerId !== (initialPartnerId || '') || source !== (initialSource || '');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await adminFetch<{ ok?: boolean; error?: string }>(
        `/api/admin/missions/${missionId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            partnerId: partnerId || null,
            source: source || null,
          }),
        },
      );
      // L'endpoint existant renvoie soit { error } soit la mission directe — pas de flag ok
      if (r.error) throw new Error(r.error);
      onSaved();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const selectedPartner = partners.find((p) => p.id === partnerId);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-indigo-300" />
        <h3 className="text-xs uppercase tracking-wider text-white/55 font-semibold">
          Apporteur / canal d'acquisition
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-white/55 mb-1.5">Canal d'acquisition</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-neutral-900">{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-white/55 mb-1.5">Apporteur (partner)</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un apporteur…"
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white mb-1.5 placeholder:text-white/30"
          />
          {selectedPartner && partnerId && (
            <div className="mb-1.5 flex items-center gap-2 px-2 py-1 rounded-md border border-indigo-400/30 bg-indigo-400/10 text-xs text-indigo-100">
              <UserCheck className="w-3 h-3" />
              {selectedPartner.name}
              <Link href={`/admin/partners/${partnerId}`} className="ml-auto text-indigo-200/65 hover:text-indigo-100">
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button onClick={() => setPartnerId('')} className="text-indigo-200/65 hover:text-red-200">×</button>
            </div>
          )}
          <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02]">
            {loading ? (
              <div className="px-3 py-2 text-xs text-white/45 text-center">
                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                Recherche…
              </div>
            ) : partners.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/45 text-center">
                Aucun apporteur. <Link href="/admin/partners" className="text-indigo-300 hover:text-indigo-200">Créer →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {partners.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setPartnerId(p.id)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-white/[0.05] text-xs ${
                        partnerId === p.id ? 'bg-indigo-400/10 text-indigo-100' : 'text-white/85'
                      }`}
                    >
                      <div className="truncate">{p.name}</div>
                      <div className="text-[10px] text-white/45">{p.type}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/admin/partners"
            className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-white/55 hover:text-white/85"
          >
            <Plus className="w-3 h-3" />
            Nouvel apporteur
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] text-white/40">
          {dirty ? 'Modifications non enregistrées' : savedFlash ? '✓ Enregistré' : 'Synchronisé'}
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-400 text-indigo-950 text-xs font-medium hover:bg-indigo-300 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
