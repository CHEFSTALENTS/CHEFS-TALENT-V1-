'use client';

// /admin/quotes/memories — Mémoires apprises par l'agent commercial
// Permet à Thomas de relire, éditer ou supprimer ce que l'agent retient.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Brain, Loader2, RefreshCw, Trash2, Edit3, ChevronLeft, Filter, Globe2, User, MapPin } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import { AdminModal } from '@/app/admin/_components/AdminModal';

type Memory = {
  id: string;
  scope: 'global' | 'destinataire' | 'location';
  scope_key: string | null;
  memory_key: string;
  value: string;
  rationale: string | null;
  confidence: number; // 0..1
  use_count: number;
  source_quote_id: string | null;
  created_at: string;
  updated_at: string;
};

const SCOPE_LABEL: Record<Memory['scope'], string> = {
  global: 'Global',
  destinataire: 'Destinataire',
  location: 'Lieu',
};

const SCOPE_ICON: Record<Memory['scope'], typeof Globe2> = {
  global: Globe2,
  destinataire: User,
  location: MapPin,
};

const SCOPE_CLASS: Record<Memory['scope'], string> = {
  global: 'bg-indigo-400/15 text-indigo-200 border-indigo-400/25',
  destinataire: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
  location: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
};

export default function QuoteAgentMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [editing, setEditing] = useState<Memory | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (scope) params.set('scope', scope);
      if (search) params.set('q', search);
      const json = await adminFetch<{ ok: boolean; memories: Memory[] }>(
        `/api/admin/quote-memories?${params.toString()}`,
      );
      setMemories(json.memories || []);
    } catch (e: any) {
      console.error('[memories] fetch', e);
    } finally {
      setLoading(false);
    }
  }, [scope, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette mémoire ? L'agent ne s'en souviendra plus.")) return;
    try {
      await adminFetch(`/api/admin/quote-memories/${id}`, { method: 'DELETE' });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      alert(`Erreur : ${e?.message || 'inconnue'}`);
    }
  }, []);

  // ─── Group by scope for readability ───
  const grouped = useMemo(() => {
    const g: Record<Memory['scope'], Memory[]> = { global: [], destinataire: [], location: [] };
    for (const m of memories) g[m.scope].push(m);
    return g;
  }, [memories]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link
            href="/admin/quotes"
            className="text-xs text-white/45 hover:text-white/85 inline-flex items-center gap-1 mb-1"
          >
            <ChevronLeft className="w-3 h-3" /> Dashboard devis
          </Link>
          <h1 className="text-xl font-semibold text-white inline-flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-300" />
            Mémoires de l'agent commercial
          </h1>
          <p className="text-sm text-white/55">
            Ce que l'agent a appris au fil des devis. Vous pouvez corriger ou supprimer chaque entrée.
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </header>

      {/* Filters */}
      <section className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
          {[
            { v: '', label: 'Tout', n: memories.length },
            { v: 'global', label: 'Global', n: grouped.global.length },
            { v: 'destinataire', label: 'Destinataire', n: grouped.destinataire.length },
            { v: 'location', label: 'Lieu', n: grouped.location.length },
          ].map((opt) => (
            <button
              key={opt.v || 'all'}
              onClick={() => setScope(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-xs ${
                scope === opt.v
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/55 hover:text-white/85'
              }`}
            >
              {opt.label} <span className="text-white/40 ml-1">({opt.n})</span>
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (clé, valeur, raison)…"
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white placeholder:text-white/30 w-64"
        />
      </section>

      {/* List */}
      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-white/45">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Chargement…
        </div>
      ) : memories.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-12 text-center">
          <Brain className="w-8 h-8 mx-auto text-white/25 mb-2" />
          <div className="text-sm text-white/55">
            Aucune mémoire pour le moment. L'agent en créera au fil des conversations sur les devis.
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {memories.map((m) => {
            const Icon = SCOPE_ICON[m.scope];
            return (
              <li
                key={m.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${SCOPE_CLASS[m.scope]}`}>
                        <Icon className="w-3 h-3" />
                        {SCOPE_LABEL[m.scope]}
                        {m.scope_key && <span className="ml-1 opacity-75">· {m.scope_key}</span>}
                      </span>
                      <ConfidenceBar value={m.confidence} />
                      <span className="text-[10px] text-white/40">
                        utilisée {m.use_count}×
                      </span>
                    </div>
                    <div className="text-sm text-white/85 font-mono">
                      <span className="text-white/55">{m.memory_key}</span>
                      <span className="text-white/30 mx-1.5">=</span>
                      <span className="text-white">{m.value}</span>
                    </div>
                    {m.rationale && (
                      <div className="text-[11px] text-white/55 italic">
                        « {m.rationale} »
                      </div>
                    )}
                    <div className="text-[10px] text-white/35">
                      Maj {new Date(m.updated_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setEditing(m)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/55 hover:text-white"
                      title="Éditer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg hover:bg-red-400/15 text-white/55 hover:text-red-200"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <EditMemoryModal
          memory={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setMemories((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? 'bg-emerald-400/70' : pct >= 50 ? 'bg-sky-400/70' : 'bg-amber-400/70';
  return (
    <div className="inline-flex items-center gap-1.5" title={`Confiance ${pct}%`}>
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-white/45 font-mono">{pct}%</span>
    </div>
  );
}

function EditMemoryModal({
  memory,
  onClose,
  onSaved,
}: {
  memory: Memory;
  onClose: () => void;
  onSaved: (m: Memory) => void;
}) {
  const [value, setValue] = useState(memory.value);
  const [rationale, setRationale] = useState(memory.rationale || '');
  const [confidence, setConfidence] = useState(memory.confidence);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch<{ ok: boolean; memory: Memory }>(
        `/api/admin/quote-memories/${memory.id}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ value, rationale, confidence }),
        },
      );
      onSaved(res.memory);
    } catch (e: any) {
      alert(`Erreur : ${e?.message || 'inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      title="Éditer la mémoire"
      subtitle={`${memory.scope}${memory.scope_key ? `:${memory.scope_key}` : ''} · ${memory.memory_key}`}
      size="md"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs text-white/75 hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !value.trim()}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-xs text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
            Enregistrer
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs text-white/55">Valeur</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-white/55">Raison (pourquoi cette mémoire ?)</label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-white/55">
            Confiance : <span className="font-mono text-white">{Math.round(confidence * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(confidence * 100)}
            onChange={(e) => setConfidence(Number(e.target.value) / 100)}
            className="w-full"
          />
        </div>
      </div>
    </AdminModal>
  );
}
