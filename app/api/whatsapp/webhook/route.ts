// app/api/whatsapp/webhook/route.ts
// Webhook WhatsApp Cloud API (Meta).
//
// GET  : handshake de vérification quand on configure le webhook côté Meta.
//        Meta envoie ?hub.mode=subscribe&hub.verify_token=<VERIFY_TOKEN>&hub.challenge=<n>
//        On répond avec hub.challenge en text/plain si verify_token matche.
//
// POST : réception des événements WhatsApp (messages entrants, status updates).
//        Phase 1 : on log + on déclenche une auto-réponse de redirection
//        vers le numéro WA Business standard pour les messages texte
//        (les chefs / clients qui répondent à un message auto seront
//        redirigés vers le vrai canal humain).
//
// Doc Meta :
// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
// https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { sendText, WHATSAPP_DIRECT_CONTACT } from '@/lib/whatsapp/send';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

// GET /api/whatsapp/webhook
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && token === VERIFY_TOKEN && challenge) {
    console.log('[whatsapp webhook] verified');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[whatsapp webhook] verification failed', { mode, hasToken: !!token });
  return new Response('Forbidden', { status: 403 });
}

// POST /api/whatsapp/webhook
export async function POST(req: Request) {
  // Toujours répondre 200 rapidement (Meta retry sinon).
  // On log et on traite en best-effort.
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: true });

    // Structure : { object, entry: [{ id, changes: [{ field, value: {...} }] }] }
    const entries: any[] = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes: any[] = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        // Messages entrants (chef ou client qui répond)
        const messages: any[] = Array.isArray(value?.messages) ? value.messages : [];
        for (const msg of messages) {
          await handleIncomingMessage(msg, value?.contacts?.[0]);
        }

        // Statuses (delivered, read, failed) — phase 1 : on log juste.
        const statuses: any[] = Array.isArray(value?.statuses) ? value.statuses : [];
        for (const s of statuses) {
          console.log('[whatsapp webhook] status', {
            id: s?.id,
            status: s?.status,
            recipient: s?.recipient_id,
            errors: s?.errors,
          });
        }
      }
    }
  } catch (e: any) {
    console.error('[whatsapp webhook] POST error', e?.message);
  }

  return NextResponse.json({ ok: true });
}

async function handleIncomingMessage(msg: any, contact: any) {
  const from: string = String(msg?.from || '');
  const type: string = String(msg?.type || '');
  const profileName: string = String(contact?.profile?.name || '').trim() || 'Bonjour';
  const text: string = String(msg?.text?.body || '');

  // Log sans le contenu intégral (RGPD) — juste métadonnée + 20 premiers chars.
  console.log('[whatsapp webhook] incoming', {
    from,
    type,
    profileName,
    preview: text ? text.slice(0, 20) : '',
  });

  // Phase 1 : auto-réponse de redirection vers le canal humain.
  // ⚠️ Cette auto-réponse nécessite d'être dans la fenêtre de 24h après
  // le message du chef/client (= ici, son propre message qu'on vient de
  // recevoir). Donc le texte libre passe.
  if (type === 'text' && text) {
    const replyFr = [
      `Bonjour ${profileName.split(' ')[0]} 👋`,
      ``,
      `Ce numéro reçoit les notifications automatiques de Chefs Talents.`,
      `Pour un échange direct avec Thomas, écris au ${WHATSAPP_DIRECT_CONTACT} (même nom de contact, autre numéro).`,
      ``,
      `Merci !`,
    ].join('\n');
    await sendText(from, replyFr).catch((err) =>
      console.error('[whatsapp webhook] auto-reply failed', err?.message),
    );
  }
}
