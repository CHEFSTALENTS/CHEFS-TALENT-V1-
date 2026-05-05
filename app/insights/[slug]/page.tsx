import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section, Reveal, Marker, Button, Label } from '../../../components/ui';
import { articles } from '../../../data/articles';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Layout } from '../../../components/Layout';

const SITE_URL = 'https://chefstalents.com';

function toAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function truncate(str: string, max = 160): string {
  const s = (str ?? '').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return { title: 'Article introuvable' };

  const url = `${SITE_URL}/insights/${article.slug}`;
  const description = truncate(article.subtitle, 160);
  const image = toAbsoluteUrl(article.image);

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: article.title,
      description,
      images: image ? [{ url: image, alt: article.title }] : undefined,
      section: article.category,
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function InsightPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) notFound();

  const url = `${SITE_URL}/insights/${article.slug}`;
  const image = toAbsoluteUrl(article.image);

  const sameCategory = articles.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  );
  const fallback = articles.filter(
    (a) => a.slug !== article.slug && a.category !== article.category,
  );
  const related = [...sameCategory, ...fallback].slice(0, 3);

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: truncate(article.subtitle, 160),
    image: image || undefined,
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    articleSection: article.category,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'Chefs Talents', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Chefs Talents',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/editorial/hero-chef-talents.jpg`,
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE_URL}/insights` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="bg-paper min-h-screen pt-32 pb-24">
        {/* Editorial Header */}
        <section className="px-6 md:px-12 max-w-4xl mx-auto text-center mb-24">
          <Reveal>
            <div className="flex items-center justify-center gap-4 mb-8">
              <Link
                href="/insights"
                className="text-xs uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors"
              >
                Journal
              </Link>
              <span className="text-stone-300">/</span>
              <span className="text-xs uppercase tracking-[0.2em] text-stone-900">
                {article.category}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif text-stone-900 leading-[1.1] mb-8">
              {article.title}
            </h1>

            <p className="text-xl md:text-2xl text-stone-500 font-light leading-relaxed max-w-2xl mx-auto">
              {article.subtitle}
            </p>
          </Reveal>
        </section>

        {/* Hero Image */}
        <Reveal delay={0.2} className="px-6 md:px-12 max-w-[100rem] mx-auto mb-24">
          <div className="aspect-[21/9] w-full overflow-hidden bg-stone-200">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[2s] ease-in-out"
            />
          </div>
        </Reveal>

        {/* Content Body */}
        <Section className="py-0 md:py-0">
          <div className="max-w-2xl mx-auto">
            {article.blocks.map((block, index) => {
              switch (block.type) {
                case 'paragraph':
                  return (
                    <Reveal key={index} delay={0.1}>
                      <p className="text-lg md:text-xl text-stone-600 font-light leading-relaxed mb-8">
                        {block.content}
                      </p>
                    </Reveal>
                  );

                case 'h2':
                  return (
                    <Reveal key={index} delay={0.1} className="mt-16 mb-8">
                      <Marker className="h-8 mb-6" />
                      <h2 className="text-3xl md:text-4xl font-serif text-stone-900">
                        {block.content}
                      </h2>
                    </Reveal>
                  );

                case 'h3':
                  return (
                    <Reveal key={index} delay={0.1}>
                      <h3 className="text-2xl font-serif text-stone-800 mt-12 mb-6">
                        {block.content}
                      </h3>
                    </Reveal>
                  );

                case 'list':
                  return (
                    <Reveal key={index} delay={0.1}>
                      <ul className="mb-12 space-y-4 border-t border-b border-stone-200 py-8 my-8">
                        {(block.content as string[]).map((item, i) => (
                          <li key={i} className="flex items-start gap-4">
                            <span className="text-stone-300 font-serif italic">
                              {i + 1}.
                            </span>
                            <span className="text-stone-700 font-light text-lg">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  );

                case 'quote':
                  return (
                    <Reveal key={index} delay={0.1}>
                      <blockquote className="my-16 pl-8 border-l-2 border-stone-900">
                        <p className="text-2xl md:text-3xl font-serif text-stone-900 italic leading-tight">
                          "{block.content}"
                        </p>
                      </blockquote>
                    </Reveal>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </Section>

        {/* Articles liés — maillage interne */}
        {related.length > 0 && (
          <section className="px-6 md:px-12 max-w-3xl mx-auto mt-32">
            <Label className="mb-8">À lire aussi</Label>
            <ul className="border-t border-stone-200 divide-y divide-stone-100">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/insights/${r.slug}`}
                    className="group flex items-baseline justify-between gap-8 py-6 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400 block mb-2">
                        {r.category}
                      </span>
                      <h3 className="text-lg md:text-xl font-serif text-stone-900 group-hover:underline decoration-1 underline-offset-4 decoration-stone-300">
                        {r.title}
                      </h3>
                    </div>
                    <ArrowRight className="w-3 h-3 text-stone-400 flex-shrink-0 transition-transform group-hover:translate-x-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <section className="bg-stone-50 py-32 mt-32 px-6 text-center border-t border-stone-200">
          <Reveal>
            <Label className="mb-8">Étape suivante</Label>

            <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-12">
              Élevez vos standards.
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link href="/insights">
                <Button variant="outline" className="w-48">
                  <ArrowLeft className="mr-4 w-4 h-4" />
                  Journal
                </Button>
              </Link>

              <Link href={article.relatedLink}>
                <Button className="w-64 bg-stone-900 text-white">
                  {article.relatedLinkText}
                </Button>
              </Link>
            </div>
          </Reveal>
        </section>
      </article>
    </Layout>
  );
}
