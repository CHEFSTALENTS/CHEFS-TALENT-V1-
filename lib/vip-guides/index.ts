// lib/vip-guides/index.ts
// Registry des guides VIP. Pour ajouter un guide :
//  1. Crée un fichier dans _guides/[slug].ts qui exporte une const Guide
//  2. Importe-le ici et ajoute-le à ALL_GUIDES
//  3. (Optionnel) référence le slug dans lib/vip-content.ts → DEFAULT_VIP_CONTENT.tips

import type { Guide, GuideLocale } from './types';
import { tarificationMissionSaisonniere } from './_guides/tarification-mission-saisonniere';
import { briefClientHuitQuestions } from './_guides/brief-client-huit-questions';
import { yachtVillaChalet } from './_guides/yacht-villa-chalet';
import { menuSignature } from './_guides/menu-signature';
import { clientDifficileMissionLongue } from './_guides/client-difficile-mission-longue';
import { reseauFournisseursEurope } from './_guides/reseau-fournisseurs-europe';

export type {
  Guide,
  GuideBlock,
  GuideLocale,
  GuideTranslation,
  Pillar,
} from './types';
export { PILLAR_LABELS, PILLAR_ORDER } from './types';

const ALL_GUIDES: Guide[] = [
  tarificationMissionSaisonniere,
  briefClientHuitQuestions,
  yachtVillaChalet,
  menuSignature,
  clientDifficileMissionLongue,
  reseauFournisseursEurope,
];

export const GUIDES: Record<string, Guide> = ALL_GUIDES.reduce(
  (acc, g) => {
    acc[g.slug] = g;
    return acc;
  },
  {} as Record<string, Guide>,
);

export function getGuide(slug: string): Guide | null {
  return GUIDES[slug] ?? null;
}

export function listGuides(): Guide[] {
  return ALL_GUIDES.slice().sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function getGuideTranslation(guide: Guide, locale: string) {
  const safe: GuideLocale =
    locale === 'en' ? 'en' : locale === 'fr' ? 'fr' : 'fr';
  return { content: guide[safe], locale: safe };
}
