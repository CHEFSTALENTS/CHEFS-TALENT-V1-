// lib/email/_helpers.ts
// Helpers communs aux emails Resend pour améliorer la délivrabilité.
//  - htmlToText : version plain-text propre dérivée du HTML
//  - buildUnsubscribeHeaders : List-Unsubscribe / List-Unsubscribe-Post
//
// Pourquoi : Gmail et Outlook 2024+ flag en spam les emails sans alternative
// texte ni header de désabonnement. Tous nos envois doivent les inclure.

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

/**
 * Convertit un HTML email en plain-text raisonnable.
 * Gère : sauts de paragraphe, tirets pour <li>, conservation des liens
 * sous la forme "label (url)", normalisation des espaces.
 *
 * Pas un parseur complet — calibré pour les HTML que nos templates
 * produisent. Suffisant pour l'usage anti-spam.
 */
export function htmlToText(html: string): string {
  if (!html) return '';
  let s = String(html);

  // Décode quelques entités fréquentes
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·');

  // Liens : transforme <a href="X">label</a> en "label (X)"
  s = s.replace(
    /<a\s+[^>]*href\s*=\s*"([^"]+)"[^>]*>(.*?)<\/a>/gis,
    (_m, href, label) => {
      const cleanLabel = String(label).replace(/<[^>]+>/g, '').trim();
      if (!cleanLabel) return href;
      if (cleanLabel === href) return href;
      return `${cleanLabel} (${href})`;
    },
  );

  // Sauts de ligne pour blocs structurants
  s = s
    .replace(/<\/(p|div|h[1-6]|tr|li|br|blockquote)\s*>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<li\s*>/gi, '— ')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<table[^>]*>/gi, '\n')
    .replace(/<\/table\s*>/gi, '\n');

  // Strip toutes les autres balises
  s = s.replace(/<[^>]+>/g, '');

  // Normalise les espaces
  s = s
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return s;
}

/**
 * Headers List-Unsubscribe + List-Unsubscribe-Post conformes RFC 8058.
 *
 * @param to Email du destinataire (utilisé pour signer le lien one-click)
 * @param category Catégorie d'email (utile pour des préférences fines plus tard)
 */
export function buildUnsubscribeHeaders(
  to: string,
  category: 'vip' | 'boost' | 'broadcast' | 'transactional' = 'transactional',
): Record<string, string> {
  const email = encodeURIComponent(to.trim().toLowerCase());
  const cat = encodeURIComponent(category);
  const oneClickUrl = `${SITE_URL}/api/unsubscribe?email=${email}&c=${cat}`;
  const mailtoAddr = 'unsubscribe@chefstalents.com';

  return {
    'List-Unsubscribe': `<mailto:${mailtoAddr}?subject=Unsubscribe>, <${oneClickUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/**
 * Footer texte court à ajouter en fin de version plain-text.
 * Inclut un lien de désinscription clair, lisible par les filtres anti-spam.
 */
export function unsubscribeFooterText(
  to: string,
  category: 'vip' | 'boost' | 'broadcast' | 'transactional' = 'transactional',
  locale: 'fr' | 'en' | 'es' = 'fr',
): string {
  const email = encodeURIComponent(to.trim().toLowerCase());
  const cat = encodeURIComponent(category);
  const url = `${SITE_URL}/api/unsubscribe?email=${email}&c=${cat}`;

  if (locale === 'en') {
    return `\n\n---\nYou received this email as a member of Chefs Talents.\nUnsubscribe: ${url}\nChefs Talents — Bordeaux, France`;
  }
  if (locale === 'es') {
    return `\n\n---\nUsted ha recibido este correo como miembro de Chefs Talents.\nDarse de baja: ${url}\nChefs Talents — Burdeos, Francia`;
  }
  return `\n\n---\nVous recevez cet email en tant que membre Chefs Talents.\nSe désinscrire : ${url}\nChefs Talents — Bordeaux, France`;
}

/**
 * HTML court à injecter en fin de footer email pour la conformité visible.
 * Discret, gris, sans soulignement criard.
 */
export function unsubscribeFooterHtml(
  to: string,
  category: 'vip' | 'boost' | 'broadcast' | 'transactional' = 'transactional',
  locale: 'fr' | 'en' | 'es' = 'fr',
): string {
  const email = encodeURIComponent(to.trim().toLowerCase());
  const cat = encodeURIComponent(category);
  const url = `${SITE_URL}/api/unsubscribe?email=${email}&c=${cat}`;

  const lines: Record<typeof locale, { intro: string; cta: string }> = {
    fr: {
      intro: 'Vous recevez cet email en tant que membre Chefs Talents.',
      cta: 'Se désinscrire',
    },
    en: {
      intro: 'You received this email as a member of Chefs Talents.',
      cta: 'Unsubscribe',
    },
    es: {
      intro: 'Recibió este correo como miembro de Chefs Talents.',
      cta: 'Darse de baja',
    },
  };
  const l = lines[locale];

  return `<p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#a1a1aa;line-height:1.5;">${l.intro} <a href="${url}" style="color:#71717a;text-decoration:underline;">${l.cta}</a></p>`;
}
