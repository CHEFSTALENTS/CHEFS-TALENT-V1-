// lib/pdf/pdfMeta.ts
//
// Helpers de méta-données sur un Buffer PDF généré par htmlToPdf().
// Utilisé pour positionner les zones de signature YouSign sur la dernière
// page (où se trouve notre bloc <div class="signatures">).

import { PDFDocument } from 'pdf-lib';

export type PdfPageSize = { width: number; height: number };

/**
 * Retourne le nombre de pages + dimensions de la dernière page du PDF.
 * Format A4 standard : 595 × 842 points (= 210 × 297 mm).
 */
export async function getPdfMeta(buffer: Buffer): Promise<{
  pageCount: number;
  lastPageSize: PdfPageSize;
}> {
  const doc = await PDFDocument.load(buffer);
  const pageCount = doc.getPageCount();
  const lastPage = doc.getPage(pageCount - 1);
  const { width, height } = lastPage.getSize();
  return { pageCount, lastPageSize: { width, height } };
}
