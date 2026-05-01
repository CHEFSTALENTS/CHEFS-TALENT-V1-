// lib/destinations-metadata-patch.ts
import type { Metadata } from 'next';

const BASE_URL = 'https://chefstalents.com';

const SLUG_HREFLANG: Record<string, { fr: string; en: string; es: string }> = {
  'chef-prive-ibiza':          { fr: 'chef-prive-ibiza',        en: 'private-chef-ibiza',        es: 'chef-privado-ibiza' },
  'chef-prive-saint-tropez':   { fr: 'chef-prive-saint-tropez', en: 'private-chef-saint-tropez', es: 'chef-privado-saint-tropez' },
  'chef-prive-monaco':         { fr: 'chef-prive-monaco',       en: 'private-chef-monaco',       es: 'chef-privado-monaco' },
  'chef-prive-mykonos':        { fr: 'chef-prive-mykonos',      en: 'private-chef-mykonos',      es: 'chef-privado-mykonos' },
  'chef-prive-courchevel':     { fr: 'chef-prive-courchevel',   en: 'private-chef-courchevel',   es: 'chef-privado-courchevel' },
  'chef-prive-cannes':         { fr: 'chef-prive-cannes',       en: 'private-chef-cannes',       es: 'chef-privado-cannes' },
  'chef-prive-cap-ferrat':     { fr: 'chef-prive-cap-ferrat',   en: 'private-chef-cap-ferrat',   es: 'chef-privado-cap-ferrat' },
  'chef-prive-marbella':       { fr: 'chef-prive-marbella',     en: 'private-chef-marbella',     es: 'chef-privado-marbella' },
  'private-chef-ibiza':        { fr: 'chef-prive-ibiza',        en: 'private-chef-ibiza',        es: 'chef-privado-ibiza' },
  'private-chef-saint-tropez': { fr: 'chef-prive-saint-tropez', en: 'private-chef-saint-tropez', es: 'chef-privado-saint-tropez' },
  'private-chef-monaco':       { fr: 'chef-prive-monaco',       en: 'private-chef-monaco',       es: 'chef-privado-monaco' },
  'private-chef-mykonos':      { fr: 'chef-prive-mykonos',      en: 'private-chef-mykonos',      es: 'chef-privado-mykonos' },
  'private-chef-courchevel':   { fr: 'chef-prive-courchevel',   en: 'private-chef-courchevel',   es: 'chef-privado-courchevel' },
  'private-chef-cannes':       { fr: 'chef-prive-cannes',       en: 'private-chef-cannes',       es: 'chef-privado-cannes' },
  'private-chef-cap-ferrat':   { fr: 'chef-prive-cap-ferrat',   en: 'private-chef-cap-ferrat',   es: 'chef-privado-cap-ferrat' },
  'private-chef-marbella':     { fr: 'chef-prive-marbella',     en: 'private-chef-marbella',     es: 'chef-privado-marbella' },
  'chef-privado-ibiza':        { fr: 'chef-prive-ibiza',        en: 'private-chef-ibiza',        es: 'chef-privado-ibiza' },
  'chef-privado-saint-tropez': { fr: 'chef-prive-saint-tropez', en: 'private-chef-saint-tropez', es: 'chef-privado-saint-tropez' },
  'chef-privado-monaco':       { fr: 'chef-prive-monaco',       en: 'private-chef-monaco',       es: 'chef-privado-monaco' },
  'chef-privado-mykonos':      { fr: 'chef-prive-mykonos',      en: 'private-chef-mykonos',      es: 'chef-privado-mykonos' },
  'chef-privado-marbella':     { fr: 'chef-prive-marbella',     en: 'private-chef-marbella',     es: 'chef-privado-marbella' },
  'chef-privado-cannes':       { fr: 'chef-prive-cannes',       en: 'private-chef-cannes',       es: 'chef-privado-cannes' },
};

export function generateDestinationMetadata(
  slug: string,
  title: string,
  description: string
): Metadata {
  const hreflang = SLUG_HREFLANG[slug];
  const canonical = `${BASE_URL}/destinations/${slug}`;

  const alternates: Metadata['alternates'] = {
    canonical,
  };

  if (hreflang) {
    alternates.languages = {
      'fr': `${BASE_URL}/destinations/${hreflang.fr}`,
      'en': `${BASE_URL}/destinations/${hreflang.en}`,
      'es': `${BASE_URL}/destinations/${hreflang.es}`,
      'x-default': `${BASE_URL}/destinations/${hreflang.en}`,
    };
  }

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Chefs Talents',
      locale: slug.startsWith('private-') ? 'en_GB'
             : slug.startsWith('chef-privado-') ? 'es_ES'
             : 'fr_FR',
      type: 'website',
    },
  };
}
