// app/api/admin/requests/[id]/send-qualification/route.ts
//
// POST /api/admin/requests/:id/send-qualification
// Envoie le message de qualification au client :
//   - channel: 'email'   → envoi via Resend
//   - channel: 'whatsapp' → renvoie un deeplink wa.me que l'admin ouvre
//
// Trace le timestamp + canal + contenu dans client_requests.
// Passe automatiquement la request de 'new' → 'in_review'.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * Sépare un message email "Objet: ...\n\nCorps..." en {subject, body}.
 * Si pas de ligne "Objet:", on prend une subject par défaut.
 */
function splitEmail(message: string): { subject: string; body: string } {
  const trimmed = message.trim();
  const lines = trimmed.split('\n');
  const first = lines[0]?.trim() || '';
  const objetMatch = /^objet\s*:?\s*/i.exec(first);
  if (objetMatch) {
    const subject = first.replace(objetMatch[0], '').trim();
    const body = lines.slice(1).join('\n').replace(/^\s*\n+/, '');
    return { subject: subject || 'Votre demande Chefs Talents', body };
  }
  return { subject: 'Votre demande Chefs Talents', body: trimmed };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const channel = body.channel === 'whatsapp' ? 'whatsapp' : body.channel === 'email' ? 'email' : null;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const edited = !!body.edited;

  if (!channel) {
    return NextResponse.json({ ok: false, error: 'CHANNEL_REQUIRED (email | whatsapp)' }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ ok: false, error: 'CONTENT_REQUIRED' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Lire la request pour récupérer email/téléphone client
  const { data: request, error: fetchErr } = await supabase
    .from('client_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
  if (!request) return NextResponse.json({ ok: false, error: 'REQUEST_NOT_FOUND' }, { status: 404 });

  // ─── Envoi selon canal ────────────────────────────────────────
  let whatsappDeeplink: string | null = null;

  if (channel === 'email') {
    const to = request.email;
    if (!to) {
      return NextResponse.json({ ok: false, error: 'CLIENT_EMAIL_MISSING' }, { status: 400 });
    }
    const { subject, body: emailBody } = splitEmail(content);
    try {
      await resend.emails.send({
        from: 'Thomas Delcroix <contact@chefstalents.com>',
        to,
        replyTo: 'Thomas Delcroix <contact@chefstalents.com>',
        subject,
        // Texte brut converti en HTML léger (préserve les sauts de ligne)
        html: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#161616;max-width:560px;">${escapeHtml(emailBody).replace(/\n/g, '<br/>')}</div>`,
        text: emailBody,
      });
    } catch (e: any) {
      console.error('[send-qualification] email error', e?.message);
      return NextResponse.json({ ok: false, error: `EMAIL_SEND_FAILED: ${e?.message}` }, { status: 500 });
    }
  } else {
    // WhatsApp : on génère un deeplink wa.me que l'admin ouvre depuis son tel.
    // Le client recevra le message quand Thomas appuiera "Envoyer" dans WhatsApp.
    const phoneRaw = request.phone;
    if (!phoneRaw) {
      return NextResponse.json({ ok: false, error: 'CLIENT_PHONE_MISSING' }, { status: 400 });
    }
    // Normalise : on garde uniquement les chiffres
    const phoneDigits = String(phoneRaw).replace(/[^0-9]/g, '');
    whatsappDeeplink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(content)}`;
  }

  // ─── Trace en DB ──────────────────────────────────────────────
  const nowIso = new Date().toISOString();
  const updates: Record<string, any> = {
    qualified_contact_sent_at: nowIso,
    qualified_contact_channel: channel,
    qualified_contact_message: content,
    qualified_contact_edited: edited,
  };

  // Auto-transition new → in_review (la demande n'est plus "à traiter")
  if (request.status === 'new') {
    updates.status = 'in_review';
  }

  const { error: updErr } = await supabase
    .from('client_requests')
    .update(updates)
    .eq('id', id);
  if (updErr) {
    console.warn('[send-qualification] DB update warning', updErr.message);
    // Pas bloquant : l'envoi est déjà parti
  }

  return NextResponse.json({
    ok: true,
    channel,
    sentAt: nowIso,
    whatsappDeeplink,
  });
}
