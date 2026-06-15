'use client';

// QuoteAgentChat — modal chat avec l'agent commercial.
// - Conversation persistante (DB) liée au quote
// - Agent pose des questions au début, propose des valeurs avec le temps
// - Boutons "Appliquer" sur chaque suggestion et "Retenir" sur chaque mémoire

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, Check, Brain, Zap } from 'lucide-react';
import { adminFetchRaw, adminFetch } from '@/lib/adminFetch';
import { AdminModal } from '@/app/admin/_components/AdminModal';

type Suggestion = {
  field: string;
  value: any;
  rationale: string;
  applied?: boolean;
};
type MemoryProposal = {
  scope: 'global' | 'destinataire' | 'location';
  scope_key: string;
  memory_key: string;
  value: any;
  rationale: string;
  saved?: boolean;
};
type Turn = {
  role: 'agent' | 'user';
  content: string;
  ts: string;
  suggestions?: Suggestion[];
  memory_proposals?: MemoryProposal[];
};
type Conversation = {
  id: string;
  quote_id: string;
  status: string;
  turns: Turn[];
  ai_input_tokens: number;
  ai_output_tokens: number;
  ai_cost_eur: number;
  started_at: string;
};

const FIELD_LABEL: Record<string, string> = {
  intitule: 'Intitulé',
  lieu: 'Lieu',
  dates_text: 'Dates',
  convives_text: 'Convives',
  rythme_text: 'Rythme',
  langues_text: 'Langues',
  hebergement_text: 'Hébergement',
  destinataire_nom: 'Destinataire',
  destinataire_type: 'Type destinataire',
  destinataire_adresse: 'Adresse destinataire',
  tariff_options: 'Options tarifaires',
  courses_text: 'Texte courses',
  courses_provision_text: 'Provision courses',
  conditions: 'Conditions',
  validity_date: 'Validité',
  chef_cost_eur: 'Coût chef HT',
  chef_travel_cost_eur: 'Frais déplacement chef',
  butler_required: 'Butler requis',
  butler_cost_eur: 'Coût butler',
};

export default function QuoteAgentChat({
  quoteId,
  onClose,
  onQuoteUpdated,
}: {
  quoteId: string;
  onClose: () => void;
  onQuoteUpdated: () => void | Promise<void>;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConv = useCallback(async () => {
    try {
      const json = await adminFetch<{ ok: boolean; conversation: Conversation | null }>(
        `/api/admin/quotes/${encodeURIComponent(quoteId)}/agent`,
      );
      setConversation(json.conversation);
    } catch (e: any) {
      console.error('[QuoteAgentChat] fetch', e);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => { fetchConv(); }, [fetchConv]);

  // Si pas de conversation → trigger un premier appel pour initier
  useEffect(() => {
    if (!loading && !conversation) {
      send(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, conversation]);

  // Scroll auto en bas quand de nouveaux turns arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.turns?.length]);

  async function send(initial = false) {
    setError(null);
    setSending(true);
    try {
      const body = initial ? {} : { message: message.trim() };
      const r = await adminFetchRaw(
        `/api/admin/quotes/${encodeURIComponent(quoteId)}/agent`,
        { method: 'POST', body: JSON.stringify(body) },
      );
      const text = await r.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {
        throw new Error(`Réponse non-JSON (HTTP ${r.status}). ${text.slice(0, 200)}`);
      }
      if (!r.ok || !json?.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setConversation(json.conversation);
      if (!initial) setMessage('');
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSending(false);
    }
  }

  async function applySuggestion(turnIndex: number, suggestionIndex: number) {
    const key = `s${turnIndex}-${suggestionIndex}`;
    setBusyKey(key);
    try {
      const r = await adminFetchRaw(
        `/api/admin/quotes/${encodeURIComponent(quoteId)}/agent/apply-suggestion`,
        { method: 'POST', body: JSON.stringify({ turnIndex, suggestionIndex }) },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await fetchConv();
      await onQuoteUpdated();
    } catch (e: any) {
      alert(`Application impossible : ${e?.message}`);
    } finally {
      setBusyKey(null);
    }
  }

  async function saveMemory(turnIndex: number, memoryIndex: number) {
    const key = `m${turnIndex}-${memoryIndex}`;
    setBusyKey(key);
    try {
      const r = await adminFetchRaw(
        `/api/admin/quotes/${encodeURIComponent(quoteId)}/agent/save-memory`,
        { method: 'POST', body: JSON.stringify({ turnIndex, memoryIndex }) },
      );
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await fetchConv();
    } catch (e: any) {
      alert(`Sauvegarde impossible : ${e?.message}`);
    } finally {
      setBusyKey(null);
    }
  }

  function formatValueShort(v: any): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v.length > 80 ? v.slice(0, 80) + '…' : v;
    if (typeof v === 'number') return new Intl.NumberFormat('fr-FR').format(v);
    if (typeof v === 'boolean') return v ? 'oui' : 'non';
    if (Array.isArray(v)) return `${v.length} entrée(s)`;
    if (typeof v === 'object') return 'objet (voir détail)';
    return String(v);
  }

  return (
    <AdminModal
      title={`Agent commercial${conversation?.ai_cost_eur ? ` · ${Number(conversation.ai_cost_eur).toFixed(4)} €` : ''}`}
      size="xl"
      onClose={onClose}
      closeOnBackdrop={!sending}
      closeOnEscape={!sending}
      footer={
        <form
          onSubmit={(e) => { e.preventDefault(); if (message.trim()) send(); }}
          className="flex items-end gap-2 w-full"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (message.trim()) send();
              }
            }}
            placeholder="Réponds à l'agent… (Cmd/Ctrl+Enter pour envoyer)"
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/30"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-400 text-emerald-950 font-medium hover:bg-emerald-300 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      }
    >
      {/* Conversation */}
      <div ref={scrollRef} className="space-y-4">
          {loading ? (
            <div className="text-center text-sm text-white/45 py-6">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Chargement…
            </div>
          ) : conversation && conversation.turns.length > 0 ? (
            conversation.turns.map((turn, i) => (
              <div key={i} className={turn.role === 'user' ? 'flex justify-end' : ''}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                  turn.role === 'user'
                    ? 'bg-sky-400/15 border border-sky-400/25 text-sky-50'
                    : 'bg-white/[0.03] border border-white/10 text-white/90'
                }`}>
                  <div className="text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5 opacity-60">
                    {turn.role === 'agent' ? (
                      <><Sparkles className="w-3 h-3" /> Agent</>
                    ) : (
                      <>Thomas</>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</div>

                  {/* Suggestions */}
                  {turn.suggestions && turn.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {turn.suggestions.map((s, j) => (
                        <div key={j} className="rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] uppercase tracking-wider text-emerald-200/80 font-semibold flex items-center gap-1.5">
                                <Zap className="w-3 h-3" />
                                {FIELD_LABEL[s.field] || s.field}
                              </div>
                              <div className="text-sm text-white/90 font-mono mt-0.5">
                                {formatValueShort(s.value)}
                              </div>
                              <div className="text-[11px] text-white/55 italic mt-0.5">
                                {s.rationale}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {s.applied ? (
                                <span className="inline-flex items-center text-[10px] text-emerald-200 px-2 py-1 rounded border border-emerald-400/30 bg-emerald-400/10">
                                  <Check className="w-3 h-3 mr-1" /> Appliqué
                                </span>
                              ) : (
                                <button
                                  onClick={() => applySuggestion(i, j)}
                                  disabled={busyKey === `s${i}-${j}`}
                                  className="inline-flex items-center text-[11px] text-emerald-200 px-2 py-1 rounded border border-emerald-400/30 bg-emerald-400/15 hover:bg-emerald-400/25 disabled:opacity-50"
                                >
                                  {busyKey === `s${i}-${j}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Check className="w-3 h-3 mr-1" />
                                  )}
                                  Appliquer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Memory proposals */}
                  {turn.memory_proposals && turn.memory_proposals.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {turn.memory_proposals.map((m, j) => (
                        <div key={j} className="rounded-lg border border-indigo-400/25 bg-indigo-400/5 px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] uppercase tracking-wider text-indigo-200/80 font-semibold flex items-center gap-1.5">
                                <Brain className="w-3 h-3" />
                                Retenir : {m.memory_key}
                              </div>
                              <div className="text-[11px] text-white/60 mt-0.5">
                                <span className="text-indigo-200/80">[{m.scope}:{m.scope_key}]</span>
                                {' = '}
                                <span className="font-mono">{formatValueShort(m.value)}</span>
                              </div>
                              <div className="text-[11px] text-white/55 italic mt-0.5">
                                {m.rationale}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {m.saved ? (
                                <span className="inline-flex items-center text-[10px] text-indigo-200 px-2 py-1 rounded border border-indigo-400/30 bg-indigo-400/10">
                                  <Check className="w-3 h-3 mr-1" /> Retenu
                                </span>
                              ) : (
                                <button
                                  onClick={() => saveMemory(i, j)}
                                  disabled={busyKey === `m${i}-${j}`}
                                  className="inline-flex items-center text-[11px] text-indigo-200 px-2 py-1 rounded border border-indigo-400/30 bg-indigo-400/15 hover:bg-indigo-400/25 disabled:opacity-50"
                                >
                                  {busyKey === `m${i}-${j}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Brain className="w-3 h-3 mr-1" />
                                  )}
                                  Retenir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-white/45 py-6">
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  L'agent prépare la première question…
                </>
              ) : (
                <>L'agent va se lancer.</>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
      </div>
    </AdminModal>
  );
}
