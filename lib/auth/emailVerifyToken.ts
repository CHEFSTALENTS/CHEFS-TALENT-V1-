// lib/auth/emailVerifyToken.ts
// Token signé HMAC-SHA256 pour la vérification email post-signup.
// Format : base64url(payload).base64url(signature)
// Payload : { userId, email, exp }
//
// Avantages vs JWT lib : zéro dépendance, lisible, suffisant pour ce cas
// d'usage (vérification email avec expiry 48h).

import crypto from 'node:crypto';

const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000; // 48h

function getSecret(): string {
  const s = process.env.EMAIL_VERIFY_SECRET || '';
  if (!s) {
    throw new Error(
      'EMAIL_VERIFY_SECRET env var is required. Generate one with: openssl rand -hex 32',
    );
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(pad), 'base64');
}

type Payload = {
  userId: string;
  email: string;
  exp: number; // epoch ms
};

function sign(data: string): string {
  return b64url(crypto.createHmac('sha256', getSecret()).update(data).digest());
}

/** Génère un token signé pour un userId/email avec expiry (par défaut 48h). */
export function generateEmailVerifyToken(
  userId: string,
  email: string,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const payload: Payload = {
    userId: String(userId),
    email: String(email).trim().toLowerCase(),
    exp: Date.now() + ttlMs,
  };
  const data = b64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = sign(data);
  return `${data}.${sig}`;
}

/**
 * Vérifie un token et renvoie le payload si signature valide et non expiré.
 * Renvoie null si invalide.
 */
export function verifyEmailVerifyToken(token: string): {
  userId: string;
  email: string;
  expired: boolean;
  valid: boolean;
} {
  if (!token || typeof token !== 'string') {
    return { userId: '', email: '', expired: false, valid: false };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { userId: '', email: '', expired: false, valid: false };
  }
  const [data, sig] = parts;

  // Vérifie la signature avant tout (defense against tampering)
  const expectedSig = sign(data);
  if (
    expectedSig.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))
  ) {
    return { userId: '', email: '', expired: false, valid: false };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(b64urlDecode(data).toString('utf8'));
  } catch {
    return { userId: '', email: '', expired: false, valid: false };
  }

  if (!payload?.userId || !payload?.email || !payload?.exp) {
    return { userId: '', email: '', expired: false, valid: false };
  }

  const expired = Date.now() > payload.exp;
  return {
    userId: payload.userId,
    email: payload.email,
    expired,
    valid: !expired,
  };
}
