// lib/articles-store.ts
//
// Source unifiée d'articles pour /insights et /insights/[slug].
// Lit la table Supabase `articles` (status='published') et la merge avec
// le legacy statique `data/articles.ts`. Si un slug existe dans les deux,
// la DB l'emporte (pour pouvoir réécrire un article legacy si besoin).
//
// Utilisé côté serveur uniquement (lit via service_role pour bypass RLS,
// même si une policy SELECT publique existe — on évite la dépendance à
// la session anon dans le SSR).

import { createClient } from '@supabase/supabase-js';
import { articles as legacyArticles, type Article } from '../data/articles';

type DbArticleRow = {
  id: string;
  slug: string;
  locale: string;
  category: string | null;
  title: string;
  subtitle: string | null;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  image_alt: string | null;
  blocks: any;
  faqs: any;
  target_destination_slug: string | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format&fit=crop';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function dbRowToArticle(row: DbArticleRow): Article {
  return {
    id: `db:${row.id}`,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || '',
    date: row.published_at
      ? new Date(row.published_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : new Date(row.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    publishedAt: row.published_at || row.created_at,
    category: row.category || 'Destinations',
    image: row.image_url || FALLBACK_IMAGE,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    faqs: Array.isArray(row.faqs) && row.faqs.length > 0 ? row.faqs : undefined,
    // Si l'article DB est lié à une destination, on cible cette page.
    // Sinon, fallback générique sur /request.
    relatedLink: row.target_destination_slug
      ? `/destinations/${row.target_destination_slug}`
      : '/request?type=private',
    relatedLinkText: row.target_destination_slug
      ? 'Voir la destination'
      : 'Soumettre une demande',
  };
}

/**
 * Renvoie l'article correspondant au slug, en cherchant d'abord en DB
 * (articles publiés) puis dans le legacy statique. Renvoie null si rien.
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) {
      console.error('[articles-store] DB lookup failed', error.message);
    } else if (data) {
      return dbRowToArticle(data as DbArticleRow);
    }
  } catch (e: any) {
    // Si Supabase n'est pas configuré (env locale incomplète), on tombe
    // sur le legacy. Ne pas casser le build.
    console.error('[articles-store] DB unavailable, fallback legacy', e?.message);
  }

  const legacy = legacyArticles.find((a) => a.slug === slug);
  return legacy ?? null;
}

/**
 * Renvoie la liste mergée : articles DB publiés (les plus récents en tête)
 * + articles legacy qui n'ont pas de doublon de slug en DB.
 */
export async function getAllPublishedArticles(): Promise<Article[]> {
  let dbArticles: Article[] = [];
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) {
      console.error('[articles-store] DB list failed', error.message);
    } else if (data) {
      dbArticles = (data as DbArticleRow[]).map(dbRowToArticle);
    }
  } catch (e: any) {
    console.error('[articles-store] DB unavailable for list', e?.message);
  }

  const dbSlugs = new Set(dbArticles.map((a) => a.slug));
  const legacyFiltered = legacyArticles.filter((a) => !dbSlugs.has(a.slug));
  return [...dbArticles, ...legacyFiltered];
}

/**
 * Renvoie tous les slugs publiés (legacy + DB) pour `generateStaticParams`.
 * Tolère l'absence de DB (renvoie au moins le legacy).
 */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const set = new Set<string>(legacyArticles.map((a) => a.slug));
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('articles')
      .select('slug')
      .eq('status', 'published');
    if (data) {
      for (const r of data as { slug: string }[]) set.add(r.slug);
    }
  } catch {
    // ignore — on garde au moins le legacy
  }
  return [...set];
}
