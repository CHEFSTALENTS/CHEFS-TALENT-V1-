'use client';

import { useEffect, useState } from 'react';
import { adminFetchRaw } from '@/lib/adminFetch';
import { Loader2, Copy, RefreshCw } from 'lucide-react';

/**
 * Page admin de diagnostic pour /admin/map.
 * Fetch /api/admin/chefs/map/debug avec le Bearer admin et affiche le
 * JSON formaté + un bouton « Copier ».
 *
 * À utiliser quand /admin/map affiche 0 chef ou retourne 500 : le JSON
 * répond précisément à pourquoi (status filter, ville absente, env
 * Mapbox manquante...).
 */
export default function MapDebugPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminFetchRaw('/api/admin/chefs/map/debug');
      const json = await r.json();
      if (!r.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const copyJson = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback : sélectionner le pre
      const pre = document.getElementById('debug-json');
      if (pre) {
        const range = document.createRange();
        range.selectNode(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Map debug — diagnostic géolocalisation chefs
          </h1>
          <p className="text-sm text-white/55 mt-1">
            Pourquoi <code className="text-white/80">/admin/map</code> affiche 0 chef ?
            Cette page fetch <code className="text-white/80">/api/admin/chefs/map/debug</code>{' '}
            avec ton token admin et affiche tous les compteurs.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Rafraîchir
          </button>
          <button
            onClick={copyJson}
            disabled={!data}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-[#161616] text-sm font-semibold hover:bg-white/90 transition disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copié ✓' : 'Copier le JSON'}
          </button>
        </div>
      </div>

      {/* Résumé visuel rapide */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Chefs en DB"
            value={data.summary.totalChefsInDB}
          />
          <Stat
            label="Actifs"
            value={data.summary.activeChefsCount}
            tone={data.summary.activeChefsCount === 0 ? 'red' : 'green'}
          />
          <Stat
            label="Avec ville détectée"
            value={data.summary.activeWithCityCount}
            tone={data.summary.activeWithCityCount === 0 ? 'red' : 'green'}
          />
          <Stat
            label="Cache hits"
            value={`${data.summary.cachedQueriesCount} / ${data.summary.uniqueQueriesCount}`}
          />
        </div>
      )}

      {/* Status distribution + env Mapbox */}
      {data?.summary?.statusDistribution && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-3">
              Distribution des statuts chefs
            </p>
            <div className="space-y-1 text-sm">
              {Object.entries(data.summary.statusDistribution).map(
                ([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between"
                  >
                    <span className="text-white/70">{k}</span>
                    <span className="text-white font-medium">
                      {v as number}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {data?.env && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-3">
                Variables d'environnement Mapbox
              </p>
              <div className="space-y-1 text-sm">
                {Object.entries(data.env).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-3"
                  >
                    <span className="text-white/70 truncate">{k}</span>
                    <span
                      className={
                        v
                          ? 'text-emerald-300 font-medium'
                          : 'text-red-300 font-medium'
                      }
                    >
                      {v ? '✓ présent' : '✗ absent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* JSON brut */}
      <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
        <div className="px-4 py-2 border-b border-white/10 text-xs text-white/50 flex items-center justify-between">
          <span>JSON brut (à copier-coller à l'agent pour debug)</span>
          {data && (
            <span className="text-white/40">
              {Object.keys(data).length} clés
            </span>
          )}
        </div>
        {loading ? (
          <div className="p-6 text-sm text-white/60 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <pre
            id="debug-json"
            className="p-4 text-[11px] text-white/75 font-mono whitespace-pre-wrap break-words max-h-[600px] overflow-auto"
          >
            {data ? JSON.stringify(data, null, 2) : '(no data)'}
          </pre>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'red' | 'green';
}) {
  const cls =
    tone === 'red'
      ? 'text-red-200'
      : tone === 'green'
        ? 'text-emerald-200'
        : 'text-white';
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55 uppercase tracking-widest">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
