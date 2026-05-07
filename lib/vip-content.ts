// lib/vip-content.ts
// Source de vérité pour le contenu VIP éditable (depuis l'admin).
// Stocké dans Supabase (table app_settings, key='vip_content').
// Fallback sur DEFAULT_VIP_CONTENT si la table est vide ou inaccessible.

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export type VipTip = {
  id: string;
  title: string;
  desc: string;
  /** URL externe (PDF, Notion, Google Doc, etc.). Optionnel — vide = card non cliquable. */
  href?: string;
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

export const DEFAULT_VIP_CONTENT: VipContent = {
  groupUrl: '',
  calendlyUrl: 'https://calendly.com/contact-chefstalents/30min',
  tips: [
    {
      id: 'tip-1',
      title: 'Tarifer une mission saisonnière à 5 zéros sans baisser de garde',
      desc: 'La méthode pour construire un tarif qui se défend face à un agent et qui sécurise une mission de 4 à 12 semaines.',
      href: '/chef/vip/guides/tarifer-mission-saisonniere',
    },
    {
      id: 'tip-2',
      title: 'Checklist pré-mission yacht (à venir)',
      desc: "Tout ce qu'il faut vérifier 7 jours avant un embarquement charter.",
    },
    {
      id: 'tip-3',
      title: '10 erreurs des chefs qui perdent leurs clients UHNW (à venir)',
      desc: 'Les pièges relationnels et opérationnels à éviter en mission privée.',
    },
    {
      id: 'tip-4',
      title: 'Modèle de devis chef privé FR/EN (à venir)',
      desc: 'Un template propre pour répondre à un brief conciergerie.',
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
      return { id, title, desc, href };
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
