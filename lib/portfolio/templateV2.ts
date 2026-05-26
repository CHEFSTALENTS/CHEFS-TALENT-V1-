// lib/portfolio/templateV2.ts
//
// Portfolio chef « v2 » — template officiel Chefs Talent. (HTML/CSS fournis
// par le user). Reproduit fidèlement le design system :
//   - Variables CSS exactes (--ct-coral #e74e2b, --ct-cream #f4efe6, etc.)
//   - Polices Fraunces + Inter via Google Fonts
//   - Layout fixe 794px (= A4 96dpi) — pas de responsive
//   - Dish gallery adaptative : 3 / 4 / 5 dishes via ct-count-N
//
// 2 modes :
//   - 'branded'    : logotype texte « Chefs Talents. » + footer contact
//   - 'whitelabel' : aucun logo, aucune mention CT
//
// IMPORTANT : pour le PDF, ce template DOIT être rendu via puppeteer en
// mode 'screen' avec viewport 794px (= A4 96dpi). Cf.
// /api/admin/chefs/[id]/portfolio?format=pdf qui le fait correctement.

const ROMANS = ['i.', 'ii.', 'iii.', 'iv.', 'v.'];

// Largeur fixe du portfolio = A4 96dpi. C'est la clef pour avoir un
// PDF pixel-perfect : puppeteer set viewport = 794, rend en 1:1, capture en A4.
const A4_WIDTH_PX = 794;

export type PortfolioV2Input = {
  referenceCode: string;
  coverImageUrl: string;
  chefPhotoUrl: string;
  headlineTitleHtml: string;
  coverSubtitle: string;
  bioLeadHtml: string;
  bioParagraph1: string;
  bioParagraph2: string;
  experienceYears: number | null;
  languages: string[];
  availability: string;
  culinaryTags: string[];
  missionTags: string[];
  whyParagraph1: string;
  whyParagraph2: string;
  dishes: Array<{ url: string; name: string }>;
  chefQuote: string;
};

export type PortfolioMode = 'branded' | 'whitelabel';

const BRANDED = {
  contactEmail: 'contact@chefstalents.com',
  website: 'chefstalents.com',
  brandName: 'Chefs Talents',
};

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildChefPortfolioHtmlV2(
  data: PortfolioV2Input,
  mode: PortfolioMode = 'branded',
): string {
  const isBranded = mode === 'branded';

  const culinaryTagsHtml = data.culinaryTags
    .map((t, i) => `<span class="ct-tag ${i === 0 ? 'ct-tag--accent' : ''}">${esc(t)}</span>`)
    .join('\n            ');

  const missionTagsHtml = data.missionTags
    .map((t) => `<span class="ct-tag">${esc(t)}</span>`)
    .join('\n            ');

  const dishCount = Math.min(5, Math.max(3, data.dishes.length || 3));
  const dishes = data.dishes.slice(0, dishCount);

  const dishesHtml = dishes
    .map(
      (d, i) => `      <figure class="ct-dish">
        <img src="${esc(d.url)}" alt="${esc(d.name)}" referrerpolicy="no-referrer" loading="eager" onerror="this.style.display='none';this.parentElement.classList.add('ct-img-broken')" />
        <figcaption class="ct-dish__num">${ROMANS[i] || ''}</figcaption>
      </figure>`,
    )
    .join('\n');

  // LOGOTYPE TEXTE (pas d'image) — zéro dépendance, élégant
  const logotypeTxt = `<span class="ct-logotype">Chefs Talents<span class="ct-logotype-dot">.</span></span>`;

  const headerHtml = isBranded
    ? `
  <header class="ct-header">
    ${logotypeTxt}
    <div class="ct-header__meta">
      <div>Private Chef Portfolio</div>
      <div>Ref. <span class="ct-ref">${esc(data.referenceCode)}</span></div>
      <div>Confidential · Client use only</div>
    </div>
  </header>`
    : `
  <header class="ct-header">
    <div class="ct-header__placeholder">PRIVATE PORTFOLIO</div>
    <div class="ct-header__meta">
      <div>Chef Selection</div>
      <div>Ref. <span class="ct-ref">${esc(data.referenceCode)}</span></div>
      <div>Confidential · Recipient use only</div>
    </div>
  </header>`;

  const footerHtml = isBranded
    ? `
  <footer class="ct-footer">
    ${logotypeTxt}
    <div class="ct-footer__contact">
      <div>${esc(BRANDED.contactEmail)}</div>
      <div>${esc(BRANDED.website)}</div>
    </div>
  </footer>`
    : `
  <footer class="ct-footer">
    <div class="ct-footer__placeholder">PRIVATE PORTFOLIO</div>
    <div class="ct-footer__contact">
      <div>Confidential</div>
      <div>For your eyes only</div>
    </div>
  </footer>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${A4_WIDTH_PX}, initial-scale=1" />
  <title>${isBranded ? 'Chef Portfolio — Chefs Talents' : `Chef Portfolio — ${esc(data.referenceCode)}`}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

  <style>
    /* ────────────────────────────────────────────────────────
       Layout FIXE 794px (= A4 96dpi). Aucune media query.
       Le PDF est généré via puppeteer mode 'screen' avec viewport
       794px → rendu pixel-perfect 1:1 sur format A4.
       ──────────────────────────────────────────────────────── */

    @page {
      size: A4;
      margin: 0;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #f4efe6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .ct-portfolio {
      --ct-cream: #f4efe6;
      --ct-cream-soft: #ebe4d6;
      --ct-ink: #1a1814;
      --ct-ink-soft: #3a342c;
      --ct-coral: #e74e2b;
      --ct-coral-soft: #f5d4c7;
      --ct-line: #d9d1bf;
      --ct-muted: #6b6358;

      width: ${A4_WIDTH_PX}px;
      margin: 0 auto;
      background: var(--ct-cream);
      color: var(--ct-ink);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-weight: 300;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    .ct-portfolio img { max-width: 100%; display: block; }

    /* Logotype texte */
    .ct-logotype {
      font-family: 'Fraunces', serif;
      font-weight: 400;
      font-size: 22px;
      color: var(--ct-ink);
      letter-spacing: -0.015em;
      line-height: 1;
    }
    .ct-logotype-dot { color: var(--ct-coral); font-weight: 500; }

    /* ====== HEADER ====== */
    .ct-portfolio .ct-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 26px 36px 18px;
      border-bottom: 1px solid var(--ct-line);
    }
    .ct-portfolio .ct-header__placeholder,
    .ct-portfolio .ct-footer__placeholder {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ct-muted);
      font-weight: 500;
    }
    .ct-portfolio .ct-header__meta {
      text-align: right;
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ct-muted);
      line-height: 1.8;
    }
    .ct-portfolio .ct-header__meta .ct-ref {
      color: var(--ct-coral);
      font-weight: 500;
    }

    /* ====== HERO ====== */
    .ct-portfolio .ct-hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 320px;
    }
    .ct-portfolio .ct-hero__text {
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .ct-portfolio .ct-hero__eyebrow {
      font-size: 10px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ct-coral);
      margin-bottom: 18px;
      font-weight: 500;
    }
    .ct-portfolio .ct-hero__title {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: 38px;
      line-height: 0.95;
      letter-spacing: -0.025em;
      margin: 0 0 16px;
      color: var(--ct-ink);
    }
    .ct-portfolio .ct-hero__title em {
      font-style: italic;
      font-weight: 400;
      color: var(--ct-coral);
    }
    .ct-portfolio .ct-hero__subtitle {
      font-family: 'Fraunces', serif;
      font-size: 13px;
      font-weight: 300;
      color: var(--ct-ink-soft);
      line-height: 1.5;
      font-style: italic;
      max-width: 280px;
      margin: 0;
    }
    .ct-portfolio .ct-hero__ornament {
      margin-top: 22px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .ct-portfolio .ct-hero__ornament-line {
      width: 32px; height: 1px; background: var(--ct-coral);
    }
    .ct-portfolio .ct-hero__ornament-text {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 11px;
      color: var(--ct-coral);
      letter-spacing: 0.05em;
    }
    .ct-portfolio .ct-hero__image {
      overflow: hidden;
      background: var(--ct-cream-soft);
      min-height: 320px;
    }
    .ct-portfolio .ct-hero__image img {
      width: 100%; height: 100%; min-height: 320px;
      object-fit: cover; object-position: center;
    }

    /* ====== SECTION (about, expertise) ====== */
    .ct-portfolio .ct-section {
      padding: 32px 36px;
      border-top: 1px solid var(--ct-line);
    }
    .ct-portfolio .ct-section-label {
      font-size: 9px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ct-coral);
      font-weight: 500;
      line-height: 1.6;
    }
    .ct-portfolio .ct-about {
      display: grid;
      grid-template-columns: 110px 1fr 160px;
      gap: 28px;
      align-items: start;
    }
    .ct-portfolio .ct-about__body {
      font-family: 'Fraunces', serif;
      font-size: 12px;
      line-height: 1.55;
      font-weight: 300;
      color: var(--ct-ink-soft);
      letter-spacing: -0.005em;
    }
    .ct-portfolio .ct-about__body .ct-lead {
      font-size: 16px;
      line-height: 1.35;
      color: var(--ct-ink);
      font-weight: 400;
      margin: 0 0 12px;
      letter-spacing: -0.015em;
    }
    .ct-portfolio .ct-about__body p { margin: 0; }
    .ct-portfolio .ct-about__body p + p { margin-top: 10px; }
    .ct-portfolio .ct-about__body .ct-accent,
    .ct-portfolio .ct-about__body .accent {
      color: var(--ct-coral);
      font-style: italic;
    }
    .ct-portfolio .ct-portrait {
      width: 160px;
      height: 210px;
      overflow: hidden;
      background: var(--ct-cream-soft);
    }
    .ct-portfolio .ct-portrait img {
      width: 100%; height: 100%;
      object-fit: cover; object-position: center top;
    }
    .ct-portfolio .ct-portrait-caption {
      font-family: 'Fraunces', serif;
      font-size: 10px;
      font-style: italic;
      color: var(--ct-muted);
      margin-top: 8px;
      letter-spacing: 0.02em;
    }

    /* ====== INFO GRID ====== */
    .ct-portfolio .ct-info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--ct-line);
      border-top: 1px solid var(--ct-line);
      border-bottom: 1px solid var(--ct-line);
      margin: 0 36px;
    }
    .ct-portfolio .ct-info-cell {
      background: var(--ct-cream);
      padding: 14px 16px;
    }
    .ct-portfolio .ct-info-cell__label {
      font-size: 8px;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      color: var(--ct-muted);
      margin-bottom: 6px;
      font-weight: 500;
    }
    .ct-portfolio .ct-info-cell__value {
      font-family: 'Fraunces', serif;
      font-size: 15px;
      color: var(--ct-ink);
      font-weight: 400;
      line-height: 1.2;
    }
    .ct-portfolio .ct-info-cell__value em {
      color: var(--ct-coral);
      font-style: italic;
    }

    /* ====== EXPERTISE & TAGS ====== */
    .ct-portfolio .ct-expertise {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 28px;
    }
    .ct-portfolio .ct-tag-group + .ct-tag-group { margin-top: 18px; }
    .ct-portfolio .ct-tag-group__title {
      font-family: 'Fraunces', serif;
      font-size: 11px;
      font-style: italic;
      color: var(--ct-ink-soft);
      margin-bottom: 10px;
    }
    .ct-portfolio .ct-tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .ct-portfolio .ct-tag {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      padding: 5px 12px;
      border: 1px solid var(--ct-ink);
      border-radius: 100px;
      color: var(--ct-ink);
      letter-spacing: 0.04em;
      font-weight: 400;
      background: transparent;
      white-space: nowrap;
      display: inline-block;
    }
    .ct-portfolio .ct-tag.ct-tag--accent {
      background: var(--ct-coral);
      border-color: var(--ct-coral);
      color: var(--ct-cream);
    }

    /* ====== WHY WE RECOMMEND ====== */
    .ct-portfolio .ct-why {
      background: var(--ct-ink);
      color: var(--ct-cream);
      padding: 32px 36px;
    }
    .ct-portfolio .ct-why .ct-section-label { color: var(--ct-coral); }
    .ct-portfolio .ct-why__inner {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 28px;
    }
    .ct-portfolio .ct-why__text {
      font-family: 'Fraunces', serif;
      font-size: 13px;
      line-height: 1.55;
      font-weight: 300;
      color: var(--ct-cream);
      letter-spacing: -0.005em;
    }
    .ct-portfolio .ct-why__text p { margin: 0; }
    .ct-portfolio .ct-why__text p + p { margin-top: 10px; }

    /* ====== GALLERY ====== */
    .ct-portfolio .ct-gallery { padding: 32px 36px; }
    .ct-portfolio .ct-gallery__header {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 28px;
      margin-bottom: 20px;
    }
    .ct-portfolio .ct-gallery__title {
      font-family: 'Fraunces', serif;
      font-size: 28px;
      font-weight: 300;
      line-height: 1;
      letter-spacing: -0.02em;
      color: var(--ct-ink);
      margin: 0;
    }
    .ct-portfolio .ct-gallery__title em {
      font-style: italic; color: var(--ct-coral);
    }
    .ct-portfolio .ct-gallery__desc {
      font-family: 'Fraunces', serif;
      font-size: 11px;
      color: var(--ct-ink-soft);
      font-style: italic;
      margin: 8px 0 0;
      max-width: 360px;
    }

    /* Gallery grids — adaptive 3/4/5 */
    .ct-portfolio .ct-dishes-grid { display: grid; gap: 8px; }

    .ct-portfolio .ct-dishes-grid.ct-count-3 {
      grid-template-columns: 1.4fr 1fr;
      grid-template-rows: 180px 140px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-3 .ct-dish:nth-child(1) { grid-column: 1; grid-row: 1 / 3; }
    .ct-portfolio .ct-dishes-grid.ct-count-3 .ct-dish:nth-child(2) { grid-column: 2; grid-row: 1; }
    .ct-portfolio .ct-dishes-grid.ct-count-3 .ct-dish:nth-child(3) { grid-column: 2; grid-row: 2; }

    .ct-portfolio .ct-dishes-grid.ct-count-4 {
      grid-template-columns: 1.3fr 1fr;
      grid-template-rows: 200px 160px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(1) { grid-column: 1; grid-row: 1 / 3; }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(2) { grid-column: 2; grid-row: 1; }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(3) { grid-column: 2; grid-row: 2; }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(4) { grid-column: 1 / 3; grid-row: 3; height: 180px; }

    .ct-portfolio .ct-dishes-grid.ct-count-5 {
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: 180px 150px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(1) { grid-column: 1 / 4; grid-row: 1; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(2) { grid-column: 4 / 7; grid-row: 1; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(3) { grid-column: 1 / 3; grid-row: 2; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(4) { grid-column: 3 / 5; grid-row: 2; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(5) { grid-column: 5 / 7; grid-row: 2; }

    .ct-portfolio .ct-dish {
      position: relative;
      overflow: hidden;
      background: var(--ct-cream-soft);
      margin: 0;
    }
    .ct-portfolio .ct-dish img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .ct-portfolio .ct-dish__num {
      position: absolute;
      top: 10px; left: 12px;
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 11px;
      color: rgba(255,255,255,0.92);
      text-shadow: 0 1px 4px rgba(0,0,0,0.55);
      letter-spacing: 0.04em;
      margin: 0;
    }
    /* Fallback image cassée : placeholder élégant */
    .ct-portfolio .ct-dish.ct-img-broken {
      background: linear-gradient(135deg, var(--ct-cream-soft) 0%, var(--ct-line) 100%);
    }
    .ct-portfolio .ct-dish.ct-img-broken::before {
      content: 'Image unavailable';
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Fraunces', serif;
      font-style: italic; font-size: 11px;
      color: var(--ct-muted);
    }

    /* ====== SIGNATURE QUOTE ====== */
    .ct-portfolio .ct-signature {
      text-align: center;
      padding: 36px 36px;
      border-top: 1px solid var(--ct-line);
    }
    .ct-portfolio .ct-signature__mark {
      font-family: 'Fraunces', serif;
      font-size: 34px;
      color: var(--ct-coral);
      line-height: 0.4;
      margin-bottom: 20px;
    }
    .ct-portfolio .ct-signature__quote {
      font-family: 'Fraunces', serif;
      font-size: 18px;
      font-weight: 300;
      font-style: italic;
      line-height: 1.4;
      color: var(--ct-ink);
      max-width: 500px;
      margin: 0 auto 16px;
      letter-spacing: -0.01em;
    }
    .ct-portfolio .ct-signature__attribution {
      font-size: 9px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ct-muted);
      font-weight: 500;
    }

    /* ====== FOOTER ====== */
    .ct-portfolio .ct-footer {
      padding: 22px 36px;
      border-top: 1px solid var(--ct-line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--ct-muted);
    }
    .ct-portfolio .ct-footer .ct-logotype { font-size: 16px; }
    .ct-portfolio .ct-footer__placeholder {
      font-weight: 500;
      color: var(--ct-ink);
      letter-spacing: 0.18em;
    }
    .ct-portfolio .ct-footer__contact {
      text-align: right;
      line-height: 1.8;
    }
    .ct-portfolio .ct-confidential {
      text-align: center;
      font-size: 8px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ct-muted);
      padding: 12px 36px 18px;
      border-top: 1px dashed var(--ct-line);
    }

    /* Barre de génération PDF (uniquement en mode aperçu navigateur) */
    .ct-genbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      background: #1a1814;
      color: #f4efe6;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .ct-genbar + .ct-portfolio { margin-top: 48px; }
    .ct-genbar__btn {
      background: #e74e2b;
      color: #fff;
      border: 0;
      padding: 8px 16px;
      border-radius: 999px;
      font-family: inherit;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      cursor: pointer;
      font-weight: 500;
      text-decoration: none;
    }
    @media print { .ct-genbar { display: none !important; } .ct-genbar + .ct-portfolio { margin-top: 0; } }
  </style>
</head>
<body>

  <div class="ct-genbar no-print">
    <span>${isBranded ? 'Chef Portfolio · Confidential' : 'Private portfolio · Confidential'}</span>
    <a href="javascript:void(0)" onclick="downloadPortfolioPdf()" class="ct-genbar__btn">Download as PDF</a>
  </div>

<article class="ct-portfolio ${isBranded ? 'is-branded' : 'is-whitelabel'}">

  ${headerHtml}

  <section class="ct-hero">
    <div class="ct-hero__text">
      <div class="ct-hero__eyebrow">${isBranded ? 'Selected Chef · Anonymised Profile' : 'Selected Chef · Profile'}</div>
      <h1 class="ct-hero__title">${data.headlineTitleHtml}</h1>
      <p class="ct-hero__subtitle">${esc(data.coverSubtitle)}</p>
      <div class="ct-hero__ornament">
        <span class="ct-hero__ornament-line"></span>
        <span class="ct-hero__ornament-text">No. ${esc(data.referenceCode)}</span>
      </div>
    </div>
    <div class="ct-hero__image">
      <img src="${esc(data.coverImageUrl)}" alt="Featured dish" referrerpolicy="no-referrer" loading="eager" onerror="this.style.display='none'">
    </div>
  </section>

  <section class="ct-section">
    <div class="ct-about">
      <div class="ct-section-label">About<br>the Chef</div>
      <div class="ct-about__body">
        <p class="ct-lead">${data.bioLeadHtml}</p>
        <p>${esc(data.bioParagraph1)}</p>
        ${data.bioParagraph2 ? `<p>${esc(data.bioParagraph2)}</p>` : ''}
      </div>
      <div>
        <div class="ct-portrait">
          <img src="${esc(data.chefPhotoUrl)}" alt="The Chef" referrerpolicy="no-referrer" loading="eager" onerror="this.style.display='none'">
        </div>
        <div class="ct-portrait-caption">The Chef · on location</div>
      </div>
    </div>
  </section>

  <div class="ct-info-grid">
    <div class="ct-info-cell">
      <div class="ct-info-cell__label">Experience</div>
      <div class="ct-info-cell__value">${data.experienceYears ? `<em>${data.experienceYears}</em> years` : '<em>—</em>'}</div>
    </div>
    <div class="ct-info-cell">
      <div class="ct-info-cell__label">Languages</div>
      <div class="ct-info-cell__value">${data.languages.length ? esc(data.languages.join(' · ')) : '—'}</div>
    </div>
    <div class="ct-info-cell">
      <div class="ct-info-cell__label">Availability</div>
      <div class="ct-info-cell__value">${esc(data.availability) || '—'}</div>
    </div>
    <div class="ct-info-cell">
      <div class="ct-info-cell__label">Reference</div>
      <div class="ct-info-cell__value">${esc(data.referenceCode)}</div>
    </div>
  </div>

  <section class="ct-section">
    <div class="ct-expertise">
      <div class="ct-section-label">Expertise</div>
      <div>
        ${data.culinaryTags.length ? `
        <div class="ct-tag-group">
          <div class="ct-tag-group__title">Culinary specialties</div>
          <div class="ct-tag-row">
            ${culinaryTagsHtml}
          </div>
        </div>` : ''}
        ${data.missionTags.length ? `
        <div class="ct-tag-group">
          <div class="ct-tag-group__title">Mission types</div>
          <div class="ct-tag-row">
            ${missionTagsHtml}
          </div>
        </div>` : ''}
      </div>
    </div>
  </section>

  ${(data.whyParagraph1 || data.whyParagraph2) ? `
  <section class="ct-why">
    <div class="ct-why__inner">
      <div class="ct-section-label">Why we<br>recommend<br>this chef</div>
      <div class="ct-why__text">
        ${data.whyParagraph1 ? `<p>${esc(data.whyParagraph1)}</p>` : ''}
        ${data.whyParagraph2 ? `<p>${esc(data.whyParagraph2)}</p>` : ''}
      </div>
    </div>
  </section>` : ''}

  ${dishes.length ? `
  <section class="ct-gallery">
    <div class="ct-gallery__header">
      <div class="ct-section-label">Selected Work</div>
      <div>
        <h2 class="ct-gallery__title">Plates &amp; <em>moments.</em></h2>
        <p class="ct-gallery__desc">A curated selection of recent creations, each shaped by season and provenance.</p>
      </div>
    </div>
    <div class="ct-dishes-grid ct-count-${dishCount}">
${dishesHtml}
    </div>
  </section>` : ''}

  ${data.chefQuote ? `
  <section class="ct-signature">
    <div class="ct-signature__mark">&ldquo;</div>
    <blockquote class="ct-signature__quote">${esc(data.chefQuote)}</blockquote>
    <div class="ct-signature__attribution">The Chef</div>
  </section>` : ''}

  ${footerHtml}

  <div class="ct-confidential">
    ${isBranded
      ? 'Confidential document · For exclusive client use · Not to be distributed without prior authorisation'
      : 'Private document · Confidential · Not to be distributed without prior authorisation'}
  </div>

</article>

<script>
  function downloadPortfolioPdf() {
    var btn = document.querySelector('.ct-genbar__btn');
    if (btn) { btn.textContent = 'Generating…'; btn.style.pointerEvents = 'none'; }
    var url = new URL(window.location.href);
    url.searchParams.set('format', 'pdf');
    window.location.href = url.toString();
    setTimeout(function() {
      if (btn) { btn.textContent = 'Download as PDF'; btn.style.pointerEvents = ''; }
    }, 5000);
  }
</script>

</body>
</html>`;
}
