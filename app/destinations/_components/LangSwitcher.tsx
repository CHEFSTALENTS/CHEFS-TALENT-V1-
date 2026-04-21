'use client';

import { useRouter } from 'next/navigation';

type Props = {
  currentLang: 'fr' | 'en' | 'es';
  frSlug: string;
  enSlug: string;
  esSlug?: string;
};

export function LangSwitcher({ currentLang, frSlug, enSlug, esSlug }: Props) {
  const router = useRouter();

  const langs = [
    { code: 'fr', slug: frSlug, label: 'FR' },
    { code: 'en', slug: enSlug, label: 'EN' },
    ...(esSlug ? [{ code: 'es', slug: esSlug, label: 'ES' }] : []),
  ] as const;

  return (
    <div className="inline-flex items-center rounded-full border border-white/30 overflow-hidden">
      {langs.map((l, i) => (
        <button
          key={l.code}
          onClick={() => l.code !== currentLang && router.push(`/destinations/${l.slug}`)}
          className={[
            'px-4 py-1.5 text-xs font-medium tracking-wide transition',
            i > 0 ? 'border-l border-white/20' : '',
            l.code === currentLang
              ? 'bg-white text-[#161616] cursor-default'
              : 'text-white/70 hover:text-white hover:bg-white/10',
          ].join(' ')}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
