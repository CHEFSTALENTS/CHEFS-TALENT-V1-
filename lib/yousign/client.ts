// lib/yousign/client.ts
//
// Wrapper minimal autour de l'API YouSign v3.
// Docs : https://developers.yousign.com/reference/api-resources
//
// Flux standard signature request :
//   1. createSignatureRequest()   →  POST /signature_requests  (status='draft')
//   2. uploadDocument()           →  POST /signature_requests/{id}/documents
//   3. addSigner() × N            →  POST /signature_requests/{id}/signers
//   4. activate()                 →  POST /signature_requests/{id}/activate
//                                    YouSign envoie alors les invitations email
//                                    aux signataires dans l'ordre (signature_level
//                                    'electronic_signature' simple par défaut)
//
// Variables d'env :
//   YOUSIGN_API_KEY          →  clé API (sandbox ou prod)
//   YOUSIGN_API_BASE         →  https://api-sandbox.yousign.app/v3 (sandbox)
//                            →  https://api.yousign.app/v3         (prod)
//   YOUSIGN_WEBHOOK_SECRET   →  secret HMAC pour /api/webhooks/yousign
//                              (configuré côté dashboard YouSign)

export type YousignSignerRole = 'client' | 'chef' | 'agency' | 'concierge';

export type YousignSignerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;          // E.164, ex: +33612345678
  role: YousignSignerRole;       // pour notre tracking (non envoyé tel quel)
  signatureLevel?: 'electronic_signature' | 'advanced_electronic_signature_with_witness';
  signatureAuthenticationMode?: 'no_otp' | 'otp_email' | 'otp_sms';
};

export type YousignSignatureRequest = {
  id: string;
  status: 'draft' | 'ongoing' | 'done' | 'declined' | 'expired' | 'cancelled' | 'error';
  name: string;
  delivery_mode: 'email' | 'none';
  created_at: string;
};

export type YousignDocument = {
  id: string;
  filename: string;
  nature: 'signable_document' | 'attachment';
};

export type YousignSigner = {
  id: string;
  status: string;
  info: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
};

type FetchOpts = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  formData?: FormData;
};

function getConfig() {
  const apiKey = process.env.YOUSIGN_API_KEY;
  const apiBase = process.env.YOUSIGN_API_BASE || 'https://api-sandbox.yousign.app/v3';
  if (!apiKey) {
    throw new Error('YOUSIGN_API_KEY env var manquante');
  }
  return { apiKey, apiBase: apiBase.replace(/\/$/, '') };
}

async function yousignFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { apiKey, apiBase } = getConfig();
  const url = `${apiBase}${path.startsWith('/') ? path : '/' + path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  let body: BodyInit | undefined;

  if (opts.formData) {
    body = opts.formData;
    // Ne PAS définir Content-Type → fetch ajoute le boundary multipart auto
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, {
    method: opts.method || (body ? 'POST' : 'GET'),
    headers,
    body,
    cache: 'no-store',
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const detail = json?.detail || json?.message || text || `HTTP ${res.status}`;
    const err: any = new Error(`YouSign ${opts.method || 'GET'} ${path} → ${res.status}: ${detail}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json as T;
}

// ────────────────────────────────────────────────────────────
// 1. Création de la signature request
// ────────────────────────────────────────────────────────────

export async function createSignatureRequest(input: {
  name: string;                                      // "Contrat chef — Lucas Ibiza 2026"
  deliveryMode?: 'email' | 'none';                   // 'email' = YouSign envoie les invitations
  orderedSigners?: boolean;                          // false par défaut → tout le monde signe en parallèle
  expirationDate?: string;                           // ISO 8601 — défaut YouSign = 90 jours
  reminderSettings?: {
    interval_in_days: number;
    max_occurrences: number;
  };
}): Promise<YousignSignatureRequest> {
  return yousignFetch<YousignSignatureRequest>('/signature_requests', {
    method: 'POST',
    body: {
      name: input.name,
      delivery_mode: input.deliveryMode || 'email',
      ordered_signers: input.orderedSigners ?? false,
      expiration_date: input.expirationDate,
      reminder_settings: input.reminderSettings || {
        interval_in_days: 3,
        max_occurrences: 3,
      },
    },
  });
}

// ────────────────────────────────────────────────────────────
// 2. Upload du document PDF
// ────────────────────────────────────────────────────────────

export async function uploadDocument(input: {
  signatureRequestId: string;
  pdfBuffer: Buffer;
  filename: string;                                  // "Contrat_chef_Lucas_Ibiza_2026.pdf"
  nature?: 'signable_document' | 'attachment';       // signable par défaut
  parseAnchors?: boolean;                            // si true → YouSign détecte les zones [signature_X]
}): Promise<YousignDocument> {
  const fd = new FormData();
  // Web Blob attendu par fetch FormData
  const blob = new Blob([new Uint8Array(input.pdfBuffer)], { type: 'application/pdf' });
  fd.append('file', blob, input.filename);
  fd.append('nature', input.nature || 'signable_document');
  if (input.parseAnchors) {
    fd.append('parse_anchors', 'true');
  }
  return yousignFetch<YousignDocument>(
    `/signature_requests/${encodeURIComponent(input.signatureRequestId)}/documents`,
    { method: 'POST', formData: fd }
  );
}

// ────────────────────────────────────────────────────────────
// 3. Ajout des signataires
// ────────────────────────────────────────────────────────────

export async function addSigner(input: {
  signatureRequestId: string;
  documentId: string;
  signer: YousignSignerInput;
  /**
   * Position de la zone de signature dans le PDF (en points PDF).
   * Origine = coin bas-gauche. Page 1-indexée.
   * Si tu utilises parseAnchors=true, tu peux omettre cette zone.
   */
  signatureField?: {
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}): Promise<YousignSigner> {
  const body: any = {
    info: {
      first_name: input.signer.firstName,
      last_name: input.signer.lastName,
      email: input.signer.email,
      phone_number: input.signer.phoneNumber,
      locale: 'fr',
    },
    signature_level: input.signer.signatureLevel || 'electronic_signature',
    signature_authentication_mode: input.signer.signatureAuthenticationMode || 'no_otp',
    fields: input.signatureField
      ? [{
          document_id: input.documentId,
          type: 'signature',
          page: input.signatureField.page,
          x: input.signatureField.x,
          y: input.signatureField.y,
          width: input.signatureField.width ?? 120,
          height: input.signatureField.height ?? 40,
        }]
      : [],
  };
  return yousignFetch<YousignSigner>(
    `/signature_requests/${encodeURIComponent(input.signatureRequestId)}/signers`,
    { method: 'POST', body }
  );
}

// ────────────────────────────────────────────────────────────
// 4. Activation — envoie les invitations email
// ────────────────────────────────────────────────────────────

export async function activateSignatureRequest(signatureRequestId: string): Promise<YousignSignatureRequest> {
  return yousignFetch<YousignSignatureRequest>(
    `/signature_requests/${encodeURIComponent(signatureRequestId)}/activate`,
    { method: 'POST' }
  );
}

// ────────────────────────────────────────────────────────────
// 5. Lecture (status, signed document)
// ────────────────────────────────────────────────────────────

export async function getSignatureRequest(signatureRequestId: string): Promise<YousignSignatureRequest & {
  signers: YousignSigner[];
  documents: YousignDocument[];
}> {
  return yousignFetch(`/signature_requests/${encodeURIComponent(signatureRequestId)}`);
}

/**
 * Télécharge le PDF signé final (audit trail inclus) — disponible quand
 * yousign_status='done'.
 */
export async function downloadSignedDocument(input: {
  signatureRequestId: string;
  documentId: string;
}): Promise<Buffer> {
  const { apiKey, apiBase } = getConfig();
  const res = await fetch(
    `${apiBase}/signature_requests/${encodeURIComponent(input.signatureRequestId)}/documents/${encodeURIComponent(input.documentId)}/download`,
    { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error(`YouSign download → HTTP ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

// ────────────────────────────────────────────────────────────
// Helper haut-niveau : tout-en-un
// ────────────────────────────────────────────────────────────

export async function sendForSignature(input: {
  name: string;                                      // "Contrat chef — Lucas Ibiza 2026"
  pdfBuffer: Buffer;
  filename: string;
  signers: YousignSignerInput[];
  expirationDate?: string;
}): Promise<{
  signatureRequest: YousignSignatureRequest;
  document: YousignDocument;
  signers: YousignSigner[];
}> {
  const sr = await createSignatureRequest({
    name: input.name,
    expirationDate: input.expirationDate,
  });
  const doc = await uploadDocument({
    signatureRequestId: sr.id,
    pdfBuffer: input.pdfBuffer,
    filename: input.filename,
  });
  const createdSigners: YousignSigner[] = [];
  for (const s of input.signers) {
    // On positionne chaque signature en bas de la dernière page, espacées
    // horizontalement. Le PDF généré par notre puppeteer prévoit une zone
    // « Signatures » sur la dernière page — on signe par-dessus.
    const idx = createdSigners.length;
    const created = await addSigner({
      signatureRequestId: sr.id,
      documentId: doc.id,
      signer: s,
      signatureField: {
        page: 1,                          // sera repositionné après MVP
        x: 100 + idx * 160,
        y: 100,
        width: 140,
        height: 50,
      },
    });
    createdSigners.push(created);
  }
  const activated = await activateSignatureRequest(sr.id);
  return { signatureRequest: activated, document: doc, signers: createdSigners };
}
