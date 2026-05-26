// lib/pdf/htmlToPdf.ts
//
// Convertisseur HTML → PDF côté serveur, compatible Vercel serverless.
//
// Stack : @sparticuz/chromium (Chrome headless ~50 MB compressé) + puppeteer-core.
// Sur Vercel : utilise le binary @sparticuz/chromium.executablePath()
// En local  : utilise le puppeteer standard (dépendance optionnelle dev)
//
// IMPORTANT : la route API appelante DOIT avoir `export const runtime = 'nodejs'`
// (pas Edge — Edge n'a pas accès aux binaires natifs) et idéalement
// `export const maxDuration = 60` sur plan Pro.

import type { Browser, Page } from 'puppeteer-core';

let cachedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser) {
    try {
      // Check connection — relance si déconnecté
      cachedBrowser.process();
      return cachedBrowser;
    } catch {
      cachedBrowser = null;
    }
  }

  const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isVercel) {
    // Sur Vercel serverless : @sparticuz/chromium + puppeteer-core
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');

    cachedBrowser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
      ],
      defaultViewport: { width: 1280, height: 1696 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // Local dev : essaie d'utiliser puppeteer-core avec le Chrome système.
    // L'utilisateur peut définir PUPPETEER_EXECUTABLE_PATH pour pointer
    // vers un Chrome local (ex: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome).
    const puppeteer = await import('puppeteer-core');
    const exec = process.env.PUPPETEER_EXECUTABLE_PATH
      || (process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome');
    cachedBrowser = await puppeteer.launch({
      executablePath: exec,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }) as unknown as Browser;
  }

  return cachedBrowser;
}

export type HtmlToPdfOptions = {
  /**
   * Format papier — A4 par défaut, comme les CGV et contrats actuels.
   */
  format?: 'A4' | 'Letter';
  /**
   * Marges en mm (string CSS valide aussi : "20mm", "0.5in"…)
   */
  margin?: { top: string; right: string; bottom: string; left: string };
  /**
   * Inclure les arrière-plans CSS dans le PDF (utile pour les bordures
   * de tables, sinon elles peuvent disparaître).
   */
  printBackground?: boolean;
  /**
   * Attend networkidle0 (utile pour Google Fonts + images remote).
   * +3-8s. Par défaut false pour ne pas ralentir les contrats / NCC.
   */
  waitForNetwork?: boolean;
  /**
   * Attend document.fonts.ready avant capture. Garantit un rendu
   * typographique parfait (pas de fallback en font système).
   */
  waitForFonts?: boolean;
  /**
   * Force le rendu en mode 'screen' au lieu du mode 'print' par défaut
   * de puppeteer.pdf(). Indispensable pour les templates qui ont des
   * media queries `(max-width: ...)` qui se déclencheraient en mode
   * print (viewport ~794px) et casseraient le layout grid.
   */
  mediaType?: 'screen' | 'print';
  /**
   * Largeur de viewport en pixels avant capture. Default 1280.
   * Important quand mediaType='screen' : si le template a un max-width
   * de 1100px, set viewportWidth à 1100 ou plus pour éviter les
   * breakpoints responsive.
   */
  viewportWidth?: number;
  viewportHeight?: number;
  /**
   * Désactive l'utilisation des CSS @page rules (préfère le format
   * passé en options). Default false (= utilise @page si défini).
   */
  ignoreCssPageSize?: boolean;
  /**
   * Échelle de rendu PDF (0.1 - 2). Default 1.
   * Utile pour scaler un layout 1100px vers A4 (794px) : scale ~0.72
   */
  scale?: number;
};

/**
 * Convertit un HTML complet (avec <html><head><style>…</style></head><body>…</body></html>)
 * en Buffer PDF.
 */
export async function htmlToPdf(html: string, opts: HtmlToPdfOptions = {}): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;
  try {
    page = await browser.newPage();

    // Set viewport AVANT setContent pour que les media queries soient
    // évaluées avec la bonne largeur.
    if (opts.viewportWidth || opts.viewportHeight) {
      await page.setViewport({
        width: opts.viewportWidth || 1280,
        height: opts.viewportHeight || 1696,
        deviceScaleFactor: 2, // x2 = rendu HD pour les images
      });
    }

    // Force le mode 'screen' avant render → ignore les @media print.
    // À appeler AVANT setContent pour que le rendu initial utilise
    // le bon stylesheet.
    if (opts.mediaType) {
      await page.emulateMediaType(opts.mediaType);
    }

    const waitUntil: any = opts.waitForNetwork
      ? ['load', 'networkidle0']
      : ['load', 'domcontentloaded'];
    await page.setContent(html, { waitUntil, timeout: 45_000 });

    if (opts.waitForFonts) {
      try {
        await page.evaluate(() => (document as any).fonts?.ready);
      } catch { /* ignore */ }
    }

    const pdfBytes = await page.pdf({
      format: opts.format || 'A4',
      printBackground: opts.printBackground ?? true,
      margin: opts.margin || { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
      preferCSSPageSize: !opts.ignoreCssPageSize,
      scale: opts.scale,
    });
    return Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
  } finally {
    if (page) {
      try { await page.close(); } catch { /* ignore */ }
    }
  }
}
