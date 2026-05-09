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

      {/* ================================================================
          Diagnostic chefs : 3 listes exploitables avec liens directs vers
          les fiches admin pour corriger les profils.
          ================================================================ */}
      {data?.diagnostics && (
        <div className="space-y-3">
          <DiagnosticList
            title="Chefs visibles sur la map sans ville"
            description="Chefs avec status active/approved mais aucune ville renseignée dans leur profil. Ils ne peuvent pas apparaître sur la map. Clique sur un chef pour aller corriger sa fiche."
            tone="red"
            items={data.diagnostics.chefsActiveWithoutCity || []}
          />
          <DiagnosticList
            title="Chefs avec ville ambiguë"
            description="Plusieurs villes dans le champ baseCity ou description floue (« Europe », « International »). Mapbox ne peut pas géocoder précisément, le chef apparaît avec un point approximatif. À clarifier en mettant une seule ville principale."
            tone="amber"
            items={data.diagnostics.chefsAmbiguousCity || []}
          />
          <DiagnosticList
            title="Chefs en attente de validation (draft / empty)"
            description="Pas affichés sur la map tant qu'ils ne sont pas en status active/approved. À valider depuis /admin/chefs si tu veux qu'ils apparaissent."
            tone="muted"
            items={data.diagnostics.chefsAwaitingValidation || []}
            collapsedByDefault
          />
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

function DiagnosticList({
  title,
  description,
  tone,
  items,
  collapsedByDefault,
}: {
  title: string;
  description: string;
  tone: 'red' | 'amber' | 'muted';
  items: Array<{
    userId: string;
    adminUrl: string | null;
    emailMasked: string;
    name: string;
    status: string;
    cityRaw: string | null;
  }>;
  collapsedByDefault?: boolean;
}) {
  const [expanded, setExpanded] = useState(!collapsedByDefault);

  if (!items || items.length === 0) {
    // On affiche quand même la card pour montrer que c'est OK (0 chef)
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-emerald-200">
            ✓ {title}
          </div>
          <span className="text-xs text-emerald-200/60">0 chef</span>
        </div>
      </div>
    );
  }

  const headerCls =
    tone === 'red'
      ? 'border-red-500/30 bg-red-500/10'
      : tone === 'amber'
        ? 'border-amber-500/30 bg-amber-500/10'
        : 'border-white/10 bg-white/5';
  const titleCls =
    tone === 'red'
      ? 'text-red-200'
      : tone === 'amber'
        ? 'text-amber-200'
        : 'text-white/80';
  const countCls =
    tone === 'red'
      ? 'bg-red-500/20 text-red-100'
      : tone === 'amber'
        ? 'bg-amber-500/20 text-amber-100'
        : 'bg-white/10 text-white/70';

  return (
    <div className={`rounded-2xl border ${headerCls} overflow-hidden`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-white/5 transition"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${titleCls}`}>{title}</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${countCls}`}
            >
              {items.length}
            </span>
          </div>
          <div className="text-xs text-white/55 mt-1.5 leading-relaxed">
            {description}
          </div>
        </div>
        <div className="text-white/45 text-xs whitespace-nowrap">
          {expanded ? 'Masquer' : 'Afficher'}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/20 sticky top-0">
              <tr className="text-white/55">
                <th className="text-left px-4 py-2 font-medium">Chef</th>
                <th className="text-left px-4 py-2 font-medium">Email</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Ville actuelle</th>
                <th className="text-right px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.userId}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="px-4 py-2 text-white">{c.name}</td>
                  <td className="px-4 py-2 text-white/55 text-xs">
                    {c.emailMasked}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-white/10 bg-white/5 text-white/70">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-white/65 text-xs italic">
                    {c.cityRaw ? `"${c.cityRaw}"` : '— vide —'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {c.adminUrl ? (
                      <a
                        href={c.adminUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/10 text-xs text-white hover:bg-white/15"
                      >
                        Voir fiche →
                      </a>
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
