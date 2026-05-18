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

export type YousignSignerRole = 'client' | 'chef' | 'agency' | 'concierge' | 'apporteur';

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
    // YouSign v3 renvoie selon les endpoints SOIT :
    //   format A (problem+json) : { detail, violations: [{ field, message, code }] }
    //   format B (custom)       : { detail, type, invalid_params: [{ name, reason }] }
    // On supporte les deux et on les normalise en un seul `violations[]`.
    const rawViolations: any[] = Array.isArray(json?.violations) ? json.violations
      : Array.isArray(json?.invalid_params) ? json.invalid_params
      : [];
    const violations = rawViolations.map((v: any) => ({
      field: v.field || v.name || v.propertyPath || undefined,
      message: v.message || v.reason || v.code || undefined,
      code: v.code || v.type || undefined,
    }));
    const violationsStr = violations
      .map((v) => `${v.field || '?'}: ${v.message || 'invalid'}`)
      .join(' | ');
    const baseDetail = json?.detail || json?.message || text || `HTTP ${res.status}`;
    const fullDetail = violationsStr ? `${baseDetail} → ${violationsStr}` : baseDetail;
    // Log côté serveur (visible dans les logs Vercel)
    console.error('[YouSign]', opts.method || 'GET', path, res.status, fullDetail, json);
    const err: any = new Error(`YouSign ${opts.method || 'GET'} ${path} → ${res.status}: ${fullDetail}`);
    err.status = res.status;
    err.body = json;
    err.violations = violations;
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
  expirationDate?: string;                           // YYYY-MM-DD — défaut YouSign = 90 jours
  timezone?: string;                                 // défaut "Europe/Paris"
  reminderSettings?: {
    interval_in_days: number;
    max_occurrences: number;
  };
}): Promise<YousignSignatureRequest> {
  // YouSign v3 est strict sur le payload : on ne sérialise QUE les clés non-undefined
  // (sinon JSON.stringify les drop, ok — mais on construit prudemment pour éviter
  // tout null implicite).
  const body: Record<string, any> = {
    name: input.name,
    delivery_mode: input.deliveryMode || 'email',
    ordered_signers: input.orderedSigners ?? false,
    timezone: input.timezone || 'Europe/Paris',
  };
  if (input.expirationDate) {
    body.expiration_date = input.expirationDate;
  }
  // reminder_settings : OPTIONNEL côté YouSign. Si invalide, ça 400. On omet
  // par défaut (YouSign utilisera ses propres défauts), et on ne le pose que
  // si explicitement demandé.
  if (input.reminderSettings) {
    body.reminder_settings = input.reminderSettings;
  }
  return yousignFetch<YousignSignatureRequest>('/signature_requests', {
    method: 'POST',
    body,
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
  // Construction défensive : on omet les clés undefined / vides plutôt que de
  // laisser JSON.stringify le faire — certaines versions de YouSign sont
  // strictes sur les types attendus (refus si null ou string vide).
  const info: Record<string, any> = {
    first_name: input.signer.firstName,
    last_name: input.signer.lastName,
    email: input.signer.email,
    locale: 'fr',
  };
  if (input.signer.phoneNumber && input.signer.phoneNumber.trim()) {
    info.phone_number = input.signer.phoneNumber.trim();
  }

  // ⚠️ YouSign v3 :
  // - signature_level: 'electronic_signature' (simple) → REQUIERT
  //   signature_authentication_mode = 'otp_email' ou 'otp_sms' (no_otp refusé)
  // - signature_level: 'advanced_electronic_signature_with_witness' → no_otp OK
  // Default = otp_email (compatible tous comptes, n'exige pas de phone_number)
  const body: Record<string, any> = {
    info,
    signature_level: input.signer.signatureLevel || 'electronic_signature',
    signature_authentication_mode: input.signer.signatureAuthenticationMode || 'otp_email',
  };
  if (input.signatureField) {
    body.fields = [{
      document_id: input.documentId,
      type: 'signature',
      page: input.signatureField.page,
      x: input.signatureField.x,
      y: input.signatureField.y,
      width: input.signatureField.width ?? 120,
      height: input.signatureField.height ?? 40,
    }];
  }
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

/**
 * Supprime une signature_request (utile pour cleanup si erreur en cours de
 * flow : addSigner échoue → la SR créée reste en draft → on la supprime).
 * Ne throw pas si la suppression elle-même fail (best-effort).
 */
export async function deleteSignatureRequest(signatureRequestId: string): Promise<void> {
  try {
    await yousignFetch(`/signature_requests/${encodeURIComponent(signatureRequestId)}`, {
      method: 'DELETE',
    });
  } catch (e: any) {
    console.warn('[YouSign] cleanup draft SR failed:', signatureRequestId, e?.message);
  }
}

/**
 * Annule une signature_request en cours (status='ongoing'). YouSign envoie
 * un email aux signataires non encore signés pour les notifier de l'annulation.
 *
 * Différence avec deleteSignatureRequest :
 *   - DELETE ne marche QUE sur les status 'draft' (jamais activés)
 *   - cancel marche sur les 'ongoing' (déjà activés, invitations envoyées)
 *
 * @param reason - Raison transmise aux signataires dans l'email d'annulation
 */
export async function cancelSignatureRequest(
  signatureRequestId: string,
  reason?: string,
): Promise<YousignSignatureRequest> {
  return yousignFetch<YousignSignatureRequest>(
    `/signature_requests/${encodeURIComponent(signatureRequestId)}/cancel`,
    {
      method: 'POST',
      body: {
        reason: reason || 'cancelled_by_sender',
        custom_note: reason || 'Annulation par l\'Agence',
      },
    },
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

export type SignaturePlacement = {
  /** Page (1-indexée). Si omis : dernière page du PDF (recommandé). */
  page?: number;
  /** Coordonnées en points PDF (origine = coin bas-gauche de la page) */
  x: number;
  y: number;
  width?: number;
  height?: number;
};

export async function sendForSignature(input: {
  name: string;                                      // "Contrat chef — Lucas Ibiza 2026"
  pdfBuffer: Buffer;
  filename: string;
  signers: YousignSignerInput[];
  /**
   * Position des zones de signature dans le PDF, dans le même ordre que `signers`.
   * Si omis → on auto-positionne en bas de la dernière page, signataires
   * espacés horizontalement (matchant le bloc <div class="signatures"> du HTML).
   */
  placements?: SignaturePlacement[];
  /**
   * Méta-info du PDF nécessaire pour l'auto-positionnement (cf. getPdfMeta).
   * Requis si `placements` n'est pas fourni.
   */
  pdfMeta?: { pageCount: number; lastPageSize: { width: number; height: number } };
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

  // Calcul des placements
  let placements: SignaturePlacement[];
  if (input.placements && input.placements.length === input.signers.length) {
    placements = input.placements;
  } else if (input.pdfMeta) {
    // Auto : on espace les signataires sur la dernière page, en bas.
    // Nos templates HTML rendent un .signatures block (grid 2 ou 3 colonnes)
    // en fin de doc. On colle approximativement par-dessus.
    const { pageCount, lastPageSize } = input.pdfMeta;
    const n = input.signers.length;
    const margin = 60;                                            // marge latérale
    const usable = lastPageSize.width - margin * 2;
    const fieldW = Math.min(140, usable / n - 20);
    const fieldH = 50;
    const gap = (usable - fieldW * n) / Math.max(1, n - 1);       // espace entre champs
    const y = 120;                                                // bas de la dernière page
    placements = input.signers.map((_, i) => ({
      page: pageCount,
      x: margin + i * (fieldW + (n > 1 ? gap : 0)),
      y,
      width: fieldW,
      height: fieldH,
    }));
  } else {
    // Fallback : page 1, top-left → laid mais ne fail pas
    placements = input.signers.map((_, i) => ({
      page: 1,
      x: 80 + i * 160,
      y: 700,
      width: 140,
      height: 50,
    }));
  }

  const createdSigners: YousignSigner[] = [];
  try {
    for (let i = 0; i < input.signers.length; i++) {
      const created = await addSigner({
        signatureRequestId: sr.id,
        documentId: doc.id,
        signer: input.signers[i],
        signatureField: {
          // ⚠️ YouSign v3 exige des INTEGERS pour les coordonnées de fields.
          // pdf-lib renvoie la largeur d'une page A4 = 595.275590551... → les
          // calculs (gap, x, fieldW) produisent des floats → 400 invalid_params.
          // Math.round() systématique avant envoi.
          page: Math.round(placements[i].page ?? 1),
          x: Math.round(placements[i].x),
          y: Math.round(placements[i].y),
          width: Math.round(placements[i].width ?? 140),
          height: Math.round(placements[i].height ?? 50),
        },
      });
      createdSigners.push(created);
    }
    const activated = await activateSignatureRequest(sr.id);
    return { signatureRequest: activated, document: doc, signers: createdSigners };
  } catch (e) {
    // Cleanup : la SR draft est inutilisable, on la supprime côté YouSign pour
    // ne pas polluer le dashboard. Best-effort, ne masque pas l'erreur originelle.
    await deleteSignatureRequest(sr.id);
    throw e;
  }
}
