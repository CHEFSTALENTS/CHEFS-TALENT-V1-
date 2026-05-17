// app/admin/missions/[id]/_lib/contracts.ts
//
// Types et templates HTML pour le panneau Contrats du back-office.
// Champs variables : pré-remplis depuis la mission au premier affichage,
// puis sauvegardés en missions.contracts_data (JSONB) à chaque édition.

export type ContractKind = 'essai' | 'chef' | 'client';

export type EssaiData = {
  // En-tête / mise en forme
  contractTypeLabel: string;        // "ACCORD D'ESSAI & DE NON-CONTOURNEMENT"
  contractSubtitle: string;         // "Chef privé résident · Résidence privée Paris 7ème — MAI 2026"
  signatureCity: string;            // "Bordeaux"
  signatureDate: string;            // YYYY-MM-DD

  // Parties
  agencyRep: string;                // "Monsieur Thomas Delcroix"
  agencySiret: string;              // "89832072600026"
  clientCivilite: 'Monsieur' | 'Madame' | '';
  clientName: string;
  clientCompany: string;
  chefName: string;
  chefEmail: string;

  // Article 1 — Objet
  recruitmentContext: string;       // ex: "un poste de chef privé résident à Paris, 7ème arrondissement"

  // Article 2 — Modalités de l'essai
  trialDate: string;                // YYYY-MM-DD
  trialLocation: string;            // "Résidence privée : Paris 7ème arrondissement"
  trialService: string;             // "Déjeuner et dîner pour 2 personnes"
  trialStyle: string;               // "Cuisine du quotidien simple..."
  trialAmountHt: number | null;     // indemnité essai (€ HT) — optionnel
  trialAmountShow: boolean;         // afficher ou non l'indemnité dans le contrat
  expensesIncluded: boolean;        // frais d'essai inclus / refacturés

  // Article 3 — Mission envisagée
  missionLocation: string;          // "Résidence privée Paris 7ème arrondissement"
  missionStart: string;             // "Le lendemain de l'essai (lundi)"
  missionDuration: string;          // "30 ou 45 jours selon les conditions définies dans le contrat de mission"
  missionRythme: string;            // "7 jours sur 7, déjeuner et dîner quotidiens"
  missionRemuneration: string;      // "Définie et communiquée par l'Agence exclusivement..."

  // Conditions de règlement — toujours éditable (varie selon durée de mission :
  // hebdomadaire, à la quinzaine, fin de mission, etc.)
  paymentTerms: string;

  // Article 4 — Non-contournement
  sanctionContournementPct: number; // 50

  // Article 6 — Droit applicable
  juridiction: string;              // "Bordeaux"

  // Custom
  customClauses: string;
};

export type ChefContractData = {
  // En-tête
  contractRef: string;                // "2506_Ibiza_Lucas.U"
  emissionDate: string;               // YYYY-MM-DD

  // Agence (pré-rempli depuis /legal, overridable)
  agencyDenomination: string;         // "SASU Chefs Talents"
  agencyAddress: string;              // "73 rue Porte Dijeaux, 33000 Bordeaux"
  agencyRep: string;                  // "Thomas Delcroix"
  agencyPhone: string;                // "+33 6 23 84 61 70"
  agencyEmail: string;                // "contact@chefstalents.com"
  agencySiret: string;                // "89832072600026"

  // Chef
  chefName: string;                   // "LUCAS UCHÔA"
  chefRef: string;                    // "REF.CT_LUCAS.U"

  // Article 1 — Objet de la mission
  missionLocation: string;            // "Ibiza, Espagne"
  startDate: string;                  // YYYY-MM-DD
  endDate: string;                    // YYYY-MM-DD
  missionObjectives: string;          // texte libre, une puce par ligne

  // Article 2 — Conditions de la mission
  lieu: string;                       // "Finca privée — Ibiza, Espagne"
  rythme: string;                     // "6 jours travaillés sur 7"
  jourRepos: string;
  logement: string;
  vehicule: string;
  approvisionnements: string;         // "Gérés directement par le Client, le Chef n'avance aucun frais"

  // Article 4 — Rémunération
  amountHt: number | null;
  depositPct: number;                 // 15 (CGV)
  balancePct: number;                 // 85
  balanceDays: number;                // 4 (jours ouvrés)
  paymentRetentionText: string;       // "Chefs Talents se réserve le droit de retenir..."

  // Article 5 — Approvisionnement (puces texte libre)
  approvisionnementClauses: string;

  // Article 6 — Non-contournement
  // ⚠️ DEFAUTS ALIGNÉS SUR /chef/terms (CGV chef) :
  //   exclusiviteDureeMois = 24
  //   sanctionType = 'cgv'   →  « 30 % du montant HT ou 30 000 €, le plus élevé »
  //   sanctionType = 'six_months_commissions' →  legacy PDF Lucas/Daniele, NON CONFORME CGV
  //   sanctionType = 'custom' →  utiliser sanctionTextOverride
  exclusiviteDureeMois: number;
  sanctionType: 'cgv' | 'six_months_commissions' | 'custom';
  sanctionTextOverride: string;

  // Article 7 — Confidentialité (puces texte libre)
  confidentialiteItems: string;

  // Article 8 — Standards (puces texte libre)
  standardsItems: string;

  // Article 11 — Résiliation
  // ⚠️ ALIGNÉ CGV : acompte 15 % reste acquis (et NON 10 % comme dans
  // le PDF Lucas qui contient une incohérence interne 15 % vs 10 %)
  resiliationAcomptePct: number;      // 15 par défaut

  // Custom
  customClauses: string;
};

export type ClientContractData = {
  // En-tête / mise en forme
  contractTypeLabel: string;             // "CONTRAT DE MISSION CHEF PRIVÉ RÉSIDENT"
  contractSubtitle: string;              // "Villa privée Ibiza, Espagne | Été 2026"
  signatureCity: string;                 // "Bordeaux"
  signatureDate: string;                 // YYYY-MM-DD

  // Parties
  agencyRep: string;                     // "Monsieur Thomas Delcroix"
  agencySiret: string;                   // "89832072600026"
  clientCivilite: 'Monsieur' | 'Madame' | '';
  clientName: string;
  clientCompany: string;

  // Article 2 — Conditions de la mission
  missionLocation: string;
  startDate: string;
  endDate: string;
  guestCount: number | null;
  rythme: string;                        // "6 jours travaillés sur 7"
  jourRepos: string;
  logement: string;
  vehicule: string;
  approvisionnements: string;            // "Gérés directement par le Client, hors du présent forfait"
  langues: string;                       // "Français, anglais et espagnol"

  // Article 3 — Étendue (texte libre, une ligne par puce)
  prestationsIncluses: string;
  prestationsNonIncluses: string;

  // Article 4 — Financier
  amountHt: number | null;               // 13000 HT
  // Régime TVA — toujours laissé au choix :
  //   'applicable'      → TVA française au taux en vigueur (cas standard FR/UE B2C/B2B non assujetti)
  //   'non_applicable'  → TVA non applicable, article 259-1 du CGI (B2B hors UE, autoliquidation)
  tvaRegime: 'applicable' | 'non_applicable';
  paymentMode: 'integral_signature' | '60_40' | 'custom';
  paymentCustomText: string;             // si custom
  facturationApprosText: string;         // texte 4.3

  // Article 5 — Exclusivité / non-contournement
  exclusiviteDureeMois: number;          // 24
  sanctionContournementPct: number;      // 30
  delaiPaiementSanctionJours: number;    // 15

  // Article 8 — Annulation
  cancelGte7d: number;
  cancelLt6d: number;

  // Article 10 — Juridiction
  juridiction: string;                   // "Bordeaux"
  delaiAmiableJours: number;             // 30
  delaiRemboursementAgenceJours: number; // 15

  // Custom
  customClauses: string;
};

export type ContractsData = {
  essai?: Partial<EssaiData>;
  chef?: Partial<ChefContractData>;
  client?: Partial<ClientContractData>;
};

// ─────────────────────────────────────────────────────────────
// Defaults — pré-remplissent les champs au premier affichage à
// partir des données de la mission.
// ─────────────────────────────────────────────────────────────

type MissionLike = {
  chef_name?: string | null;
  chef_email?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  guest_count?: number | null;
  service_level?: string | null;
  chef_amount?: number | null;
  client_amount?: number | null;
};

type ClientLike = {
  fullName?: string | null;
  companyName?: string | null;
};

export function buildEssaiDefaults(m: MissionLike, c?: ClientLike): EssaiData {
  const loc = m.location || '';
  return {
    contractTypeLabel: "ACCORD D'ESSAI & DE NON-CONTOURNEMENT",
    contractSubtitle: loc ? `Chef privé · ${loc}` : 'Chef privé',
    signatureCity: 'Bordeaux',
    signatureDate: new Date().toISOString().slice(0, 10),

    agencyRep: 'Monsieur Thomas Delcroix',
    agencySiret: '89832072600026',
    clientCivilite: '',
    clientName: c?.fullName || '',
    clientCompany: c?.companyName || '',
    chefName: m.chef_name || '',
    chefEmail: m.chef_email || '',

    recruitmentContext: loc
      ? `un poste de chef privé pour la mission située à ${loc}`
      : 'un poste de chef privé',

    trialDate: m.start_date || '',
    trialLocation: loc,
    trialService: 'Déjeuner et dîner pour 2 personnes',
    trialStyle: 'Cuisine du quotidien, simple et qualitative',
    trialAmountHt: null,
    trialAmountShow: false,
    expensesIncluded: false,

    missionLocation: loc,
    missionStart: 'Le lendemain de l\'essai',
    missionDuration: 'Selon les conditions définies dans le contrat de mission',
    missionRythme: '7 jours sur 7, déjeuner et dîner quotidiens',
    missionRemuneration:
      'Définie et communiquée par l\'Agence exclusivement. Toute discussion tarifaire directe entre le Client et le Prestataire est expressément interdite.',

    // ⚠️ Toujours éditable — varie selon la durée de la mission
    paymentTerms:
      'Règlement à l\'issue de la mission par virement bancaire, sur facture émise par l\'Agence Chefs Talents.',

    sanctionContournementPct: 50,

    juridiction: 'Bordeaux',

    customClauses: '',
  };
}

export function buildChefDefaults(m: MissionLike): ChefContractData {
  const today = new Date().toISOString().slice(0, 10);
  const year = m.start_date ? new Date(m.start_date).getFullYear() : new Date().getFullYear();
  const monthYear = m.start_date
    ? `${String(new Date(m.start_date).getMonth() + 1).padStart(2, '0')}${String(year).slice(-2)}`
    : '';
  const locShort = (m.location || '').split(/[,\-]/)[0].trim().replace(/\s+/g, '');
  const chefShort = (m.chef_name || '').split(' ').filter(Boolean).map((p, i, a) =>
    i === 0 ? p : (a.length > 1 ? p[0] : ''),
  ).join('.');

  return {
    contractRef: monthYear && locShort && chefShort ? `${monthYear}_${locShort}_${chefShort}` : '',
    emissionDate: today,

    // Société (raison sociale légale) : SASU La cantine de Thomas, siège
    // 25 cours evrard de fayolle. Nom commercial : Chefs Talents.
    // Bureau opérationnel : 73 rue Porte Dijeaux.
    // Source : confirmé par Thomas le 17/05/2026 (le /legal du site
    // sera mis à jour dans une PR séparée pour aligner les mentions).
    agencyDenomination: 'SASU La cantine de Thomas',
    agencyAddress: '25 cours evrard de fayolle, 33000 Bordeaux',
    agencyRep: 'Thomas Delcroix',
    agencyPhone: '+33 6 23 84 61 70',
    agencyEmail: 'contact@chefstalents.com',
    agencySiret: '89832072600026',

    chefName: (m.chef_name || '').toUpperCase(),
    chefRef: m.chef_name ? `REF.CT_${m.chef_name.split(' ').filter(Boolean).map((p, i, a) => i === 0 ? p.toUpperCase() : (a.length > 1 ? p[0].toUpperCase() : '')).join('.')}` : '',

    missionLocation: m.location || '',
    startDate: m.start_date || '',
    endDate: m.end_date || '',
    missionObjectives: [
      'Préparation des repas quotidiens (petit-déjeuner, déjeuner, dîner)',
      'Élaboration des menus adaptés aux préférences, régimes alimentaires et allergies du Client et de ses invités',
      'Gestion simultanée de plusieurs niveaux de repas : adultes, enfants et personnel de maison',
      'Exécution culinaire sur place avec un niveau de prestation haut de gamme',
      'Entretien et nettoyage irréprochable de la cuisine après chaque service',
      'Autonomie complète sur la planification des menus et l\'organisation des services',
    ].join('\n'),

    lieu: m.location || '',
    rythme: '6 jours travaillés sur 7',
    jourRepos: '1 jour par semaine, à convenir avec le Client en début de mission',
    logement: 'chambre individuelle fournie sur place au sein de la guest house de la propriété',
    vehicule: 'accès à un véhicule partagé sur place pour les besoins d\'approvisionnement',
    approvisionnements: 'gérés directement par le Client, le Chef n\'avance aucun frais',

    amountHt: m.chef_amount ?? null,
    depositPct: 15,
    balancePct: 85,
    balanceDays: 4,
    paymentRetentionText:
      'Les virements sont effectués sur le compte bancaire communiqué par le Chef. Chefs Talents se réserve le droit de retenir tout ou partie du solde en cas de manquement grave aux obligations du présent contrat, dûment constaté.',

    approvisionnementClauses: [
      'Les courses et approvisionnements alimentaires sont pris en charge directement par le Client',
      'Le Chef n\'avance aucun frais personnel dans le cadre de la mission',
      'En cas d\'achat exceptionnel et préalablement validé, le Chef transmet les justificatifs à Chefs Talents dans les 48 heures',
    ].join('\n'),

    exclusiviteDureeMois: 24,
    sanctionType: 'cgv',
    sanctionTextOverride: '',

    confidentialiteItems: [
      'L\'identité du Client et de son entourage',
      'Le lieu et les conditions de la mission',
      'Toutes informations personnelles, patrimoniales ou familiales',
      'Tout contenu médiatique (photos, vidéos, réseaux sociaux) lié à la mission ou à la propriété',
    ].join('\n'),

    standardsItems: [
      'Respecter les standards haut de gamme attendus par Chefs Talents et le Client',
      'Être ponctuel, organisé et professionnel en toutes circonstances',
      'Maintenir une hygiène irréprochable — tenue, espace de travail, manipulations alimentaires',
      'Adopter une tenue et un comportement adaptés à l\'environnement privé et familial',
      'Informer Chefs Talents sans délai de toute difficulté rencontrée en cours de mission',
    ].join('\n'),

    resiliationAcomptePct: 15,

    customClauses: '',
  };
}

export function buildClientDefaults(m: MissionLike, c: ClientLike): ClientContractData {
  const amount = m.client_amount ?? 0;
  return {
    contractTypeLabel: 'CONTRAT DE MISSION CHEF PRIVÉ RÉSIDENT',
    contractSubtitle: m.location ? `${m.location} | Mission ${m.start_date ? new Date(m.start_date).getFullYear() : ''}`.trim() : '',
    signatureCity: 'Bordeaux',
    signatureDate: new Date().toISOString().slice(0, 10),

    agencyRep: 'Monsieur Thomas Delcroix',
    agencySiret: '89832072600026',
    clientCivilite: '',
    clientName: c.fullName || '',
    clientCompany: c.companyName || '',

    missionLocation: m.location || '',
    startDate: m.start_date || '',
    endDate: m.end_date || '',
    guestCount: m.guest_count ?? null,
    rythme: '6 jours travaillés sur 7',
    jourRepos: '1 jour par semaine, à convenir entre le Chef et le Client en début de mission',
    logement: 'Chambre individuelle fournie sur place, au sein de la propriété',
    vehicule: 'Accès à un véhicule partagé sur place pour les besoins d\'approvisionnement',
    approvisionnements: 'Gérés directement par le Client, hors du présent forfait',
    langues: 'Français, anglais',

    prestationsIncluses: [
      'Petit-déjeuner, déjeuner et dîner pour l\'ensemble des convives présents',
      'Élaboration des menus sur mesure, adaptés aux préférences, régimes alimentaires et allergies éventuelles de la famille et de ses invités',
      'Gestion simultanée de plusieurs niveaux de repas : adultes, enfants et personnel de maison',
      'Autonomie complète sur la planification des menus et l\'organisation de la cuisine',
      'Entretien et nettoyage de la cuisine après chaque service',
    ].join('\n'),
    prestationsNonIncluses: [
      'Le coût des produits alimentaires et boissons, pris en charge directement par le Client',
      'Toute prestation extérieure à la propriété',
    ].join('\n'),

    amountHt: m.client_amount ?? null,
    tvaRegime: 'applicable',
    paymentMode: amount >= 30000 ? '60_40' : 'integral_signature',
    paymentCustomText: '',
    facturationApprosText:
      'Les dépenses relatives aux produits alimentaires, boissons et fournitures culinaires sont supportées directement par le Client et gérées en dehors du présent contrat. Le Chef rend compte au Client de l\'utilisation des fonds alloués à cet effet.',

    exclusiviteDureeMois: 24,
    sanctionContournementPct: 30,
    delaiPaiementSanctionJours: 15,

    cancelGte7d: 25,
    cancelLt6d: 50,

    juridiction: 'Bordeaux',
    delaiAmiableJours: 30,
    delaiRemboursementAgenceJours: 15,

    customClauses: '',
  };
}

// ─────────────────────────────────────────────────────────────
// Rendu HTML (preview + copier-coller)
// ─────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function eurFmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function dateFmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

function dateRange(start: string, end: string): string {
  const s = dateFmt(start);
  const e = dateFmt(end);
  if (s !== '—' && e !== '—' && start !== end) return `du ${s} au ${e}`;
  if (s !== '—') return s;
  return '—';
}

const baseStyles = `
  @page { size: A4; margin: 18mm 16mm; }
  @media print {
    body { padding: 0 !important; max-width: 100% !important; }
    .doc-header { position: running(header); }
    h2, h3 { page-break-after: avoid; }
    table, ul { page-break-inside: avoid; }
    .signatures { page-break-inside: avoid; margin-top: 32px; }
  }
  body { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; max-width: 720px; margin: 0 auto; padding: 40px 48px; line-height: 1.5; font-size: 12.5pt; text-align: justify; }
  h1 { font-size: 22pt; text-align: center; font-weight: bold; margin: 0 0 6px 0; line-height: 1.15; letter-spacing: 0.01em; }
  h2 { font-size: 12.5pt; text-decoration: underline; margin: 22px 0 10px 0; font-weight: bold; }
  h3 { font-size: 12.5pt; margin: 14px 0 6px 0; font-weight: bold; }
  p { margin: 0 0 8px 0; }
  ul { margin: 0 0 10px 22px; padding: 0; list-style-type: none; }
  ul li { margin: 4px 0; position: relative; padding-left: 14px; }
  ul li::before { content: '—'; position: absolute; left: 0; color: #1a1a1a; }
  .doc-header { border-bottom: 1px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 24px; display: flex; justify-content: space-between; font-size: 9pt; color: #1a1a1a; }
  .doc-title { text-align: center; margin: 24px 0 36px 0; }
  .doc-title .subtitle { font-style: italic; font-size: 12pt; margin-top: 4px; color: #1a1a1a; }
  .doc-title .place-date { font-style: italic; font-size: 11pt; margin-top: 2px; color: #1a1a1a; }
  table.parties { width: 100%; border-collapse: collapse; margin: 12px 0 24px 0; }
  table.parties td { border: 1px solid #1a1a1a; padding: 8px 10px; vertical-align: top; }
  table.parties td.label { width: 24%; font-weight: bold; }
  table.conditions { width: 100%; border-collapse: collapse; margin: 8px 0 16px 0; }
  table.conditions td { border: 1px solid #1a1a1a; padding: 8px 10px; vertical-align: top; font-size: 11pt; }
  table.conditions td.label { width: 28%; font-weight: bold; }
  .amount-block { text-align: center; margin: 16px 0; font-size: 14pt; font-weight: bold; }
  .amount-note { text-align: center; font-style: italic; font-size: 10pt; margin: -8px 0 16px 0; }
  .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; font-size: 11pt; }
  .signature-block .role { font-weight: bold; }
  .signature-block .name { font-style: italic; margin-bottom: 24px; }
  .signature-block .line { margin-top: 56px; }
  .doc-footer { border-top: 1px solid #1a1a1a; padding-top: 4px; margin-top: 40px; text-align: center; font-size: 9pt; color: #1a1a1a; }
  .mention-manuscrite { text-align: center; font-style: italic; font-size: 10pt; margin-top: 16px; }
`;

export function renderEssai(d: EssaiData): string {
  const clientFull = [d.clientCivilite, d.clientName].filter(Boolean).join(' ').trim() || '—';
  const clientCompanyLine = d.clientCompany ? ` — ${esc(d.clientCompany)}` : '';
  const chefLine = [esc(d.chefName) || '—', d.chefEmail ? esc(d.chefEmail) : null]
    .filter(Boolean)
    .join(' · ');

  // Bloc indemnité essai — affiché seulement si activé
  const trialAmountRow = d.trialAmountShow
    ? `<tr><td class="label">Indemnité essai</td><td>${eurFmt(d.trialAmountHt)} HT — ${d.expensesIncluded ? 'frais inclus' : 'frais à la charge de Chefs Talents sur justificatifs'}</td></tr>`
    : '';

  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>

<div class="doc-header">
  <span>CHEFS TALENTS</span>
  <span>Accord d'Essai &amp; Non-Contournement — Confidentiel</span>
</div>

<div class="doc-title">
  <h1>${esc(d.contractTypeLabel)}</h1>
  ${d.contractSubtitle ? `<div class="subtitle">${esc(d.contractSubtitle)}</div>` : ''}
  <div class="place-date">${esc(d.signatureCity)}, le ${dateFmt(d.signatureDate)}</div>
</div>

<h2>ENTRE LES SOUSSIGNÉS :</h2>

<table class="parties">
  <tr>
    <td class="label">L'Agence</td>
    <td>CHEFS TALENTS — exploitée par la <strong>SASU La cantine de Thomas</strong>, SIRET ${esc(d.agencySiret)}, siège 25 cours Evrard de Fayolle, 33000 Bordeaux, représentée par ${esc(d.agencyRep)} (ci-après « l'Agence »)</td>
  </tr>
  <tr>
    <td class="label">Le Client</td>
    <td>${esc(clientFull)}${clientCompanyLine} (ci-après « le Client »)</td>
  </tr>
  <tr>
    <td class="label">Le Prestataire</td>
    <td>${chefLine || '—'}, chef privé indépendant (ci-après « le Prestataire »)</td>
  </tr>
</table>

<p>Il a été convenu ce qui suit :</p>

<h2>Article 1. — OBJET</h2>
<p>Le présent accord encadre la réalisation d'un essai professionnel entre le Client et le Prestataire, organisé par l'Agence Chefs Talents, dans le cadre d'un recrutement pour ${esc(d.recruitmentContext) || '—'}.</p>

<h2>Article 2. — MODALITÉS DE L'ESSAI</h2>
<table class="conditions">
  <tr><td class="label">Date</td><td>${dateFmt(d.trialDate)}</td></tr>
  <tr><td class="label">Lieu</td><td>${esc(d.trialLocation) || '—'}</td></tr>
  <tr><td class="label">Service</td><td>${esc(d.trialService) || '—'}</td></tr>
  <tr><td class="label">Style</td><td>${esc(d.trialStyle) || '—'}</td></tr>
  ${trialAmountRow}
</table>
<p>L'essai a pour seul objectif d'évaluer l'adéquation du Prestataire avec les attentes culinaires de la famille. Il ne constitue en aucun cas un engagement de la part de l'une ou l'autre des parties.</p>

<h2>Article 3. — MISSION ENVISAGÉE</h2>
<p>En cas d'issue favorable à l'essai, la mission envisagée serait la suivante :</p>
<table class="conditions">
  <tr><td class="label">Lieu</td><td>${esc(d.missionLocation) || '—'}</td></tr>
  <tr><td class="label">Début</td><td>${esc(d.missionStart) || '—'}</td></tr>
  <tr><td class="label">Durée</td><td>${esc(d.missionDuration) || '—'}</td></tr>
  <tr><td class="label">Rythme</td><td>${esc(d.missionRythme) || '—'}</td></tr>
  <tr><td class="label">Rémunération</td><td>${esc(d.missionRemuneration) || '—'}</td></tr>
  <tr><td class="label">Conditions de règlement</td><td>${esc(d.paymentTerms) || '—'}</td></tr>
</table>
<p>Les conditions définitives feront l'objet d'un contrat de mission distinct, transmis par l'Agence dès validation de l'essai.</p>

<h2>Article 4. — CLAUSE DE NON-CONTOURNEMENT</h2>
<p><strong>⚠ Toute relation commerciale directe entre le Client et le Prestataire, faisant suite à cette mise en relation, doit obligatoirement être contractualisée via l'Agence Chefs Talents, sans exception.</strong></p>
<p>Le Client et le Prestataire s'engagent conjointement à ne pas établir de relation commerciale directe, que ce soit pour la mission envisagée ou pour toute autre mission future, sans l'intermédiation de Chefs Talents.</p>
<p><strong>⚠ INTERDICTION EXPRESSE :</strong> aucune discussion relative aux conditions financières, tarifaires ou de rémunération ne doit avoir lieu directement entre le Client et le Prestataire. Toute négociation commerciale est réservée exclusivement à l'Agence.</p>
<p>En cas de contournement avéré, le Client et/ou le Prestataire s'engagent solidairement à verser à l'Agence une indemnité forfaitaire égale à <strong>${d.sanctionContournementPct} %</strong> de la valeur totale de la mission envisagée, sans mise en demeure préalable.</p>

<h2>Article 5. — CONFIDENTIALITÉ</h2>
<p>Toutes les informations échangées dans le cadre de cet essai sont strictement confidentielles. Les parties s'engagent à ne pas divulguer les coordonnées ou informations personnelles respectives sans accord préalable de l'Agence.</p>

<h2>Article 6. — DROIT APPLICABLE</h2>
<p>Le présent accord est soumis au droit français. Tout litige sera porté devant les tribunaux de ${esc(d.juridiction) || 'Bordeaux'}.</p>

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<h2>SIGNATURES</h2>
<p>Fait à ${esc(d.signatureCity)}, le ${dateFmt(d.signatureDate)}, en trois exemplaires originaux.</p>

<div class="signatures" style="grid-template-columns: 1fr 1fr 1fr; gap: 24px;">
  <div class="signature-block">
    <div class="role">Le Client</div>
    <div class="name">${esc(clientFull)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
  <div class="signature-block">
    <div class="role">Le Prestataire</div>
    <div class="name">${esc(d.chefName) || '—'}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
  <div class="signature-block">
    <div class="role">Pour Chefs Talents</div>
    <div class="name">${esc(d.agencyRep)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
</div>

<p class="mention-manuscrite">Mention manuscrite obligatoire : « Lu et approuvé »</p>

<div class="doc-footer">Document confidentiel — Chefs Talents — contact@chefstalents.com</div>

</body></html>`.trim();
}

export function renderChef(d: ChefContractData): string {
  const bulletList = (text: string): string => {
    const items = (text || '').split('\n').map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) return '';
    return `<ul>${items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`;
  };

  // Article 6 — Sanction non-contournement, alignée par défaut sur les CGV chef.
  const sanctionText = (() => {
    if (d.sanctionType === 'custom' && d.sanctionTextOverride) {
      return d.sanctionTextOverride;
    }
    if (d.sanctionType === 'six_months_commissions') {
      return "En cas de non-respect, une pénalité équivalente à 6 mois de commissions Chefs Talents calculées sur la base du tarif de la présente mission sera immédiatement exigible, sans mise en demeure préalable.";
    }
    // 'cgv' (default) — texte aligné /chef/terms § 12.3
    return "En cas de violation avérée, le Chef sera redevable envers Chefs Talents d'une indemnité forfaitaire égale à 30 % du montant HT total de la mission contournée ou 30 000 €, le plus élevé des deux montants, sans préjudice de tout dommage complémentaire que Chefs Talents pourrait démontrer. Cette indemnité est immédiatement exigible et payable dans un délai de 15 jours à compter de la notification.";
  })();

  // Amount derived (acompte / solde)
  const amount = d.amountHt ?? 0;
  const acompteValue = amount > 0 ? Math.round(amount * d.depositPct) / 100 : 0;
  const soldeValue = amount > 0 ? Math.round(amount * d.balancePct) / 100 : 0;
  // Date butoir solde = endDate + balanceDays jours (calendaire, approximation pour affichage)
  let soldeButoir = '';
  if (d.endDate && d.balanceDays > 0) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.endDate);
    if (m) {
      const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
      dt.setUTCDate(dt.getUTCDate() + d.balanceDays);
      soldeButoir = dateFmt(dt.toISOString().slice(0, 10));
    }
  }

  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>

<div class="doc-header">
  <span>CHEFS TALENTS</span>
  <span>Contrat de Prestation – Chef Privé</span>
</div>

<div class="doc-title">
  <h1>CONTRAT DE PRESTATION<br/><span style="color:#b08d57;">CHEF PRIVÉ</span></h1>
  <div class="place-date">Réf. ${esc(d.contractRef) || '—'} · Émis le ${dateFmt(d.emissionDate)}</div>
</div>

<h2>PARTIES</h2>

<table class="parties">
  <tr>
    <td class="label">Émis par</td>
    <td>
      L'Agence <strong>Chefs Talents</strong><br/>
      ${esc(d.agencyDenomination)}<br/>
      Adresse ${esc(d.agencyAddress)}<br/>
      Représentée par ${esc(d.agencyRep)}<br/>
      Contact ${esc(d.agencyPhone)} · ${esc(d.agencyEmail)}
    </td>
  </tr>
  <tr>
    <td class="label">Le Chef</td>
    <td>
      <strong>${esc(d.chefName) || '—'}</strong>${d.chefRef ? `<br/>Référence ${esc(d.chefRef)}` : ''}
    </td>
  </tr>
</table>

<h2>1. OBJET DE LA MISSION</h2>
<p>Le Chef est engagé pour une mission privée ${dateRange(d.startDate, d.endDate)} à ${esc(d.missionLocation) || '—'}.</p>
<p>Le Chef s'engage à fournir :</p>
${bulletList(d.missionObjectives)}

<h2>2. CONDITIONS DE LA MISSION</h2>
<ul>
  ${d.lieu ? `<li>Lieu : ${esc(d.lieu)}</li>` : ''}
  ${d.startDate ? `<li>Période : ${dateRange(d.startDate, d.endDate)} inclus</li>` : ''}
  ${d.rythme ? `<li>Rythme : ${esc(d.rythme)}</li>` : ''}
  ${d.jourRepos ? `<li>Jour de repos : ${esc(d.jourRepos)}</li>` : ''}
  ${d.logement ? `<li>Logement : ${esc(d.logement)}</li>` : ''}
  ${d.vehicule ? `<li>Véhicule : ${esc(d.vehicule)}</li>` : ''}
  ${d.approvisionnements ? `<li>Approvisionnements : ${esc(d.approvisionnements)}</li>` : ''}
</ul>

<h2>3. STATUT</h2>
<p>Le Chef intervient en tant que prestataire indépendant et ne dispose d'aucun lien de subordination avec Chefs Talents. Le présent contrat ne constitue en aucun cas un contrat de travail.</p>

<h2>4. RÉMUNÉRATION</h2>
<table class="conditions">
  <tr><td class="label">Montant total</td><td>${eurFmt(d.amountHt)}</td></tr>
  <tr><td class="label">Acompte (${d.depositPct} %)</td><td>${eurFmt(acompteValue)} — versé à la signature du contrat</td></tr>
  <tr><td class="label">Solde (${d.balancePct} %)</td><td>${eurFmt(soldeValue)} — versé au plus tard J+${d.balanceDays} après la fin de mission${soldeButoir ? ` (soit au plus tard le ${soldeButoir})` : ''}</td></tr>
</table>
<p>${esc(d.paymentRetentionText)}</p>

<h2>5. APPROVISIONNEMENT &amp; DÉPENSES</h2>
${bulletList(d.approvisionnementClauses)}

<h2>6. NON-CONTOURNEMENT &amp; EXCLUSIVITÉ</h2>
<p>Le Chef s'engage à ne pas entrer en relation directe avec le Client introduit par Chefs Talents, que ce soit directement ou via un intermédiaire.</p>
<p>Cette interdiction s'applique pendant toute la durée de la mission et pour une période de <strong>${d.exclusiviteDureeMois} mois</strong> après la fin de celle-ci.</p>
<p>${esc(sanctionText)}</p>

<h2>7. CONFIDENTIALITÉ</h2>
<p>Le Chef s'engage à une confidentialité stricte concernant :</p>
${bulletList(d.confidentialiteItems)}

<h2>8. STANDARDS &amp; OBLIGATIONS PROFESSIONNELLES</h2>
<p>Le Chef s'engage à :</p>
${bulletList(d.standardsItems)}

<h2>9. RESPONSABILITÉ</h2>
<p>Le Chef est seul responsable de la bonne exécution de ses prestations, de ses actes, omissions et comportements pendant toute la durée de la mission. Il agit en totale autonomie et ne peut en aucun cas engager la responsabilité de Chefs Talents.</p>

<h2>10. ASSURANCE PROFESSIONNELLE</h2>
<p>Le Chef déclare être titulaire d'une assurance responsabilité civile professionnelle en cours de validité couvrant l'ensemble de ses prestations. Il s'engage à fournir une attestation sur simple demande de Chefs Talents.</p>
<p>En cas de défaut d'assurance, le Chef assume seul toutes les conséquences financières et juridiques liées à son activité et à la mission.</p>

<h2>11. RÉSILIATION</h2>
<p>En cas d'annulation de la mission par le Client après signature du présent contrat, l'acompte de <strong>${d.resiliationAcomptePct} %</strong> reste acquis au Chef à titre d'indemnité forfaitaire.</p>
<p>En cas de résiliation à l'initiative du Chef sans motif légitime, l'acompte devra être restitué et une pénalité pourra être appliquée à hauteur des préjudices subis par Chefs Talents.</p>

${d.customClauses ? `<h2>CLAUSES SPÉCIFIQUES</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<h2>SIGNATURES</h2>
<div class="signatures">
  <div class="signature-block">
    <div class="role">Le Chef</div>
    <div class="name">${esc(d.chefName) || '—'}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
  <div class="signature-block">
    <div class="role">L'Agence</div>
    <div class="name">${esc(d.agencyDenomination)} – ${esc(d.agencyRep)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
</div>

<div class="doc-footer">${esc(d.agencyDenomination)} · ${esc(d.agencyAddress)} · ${esc(d.agencyEmail)}</div>

</body></html>`.trim();
}

export function renderClient(d: ClientContractData): string {
  // Bullets pour Article 3
  const bulletList = (text: string): string => {
    const items = (text || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return '';
    return `<ul>${items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>`;
  };

  // Article 4.2 — modalités de paiement
  const paymentModeText = (() => {
    if (d.paymentMode === 'integral_signature') {
      return "Conformément aux conditions générales de Chefs Talents, le règlement intégral du forfait est dû à la signature du présent contrat, préalablement au début de la mission. Aucune mission ne peut être confirmée sans réception du paiement intégral.";
    }
    if (d.paymentMode === '60_40') {
      return "Conformément aux conditions générales de Chefs Talents, un acompte de 60 % du forfait est dû à la signature du présent contrat. Le solde de 40 % est exigible 48 heures avant le début de la mission. Aucune mission ne peut être confirmée sans réception de l'acompte.";
    }
    return d.paymentCustomText || '—';
  })();

  const clientFull = [d.clientCivilite, d.clientName].filter(Boolean).join(' ').trim() || '—';
  const clientCompanyLine = d.clientCompany ? ` — ${esc(d.clientCompany)}` : '';

  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>

<div class="doc-header">
  <span>CHEFS TALENTS</span>
  <span>Contrat de prestation client — Confidentiel</span>
</div>

<div class="doc-title">
  <h1>${esc(d.contractTypeLabel)}</h1>
  ${d.contractSubtitle ? `<div class="subtitle">${esc(d.contractSubtitle)}</div>` : ''}
  <div class="place-date">Chefs Talents · ${esc(d.signatureCity)}, le ${dateFmt(d.signatureDate)}</div>
</div>

<h2>ENTRE LES SOUSSIGNÉS :</h2>

<table class="parties">
  <tr>
    <td class="label">L'Agence</td>
    <td>CHEFS TALENTS, agence de mise en relation de chefs privés, représentée par ${esc(d.agencyRep)} (ci-après « l'Agence »)</td>
  </tr>
  <tr>
    <td class="label">Le Client</td>
    <td>${esc(clientFull)}${clientCompanyLine} (ci-après « le Client »)</td>
  </tr>
</table>

<p>Il a été convenu et arrêté ce qui suit :</p>

<h2>Article 1. — OBJET DU CONTRAT</h2>
<p>Le présent contrat a pour objet de définir les conditions dans lesquelles l'Agence Chefs Talents fournit au Client une prestation de chef privé, pour la mission décrite ci-après.</p>
<p>L'Agence est exploitée par la <strong>SASU La cantine de Thomas</strong>, sous le nom commercial <strong>Chefs Talents</strong>, immatriculée au RCS de Bordeaux sous le SIRET ${esc(d.agencySiret)}, dont le siège social est situé 25 cours Evrard de Fayolle, 33000 Bordeaux. Elle agit en qualité de vendeur en nom propre de la prestation. Elle confie l'exécution culinaire au Chef qui intervient en qualité de prestataire indépendant pour le compte de l'Agence. Le Chef n'est ni salarié, ni mandataire, ni préposé de l'Agence. Il agit sous sa propre responsabilité civile professionnelle.</p>
<p><strong>Référence aux Conditions Générales de Vente.</strong> Les Conditions Générales de Vente de l'Agence Chefs Talents, accessibles à l'adresse https://chefstalents.com/conditions, font partie intégrante du présent contrat et le complètent. En cas de stipulation contradictoire, les dispositions du présent contrat prévalent sur celles des CGV pour ce qui concerne strictement la mission décrite. Pour tout point non traité par le présent contrat, les CGV s'appliquent.</p>

<h2>Article 2. — CONDITIONS DE LA MISSION</h2>

<table class="conditions">
  <tr><td class="label">Lieu</td><td>${esc(d.missionLocation) || '—'}</td></tr>
  <tr><td class="label">Période</td><td>${dateRange(d.startDate, d.endDate)}</td></tr>
  <tr><td class="label">Rythme</td><td>${esc(d.rythme) || '—'}</td></tr>
  <tr><td class="label">Jour de repos</td><td>${esc(d.jourRepos) || '—'}</td></tr>
  <tr><td class="label">Logement</td><td>${esc(d.logement) || '—'}</td></tr>
  <tr><td class="label">Véhicule</td><td>${esc(d.vehicule) || '—'}</td></tr>
  <tr><td class="label">Approvisionnements</td><td>${esc(d.approvisionnements) || '—'}</td></tr>
  <tr><td class="label">Langue de travail</td><td>${esc(d.langues) || '—'}</td></tr>
</table>

<h2>Article 3. — ÉTENDUE DES PRESTATIONS</h2>

<h3>3.1 Prestations culinaires incluses</h3>
<p>Le Chef assure la préparation des repas selon les modalités suivantes :</p>
${bulletList(d.prestationsIncluses)}

<h3>3.2 Prestations non incluses</h3>
<p>Ne sont pas compris dans le présent contrat :</p>
${bulletList(d.prestationsNonIncluses)}

<h2>Article 4. — CONDITIONS FINANCIÈRES</h2>

<h3>4.1 Honoraires de l'Agence</h3>
<p>Les honoraires de coordination et de mise en relation de l'Agence Chefs Talents sont fixés à la somme forfaitaire de :</p>
<div class="amount-block">${eurFmt(d.amountHt)} hors taxes (HT)</div>
<div class="amount-note">${d.tvaRegime === 'non_applicable'
  ? '(TVA non applicable, article 259-1 du CGI)'
  : '(TVA française au taux en vigueur applicable au jour de la facturation)'}</div>
<p>Ce prix couvre l'intégralité de la prestation chef décrite à l'article 3, sur toute la période définie à l'article 2. Il inclut la rémunération du Chef négociée par l'Agence et la marge commerciale de l'Agence${d.tvaRegime === 'applicable' ? ', ainsi que la TVA applicable' : ''}. Le Chef est rémunéré directement par l'Agence selon les modalités du contrat de mission qui les lie.</p>

<h3>4.2 Modalités de règlement</h3>
<p>${esc(paymentModeText)}</p>
<p>Le règlement s'effectue par virement bancaire aux coordonnées communiquées sur la facture émise par l'Agence.</p>

<h3>4.3 Facturation des approvisionnements</h3>
<p>${esc(d.facturationApprosText)}</p>

<h2>Article 5. — EXCLUSIVITÉ ET NON-CONTOURNEMENT</h2>

<h3>5.1 Engagement d'exclusivité</h3>
<p>Le Client reconnaît que le Chef lui a été présenté exclusivement par l'Agence Chefs Talents. En conséquence, toute collaboration entre le Client et le Chef, présente ou future, devra obligatoirement être contractualisée par l'intermédiaire de l'Agence, pendant toute la durée de la mission et pour une période de <strong>${d.exclusiviteDureeMois} (${numberInWords(d.exclusiviteDureeMois)}) mois</strong> à compter de la date de fin de la dernière mission réalisée.</p>

<h3>5.2 Interdiction de contournement</h3>
<p>Le Client s'engage formellement à ne pas contacter, solliciter, employer, ni contracter directement ou indirectement avec le Chef, sans l'intermédiation de l'Agence, que ce soit pour une mission identique, similaire ou de toute autre nature.</p>

<h3>5.3 Sanction</h3>
<p>En cas de violation avérée de la présente clause, le Client sera redevable envers l'Agence d'une indemnité forfaitaire égale à <strong>${d.sanctionContournementPct} %</strong> du montant HT total du présent contrat, immédiatement exigible et sans mise en demeure préalable, sans préjudice de tout dommage complémentaire que l'Agence serait fondée à démontrer. Cette indemnité est payable dans un délai de <strong>${d.delaiPaiementSanctionJours} (${numberInWords(d.delaiPaiementSanctionJours)}) jours</strong> à compter de la notification.</p>

<h2>Article 6. — OBLIGATIONS DE L'AGENCE</h2>
<p>L'Agence engage sa responsabilité commerciale vis-à-vis du Client uniquement sur :</p>
<ul>
  <li>la mise à disposition d'un Chef qualifié, sélectionné, validé et assuré ;</li>
  <li>la conformité de la prestation au cahier des charges convenu (format, dates, menu, contraintes médicales et alimentaires communiquées) ;</li>
  <li>la coordination administrative et financière de la mission.</li>
</ul>
<p>Le Chef intervient sous sa propre responsabilité civile professionnelle.</p>
<p>L'Agence n'est en aucun cas garante des dommages, préjudices ou sinistres causés par le Chef pendant l'exécution matérielle de la prestation, notamment :</p>
<ul>
  <li>dommages causés aux équipements, installations ou biens du Client ;</li>
  <li>préjudices corporels ou matériels survenus pendant la prestation du fait du Chef ;</li>
  <li>manquements aux règles d'hygiène, de sécurité alimentaire ou normes professionnelles ;</li>
  <li>pertes ou détériorations de matériel, équipements ou ingrédients placés sous la garde du Chef.</li>
</ul>
<p>Pour ces catégories de dommages, le Client est invité à faire valoir ses droits directement auprès du Chef et de son assureur en responsabilité civile professionnelle.</p>
<p>L'Agence fournira au Client, sur simple demande, l'attestation RC Pro du Chef en cours de validité.</p>
<p>La responsabilité de l'Agence au titre de la non-conformité est limitée au montant TTC facturé pour la prestation, à l'exclusion de tout dommage indirect, perte de jouissance, préjudice moral non démontré ou perte commerciale.</p>

<h2>Article 7. — OBLIGATIONS DU CHEF</h2>
<p>Le Chef s'engage à :</p>
<ul>
  <li>Exécuter sa mission avec professionnalisme, ponctualité et discrétion</li>
  <li>Respecter les préférences alimentaires, régimes et allergies communiqués par le Client</li>
  <li>Maintenir la cuisine dans un état de propreté irréprochable</li>
  <li>Respecter la vie privée de la famille et de ses invités</li>
  <li>Ne pas divulguer à des tiers les informations relatives au Client ou à son entourage</li>
  <li>Informer l'Agence sans délai de toute difficulté rencontrée dans l'exécution de la mission</li>
</ul>

<h2>Article 8. — CONDITIONS D'ANNULATION</h2>

<h3>8.1 Annulation par le Client</h3>
<p>Toute annulation du présent contrat par le Client après signature donne lieu aux pénalités suivantes, conformes aux Conditions Générales de Vente de l'Agence :</p>
<ul>
  <li>Annulation à 7 jours ou plus avant le début de la mission : <strong>${d.cancelGte7d} %</strong> du montant TTC retenu à titre d'indemnité forfaitaire (${100 - d.cancelGte7d} % remboursé)</li>
  <li>Annulation dans les 6 jours précédant le début de la mission, no-show ou en cours de mission : <strong>${d.cancelLt6d} %</strong> du montant TTC retenu (${100 - d.cancelLt6d} % remboursé)</li>
</ul>
<p>Ces retenues couvrent les engagements pris par l'Agence et le Chef (mobilisation des dates, organisation, achats engagés, manque à gagner) et ne peuvent faire l'objet d'une contestation fondée sur l'absence d'exécution effective de la prestation.</p>

<h3>8.2 Annulation par l'Agence</h3>
<p>En cas d'annulation à l'initiative de l'Agence pour un motif non imputable au Client, le montant intégral réglé sera remboursé au Client dans un délai de <strong>${d.delaiRemboursementAgenceJours} (${numberInWords(d.delaiRemboursementAgenceJours)}) jours ouvrés</strong>.</p>

<h2>Article 9. — CONFIDENTIALITÉ</h2>
<p>L'ensemble des informations échangées dans le cadre du présent contrat — identité des parties, conditions financières, organisation du lieu, habitudes de la famille — revêt un caractère strictement confidentiel. Les parties s'engagent à ne pas les divulguer à des tiers, sans limitation de durée.</p>

<h2>Article 10. — DROIT APPLICABLE ET JURIDICTION COMPÉTENTE</h2>
<p>Le présent contrat est soumis au droit français. En cas de litige, et à défaut de résolution amiable dans un délai de <strong>${d.delaiAmiableJours} (${numberInWords(d.delaiAmiableJours)}) jours</strong> à compter de la première notification écrite, les Parties conviennent de la compétence exclusive des tribunaux de ${esc(d.juridiction)}.</p>

<h2>Article 11. — ACCEPTATION ET ENTRÉE EN VIGUEUR</h2>
<p>Le présent contrat entre en vigueur à la date de sa signature par l'ensemble des parties et de la réception du règlement intégral par l'Agence. En apposant leur signature, les parties déclarent avoir pris connaissance de l'intégralité des stipulations du présent contrat et les accepter sans réserve.</p>

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<h2>SIGNATURES</h2>
<p>Fait à ${esc(d.signatureCity)}, le ${dateFmt(d.signatureDate)}, en deux exemplaires originaux.</p>

<div class="signatures">
  <div class="signature-block">
    <div class="role">Le Client</div>
    <div class="name">${esc(clientFull)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
  <div class="signature-block">
    <div class="role">Pour Chefs Talents</div>
    <div class="name">${esc(d.agencyRep)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
</div>

<p class="mention-manuscrite">Chaque partie doit faire précéder sa signature de la mention manuscrite « Lu et approuvé »</p>

<div class="doc-footer">Page — Document confidentiel — Chefs Talents</div>

</body></html>`.trim();
}

// Convertit un petit nombre en lettres françaises (pour les contrats : "24 (vingt-quatre) mois").
// Garde la couverture sur 0-99 qui couvre tous les délais usuels (jours, mois).
function numberInWords(n: number): string {
  const units = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize'];
  const tens = ['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  if (n < 0 || !Number.isFinite(n)) return String(n);
  if (n < 17) return units[n];
  if (n === 17) return 'dix-sept';
  if (n === 18) return 'dix-huit';
  if (n === 19) return 'dix-neuf';
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return tens[t];
    if (u === 1 && t !== 8) return `${tens[t]} et un`;
    return `${tens[t]}-${units[u]}`;
  }
  if (n < 80) {
    const u = n - 60;
    if (u === 11) return 'soixante et onze';
    return `soixante-${u < 17 ? units[u] : u === 17 ? 'dix-sept' : u === 18 ? 'dix-huit' : 'dix-neuf'}`;
  }
  if (n < 100) {
    const u = n - 80;
    if (u === 0) return 'quatre-vingts';
    return `quatre-vingt-${u < 17 ? units[u] : u === 17 ? 'dix-sept' : u === 18 ? 'dix-huit' : 'dix-neuf'}`;
  }
  return String(n);
}

function perDiemLabel(kind: 'inclus' | 'a_charge_client' | 'forfait', amount: number | null): string {
  if (kind === 'inclus') return "inclus dans le tarif chef";
  if (kind === 'a_charge_client') return "à la charge du client (sur justificatifs)";
  if (kind === 'forfait') return amount ? `forfait ${eurFmt(amount)}` : 'forfait à définir';
  return '—';
}

function fondsCoursesQuiLabel(kind: 'client' | 'chefs_talents' | 'avance_chef'): string {
  if (kind === 'client') return 'le client (paiement direct ou avance de fonds)';
  if (kind === 'chefs_talents') return 'Chefs Talents';
  if (kind === 'avance_chef') return "le chef sur avance, remboursé sur justificatifs";
  return '—';
}
