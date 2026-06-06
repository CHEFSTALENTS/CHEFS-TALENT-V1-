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
  format?: 'A4' | 'Letter';
  margin?: { top: string; right: string; bottom: string; left: string };
  printBackground?: boolean;
  /** Attend networkidle0 (utile pour Google Fonts + images remote). */
  waitForNetwork?: boolean;
  /** Attend document.fonts.ready avant capture (rendu typo parfait). */
  waitForFonts?: boolean;
  /** Force 'screen' au lieu du mode 'print' par défaut de pdf(). */
  mediaType?: 'screen' | 'print';
  /** Viewport en pixels avant capture (default 1280). */
  viewportWidth?: number;
  viewportHeight?: number;
  /** Désactive CSS @page rules (force le format passé en options). */
  ignoreCssPageSize?: boolean;
  /** Échelle de rendu PDF (0.1 - 2). Default 1. */
  scale?: number;
};

/**
 * Convertit un HTML complet (avec <html><head><style>…</style></head><body>…</body></html>)
 * en Buffer PDF.
 *
 * Le HTML est rendu avec `waitUntil: 'networkidle0'` donc tu peux inclure
 * des polices @import. Les images http(s) sont supportées.
 */
export async function htmlToPdf(html: string, opts: HtmlToPdfOptions = {}): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;
  try {
    page = await browser.newPage();

    if (opts.viewportWidth || opts.viewportHeight) {
      await page.setViewport({
        width: opts.viewportWidth || 1280,
        height: opts.viewportHeight || 1696,
        deviceScaleFactor: 2,
      });
    }

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
    // @sparticuz/chromium peut renvoyer Uint8Array — on normalise en Buffer
    return Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
  } finally {
    if (page) {
      try { await page.close(); } catch { /* ignore */ }
    }
    // On NE ferme PAS le browser : on le garde en cache pour réutilisation
    // entre invocations chaudes de la function serverless.
  }
}
