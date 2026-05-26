// lib/portfolio/templateV2.ts
//
// Portfolio chef « v2 » — template officiel Chefs Talent. (HTML/CSS fournis
// par le user le 26/05/2026). Reproduit fidèlement le template avec :
//   - Variables CSS exactes (--ct-coral #e74e2b, etc.)
//   - Polices Fraunces + Inter via Google Fonts (chargées dans le head)
//   - Layout responsive (collapse mono-col < 880px, fine-tune < 480px)
//   - Dish gallery adaptative : 3 / 4 / 5 dishes via ct-count-N
//
// 2 modes :
//   - 'branded'    : logo CT en header + footer (logo + contact email + site)
//   - 'whitelabel' : aucun logo, aucun contact, aucune mention « Chefs Talent »
//                    → header meta neutre, footer remplacé par un bandeau
//                       « Private Portfolio · Confidential ».

const ROMANS = ['i.', 'ii.', 'iii.', 'iv.', 'v.'];

export type PortfolioV2Input = {
  referenceCode: string;          // ex: 'CT-209' (anonymisé)
  coverImageUrl: string;          // plat hero (image droite du hero)
  chefPhotoUrl: string;           // portrait chef (cellule About)
  headlineTitleHtml: string;      // titre cover (peut contenir <br>, <em>)
  coverSubtitle: string;          // tagline éditoriale
  bioLeadHtml: string;            // phrase d'attaque (peut contenir <span class="accent">)
  bioParagraph1: string;
  bioParagraph2: string;
  experienceYears: number | null;
  languages: string[];            // ex: ['EN', 'ES', 'FR']
  availability: string;           // ex: 'Immediate'
  culinaryTags: string[];         // 1er tag aura la classe accent
  missionTags: string[];
  whyParagraph1: string;
  whyParagraph2: string;
  dishes: Array<{ url: string; name: string }>; // 3 à 5
  chefQuote: string;
  dateLabel?: string;             // ex: '26 / 05 / 2026' (optionnel, affiché si fourni)
};

export type PortfolioMode = 'branded' | 'whitelabel';

const BRANDED = {
  logoUrl: '/images/logo.png',
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

/**
 * Génère le HTML complet du portfolio v2.
 * Toutes les styles sont scopées sous `.ct-portfolio`.
 */
export function buildChefPortfolioHtmlV2(
  data: PortfolioV2Input,
  mode: PortfolioMode = 'branded',
): string {
  const isBranded = mode === 'branded';

  // Tags culinary : 1er tag = accent
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
        <img src="${esc(d.url)}" alt="${esc(d.name)}" referrerpolicy="no-referrer" loading="eager" />
        <figcaption class="ct-dish__num">${ROMANS[i] || ''}</figcaption>
      </figure>`,
    )
    .join('\n');

  // Header : logotype texte (élégant + 0 dépendance image)
  // En whitelabel : aucune mention de la marque.
  const headerHtml = isBranded
    ? `
  <header class="ct-header">
    <div class="ct-header__logotype">Chefs Talents<span class="ct-logotype-dot">.</span></div>
    <div class="ct-header__meta">
      <div>Private Chef Portfolio</div>
      <div>Ref. <span class="ct-ref">${esc(data.referenceCode)}</span></div>
      <div>Confidential · Client use only</div>
    </div>
  </header>`
    : `
  <header class="ct-header ct-header--whitelabel">
    <div class="ct-header__brand-placeholder">PRIVATE PORTFOLIO</div>
    <div class="ct-header__meta">
      <div>Chef Selection</div>
      <div>Ref. <span class="ct-ref">${esc(data.referenceCode)}</span></div>
      <div>Confidential · Recipient use only</div>
    </div>
  </header>`;

  // Footer : logotype texte également
  const footerHtml = isBranded
    ? `
  <footer class="ct-footer">
    <div class="ct-footer__logotype">Chefs Talents<span class="ct-logotype-dot">.</span></div>
    <div class="ct-footer__contact">
      <div>${esc(BRANDED.contactEmail)}</div>
      <div>${esc(BRANDED.website)}</div>
    </div>
  </footer>`
    : `
  <footer class="ct-footer ct-footer--whitelabel">
    <div class="ct-footer__brand">PRIVATE PORTFOLIO</div>
    <div class="ct-footer__contact">
      <div>Confidential</div>
      <div>For your eyes only</div>
    </div>
  </footer>`;

  // Cell « Reference » de l'info-grid : en branded on affiche CT-XXX,
  // en whitelabel on garde le code anonymisé tel quel (utile pour le suivi)
  const refCellValue = esc(data.referenceCode);

  // Print bar (sticky en haut, ne s'imprime pas).
  // Le bouton "Download as PDF" redirige vers la même URL avec ?format=pdf →
  // le serveur génère le PDF via puppeteer et le télécharge directement,
  // SANS passer par le print dialog du navigateur (donc plus de header/footer
  // browser, polices intégrées, rendu identique partout).
  const printBarHtml = `
  <div class="ct-printbar no-print">
    <span class="ct-printbar__label">${isBranded ? 'Chef Portfolio · Confidential' : 'Private portfolio · Confidential'}</span>
    <a href="javascript:void(0)" onclick="downloadPortfolioPdf()" class="ct-printbar__btn">Download as PDF</a>
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${isBranded ? 'Chef Portfolio — Chefs Talents' : `Chef Portfolio — ${esc(data.referenceCode)}`}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

  <style>
    /* ────────────────────────────────────────────────────────
       Print bar (sticky, ne s'imprime pas)
       ──────────────────────────────────────────────────────── */
    body { margin: 0; background: #f4efe6; }
    .ct-printbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1a1814;
      color: #f4efe6;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .ct-printbar__btn {
      background: #e74e2b;
      color: #fff;
      border: 0;
      padding: 8px 18px;
      border-radius: 999px;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      cursor: pointer;
      font-weight: 500;
    }
    .ct-printbar__btn:hover { filter: brightness(1.08); }
    @media print { .no-print { display: none !important; } }

    /* ────────────────────────────────────────────────────────
       CHEFS TALENT. — Chef Portfolio Component Styles
       All styles scoped under .ct-portfolio to avoid conflicts
       ──────────────────────────────────────────────────────── */
    .ct-portfolio {
      --ct-cream: #f4efe6;
      --ct-cream-soft: #ebe4d6;
      --ct-ink: #1a1814;
      --ct-ink-soft: #3a342c;
      --ct-coral: #e74e2b;
      --ct-coral-soft: #f5d4c7;
      --ct-line: #d9d1bf;
      --ct-muted: #6b6358;

      background: var(--ct-cream);
      color: var(--ct-ink);
      font-family: 'Inter', sans-serif;
      font-weight: 300;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
      max-width: 1100px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .ct-portfolio *,
    .ct-portfolio *::before,
    .ct-portfolio *::after { box-sizing: border-box; }
    .ct-portfolio img { max-width: 100%; display: block; }

    /* ====== HEADER ====== */
    .ct-portfolio .ct-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 32px 48px 24px;
      border-bottom: 1px solid var(--ct-line);
    }
    /* Logotype texte (remplace l'image logo qui n'existe pas en local) */
    .ct-portfolio .ct-header__logotype,
    .ct-portfolio .ct-footer__logotype {
      font-family: 'Fraunces', serif;
      font-weight: 400;
      font-size: 26px;
      color: var(--ct-ink);
      letter-spacing: -0.015em;
      line-height: 1;
    }
    .ct-portfolio .ct-footer__logotype { font-size: 18px; }
    .ct-portfolio .ct-logotype-dot {
      color: var(--ct-coral);
      font-weight: 500;
    }
    .ct-portfolio .ct-header__brand-placeholder {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ct-muted);
      font-weight: 500;
    }
    .ct-portfolio .ct-header__meta {
      text-align: right;
      font-size: 10px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ct-muted);
      line-height: 1.8;
    }
    .ct-portfolio .ct-header__meta .ct-ref {
      color: var(--ct-coral);
      font-weight: 500;
    }

    /* ====== HERO COVER ====== */
    .ct-portfolio .ct-hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      min-height: 520px;
    }
    .ct-portfolio .ct-hero__text {
      padding: 56px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .ct-portfolio .ct-hero__eyebrow {
      font-size: 11px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ct-coral);
      margin-bottom: 24px;
      font-weight: 500;
    }
    .ct-portfolio .ct-hero__title {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: 52px;
      line-height: 0.95;
      letter-spacing: -0.025em;
      margin: 0 0 24px;
      color: var(--ct-ink);
    }
    .ct-portfolio .ct-hero__title em {
      font-style: italic;
      font-weight: 400;
      color: var(--ct-coral);
    }
    .ct-portfolio .ct-hero__subtitle {
      font-family: 'Fraunces', serif;
      font-size: 15px;
      font-weight: 300;
      color: var(--ct-ink-soft);
      line-height: 1.55;
      font-style: italic;
      max-width: 360px;
      margin: 0;
    }
    .ct-portfolio .ct-hero__ornament {
      margin-top: 36px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .ct-portfolio .ct-hero__ornament-line {
      width: 48px;
      height: 1px;
      background: var(--ct-coral);
    }
    .ct-portfolio .ct-hero__ornament-text {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 13px;
      color: var(--ct-coral);
      letter-spacing: 0.06em;
    }
    .ct-portfolio .ct-hero__image {
      overflow: hidden;
      background: var(--ct-cream-soft);
    }
    .ct-portfolio .ct-hero__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    /* ====== ABOUT SECTION ====== */
    .ct-portfolio .ct-section {
      padding: 56px 48px;
      border-top: 1px solid var(--ct-line);
    }
    .ct-portfolio .ct-section-label {
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ct-coral);
      font-weight: 500;
      line-height: 1.6;
    }
    .ct-portfolio .ct-about {
      display: grid;
      grid-template-columns: 140px 1fr 200px;
      gap: 40px;
      align-items: start;
    }
    .ct-portfolio .ct-about__body {
      font-family: 'Fraunces', serif;
      font-size: 14px;
      line-height: 1.55;
      font-weight: 300;
      color: var(--ct-ink-soft);
      letter-spacing: -0.005em;
    }
    .ct-portfolio .ct-about__body .ct-lead {
      font-size: 19px;
      line-height: 1.35;
      color: var(--ct-ink);
      font-weight: 400;
      margin: 0 0 16px;
      letter-spacing: -0.015em;
    }
    .ct-portfolio .ct-about__body p { margin: 0; }
    .ct-portfolio .ct-about__body p + p { margin-top: 14px; }
    .ct-portfolio .ct-about__body .ct-accent,
    .ct-portfolio .ct-about__body .accent {
      color: var(--ct-coral);
      font-style: italic;
    }
    .ct-portfolio .ct-portrait {
      width: 200px;
      height: 260px;
      overflow: hidden;
      background: var(--ct-cream-soft);
      position: relative;
    }
    .ct-portfolio .ct-portrait img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }
    .ct-portfolio .ct-portrait-caption {
      font-family: 'Fraunces', serif;
      font-size: 11px;
      font-style: italic;
      color: var(--ct-muted);
      margin-top: 10px;
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
      margin: 0 48px;
    }
    .ct-portfolio .ct-info-cell {
      background: var(--ct-cream);
      padding: 20px;
    }
    .ct-portfolio .ct-info-cell__label {
      font-size: 9px;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      color: var(--ct-muted);
      margin-bottom: 8px;
      font-weight: 500;
    }
    .ct-portfolio .ct-info-cell__value {
      font-family: 'Fraunces', serif;
      font-size: 18px;
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
      grid-template-columns: 140px 1fr;
      gap: 40px;
    }
    .ct-portfolio .ct-tag-group + .ct-tag-group {
      margin-top: 24px;
    }
    .ct-portfolio .ct-tag-group__title {
      font-family: 'Fraunces', serif;
      font-size: 13px;
      font-style: italic;
      color: var(--ct-ink-soft);
      margin-bottom: 12px;
    }
    .ct-portfolio .ct-tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ct-portfolio .ct-tag {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      padding: 7px 16px;
      border: 1px solid var(--ct-ink);
      border-radius: 100px;
      color: var(--ct-ink);
      letter-spacing: 0.04em;
      font-weight: 400;
      background: transparent;
      white-space: nowrap;
      display: inline-block;
    }
    .ct-portfolio .ct-tag.ct-tag--accent,
    .ct-portfolio .ct-tag.accent {
      background: var(--ct-coral);
      border-color: var(--ct-coral);
      color: var(--ct-cream);
    }

    /* ====== WHY WE RECOMMEND ====== */
    .ct-portfolio .ct-why {
      background: var(--ct-ink);
      color: var(--ct-cream);
      padding: 56px 48px;
    }
    .ct-portfolio .ct-why .ct-section-label {
      color: var(--ct-coral);
    }
    .ct-portfolio .ct-why__inner {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 40px;
    }
    .ct-portfolio .ct-why__text {
      font-family: 'Fraunces', serif;
      font-size: 15px;
      line-height: 1.55;
      font-weight: 300;
      color: var(--ct-cream);
      letter-spacing: -0.005em;
    }
    .ct-portfolio .ct-why__text .ct-highlight,
    .ct-portfolio .ct-why__text .highlight {
      color: var(--ct-coral);
      font-style: italic;
    }
    .ct-portfolio .ct-why__text p { margin: 0; }
    .ct-portfolio .ct-why__text p + p { margin-top: 14px; }

    /* ====== GALLERY ====== */
    .ct-portfolio .ct-gallery { padding: 56px 48px; }
    .ct-portfolio .ct-gallery__header {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 40px;
      margin-bottom: 32px;
    }
    .ct-portfolio .ct-gallery__title {
      font-family: 'Fraunces', serif;
      font-size: 36px;
      font-weight: 300;
      line-height: 1;
      letter-spacing: -0.02em;
      color: var(--ct-ink);
      margin: 0;
    }
    .ct-portfolio .ct-gallery__title em {
      font-style: italic;
      color: var(--ct-coral);
    }
    .ct-portfolio .ct-gallery__desc {
      font-family: 'Fraunces', serif;
      font-size: 13px;
      color: var(--ct-ink-soft);
      font-style: italic;
      margin: 12px 0 0;
      max-width: 440px;
    }

    /* Gallery grids — adaptive */
    .ct-portfolio .ct-dishes-grid {
      display: grid;
      gap: 12px;
    }

    /* 4 dishes — 2 col + 4ème full-width */
    .ct-portfolio .ct-dishes-grid.ct-count-4 {
      grid-template-columns: 1.3fr 1fr;
      grid-template-rows: 300px 220px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(1) {
      grid-column: 1; grid-row: 1 / 3;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(2) {
      grid-column: 2; grid-row: 1;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(3) {
      grid-column: 2; grid-row: 2;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(4) {
      grid-column: 1 / 3; grid-row: 3; height: 280px;
    }

    /* 5 dishes — éditorial asymétrique */
    .ct-portfolio .ct-dishes-grid.ct-count-5 {
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: 280px 240px 240px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(1) { grid-column: 1 / 4; grid-row: 1; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(2) { grid-column: 4 / 7; grid-row: 1; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(3) { grid-column: 1 / 3; grid-row: 2; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(4) { grid-column: 3 / 5; grid-row: 2; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(5) { grid-column: 5 / 7; grid-row: 2; }

    /* 3 dishes — fallback */
    .ct-portfolio .ct-dishes-grid.ct-count-3 {
      grid-template-columns: 1.4fr 1fr;
      grid-template-rows: 250px 200px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-3 .ct-dish:nth-child(1) { grid-column: 1; grid-row: 1 / 3; }
    .ct-portfolio .ct-dishes-grid.ct-count-3 .ct-dish:nth-child(2) { grid-column: 2; grid-row: 1; }
    .ct-portfolio .ct-dishes-grid.ct-count-3 .ct-dish:nth-child(3) { grid-column: 2; grid-row: 2; }

    .ct-portfolio .ct-dish {
      position: relative;
      overflow: hidden;
      background: var(--ct-cream-soft);
      margin: 0;
    }
    .ct-portfolio .ct-dish img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }
    .ct-portfolio .ct-dish:hover img { transform: scale(1.03); }
    .ct-portfolio .ct-dish__num {
      position: absolute;
      top: 12px;
      left: 14px;
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 12px;
      color: rgba(255,255,255,0.92);
      text-shadow: 0 1px 4px rgba(0,0,0,0.55);
      letter-spacing: 0.04em;
      margin: 0;
    }

    /* ====== SIGNATURE QUOTE ====== */
    .ct-portfolio .ct-signature {
      text-align: center;
      padding: 56px 48px;
      border-top: 1px solid var(--ct-line);
    }
    .ct-portfolio .ct-signature__mark {
      font-family: 'Fraunces', serif;
      font-size: 42px;
      color: var(--ct-coral);
      line-height: 0.4;
      margin-bottom: 28px;
    }
    .ct-portfolio .ct-signature__quote {
      font-family: 'Fraunces', serif;
      font-size: 22px;
      font-weight: 300;
      font-style: italic;
      line-height: 1.4;
      color: var(--ct-ink);
      max-width: 640px;
      margin: 0 auto 20px;
      letter-spacing: -0.01em;
    }
    .ct-portfolio .ct-signature__attribution {
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ct-muted);
      font-weight: 500;
    }

    /* ====== FOOTER ====== */
    .ct-portfolio .ct-footer {
      padding: 32px 48px;
      border-top: 1px solid var(--ct-line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--ct-muted);
    }
    .ct-portfolio .ct-footer__brand {
      font-weight: 500;
      color: var(--ct-ink);
      letter-spacing: 0.18em;
    }
    .ct-portfolio .ct-footer__contact {
      text-align: right;
      line-height: 1.8;
    }
    .ct-portfolio .ct-footer__contact a {
      color: var(--ct-ink);
      text-decoration: none;
      font-weight: 500;
    }
    .ct-portfolio .ct-confidential {
      text-align: center;
      font-size: 9px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ct-muted);
      padding: 16px 48px 24px;
      border-top: 1px dashed var(--ct-line);
    }

    /* Whitelabel : aucun logotype CT (déjà géré par la non-insertion
       des éléments .ct-header__logotype / .ct-footer__logotype dans le HTML)
       — règle conservée par sécurité au cas où le HTML évolue. */
    .ct-portfolio.is-whitelabel .ct-header__logotype,
    .ct-portfolio.is-whitelabel .ct-footer__logotype { display: none; }

    /* ────────────────────────────────────────────────────────
       PRINT-SPECIFIC RULES
       Objectif : un PDF A4 unifié, sans header/footer browser,
       proportions adaptées papier (max 2-3 pages), page-breaks
       contrôlés (aucune section coupée).
       ──────────────────────────────────────────────────────── */
    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      html, body {
        margin: 0;
        padding: 0;
        background: var(--ct-cream, #f4efe6);
      }

      /* Cache la barre d'impression et tout élément marqué no-print */
      .no-print, .ct-printbar { display: none !important; }

      /* Contenu prend toute la page sans marge interne (les marges
         viennent du CSS de chaque section pour garder la mise en page) */
      .ct-portfolio {
        max-width: none !important;
        margin: 0 auto !important;
        width: 100%;
        background: var(--ct-cream);
        /* Force le rendu des couleurs (sinon le print enlève les
           backgrounds et l'orange devient gris) */
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }

      /* Force le rendu des backgrounds colorés sur ALL children */
      .ct-portfolio *,
      .ct-portfolio *::before,
      .ct-portfolio *::after {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Tailles ajustées pour A4 (210mm × 297mm) */
      .ct-portfolio .ct-header { padding: 14mm 16mm 8mm; }
      .ct-portfolio .ct-hero { min-height: 0; }
      .ct-portfolio .ct-hero__text { padding: 16mm; }
      .ct-portfolio .ct-hero__title { font-size: 36pt; line-height: 0.95; }
      .ct-portfolio .ct-hero__subtitle { font-size: 11pt; }
      .ct-portfolio .ct-hero__ornament { margin-top: 6mm; }

      .ct-portfolio .ct-section { padding: 12mm 16mm; }
      .ct-portfolio .ct-about__body .ct-lead { font-size: 14pt; }
      .ct-portfolio .ct-about__body { font-size: 10.5pt; }
      .ct-portfolio .ct-portrait { width: 50mm; height: 65mm; }

      .ct-portfolio .ct-info-grid { margin: 0 16mm; }
      .ct-portfolio .ct-info-cell { padding: 5mm; }
      .ct-portfolio .ct-info-cell__value { font-size: 13pt; }

      .ct-portfolio .ct-why { padding: 12mm 16mm; }
      .ct-portfolio .ct-why__text { font-size: 11pt; }
      .ct-portfolio .ct-gallery { padding: 12mm 16mm; }
      .ct-portfolio .ct-gallery__title { font-size: 26pt; }
      .ct-portfolio .ct-gallery__desc { font-size: 10pt; }

      /* Dishes : hauteurs réduites pour tenir sur la page */
      .ct-portfolio .ct-dishes-grid.ct-count-3 { grid-template-rows: 65mm 50mm; }
      .ct-portfolio .ct-dishes-grid.ct-count-4 { grid-template-rows: 60mm 50mm; }
      .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish:nth-child(4) { height: 55mm; }
      .ct-portfolio .ct-dishes-grid.ct-count-5 { grid-template-rows: 60mm 50mm; }

      .ct-portfolio .ct-signature { padding: 12mm 20mm; }
      .ct-portfolio .ct-signature__quote { font-size: 16pt; }

      .ct-portfolio .ct-footer { padding: 8mm 16mm; }
      .ct-portfolio .ct-confidential { padding: 4mm 16mm 8mm; }

      /* Pas d'animation hover en print */
      .ct-portfolio .ct-dish img { transition: none !important; }
      .ct-portfolio .ct-dish:hover img { transform: none !important; }

      /* Page breaks : on évite de couper au milieu d'une section */
      .ct-portfolio .ct-hero,
      .ct-portfolio .ct-section,
      .ct-portfolio .ct-info-grid,
      .ct-portfolio .ct-why,
      .ct-portfolio .ct-gallery,
      .ct-portfolio .ct-signature,
      .ct-portfolio .ct-footer {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      /* Les dishes individuelles ne se coupent jamais */
      .ct-portfolio .ct-dish { page-break-inside: avoid; break-inside: avoid; }

      /* Le bloc "Why we recommend" démarre toujours sur une nouvelle page
         pour aérer le rendu — ça donne un layout en 2 pages naturelles :
         Page 1 : Hero + About + Info grid + Expertise
         Page 2 : Why + Gallery + Signature + Footer */
      .ct-portfolio .ct-why { page-break-before: always; break-before: page; }
    }

    /* ====== RESPONSIVE ====== */
    @media (max-width: 880px) {
      .ct-portfolio .ct-header,
      .ct-portfolio .ct-section,
      .ct-portfolio .ct-why,
      .ct-portfolio .ct-gallery,
      .ct-portfolio .ct-signature,
      .ct-portfolio .ct-footer,
      .ct-portfolio .ct-confidential {
        padding-left: 24px;
        padding-right: 24px;
      }
      .ct-portfolio .ct-info-grid { margin: 0 24px; }
      .ct-portfolio .ct-hero { grid-template-columns: 1fr; min-height: auto; }
      .ct-portfolio .ct-hero__image { height: 360px; order: -1; }
      .ct-portfolio .ct-hero__text { padding: 40px 24px; }
      .ct-portfolio .ct-hero__title { font-size: 38px; }
      .ct-portfolio .ct-about { grid-template-columns: 1fr; gap: 24px; }
      .ct-portfolio .ct-portrait { width: 100%; max-width: 240px; height: 300px; }
      .ct-portfolio .ct-info-grid { grid-template-columns: repeat(2, 1fr); }
      .ct-portfolio .ct-expertise,
      .ct-portfolio .ct-why__inner,
      .ct-portfolio .ct-gallery__header { grid-template-columns: 1fr; gap: 16px; }
      .ct-portfolio .ct-gallery__title { font-size: 28px; }
      .ct-portfolio .ct-dishes-grid.ct-count-4,
      .ct-portfolio .ct-dishes-grid.ct-count-5,
      .ct-portfolio .ct-dishes-grid.ct-count-3 {
        grid-template-columns: 1fr;
        grid-template-rows: none;
      }
      .ct-portfolio .ct-dishes-grid.ct-count-4 .ct-dish,
      .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish,
      .ct-portfolio .ct-dishes-grid.ct-count-3 .ct-dish {
        grid-column: 1; grid-row: auto; height: 280px;
      }
      .ct-portfolio .ct-footer { flex-direction: column; gap: 20px; text-align: center; }
      .ct-portfolio .ct-footer__contact { text-align: center; }
    }
    @media (max-width: 480px) {
      .ct-portfolio .ct-hero__title { font-size: 30px; }
      .ct-portfolio .ct-about__body .ct-lead { font-size: 16px; }
      .ct-portfolio .ct-signature__quote { font-size: 17px; }
    }
  </style>
</head>
<body>

${printBarHtml}

<article class="ct-portfolio ${isBranded ? 'is-branded' : 'is-whitelabel'}">

  ${headerHtml}

  <!-- HERO -->
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
      <img src="${esc(data.coverImageUrl)}" alt="Featured dish" referrerpolicy="no-referrer" loading="eager">
    </div>
  </section>

  <!-- ABOUT THE CHEF -->
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
          <img src="${esc(data.chefPhotoUrl)}" alt="The Chef" referrerpolicy="no-referrer" loading="eager">
        </div>
        <div class="ct-portrait-caption">The Chef · on location</div>
      </div>
    </div>
  </section>

  <!-- INFO GRID -->
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
      <div class="ct-info-cell__value">${refCellValue}</div>
    </div>
  </div>

  <!-- EXPERTISE -->
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
  <!-- WHY WE RECOMMEND -->
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
  <!-- GALLERY -->
  <section class="ct-gallery">
    <div class="ct-gallery__header">
      <div class="ct-section-label">Selected Work</div>
      <div>
        <h2 class="ct-gallery__title">Plates &amp; <em>moments.</em></h2>
        <p class="ct-gallery__desc">A curated selection of recent creations, from intimate plated courses to large-format catering, each shaped by season and provenance.</p>
      </div>
    </div>
    <div class="ct-dishes-grid ct-count-${dishCount}">
${dishesHtml}
    </div>
  </section>` : ''}

  ${data.chefQuote ? `
  <!-- SIGNATURE QUOTE -->
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
  // ───────────────────────────────────────────────────────────
  // Download PDF : appelle l'endpoint serveur ?format=pdf qui
  // génère un PDF parfait (sans header/footer browser, polices
  // intégrées) puis force le téléchargement.
  // ───────────────────────────────────────────────────────────
  function downloadPortfolioPdf() {
    var btn = document.querySelector('.ct-printbar__btn');
    var originalText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Generating…'; btn.style.pointerEvents = 'none'; }

    // L'URL courante est /api/admin/chefs/[id]/portfolio?mode=...
    // On ajoute &format=pdf. Le navigateur déclenche le download.
    var url = new URL(window.location.href);
    url.searchParams.set('format', 'pdf');
    // On utilise window.location pour respecter les cookies admin
    // (sinon un fetch demanderait l'auth Bearer manuellement).
    window.location.href = url.toString();

    // Rétablit le bouton après 5s si l'utilisateur revient
    setTimeout(function() {
      if (btn) { btn.textContent = originalText; btn.style.pointerEvents = ''; }
    }, 5000);
  }

  // Image fallback : si une image fail (404, network), on remplace par
  // un placeholder gris uni pour ne pas casser le layout.
  document.querySelectorAll('.ct-portfolio img').forEach(function(img) {
    img.addEventListener('error', function() {
      img.style.display = 'none';
      var parent = img.parentElement;
      if (parent && !parent.querySelector('.ct-img-fallback')) {
        var fb = document.createElement('div');
        fb.className = 'ct-img-fallback';
        fb.style.cssText = 'width:100%;height:100%;background:linear-gradient(135deg,#ebe4d6 0%,#d9d1bf 100%);display:flex;align-items:center;justify-content:center;color:#6b6358;font-family:Fraunces,serif;font-style:italic;font-size:14px;';
        fb.textContent = 'Image unavailable';
        parent.appendChild(fb);
      }
    });
  });

  // Auto-print si ?print=1 (legacy, conservé pour compat)
  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 600));
  }
</script>

</body>
</html>`;
}
