// lib/email/sendVipWelcome.ts
// Email envoyé au chef après activation VIP (paiement Stripe ou grant admin).

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Thomas — Chefs Talents <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

type Locale = 'fr' | 'en' | 'es';

const T: Record<
  Locale,
  {
    subject: string;
    greeting: (name: string) => string;
    p1: (planLabel: string) => string;
    p1Comp: (planLabel: string) => string;
    p2: string;
    bulletsTitle: string;
    bullets: string[];
    callIncluded: string;
    cta: string;
    p3: string;
    sign: string;
  }
> = {
  fr: {
    subject: '🎉 Bienvenue dans le réseau Chef VIP — Chefs Talents',
    greeting: (name) => `Bonjour ${name},`,
    p1: (planLabel) =>
      `Votre abonnement <strong>${planLabel}</strong> est actif. Bienvenue dans le réseau VIP Chefs Talents.`,
    p1Comp: (planLabel) =>
      `Nous vous offrons un accès <strong>${planLabel}</strong> au réseau VIP Chefs Talents. À utiliser sans modération.`,
    p2:
      'À partir de maintenant, vous bénéficiez de la priorité sur les missions, des guides exclusifs et des ressources réservées aux chefs membres.',
    bulletsTitle: 'Ce qui vous attend',
    bullets: [
      'Accès au canal WhatsApp VIP — missions proposées en priorité',
      '4 guides par mois (tarification, codes clients, gestion de mission, business)',
      'Accès à votre espace VIP avec toutes les ressources',
    ],
    callIncluded:
      'Votre engagement 12 mois inclut un call de positionnement de 30 min avec Thomas. Le lien Calendly est dans votre espace VIP.',
    cta: 'Accéder à mon espace VIP →',
    p3:
      'Le lien du groupe WhatsApp Last Minute vous sera envoyé par email sous 24h après vérification de votre profil.',
    sign: 'À très vite,\nThomas',
  },
  en: {
    subject: '🎉 Welcome to the VIP Chef network — Chefs Talents',
    greeting: (name) => `Hi ${name},`,
    p1: (planLabel) =>
      `Your <strong>${planLabel}</strong> subscription is now active. Welcome to the Chefs Talents VIP network.`,
    p1Comp: (planLabel) =>
      `We are offering you <strong>${planLabel}</strong> access to the Chefs Talents VIP network. Enjoy.`,
    p2:
      'From now on, you have priority on missions, exclusive guides and resources reserved for member chefs.',
    bulletsTitle: 'What awaits you',
    bullets: [
      'Access to the VIP WhatsApp channel — missions sent in priority',
      '4 guides per month (pricing, client codes, mission management, business)',
      'Access to your VIP space with all resources',
    ],
    callIncluded:
      'Your 12-month commitment includes a 30-min positioning call with Thomas. The Calendly link is in your VIP space.',
    cta: 'Open my VIP space →',
    p3:
      'The Last Minute WhatsApp group link will be sent to you by email within 24h after profile verification.',
    sign: 'Speak soon,\nThomas',
  },
  es: {
    subject: '🎉 Bienvenido a la red Chef VIP — Chefs Talents',
    greeting: (name) => `Hola ${name},`,
    p1: (planLabel) =>
      `Su suscripción <strong>${planLabel}</strong> está activa. Bienvenido a la red VIP de Chefs Talents.`,
    p1Comp: (planLabel) =>
      `Le ofrecemos un acceso <strong>${planLabel}</strong> a la red VIP de Chefs Talents. Disfrute.`,
    p2:
      'A partir de ahora, tiene prioridad en las misiones, las guías exclusivas y los recursos reservados a los chefs miembros.',
    bulletsTitle: 'Lo que le espera',
    bullets: [
      'Acceso al canal WhatsApp VIP — misiones enviadas con prioridad',
      '4 guías al mes (tarificación, códigos cliente, gestión de misión, business)',
      'Acceso a su espacio VIP con todos los recursos',
    ],
    callIncluded:
      'Su compromiso 12 meses incluye una llamada de posicionamiento de 30 min con Thomas. El enlace Calendly está en su espacio VIP.',
    cta: 'Acceder a mi espacio VIP →',
    p3:
      'El enlace del grupo WhatsApp Last Minute se le enviará por email en 24h tras la verificación del perfil.',
    sign: 'Hasta pronto,\nThomas',
  },
};

const PLAN_LABELS: Record<string, Record<Locale, string>> = {
  vip_3m: {
    fr: 'VIP 3 mois',
    en: 'VIP 3 months',
    es: 'VIP 3 meses',
  },
  vip_6m: {
    fr: 'VIP 6 mois',
    en: 'VIP 6 months',
    es: 'VIP 6 meses',
  },
  vip_12m: {
    fr: 'VIP 12 mois',
    en: 'VIP 12 months',
    es: 'VIP 12 meses',
  },
};

export async function sendVipWelcome(opts: {
  email: string;
  firstName?: string;
  planKey: string;
  isComplimentary: boolean;
  locale?: Locale;
}) {
  const locale: Locale =
    opts.locale === 'fr' || opts.locale === 'en' || opts.locale === 'es'
      ? opts.locale
      : 'fr';
  const t = T[locale];
  const name = (opts.firstName || '').trim() || 'Chef';
  const planLabel =
    PLAN_LABELS[opts.planKey]?.[locale] || opts.planKey || 'VIP';

  const intro = opts.isComplimentary ? t.p1Comp(planLabel) : t.p1(planLabel);
  const includesCall = opts.planKey === 'vip_12m';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">

    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 40px;">
      CHEFS TALENTS · CHEF VIP
    </p>

    <h1 style="font-size:28px;font-weight:normal;color:#161616;margin:0 0 24px;line-height:1.3;">
      ${t.greeting(name)}
    </h1>

    <p style="font-size:16px;line-height:1.8;color:#3f3a34;margin:0 0 16px;">
      ${intro}
    </p>

    <p style="font-size:16px;line-height:1.8;color:#59544d;margin:0 0 28px;">
      ${t.p2}
    </p>

    <div style="border:1px solid #e2dccf;background:#ffffff;padding:24px;margin:0 0 28px;">
      <p style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#8a7f73;margin:0 0 12px;">
        ${t.bulletsTitle}
      </p>
      <ul style="margin:0;padding:0;list-style:none;">
        ${t.bullets
          .map(
            (b) => `
        <li style="font-size:15px;line-height:1.6;color:#3f3a34;margin:0 0 10px;padding-left:20px;position:relative;">
          <span style="position:absolute;left:0;top:0;color:#8a7f73;">•</span>${b}
        </li>`,
          )
          .join('')}
      </ul>
    </div>

    ${
      includesCall
        ? `<div style="border-left:3px solid #d4b96a;background:#faf6ec;padding:16px 20px;margin:0 0 28px;">
            <p style="font-size:14px;line-height:1.6;color:#5c4a18;margin:0;">
              ✦ ${t.callIncluded}
            </p>
           </div>`
        : ''
    }

    <p style="margin:0 0 28px;">
      <a href="${SITE_URL}/chef/vip" style="display:inline-block;background:#161616;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:14px;letter-spacing:0.05em;">
        ${t.cta}
      </a>
    </p>

    <p style="font-size:13px;line-height:1.7;color:#8a7f73;margin:0 0 32px;font-style:italic;">
      ${t.p3}
    </p>

    <p style="font-size:14px;line-height:1.7;color:#3f3a34;margin:32px 0 0;white-space:pre-line;">
      ${t.sign}
    </p>

    <p style="font-size:11px;color:#a8a29e;margin:48px 0 0;border-top:1px solid #e2dccf;padding-top:24px;">
      Chefs Talents · ${SITE_URL}
    </p>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: opts.email,
    subject: t.subject,
    html,
  });
}
