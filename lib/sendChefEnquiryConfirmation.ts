import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TRANSLATIONS = {
  en: {
    subject: 'Your application — Chefs Talents Private Chef Network',
    greeting: (name: string) => `Hi ${name},`,
    p1: "Thank you for reaching out about our integration programme.",
    p2: "We've received your details and will come back to you within 24 hours.",
    box_title: 'What to expect',
    box_items: ['A short exchange to learn more about your background', 'Details on our integration programme and how it works', 'If it\'s a fit, access to our active roster for summer 2026'],
    p3: 'We currently have active demand in Ibiza, Saint-Tropez and Mykonos — so timing is good.',
    sign: 'Speak soon,',
  },
  fr: {
    subject: 'Votre candidature — Réseau Chefs Talents',
    greeting: (name: string) => `Bonjour ${name},`,
    p1: "Merci de nous avoir contactés au sujet de notre programme d'intégration.",
    p2: "Nous avons bien reçu votre candidature et vous recontacterons sous 24 heures.",
    box_title: 'Ce qui va se passer',
    box_items: ['Un court échange pour en savoir plus sur votre parcours', 'Les détails de notre programme d\'intégration', 'Si votre profil correspond, accès à notre réseau actif pour l\'été 2026'],
    p3: 'Nous avons actuellement une forte demande à Ibiza, Saint-Tropez et Mykonos — le timing est parfait.',
    sign: 'À très vite,',
  },
  es: {
    subject: 'Su solicitud — Red Chefs Talents',
    greeting: (name: string) => `Hola ${name},`,
    p1: "Gracias por contactarnos sobre nuestro programa de integración.",
    p2: "Hemos recibido sus datos y nos pondremos en contacto con usted en 24 horas.",
    box_title: 'Qué esperar',
    box_items: ['Un breve intercambio para conocer mejor su trayectoria', 'Detalles sobre nuestro programa de integración', 'Si encaja, acceso a nuestro roster activo para el verano 2026'],
    p3: 'Actualmente tenemos alta demanda en Ibiza, Saint-Tropez y Mykonos — el momento es perfecto.',
    sign: 'Hasta pronto,',
  },
};

export async function sendChefEnquiryConfirmation({
  email,
  firstName,
  lang = 'en',
}: {
  email: string;
  firstName?: string;
  lang?: string;
}) {
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] ?? TRANSLATIONS.en;
  const name = firstName || 'Chef';

  await resend.emails.send({
    from: 'Thomas — Chefs Talents <thomas@chefstalents.com>',
    to: email,
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 32px;">

    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 40px;">
      CHEFS TALENTS
    </p>

    <h1 style="font-size:28px;font-weight:normal;color:#161616;margin:0 0 24px;line-height:1.3;">
      ${t.greeting(name)}
    </h1>

    <p style="font-size:16px;line-height:1.8;color:#59544d;margin:0 0 16px;">
      ${t.p1}
    </p>
    <p style="font-size:16px;line-height:1.8;color:#59544d;margin:0 0 32px;">
      ${t.p2}
    </p>

    <div style="background:#161616;border-radius:16px;padding:28px 32px;margin:0 0 32px;">
      <p style="color:#8a7f73;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">
        ${t.box_title}
      </p>
      ${t.box_items.map(item => `
      <p style="color:#ffffff;font-size:15px;line-height:1.7;margin:0 0 8px;">
        → ${item}
      </p>`).join('')}
    </div>

    <p style="font-size:16px;line-height:1.8;color:#59544d;margin:0 0 40px;">
      ${t.p3}
    </p>

    <div style="border-top:1px solid #d8d1c7;padding-top:32px;">
      <p style="font-size:15px;color:#59544d;margin:0 0 4px;">${t.sign}</p>
      <p style="font-size:16px;color:#161616;font-weight:bold;margin:0 0 4px;">Thomas Delcroix</p>
      <p style="font-size:13px;color:#8a7f73;margin:0 0 4px;">Chefs Talents</p>
      <p style="font-size:13px;color:#8a7f73;margin:0;">+33 7 56 82 76 12 · chefstalents.com/chef</p>
    </div>

  </div>
</body>
</html>`,
  });
}
