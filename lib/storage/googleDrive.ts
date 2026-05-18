// lib/storage/googleDrive.ts
//
// Upload de PDF signés dans un dossier Google Drive dédié.
// Architecture : compte de service Google (Service Account) — pas d'OAuth user,
// pas de refresh token à gérer. Le service account a accès au dossier Drive
// parce qu'on partage explicitement le dossier avec son email IAM.
//
// Setup côté Google (à faire 1 fois) :
//   1. Google Cloud Console → Créer un projet (ou réutiliser un existant)
//   2. Activer Google Drive API
//   3. IAM & Admin → Service Accounts → Créer un service account
//   4. Créer une clé JSON pour ce service account → télécharger
//   5. Google Drive (UI) → créer un dossier « Chefs Talents — Contrats signés »
//   6. Partager ce dossier avec l'email du service account
//      (xxx@nom-projet.iam.gserviceaccount.com) en rôle Éditeur
//   7. Copier l'ID du dossier (dans l'URL Drive)
//
// Variables env Vercel :
//   GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY   → JSON serialisé OU base64
//   GOOGLE_DRIVE_PARENT_FOLDER_ID      → ID du dossier parent (où archiver)
//   GOOGLE_DRIVE_ENABLED               → 'true' pour activer (sinon skip silencieux)

import { google } from 'googleapis';
import type { Readable } from 'node:stream';

export type DriveUploadResult = {
  fileId: string;
  webViewLink: string;
  folderPath: string;
};

function isEnabled(): boolean {
  return (
    process.env.GOOGLE_DRIVE_ENABLED === 'true' &&
    !!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY &&
    !!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
  );
}

function getCredentials(): { client_email: string; private_key: string } {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY || '';
  if (!raw) throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY missing');

  // Support 2 formats : JSON brut OU base64 (pour éviter les soucis de
  // newlines dans la private_key avec Vercel env vars UI).
  let json: any;
  try {
    if (raw.trim().startsWith('{')) {
      json = JSON.parse(raw);
    } else {
      json = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
  } catch (e) {
    throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY invalid format (expected JSON or base64-JSON)');
  }

  if (!json.client_email || !json.private_key) {
    throw new Error('Service account JSON missing client_email or private_key');
  }
  return { client_email: json.client_email, private_key: json.private_key };
}

function getDriveClient() {
  const creds = getCredentials();
  const jwt = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth: jwt });
}

/**
 * Cherche un sous-dossier par nom dans un parent. Le crée s'il n'existe pas.
 * Utilisé pour structurer en /YYYY/MM/.
 */
async function ensureSubfolder(
  drive: ReturnType<typeof getDriveClient>,
  parentId: string,
  name: string,
): Promise<string> {
  const query = [
    `'${parentId}' in parents`,
    `name='${name.replace(/'/g, "\\'")}'`,
    `mimeType='application/vnd.google-apps.folder'`,
    `trashed=false`,
  ].join(' and ');

  const list = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    pageSize: 1,
  });
  const existing = list.data.files?.[0];
  if (existing?.id) return existing.id;

  // Crée le sous-dossier
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  if (!created.data.id) throw new Error('Failed to create Drive subfolder');
  return created.data.id;
}

/**
 * Upload un PDF dans le dossier Drive parent, organisé par YYYY/MM/.
 * Retourne { fileId, webViewLink } ou null si Drive n'est pas activé.
 *
 * Best-effort : ne throw PAS — log + retourne null en cas d'erreur. Le caller
 * (webhook YouSign) peut continuer son flow sans bloquer.
 */
export async function uploadSignedContractToDrive(input: {
  pdfBuffer: Buffer;
  filename: string;          // ex: "Contrat_client_Lucas.pdf"
  subfolder?: string;        // ex: 'essai', 'chef', 'client', 'ncc' — pour grouper par type
}): Promise<DriveUploadResult | null> {
  if (!isEnabled()) {
    console.log('[googleDrive] disabled (env GOOGLE_DRIVE_ENABLED!=true or missing creds)');
    return null;
  }

  try {
    const drive = getDriveClient();
    const parentId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!;

    // Structure : /YYYY/MM/[kind]/file.pdf
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');

    const yearFolder = await ensureSubfolder(drive, parentId, yyyy);
    const monthFolder = await ensureSubfolder(drive, yearFolder, mm);
    const finalFolder = input.subfolder
      ? await ensureSubfolder(drive, monthFolder, input.subfolder)
      : monthFolder;

    // Upload du fichier
    const { Readable } = await import('node:stream');
    const stream = Readable.from(input.pdfBuffer);

    const created = await drive.files.create({
      requestBody: {
        name: input.filename,
        parents: [finalFolder],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: stream as unknown as Readable,
      },
      fields: 'id, webViewLink',
    });

    const fileId = created.data.id || '';
    const webViewLink = created.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const folderPath = `${yyyy}/${mm}${input.subfolder ? `/${input.subfolder}` : ''}`;

    console.log('[googleDrive] uploaded:', input.filename, '→', folderPath, fileId);
    return { fileId, webViewLink, folderPath };
  } catch (e: any) {
    console.error('[googleDrive] upload error:', e?.message || e);
    return null;
  }
}
