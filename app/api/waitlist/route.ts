// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // important (emails + supabase server)

type Role = 'concierge' | 'client' | 'other';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailContent(payload: {
  role: Role;
  email: string;
  company?: string;
}) {
  const role = payload.role;

  const subject =
    role === 'concierge'
      ? 'Chef Talents — Accès prioritaire au lancement'
      : role === 'client'
      ? 'Chef Talents — Merci, on vous prévient dès l’ouverture'
      : 'Chef Talents — Inscription confirmée';

  const headline =
    role === 'concierge'
      ? 'Merci — vous êtes sur la liste prioritaire.'
      : role === 'client'
      ? 'Merci — votre demande est bien enregistrée.'
      : 'Merci — inscription confirmée.';

  const intro =
    role === 'concierge'
      ? `Nous ouvrons Chef Talents par zones, avec une capacité volontairement limitée pour garantir la qualité d’exécution.`
      : `Chef Talents est en lancement privé. Nous ouvrons progressivement l’accès au public.`;

  const bullets =
    role === 'concierge'
      ? `
        <li><b>Accès prioritaire</b> dès l’ouverture officielle</li>
        <li>Présentation du fonctionnement & des zones actives</li>
        <li>Activation rapide des premières demandes</li>
      `
      : `
        <li>Ouverture par vagues (capacité limitée)</li>
        <li>Accès privé sur invitation / code</li>
        <li>Notification dès que l’accès est disponible</li>
      `;

  const footer =
    role === 'concierge'
      ? `Si vous souhaitez accélérer l’onboarding, répondez simplement à cet email avec votre zone (ex : Paris, Côte d’Azur, Ibiza) et votre volume mensuel estimé.`
      : `Si vous êtes une conciergerie/agence, répondez à cet email pour recevoir un accès prioritaire.`;

  const companyLine =
    payload.company?.trim()
      ? `<div style="margin-top:10px;color:#6b7280;font-size:12px;">Société : <b>${escapeHtml(
          payload.company.trim()
        )}</b></div>`
      : '';

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; background:#f7f5f2; padding:32px;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:18px;overflow:hidden;">
      <div style="padding:26px 28px;background:linear-gradient(135deg,#0f172a,#1f2937);color:#fff;">
        <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.75);">
          Chef Talents • Lancement privé
        </div>
        <div style="margin-top:10px;font-size:26px;line-height:1.2;font-weight:600;">
          ${headline}
        </div>
        <div style="margin-top:10px;font-size:14px;line-height:1.6;color:rgba(255,255,255,.8);">
          ${intro}
        </div>
      </div>

      <div style="padding:24px 28px;">
        <div style="font-size:14px;line-height:1.7;color:#111827;">
          <div style="margin-bottom:12px;">Ce que vous allez recevoir :</div>
          <ul style="margin:0;padding-left:18px;color:#374151;">
            ${bullets}
          </ul>
          ${companyLine}
        </div>

        <div style="margin-top:18px;padding:14px 14px;border:1px solid #e7e5e4;border-radius:14px;background:#fafaf9;color:#374151;font-size:13px;line-height:1.6;">
          ${footer}
        </div>

        <div style="margin-top:18px;color:#9ca3af;font-size:12px;line-height:1.6;">
          Vous recevez cet email suite à votre inscription sur la liste de pré-lancement Chef Talents.
        </div>
      </div>

      <div style="padding:16px 28px;border-top:1px solid #f1f5f9;color:#9ca3af;font-size:12px;">
        © ${new Date().getFullYear()} Chef Talents
      </div>
    </div>
  </div>
  `;

  const text =
    role === 'concierge'
      ? `Merci — vous êtes sur la liste prioritaire Chef Talents. Nous ouvrons par zones avec capacité limitée. Répondez avec votre zone + volume mensuel estimé si vous souhaitez accélérer l’onboarding.`
      : `Merci — votre inscription Chef Talents est confirmée. Nous ouvrons progressivement l’accès. Nous vous préviendrons dès l’ouverture.`;

  return { subject, html, text };
}

function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendWithResendHTTP(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, skipped: true, reason: 'NO_RESEND_API_KEY' };

  const from = process.env.RESEND_FROM || 'Chef Talents <no-reply@chef-talents.com>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    return { ok: false, skipped: false, reason: err || `HTTP_${res.status}` };
  }

  return { ok: true, skipped: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const email = String(body?.email || '').trim().toLowerCase();
    const company = String(body?.company || '').trim();
    const role = (String(body?.role || 'concierge').trim().toLowerCase() || 'concierge') as Role;
    const source = String(body?.source || 'access_gate').trim();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'INVALID_EMAIL' }, { status: 400 });
    }

    // --- Supabase (server) ---
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'SUPABASE_ENV_MISSING' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // upsert pour éviter doublons si email déjà inscrit
    const { error: dbError } = await supabase
      .from('waitlist')
      .upsert(
        {
          email,
          company: company || null,
          role,
          source,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      return NextResponse.json(
        { success: false, error: 'DB_ERROR', details: dbError.message },
        { status: 500 }
      );
    }

    // --- Email confirmation (Resend HTTP) ---
    const content = buildEmailContent({ role, email, company });
    const emailRes = await sendWithResendHTTP({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    return NextResponse.json({
      success: true,
      emailed: emailRes.ok,
      emailSkipped: (emailRes as any).skipped || false,
      emailReason: (emailRes as any).reason || null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: 'UNEXPECTED', details: e?.message || 'unknown' },
      { status: 500 }
    );
  }
}
