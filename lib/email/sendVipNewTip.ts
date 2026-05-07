// lib/email/sendVipNewTip.ts
// Email envoyé à tous les chefs VIP actifs quand l'admin ajoute un nouveau tip.

import { Resend } from 'resend';
import type { VipTip } from '@/lib/vip-content';
import { listVipChefs } from './listVipChefs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas — Chefs Talents <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

type Locale = 'fr' | 'en' | 'es';

const T: Record<
  Locale,
  {
    subject: (title: string) => string;
    greeting: (name: string) => string;
    p1: string;
    ctaWithLink: string;
    ctaSpace: string;
    p3: string;
    sign: string;
  }
> = {
  fr: {
    subject: (title) => `🎁 Nouvelle ressource VIP : ${title}`,
    greeting: (name) => `Bonjour ${name},`,
    p1: 'Une nouvelle ressource vient d\'être ajoutée à votre espace VIP.',
    ctaWithLink: 'Ouvrir la ressource →',
    ctaSpace: 'Voir dans mon espace VIP →',
    p3:
      'Toutes les ressources VIP restent disponibles dans votre espace, accessibles à tout moment.',
    sign: 'À très vite,\nThomas',
  },
  en: {
    subject: (title) => `🎁 New VIP resource: ${title}`,
    greeting: (name) => `Hi ${name},`,
    p1: 'A new resource has just been added to your VIP space.',
    ctaWithLink: 'Open the resource →',
    ctaSpace: 'See in my VIP space →',
    p3:
      'All VIP resources remain available in your space, accessible anytime.',
    sign: 'Speak soon,\nThomas',
  },
  es: {
    subject: (title) => `🎁 Nuevo recurso VIP: ${title}`,
    greeting: (name) => `Hola ${name},`,
    p1: 'Acaba de añadirse un nuevo recurso a su espacio VIP.',
    ctaWithLink: 'Abrir el recurso →',
    ctaSpace: 'Ver en mi espacio VIP →',
    p3:
      'Todos los recursos VIP siguen disponibles en su espacio, accesibles en cualquier momento.',
    sign: 'Hasta pronto,\nThomas',
  },
};

function buildHtml(opts: {
  firstName: string;
  tip: VipTip;
  locale: Locale;
}): string {
  const t = T[opts.locale];
  const name = opts.firstName?.trim() || 'Chef';
  const tip = opts.tip;
  const link = tip.href || `${SITE_URL}/chef/vip`;
  const cta = tip.href ? t.ctaWithLink : t.ctaSpace;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">

    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 40px;">
      CHEFS TALENTS · CHEF VIP
    </p>

    <h1 style="font-size:26px;font-weight:normal;color:#161616;margin:0 0 24px;line-height:1.3;">
      ${t.greeting(name)}
    </h1>

    <p style="font-size:16px;line-height:1.8;color:#3f3a34;margin:0 0 28px;">
      ${t.p1}
    </p>

    <div style="border:1px solid #e2dccf;background:#ffffff;padding:28px;margin:0 0 28px;">
      <p style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#8a7f73;margin:0 0 12px;">
        Nouveau guide
      </p>
      <h2 style="font-size:22px;font-weight:normal;color:#161616;margin:0 0 12px;line-height:1.4;">
        ${escapeHtml(tip.title)}
      </h2>
      ${
        tip.desc
          ? `<p style="font-size:15px;line-height:1.7;color:#59544d;margin:0;">${escapeHtml(tip.desc)}</p>`
          : ''
      }
    </div>

    <p style="margin:0 0 32px;">
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#161616;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:14px;letter-spacing:0.05em;">
        ${cta}
      </a>
    </p>

    <p style="font-size:13px;line-height:1.7;color:#8a7f73;margin:0 0 32px;font-style:italic;">
      ${t.p3}
    </p>

    <p style="font-size:14px;line-height:1.7;color:#3f3a34;margin:32px 0 0;white-space:pre-line;">
      ${t.sign}
    </p>

    <p style="font-size:11px;color:#a8a29e;margin:48px 0 0;border-top:1px solid #e2dccf;padding-top:24px;">
      Vous recevez cet email car vous êtes membre VIP Chefs Talents · ${SITE_URL}
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Envoie l'email "nouveau tip VIP" à tous les chefs VIP actifs.
 * Concurrent en parallèle (Resend supporte le rate limit interne).
 * Returns: { sent, failed }
 */
export async function sendVipNewTipToAll(tip: VipTip): Promise<{
  sent: number;
  failed: number;
}> {
  const recipients = await listVipChefs();
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  const subjectByLocale: Record<Locale, string> = {
    fr: T.fr.subject(tip.title),
    en: T.en.subject(tip.title),
    es: T.es.subject(tip.title),
  };

  let sent = 0;
  let failed = 0;

  // Envoi en parallèle, par batches de 20 pour éviter le rate limit
  const BATCH = 20;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((r) =>
        resend.emails.send({
          from: FROM,
          to: r.email,
          subject: subjectByLocale[r.locale] || subjectByLocale.fr,
          html: buildHtml({
            firstName: r.firstName,
            tip,
            locale: r.locale,
          }),
        }),
      ),
    );

    for (const res of results) {
      if (res.status === 'fulfilled') sent++;
      else failed++;
    }
  }

  return { sent, failed };
}
