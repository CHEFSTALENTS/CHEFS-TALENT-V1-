'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Button } from '../../../../../components/ui';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useChefLocale } from '@/lib/ChefLocaleContext';
import {
  getGuide,
  getGuideTranslation,
  PILLAR_LABELS,
  type GuideBlock,
} from '@/lib/vip-guides';

type ChefProfile = {
  plan?: 'free' | 'pro';
  planStatus?: 'active' | 'past_due' | 'cancelled' | string;
  [key: string]: any;
};

export default function VipGuidePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { t, locale } = useChefLocale();

  const slug = (params?.slug || '') as string;
  const guide = getGuide(slug);

  const [booting, setBooting] = useState(true);
  const [profile, setProfile] = useState<ChefProfile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      const u = data.session?.user ?? null;
      if (!u) {
        router.replace('/chef/login');
        return;
      }
      try {
        const res = await fetch(
          `/api/chef/profile?id=${encodeURIComponent(u.id)}`,
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => null);
        if (alive) setProfile(json?.profile ?? null);
      } catch {
        /* ignore */
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // 404 — slug introuvable
  if (!guide) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/chef/vip"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'en' ? 'Back to VIP space' : 'Retour à mon espace VIP'}
        </Link>
        <div className="border border-stone-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-serif text-stone-900 mb-3">
            {locale === 'en' ? 'Guide not found' : 'Guide introuvable'}
          </h1>
          <p className="text-sm text-stone-500">
            {locale === 'en'
              ? 'This guide does not exist or has been moved.'
              : 'Ce guide n’existe pas ou a été déplacé.'}
          </p>
        </div>
      </div>
    );
  }

  if (booting) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    );
  }

  const isVipActive =
    profile?.plan === 'pro' && profile?.planStatus === 'active';
  const hasEngagement =
    profile?.plan === 'pro' &&
    (profile?.planStatus === 'past_due' || profile?.planStatus === 'cancelled');

  // Gating : seuls les VIP actifs (ou en past_due / cancelled avec engagement encore valide) accèdent
  if (!isVipActive && !hasEngagement) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/chef/vip"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'en' ? 'Back to VIP space' : 'Retour à mon espace VIP'}
        </Link>
        <div className="border border-stone-200 bg-white p-8 md:p-12 text-center">
          <Lock className="w-12 h-12 text-stone-300 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-stone-900 mb-4">
            {locale === 'en' ? 'VIP guide — locked' : 'Guide VIP — verrouillé'}
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto mb-8">
            {locale === 'en'
              ? 'This guide is reserved for VIP members. Join the program to unlock the full library of operational guides for private chefs.'
              : 'Ce guide est réservé aux membres VIP. Rejoignez le programme pour débloquer l’intégralité de la bibliothèque opérationnelle des chefs privés.'}
          </p>
          <Link href="/chef/upgrade">
            <Button className="bg-stone-900 hover:bg-stone-800">
              <Crown className="w-4 h-4 mr-2" />
              {locale === 'en' ? 'Discover VIP' : 'Découvrir le VIP'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { content } = getGuideTranslation(guide, locale);
  const dateLocale = t.availability.dateLocale;
  const publishedLabel = new Date(guide.publishedAt).toLocaleDateString(
    dateLocale,
    { day: 'numeric', month: 'long', year: 'numeric' },
  );
  const readLabel =
    locale === 'en'
      ? `${guide.readingMinutes} min read`
      : `${guide.readingMinutes} min de lecture`;
  const pillarLabel = PILLAR_LABELS[guide.pillar][locale === 'en' ? 'en' : 'fr'];

  return (
    <article className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      {/* Back nav */}
      <Link
        href="/chef/vip"
        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {locale === 'en' ? 'Back to VIP space' : 'Retour à mon espace VIP'}
      </Link>

      {/* Hero image */}
      <div className="overflow-hidden border border-stone-200 bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={guide.heroImage}
          alt=""
          className="w-full h-[280px] md:h-[360px] object-cover"
        />
      </div>

      {/* Meta + title */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
          <span className="px-2 py-0.5 border border-stone-300 uppercase tracking-widest text-[10px] font-semibold text-stone-700">
            {pillarLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {readLabel}
          </span>
          <span>{publishedLabel}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-stone-900 leading-tight">
          {content.title}
        </h1>
        <p className="text-lg text-stone-600 leading-relaxed">
          {content.excerpt}
        </p>
      </header>

      <hr className="border-stone-200" />

      {/* Body */}
      <div className="space-y-6">
        {content.body.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>

      {/* Footer back to VIP */}
      <div className="border-t border-stone-200 pt-8 mt-12">
        <Link
          href="/chef/vip"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-900 hover:text-stone-600 transition-colors"
        >
          {locale === 'en'
            ? 'See all VIP guides'
            : 'Voir tous les guides VIP'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}

function BlockView({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'p':
      return (
        <p className="text-base text-stone-700 leading-[1.75]">{block.text}</p>
      );
    case 'h2':
      return (
        <h2 className="text-2xl font-serif text-stone-900 leading-tight pt-4">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="text-xl font-serif text-stone-900 leading-tight pt-2">
          {block.text}
        </h3>
      );
    case 'ul':
      return (
        <ul className="space-y-2.5 pl-1">
          {block.items.map((it, i) => (
            <li
              key={i}
              className="flex gap-3 text-base text-stone-700 leading-[1.7]"
            >
              <span className="text-[#7f1d1d] mt-2 shrink-0">
                <span className="block w-1.5 h-1.5 rounded-full bg-current" />
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="space-y-2.5 pl-1 counter-reset">
          {block.items.map((it, i) => (
            <li
              key={i}
              className="flex gap-3 text-base text-stone-700 leading-[1.7]"
            >
              <span className="text-[#7f1d1d] font-semibold shrink-0 w-5">
                {i + 1}.
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ol>
      );
    case 'callout': {
      const tone = block.tone ?? 'note';
      const palette =
        tone === 'warning'
          ? {
              bg: 'bg-red-50',
              border: 'border-red-200',
              icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
              text: 'text-red-900',
            }
          : tone === 'success'
            ? {
                bg: 'bg-green-50',
                border: 'border-green-200',
                icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
                text: 'text-green-900',
              }
            : {
                bg: 'bg-stone-50',
                border: 'border-stone-200',
                icon: <Info className="w-4 h-4 text-stone-600" />,
                text: 'text-stone-700',
              };
      return (
        <div
          className={`flex gap-3 border-l-2 border-l-[#7f1d1d] ${palette.bg} ${palette.border} border p-4`}
        >
          <span className="shrink-0 mt-0.5">{palette.icon}</span>
          <p className={`text-sm leading-[1.7] ${palette.text}`}>
            {block.text}
          </p>
        </div>
      );
    }
    case 'quote':
      return (
        <blockquote className="border-l-2 border-stone-900 pl-5 py-2 italic text-lg text-stone-800 leading-relaxed">
          “{block.text}”
          {block.cite && (
            <cite className="block not-italic text-sm text-stone-500 mt-2">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      );
    default:
      return null;
  }
}
