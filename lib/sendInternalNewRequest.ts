// lib/sendInternalNewRequest.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendInternalNewRequest(input: {
  to?: string | string[]; // optionnel (sinon env)
  requestId: string;
  email: string;
  firstName?: string;
  message?: string;
  createdAtISO?: string;
}) {
  // Fallback HARD-CODÉ à contact@chefstalents.com si INTERNAL_NOTIFY_EMAILS
  // est absent → garantit qu'on reçoit TOUJOURS la notif quand un client envoie
  // une demande (cohérent avec lib/email/sendInternalUpsellNotification.ts).
  // ⚠️ Avec des Ads en cours, manquer une notif = potentiellement un lead perdu.
  const envList = (process.env.INTERNAL_NOTIFY_EMAILS || 'contact@chefstalents.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const to = input.to ?? envList;

  if (!to || (Array.isArray(to) && to.length === 0)) {
    // Cas extrême : input.to=[] explicite — on bascule sur le fallback
    console.error('[sendInternalNewRequest] explicit empty to, fallback contact@chefstalents.com');
  }

  const createdAt = input.createdAtISO || new Date().toISOString();

  const subject = `📩 Nouvelle demande (${input.requestId})`;

  const txt = [
    `Nouvelle demande reçue sur Chef Talents`,
    ``,
    `ID: ${input.requestId}`,
    `Client: ${input.firstName || '—'}`,
    `Email: ${input.email}`,
    `Créée: ${createdAt}`,
    ``,
    `Message / brief:`,
    input.message || '—',
    ``,
    `—`,
    `Backoffice: /admin (si tu as)`,
  ].join('\n');

  const html = `
  <div style="background:#f7f6f3;padding:32px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;">
      <div style="padding:28px 28px 18px;border-bottom:1px solid #f0efec;">
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8a29e;margin-bottom:10px;">
          Chef Talents · Notification interne
        </div>
        <div style="font-size:26px;line-height:1.2;color:#0c0a09;font-family:ui-serif,Georgia,serif;">
          Nouvelle demande
        </div>
        <div style="margin-top:10px;font-size:13px;color:#78716c;">
          Reçue le <strong style="color:#44403c;">${escapeHtml(createdAt)}</strong>
        </div>
      </div>

      <div style="padding:22px 28px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#44403c;">
          <tbody>
            <tr>
              <td style="padding:10px 0;color:#a8a29e;width:140px;">ID</td>
              <td style="padding:10px 0;"><strong>${escapeHtml(input.requestId)}</strong></td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#a8a29e;">Client</td>
              <td style="padding:10px 0;">${escapeHtml(input.firstName || '—')}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#a8a29e;">Email</td>
              <td style="padding:10px 0;">
                <a href="mailto:${escapeHtml(input.email)}" style="color:#0c0a09;text-decoration:underline;">
                  ${escapeHtml(input.email)}
                </a>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:18px;border-top:1px solid #f0efec;padding-top:18px;">
          <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#a8a29e;margin-bottom:10px;">
            Brief / Message
          </div>
          <div style="white-space:pre-wrap;background:#fafaf9;border:1px solid #eeeae3;padding:14px;color:#44403c;font-size:14px;line-height:1.6;">
            ${escapeHtml(input.message || '—')}
          </div>
        </div>

        <div style="margin-top:18px;color:#a8a29e;font-size:12px;">
          Suggestion : répondre à cet email pour contacter <strong style="color:#44403c;">contact@chefstalents.com</strong>.
        </div>
      </div>

      <div style="padding:16px 28px;border-top:1px solid #f0efec;color:#a8a29e;font-size:12px;">
        © ${new Date().getFullYear()} Chef Talents
      </div>
    </div>
  </div>
  `.trim();

  // Envoi + vérif explicite du résultat — Resend renvoie { data, error } et
  // PAR DÉFAUT ne throw pas. On veut un log ERROR visible si l'envoi rate.
  const result = await resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: Array.isArray(to) && to.length > 0 ? to : envList,
    replyTo: 'Chef Talents <contact@chefstalents.com>',
    subject,
    text: txt,
    html,
  });

  if ((result as any)?.error) {
    console.error('[sendInternalNewRequest] Resend error:', (result as any).error, 'requestId:', input.requestId);
    // On rethrow pour que le caller logge avec stack trace
    throw new Error(`Resend internal notification failed: ${JSON.stringify((result as any).error)}`);
  }

  console.log('[sendInternalNewRequest] sent OK to:', Array.isArray(to) ? to.join(', ') : to, 'requestId:', input.requestId);
  return result;
}
