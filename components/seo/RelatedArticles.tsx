// components/seo/RelatedArticles.tsx
// Server Component qui affiche un bloc d'articles liés en bas d'une page.
// Si `currentSlug` est fourni, l'article correspondant est exclu.
// Si `categoryHint` est fourni, on priorise les articles de la même catégorie.
//
// Sert deux objectifs SEO :
//  1. Cross-linking destinations → articles (boost autorité topique)
//  2. Garde le visiteur sur le site (lower bounce rate)

import Link from 'next/link';
import { articles } from '@/data/articles';

export function RelatedArticles({
  currentSlug,
  categoryHint,
  title = 'À lire ensuite',
  max = 3,
}: {
  currentSlug?: string;
  categoryHint?: string;
  title?: string;
  max?: number;
}) {
  const pool = articles.filter((a) => a.slug !== currentSlug);

  // Priorise même catégorie, puis fallback aléatoire dans le pool
  const sameCat = categoryHint
    ? pool.filter((a) => a.category === categoryHint)
    : [];
  const others = pool.filter((a) => !sameCat.includes(a));
  const picked = [...sameCat, ...others].slice(0, max);

  if (picked.length === 0) return null;

  return (
    <section className="border-t border-stone-200 bg-white px-6 md:px-12 py-20">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-3">
          Le journal
        </p>
        <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-10">
          {title}
        </h2>

        <ul className="grid md:grid-cols-3 gap-8">
          {picked.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/insights/${a.slug}`}
                className="group block space-y-3"
              >
                <div className="aspect-[4/3] overflow-hidden bg-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.image}
                    alt={a.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400">
                  {a.category}
                </p>
                <h3 className="text-lg font-serif text-stone-900 leading-snug group-hover:underline underline-offset-4 decoration-stone-300">
                  {a.title}
                </h3>
                <p className="text-sm text-stone-500 font-light line-clamp-2">
                  {a.subtitle}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/insights"
            className="inline-flex items-center text-sm font-medium text-stone-900 hover:underline underline-offset-4"
          >
            Tous les articles →
          </Link>
        </div>
      </div>
    </section>
  );
}
