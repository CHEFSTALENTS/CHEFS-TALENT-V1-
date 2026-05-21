// app/admin/seo/page.tsx
//
// Console SEO admin — génération d'articles via l'agent Claude.
// PR1 : mode "nouvel article". Le bouton "Publier" sera ajouté dans PR2.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles, Trash2, Eye, RefreshCw, FileText } from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';
import { destinations } from '@/lib/destinations';

type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  locale: string;
  target_destination_slug: string | null;
  ai_generated: boolean;
  ai_model: string | null;
  ai_cost_eur: number | null;
  ai_input_tokens: number | null;
  ai_output_tokens: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type GeneratedBlock = {
  type: 'paragraph' | 'h2' | 'h3' | 'list' | 'quote';
  content: string | string[];
};

type ArticleFull = ArticleListItem & {
  meta_title: string | null;
  meta_description: string | null;
  blocks: GeneratedBlock[];
  faqs: { question: string; answer: string }[];
};

const STATUS_LABEL: Record<ArticleListItem['status'], string> = {
  draft: 'Brouillon',
  review: 'En revue',
  published: 'Publié',
  archived: 'Archivé',
};

const STATUS_CLASS: Record<ArticleListItem['status'], string> = {
  draft: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  review: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
  published: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  archived: 'bg-white/10 text-white/55 border-white/15',
};

export default function AdminSeoPage() {
  // Form state
  const [topic, setTopic] = useState('');
  const [destinationSlug, setDestinationSlug] = useState('');
  const [desiredAngle, setDesiredAngle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastGeneration, setLastGeneration] = useState<{
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    costEur: number;
    model: string;
  } | null>(null);

  // Liste des articles
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Preview
  const [previewing, setPreviewing] = useState<ArticleFull | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Tri destinations FR pour le select
  const frDestinations = useMemo(
    () => destinations.filter((d) => d.lang === 'fr').sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const fetchArticles = useCallback(async () => {
    setLoadingList(true);
    try {
      const json = await adminFetch<{ ok: boolean; articles: ArticleListItem[] }>(
        '/api/admin/seo/articles?limit=50',
      );
      setArticles(json.articles || []);
    } catch (e: any) {
      console.error('[admin/seo] fetch articles', e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleGenerate() {
    setFormError(null);
    if (!topic.trim()) {
      setFormError('Indique un sujet (ex: "Saint-Tropez villa été")');
      return;
    }
    setGenerating(true);
    try {
      const r = await adminFetchRaw('/api/admin/seo/generate', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'new_article',
          topic: topic.trim(),
          destinationSlug: destinationSlug || undefined,
          desiredAngle: desiredAngle.trim() || undefined,
          persist: true,
        }),
      });

      // On lit en text d'abord pour pouvoir afficher l'erreur même si
      // la réponse n'est pas du JSON (timeout Vercel = page HTML d'erreur).
      const text = await r.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // Réponse non-JSON : probablement un timeout/crash serverless.
        throw new Error(
          `Réponse non-JSON (HTTP ${r.status}). ` +
          `Vérifiez ANTHROPIC_API_KEY sur Vercel et les logs de la function. ` +
          `Extrait : ${text.slice(0, 200)}`,
        );
      }

      if (!r.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      setLastGeneration(json.generation);
      setTopic('');
      setDesiredAngle('');
      await fetchArticles();
      // Ouvre immédiatement le preview du nouveau brouillon
      if (json.article?.id) {
        openPreview(json.article.id);
      }
    } catch (e: any) {
      setFormError(e?.message || 'Erreur de génération');
    } finally {
      setGenerating(false);
    }
  }

  async function openPreview(id: string) {
    setLoadingPreview(true);
    try {
      const json = await adminFetch<{ ok: boolean; article: ArticleFull }>(
        `/api/admin/seo/articles/${encodeURIComponent(id)}`,
      );
      setPreviewing(json.article);
    } catch (e: any) {
      alert(`Impossible de charger l'article : ${e?.message || 'Erreur'}`);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer définitivement le brouillon « ${title} » ?`)) return;
    try {
      const r = await adminFetchRaw(`/api/admin/seo/articles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      if (previewing?.id === id) setPreviewing(null);
      await fetchArticles();
    } catch (e: any) {
      alert(`Suppression impossible : ${e?.message || 'Erreur'}`);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-300" />
          <h1 className="text-xl font-semibold text-white">Console SEO</h1>
        </div>
        <p className="text-sm text-white/55 max-w-2xl">
          Génère des articles éditoriaux pour vos destinations via l&apos;agent Claude. Les
          brouillons sont stockés en base, vous pourrez les éditer et publier depuis cette page
          (publication arrive dans la prochaine itération).
        </p>
      </header>

      {/* Formulaire de génération */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-300" />
          Nouvel article
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Sujet / mot-clé cible" hint="ex: « Chef privé Saint-Tropez villa été »">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Saint-Tropez villa été"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>

          <Field label="Destination de référence" hint="Hydrate le contexte éditorial">
            <select
              value={destinationSlug}
              onChange={(e) => setDestinationSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
            >
              <option value="">— Aucune (texte libre) —</option>
              {frDestinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} ({d.slug})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Angle éditorial souhaité (optionnel)" hint="ex: focus yacht, profil mère-fille, soirée corporate">
          <textarea
            value={desiredAngle}
            onChange={(e) => setDesiredAngle(e.target.value)}
            rows={2}
            placeholder="Optionnel — précisez si vous voulez un angle particulier"
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
          />
        </Field>

        {formError && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {formError}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-white/45">
            Génération synchrone (~20–40s). Coût typique : 0,02 – 0,05 € par article.
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center px-5 py-2 rounded-xl bg-sky-400 text-sky-950 font-medium hover:bg-sky-300 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {generating ? 'Génération en cours…' : 'Générer un brouillon'}
          </button>
        </div>

        {lastGeneration && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/65 grid grid-cols-2 md:grid-cols-5 gap-2">
            <span>Modèle : <strong className="text-white/90">{lastGeneration.model}</strong></span>
            <span>Input : {lastGeneration.inputTokens.toLocaleString('fr-FR')} tok.</span>
            <span>Output : {lastGeneration.outputTokens.toLocaleString('fr-FR')} tok.</span>
            <span>Cache hit : {lastGeneration.cacheReadTokens.toLocaleString('fr-FR')} tok.</span>
            <span className="text-emerald-200">
              Coût : {lastGeneration.costEur.toFixed(4)} €
            </span>
          </div>
        )}
      </section>

      {/* Liste des articles */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white inline-flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/55" />
            Articles ({articles.length})
          </h2>
          <button
            onClick={fetchArticles}
            disabled={loadingList}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingList ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </header>

        {loadingList ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : articles.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/45">
            Aucun article pour le moment. Générez-en un avec le formulaire ci-dessus.
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {articles.map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    {a.ai_generated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-400/25 bg-sky-400/15 text-sky-200">
                        IA
                      </span>
                    )}
                    {a.category && (
                      <span className="text-[10px] text-white/45">{a.category}</span>
                    )}
                    {a.ai_cost_eur != null && (
                      <span className="text-[10px] text-white/45">
                        {Number(a.ai_cost_eur).toFixed(4)} €
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/90 truncate mt-0.5">{a.title}</div>
                  <div className="text-[11px] text-white/45 mt-0.5">
                    /{a.slug}
                    {a.target_destination_slug && ` · → ${a.target_destination_slug}`}
                    {' · '}
                    {new Date(a.updated_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => openPreview(a.id)}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/85"
                    title="Aperçu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {a.status !== 'published' && (
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      className="p-1.5 rounded-lg border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 text-red-200"
                      title="Supprimer le brouillon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal preview */}
      {(previewing || loadingPreview) && (
        <PreviewModal
          article={previewing}
          loading={loadingPreview}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}

function PreviewModal({
  article,
  loading,
  onClose,
}: {
  article: ArticleFull | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-3xl bg-[#0f0f10] border border-white/10 rounded-2xl shadow-2xl max-h-[96vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0f0f10]/95 backdrop-blur z-10">
          <h3 className="text-base font-semibold text-white inline-flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-300" />
            Aperçu
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            Fermer
          </button>
        </div>

        {loading || !article ? (
          <div className="px-5 py-10 text-center text-white/55">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : (
          <article className="px-5 py-5 space-y-4 text-stone-200">
            <header className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-white/45">
                {article.category || 'Article'} · /{article.slug}
              </div>
              <h1 className="text-2xl font-semibold text-white">{article.title}</h1>
              {article.subtitle && (
                <p className="text-white/70">{article.subtitle}</p>
              )}
            </header>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/55 space-y-0.5">
              <div><span className="text-white/45">Meta title :</span> {article.meta_title || '—'}</div>
              <div><span className="text-white/45">Meta description :</span> {article.meta_description || '—'}</div>
              {article.target_destination_slug && (
                <div><span className="text-white/45">Destination liée :</span> {article.target_destination_slug}</div>
              )}
            </div>

            <div className="space-y-3 text-[15px] leading-relaxed">
              {(article.blocks || []).map((b, i) => {
                if (b.type === 'h2') {
                  return <h2 key={i} className="text-xl font-semibold text-white mt-4">{String(b.content)}</h2>;
                }
                if (b.type === 'h3') {
                  return <h3 key={i} className="text-lg font-semibold text-white/95 mt-3">{String(b.content)}</h3>;
                }
                if (b.type === 'list') {
                  const items = Array.isArray(b.content) ? b.content : [String(b.content)];
                  return (
                    <ul key={i} className="list-disc pl-5 space-y-1 text-stone-300">
                      {items.map((it, j) => <li key={j}>{it}</li>)}
                    </ul>
                  );
                }
                if (b.type === 'quote') {
                  return (
                    <blockquote key={i} className="border-l-2 border-sky-400/40 pl-4 italic text-white/80">
                      {String(b.content)}
                    </blockquote>
                  );
                }
                return <p key={i} className="text-stone-300">{String(b.content)}</p>;
              })}
            </div>

            {article.faqs && article.faqs.length > 0 && (
              <section className="mt-6 border-t border-white/10 pt-4 space-y-3">
                <h2 className="text-lg font-semibold text-white">Questions fréquentes</h2>
                {article.faqs.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <div className="font-medium text-white/95">{f.question}</div>
                    <div className="text-sm text-stone-300">{f.answer}</div>
                  </div>
                ))}
              </section>
            )}
          </article>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-white/55 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-white/35 mt-0.5">{hint}</span>}
    </label>
  );
}
