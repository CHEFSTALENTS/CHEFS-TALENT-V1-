// lib/email/sendChefChangeEmailVerification.ts
//
// Envoie un email au NOUVEL email du chef pour qu'il confirme le changement.
// Le lien contient un token HMAC qui expire en 24h.
//
// Sécurité : on n'envoie PAS l'ancien email — le nouveau doit prouver qu'il
// a accès à la boîte avant d'effectuer le swap.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

function esc(s: string) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendChefChangeEmailVerification(input: {
  newEmail: string;
  oldEmail: string;
  firstName?: string;
  verifyUrl: string;
  locale?: 'fr' | 'en' | 'es';
}) {
  const locale = input.locale || 'fr';

  const t = {
    fr: {
      subject: 'Confirme ton nouvel email — Chefs Talents',
      hello: `Bonjour ${input.firstName || ''}`.trim() + ',',
      lead: `Tu as demandé à changer l'email de ton compte Chefs Talents de`,
      from: `<strong>${esc(input.oldEmail)}</strong> à <strong>${esc(input.newEmail)}</strong>.`,
      cta: 'Confirmer ce nouvel email',
      note: 'Ce lien expire dans 24 heures. Si tu n\'es pas à l\'origine de cette demande, ignore simplement cet email — ton ancien email reste actif.',
      footer: 'Chefs Talents · contact@chefstalents.com',
    },
    en: {
      subject: 'Confirm your new email — Chefs Talents',
      hello: `Hi ${input.firstName || ''}`.trim() + ',',
      lead: `You requested to change your Chefs Talents account email from`,
      from: `<strong>${esc(input.oldEmail)}</strong> to <strong>${esc(input.newEmail)}</strong>.`,
      cta: 'Confirm new email',
      note: 'This link expires in 24 hours. If you did not request this change, simply ignore this email — your previous email stays active.',
      footer: 'Chefs Talents · contact@chefstalents.com',
    },
    es: {
      subject: 'Confirma tu nuevo email — Chefs Talents',
      hello: `Hola ${input.firstName || ''}`.trim() + ',',
      lead: `Has solicitado cambiar el email de tu cuenta Chefs Talents de`,
      from: `<strong>${esc(input.oldEmail)}</strong> a <strong>${esc(input.newEmail)}</strong>.`,
      cta: 'Confirmar nuevo email',
      note: 'Este enlace expira en 24 horas. Si no has solicitado este cambio, ignora este correo — tu email anterior sigue activo.',
      footer: 'Chefs Talents · contact@chefstalents.com',
    },
  }[locale];

  const txt = [
    t.hello,
    '',
    `${t.lead} ${input.oldEmail} → ${input.newEmail}.`,
    '',
    `${t.cta}: ${input.verifyUrl}`,
    '',
    t.note,
    '',
    '—',
    t.footer,
  ].join('\n');

  const html = `
<div style="background:#f7f6f3;padding:32px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;">
    <div style="padding:28px 28px 18px;border-bottom:1px solid #f0efec;">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8a29e;margin-bottom:10px;">Chefs Talents</div>
      <div style="font-size:24px;line-height:1.25;color:#0c0a09;font-family:ui-serif,Georgia,serif;">${esc(t.subject)}</div>
    </div>
    <div style="padding:24px 28px;color:#44403c;font-size:14px;line-height:1.65;">
      <p style="margin:0 0 14px 0;">${esc(t.hello)}</p>
      <p style="margin:0 0 14px 0;">${esc(t.lead)} ${t.from}</p>
      <div style="margin:22px 0;">
        <a href="${esc(input.verifyUrl)}" style="display:inline-block;background:#0c0a09;color:#fff;text-decoration:none;padding:12px 22px;font-size:14px;letter-spacing:0.04em;">${esc(t.cta)}</a>
      </div>
      <p style="margin:18px 0 0 0;color:#78716c;font-size:12px;">${esc(t.note)}</p>
    </div>
    <div style="padding:14px 28px;border-top:1px solid #f0efec;color:#a8a29e;font-size:12px;">${esc(t.footer)}</div>
  </div>
</div>`.trim();

  const result = await resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: input.newEmail,
    replyTo: 'Chefs Talents <contact@chefstalents.com>',
    subject: t.subject,
    text: txt,
    html,
  });

  if ((result as any)?.error) {
    console.error('[sendChefChangeEmailVerification] Resend error:', (result as any).error);
    throw new Error(`Resend change-email send failed: ${JSON.stringify((result as any).error)}`);
  }

  return result;
}
