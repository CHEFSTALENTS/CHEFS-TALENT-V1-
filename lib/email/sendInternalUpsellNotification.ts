// lib/email/sendInternalUpsellNotification.ts
// Notification interne envoyée à l'admin (Thomas) à chaque achat VIP, achat
// boost ou activation VIP offert. FR uniquement (interne) — design simple
// et factuel pour scan rapide.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Chefs Talents Bot <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';

export type UpsellNotificationKind =
  | 'vip_paid'
  | 'vip_complimentary'
  | 'boost_paid';

const KIND_LABELS: Record<UpsellNotificationKind, string> = {
  vip_paid: 'VIP payant',
  vip_complimentary: 'VIP offert',
  boost_paid: 'Boost',
};

const KIND_BADGE_COLOR: Record<UpsellNotificationKind, string> = {
  vip_paid: '#1a1815',
  vip_complimentary: '#155e3a',
  boost_paid: '#5c4a18',
};

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEur(cents: number | null | undefined): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '—';
  const eur = Math.round(cents) / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(eur);
}

export async function sendInternalUpsellNotification(input: {
  kind: UpsellNotificationKind;
  chefId?: string;
  chefName: string;
  chefEmail: string;
  planLabel: string;
  amountCents?: number | null;
  paymentMode?: string;
}) {
  const to =
    (process.env.INTERNAL_NOTIFY_EMAILS || 'thomas@chefstalents.com')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  if (to.length === 0) {
    console.warn('[sendInternalUpsellNotification] No recipients, skipping.');
    return { skipped: true };
  }

  const tagShort =
    input.kind === 'vip_paid'
      ? 'VIP'
      : input.kind === 'vip_complimentary'
        ? 'VIP★'
        : 'BOOST';

  const subject = `[${tagShort}] ${input.chefName} — ${input.planLabel}`;
  const dateStr = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const adminLink = input.chefId
    ? `${SITE_URL}/admin/chefs/${input.chefId}`
    : `${SITE_URL}/admin/chefs`;

  const amountRow =
    input.kind === 'vip_complimentary'
      ? `<tr>
          <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#7d756a;width:140px;">Montant</td>
          <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#1a1815;font-style:italic;">Offert (gratuit)</td>
         </tr>`
      : `<tr>
          <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#7d756a;width:140px;">Montant</td>
          <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#1a1815;">${escapeHtml(formatEur(input.amountCents ?? null))}</td>
         </tr>`;

  const paymentModeRow = input.paymentMode
    ? `<tr>
        <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#7d756a;width:140px;">Mode</td>
        <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#1a1815;">${escapeHtml(input.paymentMode)}</td>
       </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f5f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f2;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #ece6dc;width:100%;max-width:540px;">

          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #ece6dc;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#9b9082;">
                Notification interne
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 8px;font-family:Georgia,'Times New Roman',serif;">
              <span style="display:inline-block;background:${KIND_BADGE_COLOR[input.kind]};color:#ffffff;padding:4px 10px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;">
                ${KIND_LABELS[input.kind]}
              </span>
              <h1 style="margin:14px 0 4px;font-size:22px;font-weight:400;color:#1a1815;line-height:1.3;">
                ${escapeHtml(input.chefName)}
              </h1>
              <p style="margin:0 0 24px;font-size:13px;color:#7d756a;">
                ${escapeHtml(input.chefEmail)} &middot; ${escapeHtml(dateStr)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf9f5;border:1px solid #ece6dc;">
                <tr><td style="padding:18px 22px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#7d756a;width:140px;">Plan</td>
                      <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#1a1815;">${escapeHtml(input.planLabel)}</td>
                    </tr>
                    ${amountRow}
                    ${paymentModeRow}
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:0 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#1a1815;">
                    <a href="${adminLink}" style="display:inline-block;padding:12px 24px;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Ouvrir le profil admin
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px;background:#f7f5f2;border-top:1px solid #ece6dc;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#a8a29e;text-align:center;">
                Chefs Talents · Notification automatique
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  return { sent: true, recipients: to.length };
}
