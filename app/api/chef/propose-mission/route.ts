// app/api/chef/propose-mission/route.ts
// Un chef remplit le formulaire "Proposer une mission au réseau" depuis
// son dashboard. Cas d'usage : il reçoit une demande qu'il ne peut pas
// honorer (planning, périmètre, ...) et la transmet à Thomas pour qu'il
// la dispatche dans le réseau.
//
// Cette route notifie l'admin (contact@chefstalents.com) avec :
//  - les détails de la demande
//  - les coordonnées du chef émetteur (email + téléphone)
//  - 2 boutons cliquables : Email + WhatsApp pour recontacter le chef en
//    1 clic depuis l'inbox

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { htmlToText } from '@/lib/email/_helpers';
import { requireChefOr401 } from '@/lib/auth/requireChef';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Chefs Talents <contact@chefstalents.com>';
const REPLY_TO = 'contact@chefstalents.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chefstalents.com';
const ACCENT = '#7f1d1d';
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function whatsappLink(phone: string, message: string): string | null {
  if (!phone) return null;
  // wa.me veut le numéro sans le + et sans espaces (ex: 33612345678)
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function mailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function getChefContact(chefId: string): Promise<{
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}> {
  if (!chefId) return { email: '', phone: '', firstName: '', lastName: '' };
  try {
    const admin = getSupabaseAdmin();
    const { data: row } = await admin
      .from('chef_profiles')
      .select('email, profile')
      .eq('user_id', chefId)
      .maybeSingle();
    const profile = (row?.profile as any) ?? {};
    return {
      email: String(row?.email || profile.email || '').trim().toLowerCase(),
      phone: String(profile.phone || '').trim(),
      firstName: String(profile.firstName || '').trim(),
      lastName: String(profile.lastName || '').trim(),
    };
  } catch {
    return { email: '', phone: '', firstName: '', lastName: '' };
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireChefOr401(req);
    if (auth instanceof NextResponse) return auth;
    const chefId = auth.user.id; // SOURCE DE VÉRITÉ — jamais issu du body

    const body = await req.json();
    const {
      chefName,
      destination,
      dates,
      guests,
      budget,
      notes,
    } = body || {};

    const contact = await getChefContact(chefId);
    const displayName =
      String(chefName || '').trim() ||
      `${contact.firstName} ${contact.lastName}`.trim() ||
      'Chef';
    const firstName = contact.firstName || displayName.split(' ')[0] || 'Chef';

    const subject = `[Mission transmise] ${displayName} — ${destination || 'demande à dispatcher'}`;

    const replySubject = `Mission ${destination || ''} — ${dates || ''}`.trim();
    const replyBody = `Bonjour ${firstName},\n\nJe reviens vers vous concernant la mission que vous m'avez transmise (${destination || 'destination à préciser'}, ${dates || 'dates à préciser'}). \n\n— Thomas`;

    const mailtoUrl = contact.email
      ? mailtoLink(contact.email, replySubject, replyBody)
      : '';
    const whatsapp = contact.phone
      ? whatsappLink(
          contact.phone,
          `Bonjour ${firstName}, je reviens vers vous concernant la mission que vous avez transmise pour ${destination || ''} ${dates ? `(${dates})` : ''}. Pouvons-nous en discuter ?`,
        )
      : null;

    const adminProfileUrl = chefId
      ? `${SITE_URL}/admin/chefs/${chefId}`
      : `${SITE_URL}/admin/chefs`;

    const detailRow = (label: string, value?: string) => `
      <tr>
        <td style="padding:8px 0;font-family:${FONT};font-size:13px;color:#71717a;width:120px;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;font-family:${FONT};font-size:13px;color:#09090b;font-weight:500;">${escapeHtml(value || '—')}</td>
      </tr>
    `;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;width:100%;max-width:600px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONT};font-size:14px;font-weight:700;color:#09090b;letter-spacing:-0.01em;">
                    Chefs Talents
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:0.18em;color:${ACCENT};">
                    MISSION TRANSMISE
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 8px;font-family:${FONT};font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.02em;line-height:1.25;">
                ${escapeHtml(displayName)} te transmet une mission qu’il ne peut pas honorer
              </h1>
              <p style="margin:0;font-family:${FONT};font-size:14px;color:#52525b;line-height:1.55;">
                Ce chef ne peut pas prendre cette mission lui-même. Tu peux le recontacter ci-dessous pour comprendre le contexte (sur-charge, périmètre, dates) avant de la dispatcher dans le réseau.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 12px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:#71717a;">
                      DÉTAILS DE LA MISSION
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${detailRow('Destination', destination)}
                      ${detailRow('Dates', dates)}
                      ${detailRow('Convives', guests)}
                      ${detailRow('Budget', budget)}
                      ${notes ? detailRow('Notes', notes) : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf4f4;border:1px solid #f5dada;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.16em;color:${ACCENT};">
                      RECONTACTER LE CHEF
                    </p>
                    <p style="margin:0 0 14px;font-family:${FONT};font-size:13px;color:#5a1717;line-height:1.55;">
                      ${escapeHtml(displayName)}${contact.email ? ` · ${escapeHtml(contact.email)}` : ''}${contact.phone ? ` · ${escapeHtml(contact.phone)}` : ''}
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        ${
                          mailtoUrl
                            ? `<td style="background:#09090b;border-radius:999px;padding:0;">
                                <a href="${mailtoUrl}" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                                  Email au chef →
                                </a>
                              </td>`
                            : ''
                        }
                        ${mailtoUrl && whatsapp ? `<td style="width:8px;"></td>` : ''}
                        ${
                          whatsapp
                            ? `<td style="background:${ACCENT};border-radius:999px;padding:0;">
                                <a href="${whatsapp}" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                                  WhatsApp →
                                </a>
                              </td>`
                            : ''
                        }
                      </tr>
                    </table>
                    ${
                      !mailtoUrl && !whatsapp
                        ? `<p style="margin:0;font-family:${FONT};font-size:12px;color:#7f1d1d;font-style:italic;">Aucune coordonnée disponible pour ce chef. Va sur son profil admin pour voir.</p>`
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:16px 32px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border:1px solid #e4e4e7;border-radius:999px;">
                    <a href="${adminProfileUrl}" style="display:inline-block;padding:10px 20px;font-family:${FONT};font-size:12px;font-weight:600;color:#27272a;text-decoration:none;letter-spacing:-0.01em;">
                      Ouvrir le profil admin →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px;background:#fafafa;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-family:${FONT};font-size:11px;color:#a1a1aa;text-align:center;letter-spacing:0.04em;">
                Si la mission aboutit dans le réseau, ${escapeHtml(displayName)} touche 5% de commission.
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
      replyTo: REPLY_TO,
      to: 'contact@chefstalents.com',
      subject,
      html,
      text: htmlToText(html),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[chef/propose-mission] error', e?.message);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
