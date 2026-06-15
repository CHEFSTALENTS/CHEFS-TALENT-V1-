// app/admin/seo/page.tsx
//
// Console SEO admin — génération d'articles via l'agent Claude.
// PR1 : mode "nouvel article". Le bouton "Publier" sera ajouté dans PR2.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Sparkles,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  PenSquare,
  Globe,
  Archive,
  ExternalLink,
  CalendarClock,
  Plus,
  RotateCw,
  Languages,
} from 'lucide-react';
import { adminFetch, adminFetchRaw } from '@/lib/adminFetch';
import { destinations } from '@/lib/destinations';
import { AdminModal } from '@/app/admin/_components/AdminModal';

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

type SeoTopic = {
  id: string;
  topic: string;
  mode: 'new_article' | 'improve_destination';
  destination_slug: string | null;
  desired_angle: string | null;
  priority: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  generated_article_id: string | null;
  error: string | null;
  processed_at: string | null;
  created_at: string;
  generated?: { slug: string; title: string; status: string } | null;
};

const TOPIC_STATUS_LABEL: Record<SeoTopic['status'], string> = {
  pending: 'En attente',
  processing: 'En cours',
  done: 'Généré',
  failed: 'Échec',
};

const TOPIC_STATUS_CLASS: Record<SeoTopic['status'], string> = {
  pending: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
  processing: 'bg-sky-400/15 text-sky-200 border-sky-400/25',
  done: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
  failed: 'bg-red-400/15 text-red-200 border-red-400/25',
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

type GenerationMode = 'new_article' | 'improve_destination';

export default function AdminSeoPage() {
  // Form state
  const [mode, setMode] = useState<GenerationMode>('new_article');
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

  // Edit modal
  const [editing, setEditing] = useState<ArticleFull | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Per-row publish state
  const [busyId, setBusyId] = useState<string | null>(null);

  // Backlog topics
  const [topics, setTopics] = useState<SeoTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicBusyId, setTopicBusyId] = useState<string | null>(null);
  const [autoGenerating, setAutoGenerating] = useState(false);

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

  const fetchTopics = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const json = await adminFetch<{ ok: boolean; topics: SeoTopic[] }>(
        '/api/admin/seo/topics?limit=100',
      );
      setTopics(json.topics || []);
    } catch (e: any) {
      console.error('[admin/seo] fetch topics', e);
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchTopics();
  }, [fetchArticles, fetchTopics]);

  async function deleteTopic(id: string, topic: string) {
    if (!confirm(`Retirer du backlog : « ${topic} » ?`)) return;
    setTopicBusyId(id);
    try {
      const r = await adminFetchRaw(`/api/admin/seo/topics?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await fetchTopics();
    } catch (e: any) {
      alert(`Suppression impossible : ${e?.message}`);
    } finally {
      setTopicBusyId(null);
    }
  }

  async function autoGenerateTopics() {
    if (!confirm(
      'Demander à Claude 15 nouveaux topics SEO stratégiques ?\n\n' +
      'Claude analysera les topics et articles existants pour éviter les doublons, ' +
      'et tiendra compte de la saisonnalité courante. ~10-20s, coût ~0,01-0,03 €.',
    )) return;
    setAutoGenerating(true);
    try {
      const r = await adminFetchRaw('/api/admin/seo/topics/generate-batch', {
        method: 'POST',
        body: JSON.stringify({ count: 15 }),
      });
      const text = await r.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {
        throw new Error(`Réponse non-JSON (HTTP ${r.status}). ${text.slice(0, 200)}`);
      }
      if (!r.ok || !json?.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      alert(
        `✓ ${json.insertedCount} topics ajoutés au backlog ` +
        `(${json.skippedDuplicates} doublons ignorés, coût ${json.generation?.costEur?.toFixed(4)} €).`,
      );
      await fetchTopics();
    } catch (e: any) {
      alert(`Échec : ${e?.message || 'Erreur'}`);
    } finally {
      setAutoGenerating(false);
    }
  }

  async function retryTopic(id: string) {
    setTopicBusyId(id);
    try {
      const r = await adminFetchRaw(`/api/admin/seo/topics`, {
        method: 'PATCH',
        body: JSON.stringify({ id, status: 'pending' }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      await fetchTopics();
    } catch (e: any) {
      alert(`Reset impossible : ${e?.message}`);
    } finally {
      setTopicBusyId(null);
    }
  }

  async function handleGenerate() {
    setFormError(null);
    if (mode === 'new_article' && !topic.trim()) {
      setFormError('Indique un sujet (ex: "Saint-Tropez villa été")');
      return;
    }
    if (mode === 'improve_destination' && !destinationSlug) {
      setFormError('Choisis une destination à approfondir.');
      return;
    }
    setGenerating(true);
    try {
      const payload =
        mode === 'improve_destination'
          ? {
              mode: 'improve_destination',
              destinationSlug,
              desiredAngle: desiredAngle.trim() || undefined,
              persist: true,
            }
          : {
              mode: 'new_article',
              topic: topic.trim(),
              destinationSlug: destinationSlug || undefined,
              desiredAngle: desiredAngle.trim() || undefined,
              persist: true,
            };
      const r = await adminFetchRaw('/api/admin/seo/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
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

  async function openEdit(id: string) {
    setLoadingEdit(true);
    try {
      const json = await adminFetch<{ ok: boolean; article: ArticleFull }>(
        `/api/admin/seo/articles/${encodeURIComponent(id)}`,
      );
      setEditing(json.article);
    } catch (e: any) {
      alert(`Impossible de charger l'article : ${e?.message || 'Erreur'}`);
    } finally {
      setLoadingEdit(false);
    }
  }

  async function patchArticle(id: string, patch: Record<string, any>) {
    const r = await adminFetchRaw(`/api/admin/seo/articles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    const text = await r.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {
      throw new Error(`Réponse non-JSON (HTTP ${r.status}). ${text.slice(0, 200)}`);
    }
    if (!r.ok || !json?.ok) {
      throw new Error(json?.error || `HTTP ${r.status}`);
    }
    return json.article;
  }

  async function handlePublishToggle(article: ArticleListItem) {
    const goingLive = article.status !== 'published';
    const message = goingLive
      ? `Publier « ${article.title} » sur /insights/${article.slug} ?`
      : `Dépublier « ${article.title} » (l'article ne sera plus visible publiquement) ?`;
    if (!confirm(message)) return;
    setBusyId(article.id);
    try {
      await patchArticle(article.id, { status: goingLive ? 'published' : 'draft' });
      await fetchArticles();
    } catch (e: any) {
      alert(`Échec : ${e?.message || 'Erreur'}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleTranslate(article: ArticleListItem) {
    if (article.locale !== 'fr') {
      alert('La traduction n\'est disponible que pour les articles FR.');
      return;
    }
    if (!confirm(
      `Générer la version EN de « ${article.title} » ?\n\n` +
      `Claude va traduire et adapter le SEO (slug EN, meta EN, FAQs EN). ` +
      `~60-90s. Coût ~0,04-0,07 €.\n\n` +
      `La traduction sera créée en brouillon — vous pourrez la review/publier ensuite.`,
    )) return;
    setBusyId(article.id);
    try {
      const r = await adminFetchRaw(
        `/api/admin/seo/articles/${encodeURIComponent(article.id)}/translate`,
        {
          method: 'POST',
          body: JSON.stringify({ targetLocale: 'en' }),
        },
      );
      const text = await r.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {
        throw new Error(`Réponse non-JSON (HTTP ${r.status}). ${text.slice(0, 200)}`);
      }
      if (!r.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }
      await fetchArticles();
      if (json.article?.id) {
        openPreview(json.article.id);
      }
    } catch (e: any) {
      alert(`Échec de la traduction : ${e?.message || 'Erreur'}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleArchive(article: ArticleListItem) {
    if (article.status === 'published') {
      alert('Dépubliez d\'abord l\'article avant de l\'archiver.');
      return;
    }
    if (!confirm(`Archiver « ${article.title} » ? Il restera en base mais masqué de la liste active.`)) return;
    setBusyId(article.id);
    try {
      await patchArticle(article.id, { status: 'archived' });
      await fetchArticles();
    } catch (e: any) {
      alert(`Échec : ${e?.message || 'Erreur'}`);
    } finally {
      setBusyId(null);
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
          Générer un brouillon
        </h2>

        {/* Sélecteur de mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ModeCard
            active={mode === 'new_article'}
            onClick={() => setMode('new_article')}
            title="Nouvel article"
            description="Article SEO 1500-1800 mots sur un sujet libre (avec destination optionnelle pour contextualiser)."
          />
          <ModeCard
            active={mode === 'improve_destination'}
            onClick={() => setMode('improve_destination')}
            title="Approfondir une destination"
            description="Deep-dive éditorial 1800-2200 mots qui enrichit une page destination existante (Cap-Ferrat, Mégève…). L'article publié maille vers /destinations/[slug]."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mode === 'new_article' && (
            <Field label="Sujet / mot-clé cible" hint="ex: « Chef privé Saint-Tropez villa été »">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Saint-Tropez villa été"
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
              />
            </Field>
          )}

          <Field
            label={mode === 'improve_destination' ? 'Destination à approfondir (obligatoire)' : 'Destination de référence'}
            hint={
              mode === 'improve_destination'
                ? 'L\'article enrichira cette page destination.'
                : 'Hydrate le contexte éditorial (optionnel)'
            }
          >
            <select
              value={destinationSlug}
              onChange={(e) => setDestinationSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
            >
              <option value="">— {mode === 'improve_destination' ? 'Choisir' : 'Aucune (texte libre)'} —</option>
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
            Génération synchrone (~60–120s, soyez patient). Coût : 0,03 – 0,10 € par article selon longueur.
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

      {/* Backlog SEO (cron) */}
      <BacklogSection
        topics={topics}
        loading={loadingTopics}
        busyId={topicBusyId}
        showForm={showTopicForm}
        onToggleForm={() => setShowTopicForm((v) => !v)}
        onRefresh={fetchTopics}
        onAdded={async () => {
          setShowTopicForm(false);
          await fetchTopics();
        }}
        onDelete={deleteTopic}
        onRetry={retryTopic}
        onAutoGenerate={autoGenerateTopics}
        autoGenerating={autoGenerating}
        frDestinations={frDestinations}
      />

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
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/65 font-mono uppercase">
                      {a.locale || 'fr'}
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
                  {a.status === 'published' && (
                    <a
                      href={`/insights/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/85"
                      title="Ouvrir sur le site public"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => openPreview(a.id)}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/85"
                    title="Aperçu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(a.id)}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/85"
                    title="Éditer"
                  >
                    <PenSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePublishToggle(a)}
                    disabled={busyId === a.id}
                    className={
                      a.status === 'published'
                        ? 'p-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 disabled:opacity-50'
                        : 'p-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-200 disabled:opacity-50'
                    }
                    title={a.status === 'published' ? 'Dépublier' : 'Publier'}
                  >
                    {busyId === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </button>
                  {a.locale === 'fr' && a.status === 'published' && (
                    <button
                      onClick={() => handleTranslate(a)}
                      disabled={busyId === a.id}
                      className="p-1.5 rounded-lg border border-indigo-400/30 bg-indigo-400/10 hover:bg-indigo-400/20 text-indigo-200 disabled:opacity-50"
                      title="Traduire en EN"
                    >
                      {busyId === a.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Languages className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {a.status !== 'published' && a.status !== 'archived' && (
                    <button
                      onClick={() => handleArchive(a)}
                      disabled={busyId === a.id}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/65 disabled:opacity-50"
                      title="Archiver"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  {a.status !== 'published' && (
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      className="p-1.5 rounded-lg border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 text-red-200"
                      title="Supprimer définitivement"
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

      {/* Modal edit */}
      {(editing || loadingEdit) && (
        <EditModal
          article={editing}
          loading={loadingEdit}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await fetchArticles();
          }}
          patchArticle={patchArticle}
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
    <AdminModal title="Aperçu" size="lg" onClose={onClose}>
        {loading || !article ? (
          <div className="py-10 text-center text-white/55">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : (
          <article className="space-y-4 text-stone-200">
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
    </AdminModal>
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

function ModeCard({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border px-3 py-3 transition-colors ${
        active
          ? 'border-sky-400/50 bg-sky-400/10'
          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
      }`}
    >
      <div className={`text-sm font-medium ${active ? 'text-sky-100' : 'text-white/90'}`}>
        {title}
      </div>
      <div className={`text-[11px] mt-1 leading-snug ${active ? 'text-sky-100/70' : 'text-white/55'}`}>
        {description}
      </div>
    </button>
  );
}

function EditModal({
  article,
  loading,
  onClose,
  onSaved,
  patchArticle,
}: {
  article: ArticleFull | null;
  loading: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  patchArticle: (id: string, patch: Record<string, any>) => Promise<any>;
}) {
  const [form, setForm] = useState({
    slug: '',
    title: '',
    subtitle: '',
    meta_title: '',
    meta_description: '',
    category: '',
    image_url: '',
    image_alt: '',
    target_destination_slug: '',
    blocks_json: '[]',
    faqs_json: '[]',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setForm({
        slug: article.slug || '',
        title: article.title || '',
        subtitle: article.subtitle || '',
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
        category: article.category || '',
        image_url: (article as any).image_url || '',
        image_alt: (article as any).image_alt || '',
        target_destination_slug: article.target_destination_slug || '',
        blocks_json: JSON.stringify(article.blocks || [], null, 2),
        faqs_json: JSON.stringify(article.faqs || [], null, 2),
      });
      setError(null);
    }
  }, [article?.id]);

  async function save() {
    if (!article) return;
    setError(null);
    setSaving(true);
    try {
      // Validation JSON pour blocks et faqs
      let blocks: any[];
      let faqs: any[];
      try {
        blocks = JSON.parse(form.blocks_json);
        if (!Array.isArray(blocks)) throw new Error('blocks doit être un tableau');
      } catch (e: any) {
        throw new Error(`blocks JSON invalide : ${e?.message}`);
      }
      try {
        faqs = JSON.parse(form.faqs_json);
        if (!Array.isArray(faqs)) throw new Error('faqs doit être un tableau');
      } catch (e: any) {
        throw new Error(`faqs JSON invalide : ${e?.message}`);
      }

      await patchArticle(article.id, {
        slug: form.slug.trim() || undefined,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        meta_title: form.meta_title.trim(),
        meta_description: form.meta_description.trim(),
        category: form.category.trim(),
        image_url: form.image_url.trim(),
        image_alt: form.image_alt.trim(),
        target_destination_slug: form.target_destination_slug.trim(),
        blocks,
        faqs,
      });
      await onSaved();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal
      title="Éditer l'article"
      size="lg"
      onClose={onClose}
      closeOnBackdrop={!saving}
      closeOnEscape={!saving}
      footer={
        !loading && article ? (
          <>
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center px-5 py-2 rounded-xl bg-sky-400 text-sky-950 font-medium hover:bg-sky-300 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenSquare className="w-4 h-4 mr-2" />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        ) : null
      }
    >
        {loading || !article ? (
          <div className="py-10 text-center text-white/55">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Chargement…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Titre" hint="50-60 chars idéalement">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
                />
              </Field>
              <Field label="Slug" hint="kebab-case, attention : changer le slug casse les liens existants">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white font-mono text-xs"
                />
              </Field>
            </div>

            <Field label="Subtitle" hint="15-25 mots, sous le H1 sur la page">
              <textarea
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Meta title (≤ 60 chars)">
                <input
                  type="text"
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
                />
              </Field>
              <Field label="Catégorie">
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Destinations / Saisonnier / Yacht"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
                />
              </Field>
            </div>

            <Field label="Meta description" hint="140-160 chars, balise <meta> Google">
              <textarea
                value={form.meta_description}
                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Image URL (hero)" hint="https://images.unsplash.com/...">
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-mono text-xs"
                />
              </Field>
              <Field label="Image alt (a11y + SEO)">
                <input
                  type="text"
                  value={form.image_alt}
                  onChange={(e) => setForm((f) => ({ ...f, image_alt: e.target.value }))}
                  placeholder="Villa avec chef privé sur la Côte d'Azur"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
                />
              </Field>
            </div>

            <Field label="Destination liée (slug)" hint="ex: chef-prive-saint-tropez — sert au lien CTA + lien interne">
              <input
                type="text"
                value={form.target_destination_slug}
                onChange={(e) => setForm((f) => ({ ...f, target_destination_slug: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white font-mono text-xs"
              />
            </Field>

            <Field
              label="Blocks (JSON)"
              hint="[{ type: 'paragraph'|'h2'|'h3'|'list'|'quote', content: string|string[] }, ...]"
            >
              <textarea
                value={form.blocks_json}
                onChange={(e) => setForm((f) => ({ ...f, blocks_json: e.target.value }))}
                rows={16}
                spellCheck={false}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white font-mono"
              />
            </Field>

            <Field
              label="FAQs (JSON)"
              hint="[{ question: string, answer: string }, ...]"
            >
              <textarea
                value={form.faqs_json}
                onChange={(e) => setForm((f) => ({ ...f, faqs_json: e.target.value }))}
                rows={10}
                spellCheck={false}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white font-mono"
              />
            </Field>

            {error && (
              <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200 whitespace-pre-wrap">
                {error}
              </div>
            )}
          </div>
        )}
    </AdminModal>
  );
}

function BacklogSection({
  topics,
  loading,
  busyId,
  showForm,
  onToggleForm,
  onRefresh,
  onAdded,
  onDelete,
  onRetry,
  onAutoGenerate,
  autoGenerating,
  frDestinations,
}: {
  topics: SeoTopic[];
  loading: boolean;
  busyId: string | null;
  showForm: boolean;
  onToggleForm: () => void;
  onRefresh: () => Promise<void> | void;
  onAdded: () => Promise<void> | void;
  onDelete: (id: string, topic: string) => Promise<void> | void;
  onRetry: (id: string) => Promise<void> | void;
  onAutoGenerate: () => Promise<void> | void;
  autoGenerating: boolean;
  frDestinations: Array<{ slug: string; name: string }>;
}) {
  const pendingCount = topics.filter((t) => t.status === 'pending').length;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-white/55" />
          <h2 className="text-sm font-semibold text-white">
            Backlog SEO ({topics.length})
          </h2>
          {pendingCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/25 bg-amber-400/15 text-amber-200">
              {pendingCount} en attente
            </span>
          )}
          <span className="text-[10px] text-white/40">
            · Cron génération 2x/jour · Auto-refill 1x/jour
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/85 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
          <button
            onClick={onAutoGenerate}
            disabled={autoGenerating}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-indigo-400/30 bg-indigo-400/10 text-xs text-indigo-200 hover:bg-indigo-400/20 disabled:opacity-50"
            title="Demander à Claude 15 nouveaux topics non-redondants"
          >
            {autoGenerating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Auto-générer
          </button>
          <button
            onClick={onToggleForm}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sky-400 text-sky-950 text-xs font-medium hover:bg-sky-300"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Ajouter
          </button>
        </div>
      </header>

      {showForm && <AddTopicForm onAdded={onAdded} frDestinations={frDestinations} />}

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-white/45">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Chargement…
        </div>
      ) : topics.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-white/45">
          Aucun topic dans le backlog. Ajoute des sujets pour que le cron les génère automatiquement.
        </div>
      ) : (
        <ul className="divide-y divide-white/10">
          {topics.map((t) => (
            <li key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TOPIC_STATUS_CLASS[t.status]}`}>
                    {TOPIC_STATUS_LABEL[t.status]}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/55">
                    {t.mode === 'improve_destination' ? 'Approfondir' : 'Nouvel article'}
                  </span>
                  {t.priority !== 0 && (
                    <span className="text-[10px] text-white/45">priorité {t.priority}</span>
                  )}
                </div>
                <div className="text-sm text-white/90 truncate mt-0.5">{t.topic}</div>
                <div className="text-[11px] text-white/45 mt-0.5">
                  {t.destination_slug && `→ ${t.destination_slug}`}
                  {t.desired_angle && ` · ${t.desired_angle.slice(0, 80)}`}
                  {t.processed_at && ` · traité ${new Date(t.processed_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`}
                  {t.generated?.slug && (
                    <>
                      {' · '}
                      <a
                        href={`/insights/${t.generated.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-white/75"
                      >
                        /insights/{t.generated.slug}
                      </a>
                    </>
                  )}
                </div>
                {t.error && (
                  <div className="text-[11px] text-red-200 mt-1">⚠ {t.error}</div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {t.status === 'failed' && (
                  <button
                    onClick={() => onRetry(t.id)}
                    disabled={busyId === t.id}
                    className="p-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 hover:bg-sky-400/20 text-sky-200 disabled:opacity-50"
                    title="Réessayer (remettre en pending)"
                  >
                    {busyId === t.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCw className="w-4 h-4" />
                    )}
                  </button>
                )}
                {t.status !== 'processing' && (
                  <button
                    onClick={() => onDelete(t.id, t.topic)}
                    disabled={busyId === t.id}
                    className="p-1.5 rounded-lg border border-red-400/20 bg-red-400/5 hover:bg-red-400/15 text-red-200 disabled:opacity-50"
                    title="Retirer du backlog"
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
  );
}

function AddTopicForm({
  onAdded,
  frDestinations,
}: {
  onAdded: () => Promise<void> | void;
  frDestinations: Array<{ slug: string; name: string }>;
}) {
  const [mode, setMode] = useState<'new_article' | 'improve_destination'>('new_article');
  const [topic, setTopic] = useState('');
  const [destinationSlug, setDestinationSlug] = useState('');
  const [desiredAngle, setDesiredAngle] = useState('');
  const [priority, setPriority] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (mode === 'new_article' && !topic.trim()) {
      setError('Sujet requis');
      return;
    }
    if (mode === 'improve_destination' && !destinationSlug) {
      setError('Destination requise');
      return;
    }
    setSubmitting(true);
    try {
      const r = await adminFetchRaw('/api/admin/seo/topics', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          topic: topic.trim() || undefined,
          destinationSlug: destinationSlug || undefined,
          desiredAngle: desiredAngle.trim() || undefined,
          priority: Number(priority) || 0,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      setTopic('');
      setDestinationSlug('');
      setDesiredAngle('');
      setPriority('0');
      setMode('new_article');
      await onAdded();
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 py-4 border-b border-white/10 space-y-3 bg-white/[0.02]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <ModeCard
          active={mode === 'new_article'}
          onClick={() => setMode('new_article')}
          title="Nouvel article"
          description="Sujet libre avec destination optionnelle"
        />
        <ModeCard
          active={mode === 'improve_destination'}
          onClick={() => setMode('improve_destination')}
          title="Approfondir destination"
          description="Deep-dive éditorial sur une destination existante"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mode === 'new_article' && (
          <Field label="Sujet">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ex: Chef privé pour dîner CSP+++ à Paris"
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
            />
          </Field>
        )}
        <Field label={mode === 'improve_destination' ? 'Destination (obligatoire)' : 'Destination (optionnel)'}>
          <select
            value={destinationSlug}
            onChange={(e) => setDestinationSlug(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
          >
            <option value="">— {mode === 'improve_destination' ? 'Choisir' : 'Aucune'} —</option>
            {frDestinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name} ({d.slug})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Angle éditorial (optionnel)" hint="Si tu veux orienter le sujet">
        <textarea
          value={desiredAngle}
          onChange={(e) => setDesiredAngle(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
        />
      </Field>

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <Field label="Priorité" hint="0 par défaut, plus élevé = traité en premier">
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-24 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white"
          />
        </Field>
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        <button
          onClick={submit}
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 rounded-xl bg-sky-400 text-sky-950 text-sm font-medium hover:bg-sky-300 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Ajouter au backlog
        </button>
      </div>
    </div>
  );
}
