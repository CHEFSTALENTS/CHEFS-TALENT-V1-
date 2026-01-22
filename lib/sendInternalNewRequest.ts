// lib/sendInternalNewRequest.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendInternalNewRequest(input: {
  to?: string | string[]; // optionnel (sinon env)
  requestId: string;
  matchType: 'fast' | 'concierge';
  email: string;
  firstName?: string;
  message?: string;
  createdAtISO?: string;
}) {
  const to = input.to ?? (process.env.INTERNAL_NOTIFY_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!to || (Array.isArray(to) && to.length === 0)) {
    // Pas d'email interne configuré => on ne bloque pas le flow
    console.warn('[sendInternalNewRequest] No INTERNAL_NOTIFY_EMAILS set, skipping.');
    return { skipped: true };
  }

  const subject =
    input.matchType === 'fast'
      ? `🔥 Nouvelle demande FAST (${input.requestId})`
      : `📩 Nouvelle demande CONCIERGE (${input.requestId})`;

  const txt = [
    `Nouvelle demande reçue sur Chef Talents`,
    ``,
    `ID: ${input.requestId}`,
    `Type: ${input.matchType}`,
    `Client: ${input.firstName || '—'}`,
    `Email: ${input.email}`,
    `Créée: ${input.createdAtISO || new Date().toISOString()}`,
    ``,
    `Message / brief:`,
    input.message || '—',
    ``,
    `—`,
    `Backoffice: /admin (si tu as)`,
  ].join('\n');

  return resend.emails.send({
  from: process.env.MAIL_FROM!,
  to,
  replyTo: 'contact@chefstalents.com', // ✅ pas reply_to
  subject,
  text: txt,
  html,
});
