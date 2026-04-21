'use client';

import { useRouter } from 'next/navigation';

type Props = {
  currentLang: 'fr' | 'en';
  frSlug: string;
  enSlug: string;
};

export function LangSwitcher({ currentLang, frSlug, enSlug }: Props) {
  const router = useRouter();

  return (
    <div className="inline-flex items-center rounded-full border border-white/30 overflow-hidden">
      <button
        onClick={() => currentLang !== 'fr' && router.push(`/destinations/${frSlug}`)}
        className={`px-4 py-1.5 text-xs font-medium tracking-wide transition ${
          currentLang === 'fr'
            ? 'bg-white text-[#161616]'
            : 'text-white/70 hover:text-white'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => currentLang !== 'en' && router.push(`/destinations/${enSlug}`)}
        className={`px-4 py-1.5 text-xs font-medium tracking-wide transition ${
          currentLang === 'en'
            ? 'bg-white text-[#161616]'
            : 'text-white/70 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
