// lib/contracts/quoteTemplate.ts
//
// Template HTML du devis Chefs Talents — DA premium :
//   - Bleu marine #1c2840 (table headers, brand line)
//   - Or / cuivre #b8893a (séparateur fin sous le titre, signature)
//   - Crème #f3eee4 (cadre infos en haut, rows alternées)
//   - Beige #ebe4d6 (bandes intercalaires tableaux)
//   - Texte gris foncé #2c2c2c sur fond blanc cassé #fafafa
//
// Layout A4, rendu pixel-perfect via puppeteer en mode 'screen' viewport 794px.

const A4_WIDTH_PX = 794;

export type TariffOption = {
  label: string;          // "Profil Junior"
  ht_eur: number;         // 3583.33
  tva_eur: number;        // 716.67
  ttc_eur: number;        // 4300.00
  note?: string | null;
};

export type QuoteData = {
  // Identité
  reference: string;            // "N° CT-2026-0615-CONC"
  issued_at: string;            // "2 juin 2026"

  // Détail prestation
  intitule: string;
  lieu: string;
  dates_text: string;
  convives_text: string;
  rythme_text: string;
  langues_text: string;
  hebergement_text: string;

  // Émetteur
  emetteur_nom: string;
  emetteur_ville: string;
  emetteur_siret: string;
  emetteur_tva: string;

  // Destinataire
  destinataire_nom: string;
  destinataire_type: string;
  destinataire_adresse?: string;

  // Tarifs
  tariff_options: TariffOption[];

  // Courses
  courses_text: string;
  courses_provision_text: string;

  // Conditions
  conditions: string[];

  // Footer
  validity_date_text?: string;  // déjà formaté ex: "jusqu'au 5 juin 2026"
};

function esc(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDateLong(iso: string): string {
  // Accepte YYYY-MM-DD et renvoie "2 juin 2026"
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${Number(m[3])} ${months[Number(m[2]) - 1] || m[2]} ${m[1]}`;
}

export function renderQuote(d: QuoteData): string {
  // Rows DÉTAIL DE LA PRESTATION (label / valeur, alternées blanc/beige)
  const detailRows: Array<{ label: string; value: string }> = [
    { label: 'Intitulé', value: d.intitule },
    { label: 'Lieu', value: d.lieu },
    { label: 'Dates', value: d.dates_text },
    { label: 'Convives', value: d.convives_text },
    { label: 'Rythme', value: d.rythme_text },
    { label: 'Langues', value: d.langues_text },
    { label: 'Hébergement', value: d.hebergement_text },
  ].filter((r) => r.value && r.value.trim());

  const detailRowsHtml = detailRows
    .map(
      (r, i) => `
        <tr class="ct-row ${i % 2 === 0 ? 'ct-row--white' : 'ct-row--cream'}">
          <td class="ct-row__label">${esc(r.label)}</td>
          <td class="ct-row__value">${esc(r.value)}</td>
        </tr>`,
    )
    .join('');

  const tariffRowsHtml = d.tariff_options
    .map(
      (t, i) => `
        <tr class="ct-tariff-row ${i % 2 === 0 ? 'ct-tariff-row--white' : 'ct-tariff-row--cream'}">
          <td class="ct-tariff__label">${esc(t.label)}${t.note ? `<span class="ct-tariff__note"> — ${esc(t.note)}</span>` : ''}</td>
          <td class="ct-tariff__num">${fmtMoney(t.ht_eur)} EUR</td>
          <td class="ct-tariff__num">${fmtMoney(t.tva_eur)} EUR</td>
          <td class="ct-tariff__num ct-tariff__num--strong">${fmtMoney(t.ttc_eur)} EUR</td>
        </tr>`,
    )
    .join('');

  const conditionsHtml = d.conditions
    .filter((c) => c && c.trim())
    .map((c) => `<li>${esc(c)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${A4_WIDTH_PX}, initial-scale=1" />
  <title>Devis — ${esc(d.reference)}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      background: #fafafa;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #2c2c2c;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .ct-quote {
      --ct-navy: #1c2840;
      --ct-gold: #b8893a;
      --ct-cream: #f3eee4;
      --ct-cream-soft: #f8f4ec;
      --ct-beige: #ebe4d6;
      --ct-ink: #2c2c2c;
      --ct-muted: #6f6a62;
      --ct-line: #d9d1bf;

      width: ${A4_WIDTH_PX}px;
      margin: 0 auto;
      background: #fafafa;
      padding: 40px 48px 48px;
      font-size: 11px;
      line-height: 1.55;
    }

    /* ─── HEADER ─── */
    .ct-quote__header {
      text-align: center;
      margin-bottom: 18px;
    }
    .ct-quote__brand {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.32em;
      color: var(--ct-navy);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .ct-quote__tagline {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 11px;
      color: var(--ct-muted);
      font-weight: 300;
    }

    /* Trait or fin sous le header */
    .ct-quote__divider {
      height: 2px;
      background: var(--ct-gold);
      margin: 18px 0 12px;
    }

    /* ─── BLOC : N° + date d'émission ─── */
    .ct-quote__refbox {
      background: var(--ct-cream);
      padding: 14px 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--ct-navy);
    }
    .ct-quote__refbox__title {
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 10px;
    }
    .ct-quote__refbox__refnum {
      font-weight: 500;
      font-size: 12px;
    }

    /* ─── SECTION TITLES (h2) ─── */
    .ct-quote h2 {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.24em;
      color: var(--ct-navy);
      text-transform: uppercase;
      margin: 22px 0 10px;
    }

    /* ─── DÉTAIL DE LA PRESTATION ─── */
    .ct-quote__detail {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .ct-row__label {
      width: 30%;
      padding: 10px 14px;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.1em;
      color: var(--ct-muted);
      text-transform: uppercase;
      vertical-align: top;
    }
    .ct-row__value {
      padding: 10px 14px;
      font-family: 'Fraunces', serif;
      font-size: 12px;
      font-weight: 400;
      color: var(--ct-ink);
      vertical-align: top;
    }
    .ct-row--white { background: #ffffff; }
    .ct-row--cream { background: var(--ct-cream); }

    /* ─── ÉMETTEUR / DESTINATAIRE ─── */
    .ct-quote__parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .ct-quote__party {
      background: var(--ct-cream-soft);
      padding: 14px 16px;
      border-left: 2px solid var(--ct-gold);
    }
    .ct-quote__party__label {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ct-muted);
      font-weight: 600;
      margin-bottom: 6px;
    }
    .ct-quote__party__name {
      font-family: 'Fraunces', serif;
      font-size: 13px;
      font-weight: 500;
      color: var(--ct-ink);
      margin-bottom: 4px;
    }
    .ct-quote__party__meta {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      color: var(--ct-muted);
      line-height: 1.6;
    }

    /* ─── OPTIONS TARIFAIRES ─── */
    .ct-quote__tariffs {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 10px;
    }
    .ct-quote__tariffs thead th {
      background: var(--ct-navy);
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 11px 14px;
      text-align: left;
    }
    .ct-quote__tariffs thead th.ct-tariff__head-num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .ct-tariff-row td {
      padding: 11px 14px;
      font-family: 'Fraunces', serif;
      font-size: 12px;
      color: var(--ct-ink);
      vertical-align: middle;
    }
    .ct-tariff-row--white { background: #ffffff; }
    .ct-tariff-row--cream { background: var(--ct-beige); }
    .ct-tariff__label { font-weight: 500; }
    .ct-tariff__note { font-style: italic; color: var(--ct-muted); font-size: 10px; }
    .ct-tariff__num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
    }
    .ct-tariff__num--strong { font-weight: 600; color: var(--ct-navy); }

    .ct-quote__tariffs__caption {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-size: 10px;
      color: var(--ct-muted);
      margin: -6px 0 14px;
    }

    /* ─── COURSES ET APPROVISIONNEMENT ─── */
    .ct-quote__paragraph {
      font-family: 'Inter', sans-serif;
      font-size: 10.5px;
      line-height: 1.65;
      color: var(--ct-ink);
      margin: 4px 0 10px;
    }
    .ct-quote__paragraph + .ct-quote__paragraph { margin-top: 0; }

    /* ─── CONDITIONS ─── */
    .ct-quote__conditions {
      list-style: none;
      padding: 0;
      margin: 4px 0 14px;
    }
    .ct-quote__conditions li {
      position: relative;
      padding: 6px 0 6px 18px;
      font-family: 'Inter', sans-serif;
      font-size: 10.5px;
      line-height: 1.6;
      color: var(--ct-ink);
    }
    .ct-quote__conditions li::before {
      content: '•';
      position: absolute;
      left: 4px;
      top: 5px;
      color: var(--ct-gold);
      font-size: 14px;
    }

    /* ─── FOOTER ─── */
    .ct-quote__footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--ct-line);
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 9.5px;
      color: var(--ct-muted);
      line-height: 1.7;
      letter-spacing: 0.02em;
    }

    @media print {
      .ct-quote { padding: 32px 44px 36px; }
    }
  </style>
</head>
<body>

<article class="ct-quote">

  <!-- Header -->
  <header class="ct-quote__header">
    <div class="ct-quote__brand">Chefs Talents</div>
    <div class="ct-quote__tagline">Intermédiation de chefs privés haut de gamme</div>
  </header>
  <div class="ct-quote__divider"></div>

  <!-- Ref box -->
  <div class="ct-quote__refbox">
    <span class="ct-quote__refbox__title">Détail de la prestation</span>
    <span><span class="ct-quote__refbox__refnum">${esc(d.reference)}</span> · Émis le ${esc(d.issued_at)}</span>
  </div>

  <!-- Détail de la prestation (rows alternées) -->
  <table class="ct-quote__detail">
    <tbody>
      ${detailRowsHtml}
    </tbody>
  </table>

  <!-- DEVIS — émetteur / destinataire -->
  <h2>Devis</h2>
  <div class="ct-quote__parties">
    <div class="ct-quote__party">
      <div class="ct-quote__party__label">Émetteur</div>
      <div class="ct-quote__party__name">${esc(d.emetteur_nom)}</div>
      <div class="ct-quote__party__meta">
        ${esc(d.emetteur_ville)}<br>
        SIRET ${esc(d.emetteur_siret)}<br>
        ${esc(d.emetteur_tva)}
      </div>
    </div>
    <div class="ct-quote__party">
      <div class="ct-quote__party__label">Destinataire</div>
      <div class="ct-quote__party__name">${esc(d.destinataire_nom)}</div>
      <div class="ct-quote__party__meta">
        ${esc(d.destinataire_type)}
        ${d.destinataire_adresse ? `<br>${esc(d.destinataire_adresse)}` : ''}
      </div>
    </div>
  </div>

  <!-- OPTIONS TARIFAIRES -->
  ${d.tariff_options.length > 0 ? `
  <h2>Options tarifaires (au choix)</h2>
  <p class="ct-quote__tariffs__caption">Une seule option est à retenir par la conciergerie au moment de la confirmation.</p>
  <table class="ct-quote__tariffs">
    <thead>
      <tr>
        <th>Profil du chef</th>
        <th class="ct-tariff__head-num">Montant HT</th>
        <th class="ct-tariff__head-num">TVA 20 %</th>
        <th class="ct-tariff__head-num">Montant TTC</th>
      </tr>
    </thead>
    <tbody>
      ${tariffRowsHtml}
    </tbody>
  </table>` : ''}

  <!-- COURSES ET APPROVISIONNEMENT -->
  ${(d.courses_text || d.courses_provision_text) ? `
  <h2>Courses et approvisionnement</h2>
  ${d.courses_text ? `<p class="ct-quote__paragraph">${esc(d.courses_text)}</p>` : ''}
  ${d.courses_provision_text ? `<p class="ct-quote__paragraph"><em>${esc(d.courses_provision_text)}</em></p>` : ''}
  ` : ''}

  <!-- CONDITIONS -->
  ${conditionsHtml ? `
  <h2>Conditions</h2>
  <ul class="ct-quote__conditions">
    ${conditionsHtml}
  </ul>` : ''}

  <!-- Footer -->
  <div class="ct-quote__footer">
    ${esc(d.emetteur_nom)} · SIRET ${esc(d.emetteur_siret)}.<br>
    Bon pour accord à retourner daté et signé. Devis établi en euros.
    ${d.validity_date_text ? `<br><strong>Validité du devis : ${esc(d.validity_date_text)}</strong>` : ''}
  </div>

</article>

</body>
</html>`;
}

// ────────────────────────────────────────────────────────────
// Helpers : pré-remplissage depuis une client_request
// ────────────────────────────────────────────────────────────

export type RequestLike = {
  id?: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  client_type?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  guest_count?: number | null;
  mission_category?: string | null;
  service_level?: string | null;
  service_expectations?: string | null;
  preferred_language?: string | null;
  notes?: string | null;
  message?: string | null;
};

// Génère une référence unique au format CT-YYYY-MMDD-XXX
export function generateQuoteReference(opts?: {
  type?: 'CONC' | 'CLIENT' | 'ADHOC';
}): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = (opts?.type || 'CONC');
  return `CT-${y}-${m}${d}-${suffix}`;
}

// Profils tarifaires par défaut (3 niveaux Junior/Confirmé/Expérimenté)
// avec valeurs cohérentes avec ton exemple Cannes 7 jours.
// Ces valeurs sont éditables par l'admin après génération.
export function defaultTariffOptions(): TariffOption[] {
  return [
    { label: 'Profil Junior',       ht_eur: 3583.33, tva_eur: 716.67, ttc_eur: 4300.00 },
    { label: 'Profil Confirmé',     ht_eur: 3750.00, tva_eur: 750.00, ttc_eur: 4500.00 },
    { label: 'Profil Expérimenté',  ht_eur: 4000.00, tva_eur: 800.00, ttc_eur: 4800.00 },
  ];
}

export function defaultConditions(): string[] {
  return [
    "Modalités de règlement : 100 % à la signature (prestation en résidence, engagement longue durée).",
    "Validité du devis : précisée ci-dessous.",
    "Chef : professionnel sous statut indépendant (micro-entreprise), intervenant en toute autonomie.",
    "Inclus : coordination, sélection et mise à disposition du chef, élaboration des menus, service des repas.",
    "Non inclus : budget courses (cf. ci-dessus), boissons et prestations annexes éventuelles.",
  ];
}

export function defaultCoursesText(): string {
  return "Le budget courses fait l'objet d'une provision facturée à l'avance, puis refacturée au réel en fin de mission sur présentation des justificatifs (régularisation à la hausse ou à la baisse). Une carte de paiement est remise au chef pour l'ensemble des achats alimentaires ; le temps consacré aux courses est inclus dans la prestation.";
}

export function defaultCoursesProvision(guestCount?: number | null): string {
  const guests = guestCount && guestCount > 0 ? guestCount : 10;
  const low = guests * 150;
  const high = guests * 200;
  return `Provision indicative pour ${guests} couverts en full time : ${low.toLocaleString('fr-FR')} à ${high.toLocaleString('fr-FR')} EUR sur la semaine.`;
}

/**
 * Pré-remplit un devis depuis une client_request.
 * Tous les champs sont éditables après génération.
 */
export function buildQuoteDefaults(req?: RequestLike | null): Partial<QuoteData> & {
  intitule: string;
  lieu: string;
  dates_text: string;
  convives_text: string;
  rythme_text: string;
  langues_text: string;
  hebergement_text: string;
  emetteur_nom: string;
  emetteur_ville: string;
  emetteur_siret: string;
  emetteur_tva: string;
  destinataire_nom: string;
  destinataire_type: string;
  tariff_options: TariffOption[];
  courses_text: string;
  courses_provision_text: string;
  conditions: string[];
} {
  const guestCount = req?.guest_count ?? null;
  const guestText = guestCount && guestCount > 0
    ? `${guestCount} adulte${guestCount > 1 ? 's' : ''}`
    : '';

  const datesText = (() => {
    if (!req?.start_date) return '';
    const s = fmtDateLong(req.start_date);
    if (!req.end_date) return s;
    const e = fmtDateLong(req.end_date);
    const days = Math.ceil(
      (new Date(req.end_date).getTime() - new Date(req.start_date).getTime()) / 86400000,
    ) + 1;
    return `Du ${s.replace(/\s\d{4}$/, '')} au ${e} (${days} jour${days > 1 ? 's' : ''})`;
  })();

  const isB2B = req?.client_type === 'concierge' || req?.company_name;

  return {
    intitule: req?.mission_category === 'residence'
      ? 'Chef privé en résidence, service full time'
      : 'Prestation chef privé Chefs Talents',
    lieu: req?.location || '',
    dates_text: datesText,
    convives_text: guestText,
    rythme_text: req?.service_expectations || 'Full time, tous repas',
    langues_text: req?.preferred_language || 'Français / Anglais',
    hebergement_text: 'Chef local, ne dort pas sur place',

    emetteur_nom: 'SASU La Cantine de Thomas, Chefs Talents',
    emetteur_ville: 'Bordeaux, France',
    emetteur_siret: '898 320 726 00026',
    emetteur_tva: 'Assujettie à la TVA, TVA 20 %',

    destinataire_nom: req?.company_name || req?.full_name || '',
    destinataire_type: isB2B ? 'Prestation B2B, marque blanche' : 'Prestation B2C, particulier',

    tariff_options: defaultTariffOptions(),

    courses_text: defaultCoursesText(),
    courses_provision_text: defaultCoursesProvision(guestCount),

    conditions: defaultConditions(),
  };
}
