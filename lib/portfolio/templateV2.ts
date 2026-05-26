// lib/portfolio/templateV2.ts
//
// Portfolio chef « v2 » — template éditorial reconstruit fidèlement à partir
// de la spec « Chefs Talent. — Chef Portfolio Template » (classes ct-*,
// fonts Fraunces + Inter, accent coral, layout 3/4/5 dishes, scoped CSS).
//
// 2 modes :
//   - 'branded'    : logo + footer Chefs Talents (email + site)
//   - 'whitelabel' : aucun logo, aucun contact, aucune mention Chefs Talents
//                    → usage pour partager le portfolio à un client/concierge
//                       sans révéler la source.

const ROMANS = ['i.', 'ii.', 'iii.', 'iv.', 'v.'];

export type PortfolioV2Input = {
  referenceCode: string;          // ex: 'CT-209' (anonymisé)
  coverImageUrl: string;          // plat hero
  chefPhotoUrl: string;           // portrait chef
  headlineTitleHtml: string;      // titre cover (peut contenir <br>, <em>)
  coverSubtitle: string;          // tagline éditoriale
  bioLeadHtml: string;            // phrase d'attaque (peut contenir <span class="ct-accent">)
  bioParagraph1: string;
  bioParagraph2: string;
  experienceYears: number | null;
  languages: string[];            // ex: ['EN', 'ES', 'FR']
  availability: string;           // ex: 'Immediate', 'Sur demande'
  culinaryTags: string[];         // 1er tag aura l'accent (orange)
  missionTags: string[];
  whyParagraph1: string;
  whyParagraph2: string;
  dishes: Array<{ url: string; name: string }>; // 3 à 5
  chefQuote: string;
};

export type PortfolioMode = 'branded' | 'whitelabel';

const BRANDED_FOOTER = {
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
 * Toutes les styles sont scopées sous `.ct-portfolio` pour ne pas conflicter
 * si on intègre ce HTML dans une autre page (même si on l'ouvre seul).
 */
export function buildChefPortfolioHtmlV2(
  data: PortfolioV2Input,
  mode: PortfolioMode = 'branded',
): string {
  const isBranded = mode === 'branded';

  // Tags culinary : 1er tag = accent
  const culinaryTagsHtml = data.culinaryTags
    .map((t, i) => `<span class="ct-tag ${i === 0 ? 'ct-tag--accent' : ''}">${esc(t)}</span>`)
    .join('\n');

  const missionTagsHtml = data.missionTags
    .map((t) => `<span class="ct-tag">${esc(t)}</span>`)
    .join('\n');

  const dishCount = Math.min(5, Math.max(3, data.dishes.length || 3));
  const dishes = data.dishes.slice(0, dishCount);

  const dishesHtml = dishes
    .map(
      (d, i) => `
        <figure class="ct-dish">
          <img src="${esc(d.url)}" alt="${esc(d.name)}" crossorigin="anonymous" />
          <figcaption class="ct-dish__num">${ROMANS[i] || ''}</figcaption>
        </figure>`,
    )
    .join('\n');

  const expLine = data.experienceYears
    ? `<div class="ct-fact"><div class="ct-fact__num">${data.experienceYears}</div><div class="ct-fact__label">Years of experience</div></div>`
    : '';

  const langLine = data.languages.length
    ? `<div class="ct-fact"><div class="ct-fact__num">${esc(data.languages.join(' · '))}</div><div class="ct-fact__label">Languages</div></div>`
    : '';

  const availLine = data.availability
    ? `<div class="ct-fact"><div class="ct-fact__num">${esc(data.availability)}</div><div class="ct-fact__label">Availability</div></div>`
    : '';

  // Header logo : visible uniquement en mode branded
  const headerLogoHtml = isBranded
    ? `<img src="${esc(BRANDED_FOOTER.logoUrl)}" alt="${esc(BRANDED_FOOTER.brandName)}" class="ct-logo" />`
    : '';

  // Footer : différent selon mode
  const footerHtml = isBranded
    ? `
      <footer class="ct-footer">
        <div class="ct-footer__brand">${esc(BRANDED_FOOTER.brandName.toUpperCase())}</div>
        <div class="ct-footer__contact">
          <a href="mailto:${esc(BRANDED_FOOTER.contactEmail)}">${esc(BRANDED_FOOTER.contactEmail)}</a>
          &nbsp;·&nbsp;
          <span>${esc(BRANDED_FOOTER.website)}</span>
        </div>
      </footer>`
    : `
      <footer class="ct-footer ct-footer--whitelabel">
        <div class="ct-footer__brand">PRIVATE PORTFOLIO</div>
        <div class="ct-footer__contact">Confidential · For your eyes only</div>
      </footer>`;

  // Print bar : ne s'imprime pas, juste utile pour télécharger en PDF
  const printBarHtml = `
    <div class="ct-printbar no-print">
      <span class="ct-printbar__label">${isBranded ? 'Chef Portfolio · Confidential' : 'Private portfolio · Confidential'}</span>
      <button class="ct-printbar__btn" onclick="window.print()">Download as PDF</button>
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
    /* ───────────────────────────────────────────────────────────
       Portfolio v2 — scoped under .ct-portfolio
       Spec: Fraunces (serif editorial) + Inter (sans),
             accent --ct-coral, layout responsive,
             dish gallery 3/4/5 via ct-count-N
       ─────────────────────────────────────────────────────────── */
    .ct-printbar { position: sticky; top: 0; z-index: 100; background: #161616; color: #f4efe8; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; font-family: 'Inter', sans-serif; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; }
    .ct-printbar__btn { background: var(--ct-coral, #d97552); color: #fff; border: 0; padding: 8px 16px; border-radius: 999px; font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; font-weight: 500; }
    .ct-printbar__btn:hover { filter: brightness(1.08); }

    @media print { .no-print { display: none !important; } }

    body { margin: 0; background: #f4efe8; }

    .ct-portfolio {
      --ct-coral: #d97552;
      --ct-bg: #f4efe8;
      --ct-ink: #1a1a1a;
      --ct-ink-soft: #4a4a4a;
      --ct-ink-mute: #8a857c;
      --ct-paper: #fbf8f3;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--ct-ink);
      background: var(--ct-bg);
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 80px;
      line-height: 1.55;
    }

    .ct-portfolio * { box-sizing: border-box; }

    /* Header */
    .ct-portfolio .ct-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      margin-bottom: 32px;
    }
    .ct-portfolio .ct-ref {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ct-ink-mute);
    }
    .ct-portfolio .ct-logo { height: 28px; width: auto; }

    /* Cover */
    .ct-portfolio .ct-cover {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 40px;
      align-items: end;
      margin-bottom: 64px;
    }
    .ct-portfolio .ct-cover__image {
      position: relative;
      aspect-ratio: 4/5;
      overflow: hidden;
      border-radius: 4px;
    }
    .ct-portfolio .ct-cover__image img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ct-portfolio .ct-cover__text { padding-bottom: 16px; }
    .ct-portfolio .ct-cover__title {
      font-family: 'Fraunces', serif;
      font-weight: 400;
      font-size: clamp(40px, 5.5vw, 68px);
      line-height: 1.02;
      letter-spacing: -0.02em;
      margin: 0 0 24px 0;
      color: var(--ct-ink);
    }
    .ct-portfolio .ct-cover__title em { font-style: italic; color: var(--ct-coral); font-weight: 400; }
    .ct-portfolio .ct-cover__subtitle {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-weight: 300;
      font-size: 17px;
      line-height: 1.6;
      color: var(--ct-ink-soft);
      max-width: 460px;
      margin: 0;
    }

    /* Body 2-cols */
    .ct-portfolio .ct-body {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 64px;
      margin-bottom: 72px;
    }

    /* Left col : portrait + facts */
    .ct-portfolio .ct-portrait {
      aspect-ratio: 3/4;
      overflow: hidden;
      border-radius: 4px;
      margin-bottom: 28px;
    }
    .ct-portfolio .ct-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }

    .ct-portfolio .ct-facts {
      display: grid;
      gap: 20px;
      padding: 24px 0;
      border-top: 1px solid rgba(0,0,0,0.08);
    }
    .ct-portfolio .ct-fact__num {
      font-family: 'Fraunces', serif;
      font-size: 28px;
      font-weight: 400;
      letter-spacing: -0.01em;
      color: var(--ct-ink);
    }
    .ct-portfolio .ct-fact__label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ct-ink-mute);
      margin-top: 4px;
    }

    /* Right col : bio + tags */
    .ct-portfolio .ct-bio__label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ct-coral);
      margin-bottom: 16px;
      font-weight: 500;
    }
    .ct-portfolio .ct-bio__lead {
      font-family: 'Fraunces', serif;
      font-size: 30px;
      line-height: 1.25;
      font-weight: 300;
      letter-spacing: -0.01em;
      color: var(--ct-ink);
      margin: 0 0 28px 0;
    }
    .ct-portfolio .ct-accent { color: var(--ct-coral); font-style: italic; }
    .ct-portfolio .ct-bio p {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: var(--ct-ink-soft);
      margin: 0 0 18px 0;
    }

    .ct-portfolio .ct-tags-section { margin-top: 36px; }
    .ct-portfolio .ct-tags-section + .ct-tags-section { margin-top: 28px; }
    .ct-portfolio .ct-tags-label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ct-ink-mute);
      margin-bottom: 14px;
      font-weight: 500;
    }
    .ct-portfolio .ct-tag {
      display: inline-block;
      padding: 8px 16px;
      margin: 0 6px 8px 0;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 999px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      letter-spacing: 0.04em;
      color: var(--ct-ink);
      background: transparent;
    }
    .ct-portfolio .ct-tag--accent {
      background: var(--ct-coral);
      color: #fff;
      border-color: var(--ct-coral);
    }

    /* Why we recommend - dark section */
    .ct-portfolio .ct-why {
      background: #1a1a1a;
      color: #f4efe8;
      padding: 56px 56px;
      border-radius: 4px;
      margin: 0 -8px 64px;
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 48px;
      align-items: start;
    }
    .ct-portfolio .ct-why__label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ct-coral);
      font-weight: 500;
    }
    .ct-portfolio .ct-why__title {
      font-family: 'Fraunces', serif;
      font-size: 32px;
      font-weight: 300;
      line-height: 1.2;
      margin: 12px 0 0 0;
      color: #f4efe8;
    }
    .ct-portfolio .ct-why p {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      line-height: 1.75;
      color: rgba(244,239,232,0.85);
      margin: 0 0 18px 0;
    }
    .ct-portfolio .ct-why p:last-child { margin-bottom: 0; }

    /* Dishes gallery */
    .ct-portfolio .ct-dishes {
      margin-bottom: 72px;
    }
    .ct-portfolio .ct-dishes__label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ct-coral);
      margin-bottom: 28px;
      font-weight: 500;
    }
    .ct-portfolio .ct-dishes-grid {
      display: grid;
      gap: 20px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-3 {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: 320px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-4 {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: 280px 280px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-5 {
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: 280px 240px;
    }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(1) { grid-column: 1 / span 3; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(2) { grid-column: 4 / span 3; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(3) { grid-column: 1 / span 2; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(4) { grid-column: 3 / span 2; }
    .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish:nth-child(5) { grid-column: 5 / span 2; }

    .ct-portfolio .ct-dish {
      position: relative;
      overflow: hidden;
      border-radius: 4px;
      margin: 0;
    }
    .ct-portfolio .ct-dish img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .ct-portfolio .ct-dish__num {
      position: absolute;
      bottom: 14px;
      left: 16px;
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 17px;
      color: #fff;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }

    /* Quote */
    .ct-portfolio .ct-quote {
      margin: 80px 0 72px;
      padding: 0 8%;
      text-align: center;
    }
    .ct-portfolio .ct-quote p {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-weight: 300;
      font-size: 30px;
      line-height: 1.35;
      color: var(--ct-ink);
      margin: 0;
      letter-spacing: -0.005em;
    }
    .ct-portfolio .ct-quote__mark {
      font-family: 'Fraunces', serif;
      font-size: 48px;
      color: var(--ct-coral);
      line-height: 1;
      margin-bottom: 8px;
    }

    /* Footer */
    .ct-portfolio .ct-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid rgba(0,0,0,0.08);
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ct-ink-mute);
    }
    .ct-portfolio .ct-footer__brand { font-weight: 500; color: var(--ct-ink); }
    .ct-portfolio .ct-footer a { color: var(--ct-ink-soft); text-decoration: none; }
    .ct-portfolio .ct-footer a:hover { color: var(--ct-coral); }

    /* Responsive : below 880px collapse to single col */
    @media (max-width: 880px) {
      .ct-portfolio .ct-cover,
      .ct-portfolio .ct-body,
      .ct-portfolio .ct-why { grid-template-columns: 1fr; gap: 28px; }
      .ct-portfolio .ct-why { padding: 36px 28px; }
      .ct-portfolio .ct-dishes-grid.ct-count-3,
      .ct-portfolio .ct-dishes-grid.ct-count-4,
      .ct-portfolio .ct-dishes-grid.ct-count-5 {
        grid-template-columns: 1fr;
        grid-template-rows: none;
      }
      .ct-portfolio .ct-dishes-grid.ct-count-5 .ct-dish { grid-column: auto; }
      .ct-portfolio .ct-dish { aspect-ratio: 4/3; }
      .ct-portfolio .ct-cover__title { font-size: 38px; }
      .ct-portfolio .ct-bio__lead { font-size: 24px; }
      .ct-portfolio .ct-quote p { font-size: 22px; }
    }

    /* Whitelabel : aucune mention de la marque */
    .ct-portfolio.is-whitelabel .ct-logo { display: none; }
    .ct-portfolio .ct-footer--whitelabel { color: var(--ct-ink-mute); }
  </style>
</head>
<body>

${printBarHtml}

<article class="ct-portfolio ${isBranded ? 'is-branded' : 'is-whitelabel'}">

  <!-- Header -->
  <header class="ct-header">
    <div class="ct-ref">REF · ${esc(data.referenceCode)}</div>
    ${headerLogoHtml}
  </header>

  <!-- Cover -->
  <section class="ct-cover">
    <div class="ct-cover__image">
      <img src="${esc(data.coverImageUrl)}" alt="Signature dish" crossorigin="anonymous" />
    </div>
    <div class="ct-cover__text">
      <h1 class="ct-cover__title">${data.headlineTitleHtml}</h1>
      <p class="ct-cover__subtitle">${esc(data.coverSubtitle)}</p>
    </div>
  </section>

  <!-- Body -->
  <section class="ct-body">
    <!-- Left : portrait + facts -->
    <div>
      <div class="ct-portrait">
        <img src="${esc(data.chefPhotoUrl)}" alt="Chef portrait" crossorigin="anonymous" />
      </div>
      <div class="ct-facts">
        ${expLine}
        ${langLine}
        ${availLine}
      </div>
    </div>

    <!-- Right : bio + tags -->
    <div class="ct-bio">
      <div class="ct-bio__label">A few words</div>
      <p class="ct-bio__lead">${data.bioLeadHtml}</p>
      <p>${esc(data.bioParagraph1)}</p>
      ${data.bioParagraph2 ? `<p>${esc(data.bioParagraph2)}</p>` : ''}

      ${data.culinaryTags.length ? `
      <div class="ct-tags-section">
        <div class="ct-tags-label">Culinary signature</div>
        ${culinaryTagsHtml}
      </div>` : ''}

      ${data.missionTags.length ? `
      <div class="ct-tags-section">
        <div class="ct-tags-label">Mission formats</div>
        ${missionTagsHtml}
      </div>` : ''}
    </div>
  </section>

  <!-- Why we recommend -->
  ${(data.whyParagraph1 || data.whyParagraph2) ? `
  <section class="ct-why">
    <div>
      <div class="ct-why__label">Why this chef</div>
      <h2 class="ct-why__title">A selection beyond the&nbsp;CV</h2>
    </div>
    <div>
      ${data.whyParagraph1 ? `<p>${esc(data.whyParagraph1)}</p>` : ''}
      ${data.whyParagraph2 ? `<p>${esc(data.whyParagraph2)}</p>` : ''}
    </div>
  </section>` : ''}

  <!-- Dishes gallery -->
  ${dishes.length ? `
  <section class="ct-dishes">
    <div class="ct-dishes__label">Selected dishes</div>
    <div class="ct-dishes-grid ct-count-${dishCount}">
      ${dishesHtml}
    </div>
  </section>` : ''}

  <!-- Quote -->
  ${data.chefQuote ? `
  <section class="ct-quote">
    <div class="ct-quote__mark">&ldquo;</div>
    <p>${esc(data.chefQuote)}</p>
  </section>` : ''}

  ${footerHtml}

</article>

<script>
  // Auto-print si ?print=1
  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 600));
  }
</script>

</body>
</html>`;
}
