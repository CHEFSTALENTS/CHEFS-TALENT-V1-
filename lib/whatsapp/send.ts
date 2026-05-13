// lib/whatsapp/send.ts
// Wrapper minimaliste autour de l'API WhatsApp Cloud (Meta).
//
// Mode MOCK : si WHATSAPP_TOKEN ou WHATSAPP_PHONE_NUMBER_ID manque,
// ou si WHATSAPP_MOCK === '1', on log le message et on retourne ok=true
// sans appel réseau. Permet de coder + tester en local sans
// dépendre de l'approbation Meta des templates.
//
// Mode RÉEL : POST sur https://graph.facebook.com/<version>/<phone_id>/messages
//
// Doc Meta : https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

export type WhatsAppPhone = string; // E.164 sans le + (ex: "33612345678")

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const TOKEN = process.env.WHATSAPP_TOKEN || '';

/**
 * Numéro WhatsApp Business STANDARD (app, conversations directes Thomas).
 * Distinct du numéro Cloud API utilisé pour les notifications auto.
 * Utilisé dans les footers de templates + auto-réponses webhook pour
 * rediriger les chefs / clients qui veulent un échange humain.
 */
export const WHATSAPP_DIRECT_CONTACT = process.env.WHATSAPP_DIRECT_CONTACT
  || '+33 7 56 82 76 12';

function isMockMode(): boolean {
  if (process.env.WHATSAPP_MOCK === '1') return true;
  return !TOKEN || !PHONE_ID;
}

/** Normalise un numéro FR en format E.164 sans le + (ex: "0612..." → "33612..."). */
export function normalizeToE164(input: string): string | null {
  if (!input) return null;
  let s = String(input).replace(/[^\d+]/g, '');
  if (!s) return null;
  if (s.startsWith('+')) s = s.slice(1);
  // Heuristique FR : 0XXXXXXXXX → 33XXXXXXXXX
  if (s.startsWith('0') && s.length === 10) s = '33' + s.slice(1);
  // Validation grossière : 8-15 chiffres
  if (!/^\d{8,15}$/.test(s)) return null;
  return s;
}

export type SendResult = {
  ok: boolean;
  mock: boolean;
  messageId?: string;
  error?: string;
  raw?: any;
};

async function callApi(body: any): Promise<SendResult> {
  if (isMockMode()) {
    console.log('[whatsapp MOCK]', JSON.stringify(body));
    return { ok: true, mock: true, messageId: `mock_${Date.now()}` };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[whatsapp] API error', res.status, json);
      return {
        ok: false,
        mock: false,
        error: json?.error?.message || `HTTP ${res.status}`,
        raw: json,
      };
    }
    const messageId: string | undefined = json?.messages?.[0]?.id;
    return { ok: true, mock: false, messageId, raw: json };
  } catch (e: any) {
    console.error('[whatsapp] fetch failed', e?.message);
    return { ok: false, mock: false, error: e?.message || 'fetch failed' };
  }
}

/**
 * Envoie un message texte libre.
 * ⚠️ Hors fenêtre de 24h après dernier message du destinataire, Meta
 * refuse les messages texte libres → il faut un template approuvé.
 */
export async function sendText(to: WhatsAppPhone, body: string): Promise<SendResult> {
  const dest = normalizeToE164(to);
  if (!dest) return { ok: false, mock: false, error: 'Invalid phone number' };
  if (!body?.trim()) return { ok: false, mock: false, error: 'Empty body' };

  return callApi({
    messaging_product: 'whatsapp',
    to: dest,
    type: 'text',
    text: { body, preview_url: false },
  });
}

/**
 * Envoie un message template (approuvé côté Meta).
 *
 * - name : nom du template (ex: 'mission_reminder_30d')
 * - languageCode : code BCP-47 (ex: 'fr', 'en', 'es')
 * - components : variables à injecter (header, body, button)
 *
 * Doc components : https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-object
 */
export async function sendTemplate(
  to: WhatsAppPhone,
  name: string,
  languageCode: 'fr' | 'en' | 'es',
  components: any[] = [],
): Promise<SendResult> {
  const dest = normalizeToE164(to);
  if (!dest) return { ok: false, mock: false, error: 'Invalid phone number' };
  if (!name?.trim()) return { ok: false, mock: false, error: 'Empty template name' };

  return callApi({
    messaging_product: 'whatsapp',
    to: dest,
    type: 'template',
    template: {
      name,
      language: { code: languageCode },
      ...(components.length ? { components } : {}),
    },
  });
}

/**
 * Variables body de template, format simplifié.
 * Ex: bodyVars(['Thomas', '15 juin 2026']) →
 *   [{ type: 'body', parameters: [{type:'text',text:'Thomas'},{type:'text',text:'15 juin 2026'}] }]
 */
export function bodyVars(values: (string | number)[]): any[] {
  return [
    {
      type: 'body',
      parameters: values.map((v) => ({ type: 'text', text: String(v) })),
    },
  ];
}
