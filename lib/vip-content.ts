// lib/vip-content.ts
// Source de vérité pour le contenu VIP éditable (depuis l'admin).
// Stocké dans Supabase (table app_settings, key='vip_content').
// Fallback sur DEFAULT_VIP_CONTENT si la table est vide ou inaccessible.

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { Pillar } from '@/lib/vip-guides';

const VALID_PILLARS = ['metier', 'business', 'marque', 'humain'] as const;
type ValidPillar = typeof VALID_PILLARS[number];

function isValidPillar(v: unknown): v is ValidPillar {
  return typeof v === 'string' && (VALID_PILLARS as readonly string[]).includes(v);
}

export type VipTip = {
  id: string;
  title: string;
  desc: string;
  /**
   * URL externe ou interne (commençant par /). Optionnel.
   * Si interne et que le slug correspond à un guide, le pilier est dérivé du guide.
   */
  href?: string;
  /**
   * Pilier explicite (utile pour les placeholders "à venir" sans href interne).
   * Si absent, on essaie de le déduire du href interne. Si rien ne matche, le tip
   * est rangé dans une section "Autres" en fin de page.
   */
  pillar?: Pillar;
};

export type VipContent = {
  /** URL du groupe privé (WhatsApp/Telegram). Vide = section affiche "lien envoyé par email". */
  groupUrl: string;
  /** URL Calendly pour le call de positionnement (gated 12 mois). */
  calendlyUrl: string;
  /** Liste des tips/e-books exclusifs affichés sur /chef/vip. */
  tips: VipTip[];
};

export const VIP_CONTENT_KEY = 'vip_content';

/**
 * Defaults : 14 tips répartis dans les 4 piliers.
 * Les 6 premiers pointent vers les guides écrits, les 8 autres sont des
 * placeholders "à venir" qui marquent la structure dès aujourd'hui.
 */
export const DEFAULT_VIP_CONTENT: VipContent = {
  groupUrl: '',
  calendlyUrl: 'https://calendly.com/contact-chefstalents/30min',
  tips: [
    // ─── Pilier 1 : Le métier ────────────────────────────────────────────────
    {
      id: 'tip-metier-1',
      pillar: 'metier',
      title: 'Yacht, villa, chalet : adapter sa cuisine et son rythme',
      desc: 'Trois environnements voisins, trois logiques opposées. Choisir son terrain dominant.',
      href: '/chef/vip/guides/yacht-villa-chalet',
    },
    {
      id: 'tip-metier-2',
      pillar: 'metier',
      title: 'Tisser son réseau de fournisseurs locaux en Europe',
      desc: 'Construire en quatre jours un sourcing solide sur une destination que vous ne connaissez pas.',
      href: '/chef/vip/guides/reseau-fournisseurs-europe',
    },
    {
      id: 'tip-metier-3',
      pillar: 'metier',
      title: 'La cuisine d’événement privé : un dîner pour 30 dans une villa',
      desc: 'À venir. Logistique, menu, équipe et timing pour les grands services privés.',
    },
    {
      id: 'tip-metier-4',
      pillar: 'metier',
      title: 'Cuisine wellness et régimes médicaux UHNW',
      desc: 'À venir. Cétogène, jeûne intermittent, casher, allergies sévères : tenir le niveau dans la contrainte.',
    },

    // ─── Pilier 2 : Le business ──────────────────────────────────────────────
    {
      id: 'tip-business-1',
      pillar: 'business',
      title: 'Tarifer une mission saisonnière à cinq zéros',
      desc: 'Tenir un tarif net face à un agent expérimenté et sortir avec une marge intacte.',
      href: '/chef/vip/guides/tarifer-mission-saisonniere',
    },
    {
      id: 'tip-business-2',
      pillar: 'business',
      title: 'Le brief client en huit questions, avant d’accepter',
      desc: 'Les questions précises qu’un chef installé pose avant d’engager sa signature.',
      href: '/chef/vip/guides/brief-client-huit-questions',
    },
    {
      id: 'tip-business-3',
      pillar: 'business',
      title: 'Le contrat chef privé : les clauses qui protègent vraiment',
      desc: 'À venir. Périmètre, paiement, rupture, RC pro : ce qui doit figurer noir sur blanc.',
    },
    {
      id: 'tip-business-4',
      pillar: 'business',
      title: 'Encaisser proprement : factures, retenues, soldes impayés',
      desc: 'À venir. Le cycle de facturation d’un chef privé saisonnier, et la procédure de relance.',
    },

    // ─── Pilier 3 : La marque ────────────────────────────────────────────────
    {
      id: 'tip-marque-1',
      pillar: 'marque',
      title: 'Bâtir un menu signature reproductible, qui se vend et qui dure',
      desc: 'Le menu signature comme actif commercial, pas comme manifeste créatif.',
      href: '/chef/vip/guides/menu-signature',
    },
    {
      id: 'tip-marque-2',
      pillar: 'marque',
      title: 'Le dossier de presse du chef privé',
      desc: 'À venir. Ce que les médias attendent, et comment le présenter sans avoir un attaché de presse.',
    },
    {
      id: 'tip-marque-3',
      pillar: 'marque',
      title: 'Instagram pour chef privé dans le segment UHNW',
      desc: 'À venir. Ce qui marche et ce qui dessert. Cadrer un compte sans tomber dans la mode food.',
    },

    // ─── Pilier 4 : L’humain ─────────────────────────────────────────────────
    {
      id: 'tip-humain-1',
      pillar: 'humain',
      title: 'Gérer un client difficile pendant une mission longue',
      desc: 'Tenir la qualité, protéger votre énergie, sortir avec votre tarif et votre santé intacts.',
      href: '/chef/vip/guides/gerer-client-difficile-mission-longue',
    },
    {
      id: 'tip-humain-2',
      pillar: 'humain',
      title: 'Travailler avec un agent ou une conciergerie',
      desc: 'À venir. La relation à entretenir, les attentes implicites, les pièges des contrats triangulaires.',
    },
    {
      id: 'tip-humain-3',
      pillar: 'humain',
      title: 'La carrière du chef privé sur dix ans : les choix qui paient',
      desc: 'À venir. Les bifurcations stratégiques observées sur trois générations de chefs privés.',
    },
  ],
};

/** Validation/sanitisation d'un VipContent venant du JSON DB ou d'un body PUT. */
export function sanitizeVipContent(raw: unknown): VipContent {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;

  const groupUrl = typeof obj.groupUrl === 'string' ? obj.groupUrl.trim() : '';
  const calendlyUrl =
    typeof obj.calendlyUrl === 'string' && obj.calendlyUrl.trim()
      ? obj.calendlyUrl.trim()
      : DEFAULT_VIP_CONTENT.calendlyUrl;

  const rawTips = Array.isArray(obj.tips) ? obj.tips : [];
  const tips: VipTip[] = rawTips
    .map((t: any, idx: number): VipTip | null => {
      if (!t || typeof t !== 'object') return null;
      const title = typeof t.title === 'string' ? t.title.trim() : '';
      const desc = typeof t.desc === 'string' ? t.desc.trim() : '';
      if (!title && !desc) return null;
      const id = typeof t.id === 'string' && t.id ? t.id : `tip-${idx + 1}`;
      const href =
        typeof t.href === 'string' && t.href.trim()
          ? t.href.trim()
          : undefined;
      const pillar = isValidPillar(t.pillar) ? (t.pillar as Pillar) : undefined;
      return { id, title, desc, href, pillar };
    })
    .filter((t): t is VipTip => t !== null);

  return { groupUrl, calendlyUrl, tips };
}

/**
 * Lit la config VIP depuis Supabase. Fallback DEFAULT si erreur ou absence.
 * Server-side uniquement.
 */
export async function getVipContent(): Promise<VipContent> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', VIP_CONTENT_KEY)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_VIP_CONTENT;
    }
    return sanitizeVipContent(data.value);
  } catch (e) {
    console.error('[vip-content] read failed', e);
    return DEFAULT_VIP_CONTENT;
  }
}

/**
 * Upsert la config VIP. Server-side uniquement.
 * Sanitise le payload avant écriture.
 */
export async function setVipContent(raw: unknown): Promise<VipContent> {
  const clean = sanitizeVipContent(raw);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: VIP_CONTENT_KEY, value: clean }, { onConflict: 'key' });

  if (error) {
    console.error('[vip-content] write failed', error);
    throw error;
  }
  return clean;
}
