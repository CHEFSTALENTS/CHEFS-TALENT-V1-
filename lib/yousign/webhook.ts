// lib/yousign/webhook.ts
//
// Vérification HMAC-SHA256 des webhooks YouSign.
// Docs : https://developers.yousign.com/docs/webhooks#security
//
// YouSign signe chaque webhook avec X-YouSign-Signature-256 = hmac_sha256(secret, rawBody)
// au format hex. On compare en timingSafeEqual.

import crypto from 'node:crypto';

export type YousignWebhookEvent = {
  event_name:
    | 'signature_request.activated'
    | 'signature_request.done'
    | 'signature_request.declined'
    | 'signature_request.expired'
    | 'signature_request.cancelled'
    | 'signer.done'
    | 'signer.declined'
    | string;
  event_id: string;
  event_time: string;                     // ISO 8601
  sandbox: boolean;
  data: {
    signature_request: {
      id: string;
      status: string;
      name: string;
      delivery_mode: string;
      created_at: string;
    };
    signer?: {
      id: string;
      status: string;
      info?: { first_name?: string; last_name?: string; email?: string };
    };
  };
};

/**
 * Vérifie la signature HMAC envoyée par YouSign.
 * À appeler dans le route handler webhook AVANT de parser le JSON.
 *
 * IMPORTANT : passe le **raw body** (pas le JSON déjà parsé), sinon le HMAC
 * ne matchera pas (les espaces / ordre des clés peuvent différer).
 */
export function verifyYousignSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  // YouSign envoie soit la signature brute hex, soit "sha256=<hex>" — on supporte les deux
  const sig = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  // timingSafeEqual nécessite des Buffer de même longueur
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
