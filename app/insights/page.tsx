import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Section, Reveal, Marker, Label } from '../../components/ui';
import { articles } from '../../data/articles';
import { ArrowRight } from 'lucide-react';
import { Layout } from '../../components/Layout';

const SITE_URL = 'https://chefstalents.com';

export const metadata: Metadata = {
  title: 'Guides Chef Privé : villas, yachts, destinations & logistique',
  description:
    "Guides et analyses pour engager un chef privé en Europe : Côte d'Azur, Ibiza, Monaco, Sardaigne, Courchevel, yachts, villas, résidences UHNW.",
  alternates: { canonical: `${SITE_URL}/insights` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/insights`,
    title: 'Guides Chef Privé — villas, yachts, destinations',
    description:
      "Guides pour engager un chef privé en Europe : villas, yachts, chalets, résidences UHNW.",
    images: [`${SITE_URL}/images/editorial/hero-chef-talents.jpg`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guides Chef Privé — Chefs Talents',
    description: 'Guides chef privé par destination et type de mission.',
    images: [`${SITE_URL}/images/editorial/hero-chef-talents.jpg`],
  },
};

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Le Journal Chefs Talents',
  url: `${SITE_URL}/insights`,
  description:
    "Guides et analyses pour engager un chef privé en Europe — villas, yachts, chalets, résidences UHNW.",
  publisher: {
    '@type': 'Organization',
    name: 'Chefs Talents',
    url: SITE_URL,
  },
};

export default function InsightsPage() {
  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <div className="pt-40 pb-24 px-6 md:px-12 bg-stone-50 border-b border-stone-200">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Marker className="mx-auto" />
          <Label>Le Journal</Label>
          <h1 className="text-4xl md:text-6xl font-serif text-stone-900 leading-tight">
            Guides Chef Privé : villas, yachts, destinations &amp; logistique
          </h1>
          <p className="text-xl text-stone-500 font-light max-w-2xl mx-auto">
            Analyses et guides pratiques pour engager un chef privé — Côte d'Azur, Ibiza, Monaco, Sardaigne, Courchevel, yachts, résidences UHNW.
          </p>
        </div>
      </div>

      <Section>
        <div className="grid md:grid-cols-1 gap-16 max-w-5xl mx-auto">
          {articles.map((post, index) => (
            <Reveal key={post.id} delay={index * 0.1}>
              <Link href={`/insights/${post.slug}`} className="group block">
                <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start border-b border-stone-100 pb-16">

                  {/* Image Column */}
                  <div className="md:col-span-5 order-2 md:order-1">
                    <div className="aspect-[4/3] bg-stone-200 w-full overflow-hidden">
                       <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Text Column */}
                  <div className="md:col-span-7 order-1 md:order-2 space-y-6">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-900">{post.category}</span>
                      <span className="w-8 h-px bg-stone-200"></span>
                      <span className="text-xs text-stone-400 uppercase tracking-widest">{post.date}</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-serif text-stone-900 leading-tight group-hover:underline decoration-1 underline-offset-8 decoration-stone-300">
                      {post.title}
                    </h2>

                    <p className="text-stone-500 text-lg font-light leading-relaxed">
                      {post.subtitle}
                    </p>

                    <div className="pt-4 flex items-center text-xs font-medium uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-900 transition-colors">
                      Lire l'article <ArrowRight className="ml-4 w-3 h-3 transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>

                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </Layout>
  );
}
