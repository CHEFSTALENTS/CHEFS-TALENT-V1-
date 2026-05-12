export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/escapeHtml';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const resend = new Resend(process.env.RESEND_API_KEY);

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// =============================================================
// POST /api/request/draft
//
// Body : { email, state, lastStep?, lang? }
//
// Crée (ou met à jour) un draft de demande pour l'email donné.
// Envoie un email Resend avec un lien de reprise.
//
// Endpoint PUBLIC (pas d'auth) — protégé par rate limit pour éviter
// les abus (spam email vers des tiers).
// =============================================================
export async function POST(req: Request) {
  // Rate limit : 3 saves par 10 min par IP (suffit largement pour un
  // visiteur qui sauve son brouillon, bloque les bots).
  const rl = rateLimit(req, {
    identifier: 'request-draft',
    windowMs: 10 * 60_000,
    max: 3,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const state = body?.state;
    const lastStep = Number(body?.lastStep || 0) || null;
    const lang = String(body?.lang || 'fr').trim() || 'fr';

    // Validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!state || typeof state !== 'object') {
      return NextResponse.json({ error: 'Missing state' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Check si un draft existe déjà pour cet email récemment (< 7 jours)
    // → on le met à jour au lieu de créer un doublon
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('request_drafts')
      .select('id, token, reminder_sent_at')
      .eq('email', email)
      .is('converted_at', null)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let draftToken: string;
    let isNew = false;

    if (existing) {
      // Update le draft existant
      const { error: updErr } = await supabase
        .from('request_drafts')
        .update({
          state,
          last_step: lastStep,
          lang,
        })
        .eq('id', existing.id);
      if (updErr) {
        console.error('[request/draft] update error', updErr.message);
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      draftToken = existing.token;
    } else {
      // Crée un nouveau draft (token généré côté DB via default)
      const { data: created, error: insErr } = await supabase
        .from('request_drafts')
        .insert({
          email,
          state,
          last_step: lastStep,
          lang,
        })
        .select('token')
        .single();
      if (insErr) {
        console.error('[request/draft] insert error', insErr.message);
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      draftToken = created.token;
      isNew = true;
    }

    // Envoie l'email de rappel (1 seul email par draft pour éviter le spam)
    let emailSent = false;
    const shouldSend = isNew || !existing?.reminder_sent_at;

    if (shouldSend) {
      try {
        await sendDraftReminderEmail({
          to: email,
          token: draftToken,
          lang,
          state,
        });
        emailSent = true;
        await supabase
          .from('request_drafts')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('token', draftToken);
      } catch (e: any) {
        console.error('[request/draft] email error', e?.message);
      }
    }

    return NextResponse.json({
      ok: true,
      token: draftToken,
      emailSent,
    });
  } catch (e: any) {
    console.error('[request/draft] POST fatal', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// =============================================================
// Helper : envoi de l'email de rappel via Resend
// =============================================================
async function sendDraftReminderEmail(params: {
  to: string;
  token: string;
  lang: string;
  state: any;
}) {
  const { to, token, lang, state } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chefstalents.com';
  const resumeUrl = `${baseUrl}/request?draft=${encodeURIComponent(token)}`;

  // Localisation simple FR/EN/ES
  const i18n =
    lang === 'en'
      ? {
          subject: 'Resume your private chef request',
          headline: 'Your request is saved',
          intro: "We've saved your progress. Click below to continue where you left off — no need to start over.",
          cta: 'Resume my request',
          footer:
            'This link is valid for 7 days. If you didn\'t request this, just ignore it.',
          signature: 'Thomas — Chefs Talents',
        }
      : lang === 'es'
        ? {
            subject: 'Continúe su solicitud de chef privado',
            headline: 'Su solicitud está guardada',
            intro:
              'Hemos guardado su progreso. Haga clic a continuación para continuar donde lo dejó.',
            cta: 'Continuar mi solicitud',
            footer:
              'Este enlace es válido durante 7 días. Si no solicitó esto, ignore este correo.',
            signature: 'Thomas — Chefs Talents',
          }
        : {
            subject: 'Reprenez votre demande de chef privé',
            headline: 'Votre demande est sauvegardée',
            intro:
              "Nous avons enregistré votre progression. Cliquez ci-dessous pour reprendre là où vous vous êtes arrêté — pas besoin de tout recommencer.",
            cta: 'Reprendre ma demande',
            footer:
              "Ce lien est valable 7 jours. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
            signature: 'Thomas — Chefs Talents',
          };

  // Contexte simple : lieu + dates si déjà saisis (pour rappeler au
  // visiteur de quoi il s'agissait)
  const location = state?.location ? escapeHtml(state.location) : '';
  const startDate = state?.startDate ? escapeHtml(state.startDate) : '';
  const contextLine =
    location || startDate
      ? `<p style="color:#8a7f73;font-size:13px;margin:0 0 24px;">${location}${startDate ? ` · ${startDate}` : ''}</p>`
      : '';

  await resend.emails.send({
    from: 'Thomas — Chefs Talents <contact@chefstalents.com>',
    to,
    subject: i18n.subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4efe8;font-family:Georgia,serif;">
  <div style="max-width:540px;margin:0 auto;padding:48px 32px;">
    <p style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8a7f73;margin:0 0 36px;">CHEFS TALENTS</p>
    <h1 style="font-size:28px;font-weight:normal;color:#161616;margin:0 0 12px;">${escapeHtml(i18n.headline)}</h1>
    ${contextLine}
    <p style="font-size:16px;line-height:1.7;color:#59544d;margin:0 0 32px;">${escapeHtml(i18n.intro)}</p>

    <a href="${resumeUrl}" style="display:inline-block;background:#161616;color:#fff;text-decoration:none;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;padding:14px 32px;border-radius:30px;margin-bottom:32px;">
      ${escapeHtml(i18n.cta)} →
    </a>

    <p style="font-size:11px;color:#8a7f73;margin:0 0 24px;line-height:1.7;">${escapeHtml(i18n.footer)}</p>

    <div style="border-top:1px solid #d8d1c7;padding-top:24px;">
      <p style="font-size:14px;color:#59544d;margin:0 0 4px;">${escapeHtml(i18n.signature)}</p>
      <p style="font-size:12px;color:#8a7f73;margin:0;">+33 7 56 82 76 12 · chefstalents.com</p>
    </div>
  </div>
</body>
</html>`,
  });
}
