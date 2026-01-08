console.log('[WAITLIST API] called');

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'Chef Talents <no-reply@chef-talents.com>';

function json(status: number, body: any) {
  return NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function buildEmail(role: string, company?: string | null) {
  const isConcierge = role === 'concierge';

  const subject = isConcierge
    ? 'Chef Talents — Pré-lancement : accès prioritaire conciergerie'
    : 'Chef Talents — Pré-lancement : confirmation d’inscription';

  const headline = isConcierge ? 'Votre accès prioritaire est noté.' : 'Vous êtes bien inscrit(e).';

  const intro = isConcierge
    ? `Merci. Nous avons bien enregistré votre demande${company ? ` (${company})` : ''}.`
    : `Merci. Nous vous préviendrons dès l’ouverture officielle.`;

  const body = isConcierge
    ? `Nous finalisons l’onboarding des chefs et l’activation des premières zones.
Dès l’ouverture, vous recevrez un email avec un accès prioritaire et les modalités de collaboration (brief, délais, process).`
    : `Nous finalisons l’onboarding des chefs et l’activation des premières zones.
Dès l’ouverture, vous recevrez un email pour accéder au site et déposer vos demandes.`;

  const footer = `Chef Talents — Private Release`;

  // Email HTML minimal premium (safe)
  const html = `
  <div style="background:#F7F4EF;padding:28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;">
    <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #E7E0D6;border-radius:18px;overflow:hidden">
      <div style="padding:22px 24px;border-bottom:1px solid #F0E9DF;background:linear-gradient(135deg,#fff,#FBF7F0)">
        <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8B7E70">Chef Talents · Accès privé</div>
        <div style="font-size:26px;margin-top:10px;color:#1E1A16;font-weight:600">${headline}</div>
        <div style="margin-top:8px;color:#6F6257;line-height:1.6">${intro}</div>
      </div>
      <div style="padding:22px 24px;color:#2A2420;line-height:1.7">
        <p style="margin:0 0 14px 0">${body}</p>
        ${
          isConcierge
            ? `<div style="margin-top:16px;padding:14px 14px;border:1px solid #EFE6DA;border-radius:12px;background:#FFFCF7;color:#6F6257">
                 <b>Astuce :</b> pour accélérer, répondez à cet email avec vos destinations & volumes (villas/yachts/hôtels).
               </div>`
            : ''
        }
      </div>
      <div style="padding:18px 24px;border-top:1px solid #F0E9DF;color:#9A8C7E;font-size:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <span>${footer}</span>
        <span>Vous recevez cet email suite à votre inscription sur la liste de pré-lancement.</span>
      </div>
    </div>
  </div>`;

  const text =
    `${headline}\n\n` +
    `${intro}\n\n` +
    `${body}\n\n` +
    `${footer}`;

  return { subject, html, text };
}

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL) return json(500, { success: false, error: 'SUPABASE_URL_MISSING' });
    if (!SERVICE_ROLE_KEY) return json(500, { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY_MISSING' });

    const payload = await req.json().catch(() => null);
    const email = String(payload?.email || '').trim().toLowerCase();
    const company = String(payload?.company || '').trim() || null;
    const role = String(payload?.role || '').trim() || 'other';
    const source = String(payload?.source || '').trim() || 'access_gate';

    if (!email || !email.includes('@')) return json(400, { success: false, error: 'INVALID_EMAIL' });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('waitlist')
      .upsert([{ email, company, role, source }], { onConflict: 'email' })
      .select('id,email,company,role,source,created_at')
      .single();

    if (error) {
      console.error('[waitlist] supabase error', error);
      return json(500, { success: false, error: 'SUPABASE_INSERT_FAILED', details: error.message });
    }

    // ✅ Email confirmation (non bloquant si tu veux)
    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        const tpl = buildEmail(role, company);

        await resend.emails.send({
          from: MAIL_FROM,
          to: email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
      } catch (e) {
        console.error('[waitlist] email send failed', e);
        // on ne bloque pas la réponse
      }
    }

    return json(200, { success: true, row: data, mailSent: !!RESEND_API_KEY });
  } catch (e: any) {
    console.error('[waitlist] unexpected', e);
    return json(500, { success: false, error: 'SERVER_ERROR' });
  }
}
