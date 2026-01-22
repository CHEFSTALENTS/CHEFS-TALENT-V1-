// lib/sendClientConfirmation.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

type MatchType = 'fast' | 'concierge';

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatName(firstName?: string) {
  const n = (firstName || '').trim();
  if (!n) return 'Bonjour,';
  // "Bonjour Thomas,"
  return `Bonjour ${n},`;
}

function getDelay(type: MatchType) {
  return type === 'fast' ? '24–48h' : '48–72h';
}

function getTitle(type: MatchType) {
  return type === 'fast' ? 'Fast Match' : 'Concierge Match';
}

function getSubtitle(type: MatchType) {
  return type === 'fast'
    ? 'Prestation ponctuelle · date unique'
    : 'Mission longue / sensible · multi-jours';
}

function buildClientHtml(params: {
  firstName?: string;
  type: MatchType;
  requestId?: string;
  supportEmail: string;
  whatsappUrl: string;
  brandUrl: string;
}) {
  const greeting = escapeHtml(formatName(params.firstName));
  const delay = getDelay(params.type);
  const title = escapeHtml(getTitle(params.type));
  const subtitle = escapeHtml(getSubtitle(params.type));
  const requestId = params.requestId ? escapeHtml(params.requestId) : null;

  // Palette sobre, paper / graphite
  const bg = '#F7F4EF';
  const paper = '#FFFFFF';
  const ink = '#111827';      // stone-900 vibe
  const muted = '#6B7280';    // stone-500
  const line = '#E5E7EB';     // stone-200
  const gold = '#B08D57';     // accent subtil
  const btn = '#111827';
  const btnText = '#F7F4EF';

  return `
  <!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Chef Talents — Confirmation</title>
    </head>
    <body style="margin:0;padding:0;background:${bg};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Nous avons bien reçu votre demande — Chef Talents.
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${bg};padding:32px 0;">
        <tr>
          <td align="center" style="padding:0 16px;">

            <!-- Container -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:${paper};border:1px solid ${line};">
              <!-- Top bar -->
              <tr>
                <td style="padding:18px 28px;border-bottom:1px solid ${line};">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="left" style="font-family:ui-serif, Georgia, 'Times New Roman', Times, serif;font-size:16px;letter-spacing:0.08em;text-transform:uppercase;color:${ink};">
                        CHEF TALENTS
                      </td>
                      <td align="right" style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};">
                        Confirmation · ${title}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="padding:36px 28px 10px 28px;">
                  <div style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${muted};">
                    Demande reçue
                  </div>

                  <h1 style="margin:14px 0 10px 0;font-family:ui-serif, Georgia, 'Times New Roman', Times, serif;font-weight:500;font-size:34px;line-height:1.15;color:${ink};">
                    ${greeting}
                  </h1>

                  <p style="margin:0 0 18px 0;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:15px;line-height:1.8;color:${muted};">
                    Nous confirmons la bonne réception de votre demande. Notre équipe analyse votre brief afin de vous proposer une sélection de chefs
                    alignés avec vos attentes, vos contraintes et le niveau de service attendu.
                  </p>

                  <div style="margin:18px 0 0 0;padding:14px 16px;border:1px solid ${line};background:#FBFAF8;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${muted};">
                          Type
                        </td>
                        <td align="right" style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${muted};">
                          Délai indicatif
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:6px;font-family:ui-serif, Georgia, 'Times New Roman', Times, serif;font-size:18px;color:${ink};">
                          ${title}
                          <span style="display:block;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};margin-top:4px;">
                            ${subtitle}
                          </span>
                        </td>
                        <td align="right" style="padding-top:6px;font-family:ui-serif, Georgia, 'Times New Roman', Times, serif;font-size:18px;color:${ink};">
                          ${escapeHtml(delay)}
                          <span style="display:block;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};margin-top:4px;">
                            selon disponibilité & complexité
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  ${
                    requestId
                      ? `<p style="margin:14px 0 0 0;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};">
                          Référence : <span style="color:${ink};font-weight:600;letter-spacing:0.06em;">${requestId}</span>
                        </p>`
                      : ''
                  }
                </td>
              </tr>

              <!-- Divider + Value props -->
              <tr>
                <td style="padding:22px 28px 10px 28px;">
                  <div style="height:1px;background:${line};width:100%;"></div>
                </td>
              </tr>

              <tr>
                <td style="padding:10px 28px 8px 28px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding:12px 0;">
                        <div style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:13px;color:${muted};line-height:1.8;">
                          <span style="color:${gold};font-weight:700;">•</span> Sélection curatée, profils autonomes & fiables<br/>
                          <span style="color:${gold};font-weight:700;">•</span> Coordination fluide, confidentialité & discrétion<br/>
                          <span style="color:${gold};font-weight:700;">•</span> Aucune réservation n’est effectuée sans votre validation
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:18px 28px 6px 28px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding:0 10px 10px 0;">
                        <a href="${escapeHtml(params.whatsappUrl)}"
                           style="display:inline-block;background:${btn};color:${btnText};text-decoration:none;padding:12px 16px;border-radius:10px;
                                  font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">
                          Contacter sur WhatsApp
                        </a>
                      </td>
                      <td style="padding:0 0 10px 0;">
                        <a href="${escapeHtml(params.brandUrl)}"
                           style="display:inline-block;border:1px solid ${line};color:${ink};text-decoration:none;padding:12px 16px;border-radius:10px;
                                  font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;background:#FBFAF8;">
                          Voir le site
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:8px 0 0 0;font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};line-height:1.7;">
                    Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce message.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 28px;border-top:1px solid ${line};background:#FBFAF8;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:12px;color:${muted};line-height:1.7;">
                        Chef Talents · Europe<br/>
                        Support : <a href="mailto:${escapeHtml(params.supportEmail)}" style="color:${ink};text-decoration:underline;">${escapeHtml(params.supportEmail)}</a>
                      </td>
                      <td align="right" style="font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:11px;color:${muted};">
                        © ${new Date().getFullYear()} Chef Talents
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>

            <!-- tiny footnote -->
            <div style="max-width:680px;color:${muted};font-family:ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial;font-size:11px;line-height:1.6;margin-top:12px;padding:0 6px;text-align:center;">
              Email automatique — merci de ne pas répondre directement à cette adresse.
            </div>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `.trim();
}

export async function sendClientConfirmation({
  email,
  firstName,
  type,
  requestId,
}: {
  email: string;
  firstName?: string;
  type: MatchType;
  requestId?: string;
}) {
  const delay = getDelay(type);

  const supportEmail = 'contact@chefstalents.com';
  const whatsappUrl = 'https://wa.me/33756827612';
  const brandUrl = 'https://chefstalents.com';

  const subject =
    type === 'fast'
      ? 'Demande reçue — Fast Match | Chef Talents'
      : 'Demande reçue — Concierge Match | Chef Talents';

  const text = `Bonjour ${firstName || ''},

Nous confirmons la bonne réception de votre demande (${type.toUpperCase()}).

Délai indicatif : ${delay}
Aucune réservation n’est effectuée sans votre validation.

${requestId ? `Référence : ${requestId}\n` : ''}

Contact :
WhatsApp : +33 7 56 82 76 12
Email : ${supportEmail}

Chef Talents`;

  const html = buildClientHtml({
    firstName,
    type,
    requestId,
    supportEmail,
    whatsappUrl,
    brandUrl,
  });

  return resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: email,
    subject,
    text, // fallback
    html, // ✅ premium
  });
}
