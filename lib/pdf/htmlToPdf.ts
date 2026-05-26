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
   * Attend que tout le réseau soit idle (utile pour Google Fonts +
   * images remote). Plus lent (+3-8s) mais garantit que les polices
   * et images sont chargées avant capture PDF. Par défaut false pour
   * ne pas ralentir les contrats / NCC (HTML inline).
   */
  waitForNetwork?: boolean;
  /**
   * Attend que document.fonts.ready résolve avant capture. Combiné
   * avec waitForNetwork, garantit un rendu typographique parfait.
   */
  waitForFonts?: boolean;
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
    const waitUntil: any = opts.waitForNetwork
      ? ['load', 'networkidle0']
      : ['load', 'domcontentloaded'];
    await page.setContent(html, { waitUntil, timeout: 45_000 });

    // Attend que les @font-face soient toutes chargées (utile pour
    // les portfolios qui dépendent de Google Fonts — sans ça, le PDF
    // peut être généré avant le swap, en font système fallback).
    if (opts.waitForFonts) {
      try {
        await page.evaluate(() => (document as any).fonts?.ready);
      } catch { /* ignore */ }
    }

    const pdfBytes = await page.pdf({
      format: opts.format || 'A4',
      printBackground: opts.printBackground ?? true,
      margin: opts.margin || { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
      preferCSSPageSize: true,
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
