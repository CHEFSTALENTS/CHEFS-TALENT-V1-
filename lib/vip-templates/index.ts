// lib/vip-templates/index.ts
// Registry des templates téléchargeables VIP. Pour ajouter un template :
//  1. Crée un fichier dans _templates/[slug].ts qui exporte une const VipTemplate
//  2. Importe-le ici et ajoute-le à ALL_TEMPLATES

import type { VipTemplate, TemplateLocale } from './types';
import { devisMissionSaisonniere } from './_templates/devis-mission-saisonniere';
import { briefClient } from './_templates/brief-client';
import { ficheFournisseur } from './_templates/fiche-fournisseur';
import { scriptNegociation } from './_templates/script-negociation';
import { emailRelanceSolde } from './_templates/email-relance-solde';
import { contratMission } from './_templates/contrat-mission';

export type { VipTemplate, TemplateBlock, TemplateLocale } from './types';

const ALL_TEMPLATES: VipTemplate[] = [
  devisMissionSaisonniere,
  briefClient,
  contratMission,
  scriptNegociation,
  emailRelanceSolde,
  ficheFournisseur,
];

export const TEMPLATES: Record<string, VipTemplate> = ALL_TEMPLATES.reduce(
  (acc, t) => {
    acc[t.slug] = t;
    return acc;
  },
  {} as Record<string, VipTemplate>,
);

export function getTemplate(slug: string): VipTemplate | null {
  return TEMPLATES[slug] ?? null;
}

export function listTemplates(): VipTemplate[] {
  return ALL_TEMPLATES.slice();
}

export function getTemplateTranslation(t: VipTemplate, locale: string) {
  const safe: TemplateLocale =
    locale === 'en' ? 'en' : locale === 'fr' ? 'fr' : 'fr';
  return { content: t[safe], locale: safe };
}
