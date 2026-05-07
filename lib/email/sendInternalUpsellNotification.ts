// lib/email/sendInternalUpsellNotification.ts
// Notification interne envoyée à l'admin (Thomas) à chaque achat VIP, achat
// boost ou activation VIP offert. FR uniquement (interne).
// Design : Revolut Business — sans-serif, blanc, accent burgundy, scan rapide.

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Chefs Talents Bot <thomas@chefstalents.com>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

export type UpsellNotificationKind =
  | 'vip_paid'
  | 'vip_complimentary'
  | 'boost_paid';

const KIND_LABELS: Record<UpsellNotificationKind, string> = {
  vip_paid: 'VIP payant',
  vip_complimentary: 'VIP offert',
  boost_paid: 'Boost',
};

const KIND_COLORS: Record<UpsellNotificationKind, { bg: string; fg: string }> = {
  vip_paid: { bg: '#09090b', fg: '#ffffff' },
  vip_complimentary: { bg: '#0f5132', fg: '#ffffff' },
  boost_paid: { bg: '#7f1d1d', fg: '#ffffff' },
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

  const subject = `[${tagShort}] ${input.chefName} · ${input.planLabel}`;
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

  const amountValue =
    input.kind === 'vip_complimentary'
      ? 'Offert (gratuit)'
      : escapeHtml(formatEur(input.amountCents ?? null));
  const amountColor =
    input.kind === 'vip_complimentary' ? '#71717a' : '#09090b';

  const colors = KIND_COLORS[input.kind];

  const paymentModeRow = input.paymentMode
    ? `<tr>
        <td style="padding:8px 0;font-family:${FONT};font-size:13px;color:#71717a;width:120px;">Mode</td>
        <td style="padding:8px 0;font-family:${FONT};font-size:13px;color:#09090b;font-weight:500;">${escapeHtml(input.paymentMode)}</td>
       </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;width:100%;max-width:540px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONT};font-size:14px;font-weight:700;color:#09090b;letter-spacing:-0.01em;">
                    Chefs Talents
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.18em;color:${ACCENT};">
                    NOTIFICATION INTERNE
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 8px;">
              <span style="display:inline-block;background:${colors.bg};color:${colors.fg};padding:5px 12px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.12em;border-radius:999px;">
                ${KIND_LABELS[input.kind]}
              </span>
              <h1 style="margin:18px 0 6px;font-family:${FONT};font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.25;">
                ${escapeHtml(input.chefName)}
              </h1>
              <p style="margin:0;font-family:${FONT};font-size:13px;color:#71717a;">
                ${escapeHtml(input.chefEmail)} · ${escapeHtml(dateStr)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:8px 0;font-family:${FONT};font-size:13px;color:#71717a;width:120px;">Plan</td>
                        <td style="padding:8px 0;font-family:${FONT};font-size:13px;color:#09090b;font-weight:500;">${escapeHtml(input.planLabel)}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-family:${FONT};font-size:13px;color:#71717a;width:120px;">Montant</td>
                        <td style="padding:8px 0;font-family:${FONT};font-size:14px;color:${amountColor};font-weight:700;">${amountValue}</td>
                      </tr>
                      ${paymentModeRow}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:0 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#09090b;border-radius:999px;">
                    <a href="${adminLink}" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      Ouvrir le profil admin →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px;background:#fafafa;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-family:${FONT};font-size:11px;color:#a1a1aa;text-align:center;letter-spacing:0.06em;">
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
