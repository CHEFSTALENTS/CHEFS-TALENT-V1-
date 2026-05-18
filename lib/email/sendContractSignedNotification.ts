// lib/email/sendContractSignedNotification.ts
//
// Notifie Thomas (et toute personne dans INTERNAL_NOTIFY_EMAILS) qu'un contrat
// vient d'être signé par tous les signataires. Envoie le PDF signé en pièce
// jointe (via Resend attachments).
//
// Appelé depuis /api/webhooks/yousign quand signature_request.done.

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

const KIND_LABEL: Record<string, string> = {
  essai: "Contrat d'essai",
  chef: 'Contrat de mission chef',
  client: 'Contrat de prestation client',
  ncc: 'NCC concierge',
};

const TARGET_KIND_LABEL: Record<string, string> = {
  mission: 'Mission',
  proposal: 'Proposal',
  request: 'Demande',
  adhoc: 'Ad-hoc',
};

export async function sendContractSignedNotification(input: {
  kind: 'essai' | 'chef' | 'client' | 'ncc';
  targetKind: 'mission' | 'proposal' | 'request' | 'adhoc';
  targetId: string | null;
  signers: Array<{ name?: string; email?: string; role?: string }>;
  pdfBuffer?: Buffer;        // PDF signé pour pièce jointe (peut être omis)
  filename: string;          // ex: "Contrat_client_Lucas.pdf"
  yousignRequestId: string;
}) {
  const envList = (process.env.INTERNAL_NOTIFY_EMAILS || 'contact@chefstalents.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
  const targetUrl =
    input.targetKind === 'mission' && input.targetId
      ? `${SITE_URL}/admin/missions/${input.targetId}`
      : input.targetKind === 'request' && input.targetId
        ? `${SITE_URL}/admin/requests/${input.targetId}`
        : null;

  const kindLabel = KIND_LABEL[input.kind] || input.kind;
  const targetLabel = TARGET_KIND_LABEL[input.targetKind] || input.targetKind;

  const subject = `✅ Contrat signé — ${kindLabel}${input.targetId ? ` (${targetLabel.toLowerCase()} ${input.targetId.slice(0, 8)})` : ''}`;

  const signersList = input.signers
    .map((s) => `• ${s.role || '?'} — ${s.name || '?'} (${s.email || '?'})`)
    .join('\n');

  const txt = [
    `Un contrat vient d'être signé par tous les signataires.`,
    ``,
    `Type : ${kindLabel}`,
    `Lien : ${targetLabel}${input.targetId ? ` ${input.targetId.slice(0, 8)}` : ''}`,
    `YouSign ID : ${input.yousignRequestId}`,
    ``,
    `Signataires :`,
    signersList,
    ``,
    targetUrl ? `Voir dans l'admin : ${targetUrl}` : '',
    ``,
    'Le PDF signé est en pièce jointe.',
    ``,
    '—',
    'Chefs Talents · contact@chefstalents.com',
  ].filter(Boolean).join('\n');

  const html = `
<div style="background:#f7f6f3;padding:32px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;">
    <div style="padding:24px 28px 16px;border-bottom:1px solid #f0efec;">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#10b981;margin-bottom:8px;">✅ Contrat signé</div>
      <div style="font-size:22px;line-height:1.25;color:#0c0a09;font-family:ui-serif,Georgia,serif;">${esc(kindLabel)}</div>
      ${input.targetId ? `<div style="font-size:12px;color:#78716c;margin-top:6px;">${esc(targetLabel)} <code style="font-family:monospace;background:#fafaf9;padding:2px 6px;border-radius:3px;">${esc(input.targetId.slice(0, 8))}</code></div>` : ''}
    </div>
    <div style="padding:20px 28px;color:#44403c;font-size:14px;line-height:1.6;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a8a29e;margin-bottom:10px;">Signataires</div>
      <ul style="margin:0 0 18px 0;padding:0 0 0 18px;">
        ${input.signers.map((s) => `<li style="margin:4px 0;">
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#a8a29e;">${esc(s.role || '?')}</span>
          &nbsp;${esc(s.name || '?')}
          <span style="color:#78716c;">&lt;${esc(s.email || '?')}&gt;</span>
        </li>`).join('')}
      </ul>
      ${targetUrl ? `<a href="${esc(targetUrl)}" style="display:inline-block;background:#0c0a09;color:#fff;text-decoration:none;padding:10px 18px;font-size:13px;letter-spacing:0.04em;">Voir dans l'admin</a>` : ''}
      <p style="margin:18px 0 0 0;font-size:12px;color:#78716c;">Le PDF signé est en pièce jointe.</p>
    </div>
    <div style="padding:14px 28px;border-top:1px solid #f0efec;color:#a8a29e;font-size:11px;">YouSign ID : ${esc(input.yousignRequestId)}</div>
  </div>
</div>`.trim();

  const attachments = input.pdfBuffer
    ? [{
        filename: input.filename,
        content: input.pdfBuffer.toString('base64'),
      }]
    : undefined;

  const result = await resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: envList,
    replyTo: 'Chefs Talents <contact@chefstalents.com>',
    subject,
    text: txt,
    html,
    attachments,
  });

  if ((result as any)?.error) {
    console.error('[sendContractSignedNotification] Resend error:', (result as any).error);
    throw new Error(`Resend signed notification failed: ${JSON.stringify((result as any).error)}`);
  }

  console.log('[sendContractSignedNotification] sent OK to:', envList.join(', '), 'sigRequestId:', input.yousignRequestId);
  return result;
}
