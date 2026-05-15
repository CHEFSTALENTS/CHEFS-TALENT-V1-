// app/admin/missions/[id]/_lib/contracts.ts
//
// Types et templates HTML pour le panneau Contrats du back-office.
// Champs variables : pré-remplis depuis la mission au premier affichage,
// puis sauvegardés en missions.contracts_data (JSONB) à chaque édition.

export type ContractKind = 'essai' | 'chef' | 'client';

export type EssaiData = {
  chefName: string;
  chefEmail: string;
  trialDate: string;        // YYYY-MM-DD
  trialLocation: string;
  trialDuration: '0.5d' | '1d' | '2d' | 'custom';
  trialDurationCustom: string;
  trialAmountHt: number | null;   // €
  expensesIncluded: boolean;
  evaluationCriteria: string;
  ndaSpecific: boolean;
  customClauses: string;
};

export type ChefContractData = {
  chefName: string;
  chefCompany: string;
  chefSiret: string;
  missionLocation: string;
  startDate: string;
  endDate: string;
  guestCount: number | null;
  serviceFormat: string;
  amountHt: number | null;
  depositPct: number;      // par défaut 15
  balancePct: number;      // par défaut 85
  balanceDays: number;     // par défaut 4
  perDiemLogement: 'inclus' | 'a_charge_client' | 'forfait';
  perDiemLogementMontant: number | null;
  perDiemRepas: 'inclus' | 'a_charge_client' | 'forfait';
  perDiemRepasMontant: number | null;
  perDiemDeplacement: string;
  fondsCoursesQuiPaye: 'client' | 'chefs_talents' | 'avance_chef';
  fondsCoursesPlafond: number | null;
  ruptureConditions: string;
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

export function buildEssaiDefaults(m: MissionLike): EssaiData {
  return {
    chefName: m.chef_name || '',
    chefEmail: m.chef_email || '',
    trialDate: m.start_date || '',
    trialLocation: m.location || '',
    trialDuration: '1d',
    trialDurationCustom: '',
    trialAmountHt: null,
    expensesIncluded: false,
    evaluationCriteria:
      'Technique, autonomie, dressage, gestion du temps, posture en environnement client.',
    ndaSpecific: true,
    customClauses: '',
  };
}

export function buildChefDefaults(m: MissionLike): ChefContractData {
  return {
    chefName: m.chef_name || '',
    chefCompany: '',
    chefSiret: '',
    missionLocation: m.location || '',
    startDate: m.start_date || '',
    endDate: m.end_date || '',
    guestCount: m.guest_count ?? null,
    serviceFormat: m.service_level || '',
    amountHt: m.chef_amount ?? null,
    depositPct: 15,
    balancePct: 85,
    balanceDays: 4,
    perDiemLogement: 'inclus',
    perDiemLogementMontant: null,
    perDiemRepas: 'inclus',
    perDiemRepasMontant: null,
    perDiemDeplacement: 'À la charge de Chefs Talents sur justificatifs.',
    fondsCoursesQuiPaye: 'client',
    fondsCoursesPlafond: null,
    ruptureConditions:
      'Indemnité de rupture sans cause = 30 % du montant chef. Force majeure : aucune indemnité.',
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
  const durationLabel = d.trialDuration === '0.5d' ? "½ journée"
    : d.trialDuration === '1d' ? '1 journée'
    : d.trialDuration === '2d' ? '2 journées'
    : d.trialDurationCustom || '—';
  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>
<h1>Contrat d'essai chef</h1>
<p class="meta">Entre Chefs Talents (Bordeaux, France) et le chef ci-dessous nommé.</p>

<h2>Chef</h2>
<p><strong>${esc(d.chefName) || '—'}</strong>${d.chefEmail ? ' — ' + esc(d.chefEmail) : ''}</p>

<h2>Essai</h2>
<ul>
  <li>Date : <strong>${dateFmt(d.trialDate)}</strong></li>
  <li>Lieu : <strong>${esc(d.trialLocation) || '—'}</strong></li>
  <li>Durée : <strong>${esc(durationLabel)}</strong></li>
  <li>Indemnité : <strong>${eurFmt(d.trialAmountHt)} HT</strong></li>
  <li>Frais ${d.expensesIncluded ? 'inclus dans l\'indemnité' : 'à la charge de Chefs Talents sur justificatifs'}</li>
</ul>

<h2>Critères d'évaluation</h2>
<p>${esc(d.evaluationCriteria) || '—'}</p>

${d.ndaSpecific ? `<h2>Confidentialité</h2>
<p>Le chef s'engage à ne divulguer aucune information relative à Chefs Talents, à ses clients, ses fournisseurs ou ses méthodes opérationnelles, pendant et après l'essai. Cette obligation perdure 24 mois après la date d'essai.</p>` : ''}

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<div class="signature">
  <div>Chefs Talents · Thomas Delcroix<br/>Date : __________</div>
  <div>Chef · ${esc(d.chefName) || '—'}<br/>Date : __________</div>
</div>
</body></html>`.trim();
}

export function renderChef(d: ChefContractData): string {
  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>
<h1>Contrat de mission chef</h1>
<p class="meta">Entre Chefs Talents (Bordeaux, France) et le prestataire chef ci-dessous nommé.</p>

<h2>Chef prestataire</h2>
<p><strong>${esc(d.chefName) || '—'}</strong>${d.chefCompany ? ' — ' + esc(d.chefCompany) : ''}${d.chefSiret ? ' (SIRET ' + esc(d.chefSiret) + ')' : ''}</p>

<h2>Mission</h2>
<ul>
  <li>Lieu : <strong>${esc(d.missionLocation) || '—'}</strong></li>
  <li>Dates : <strong>${dateRange(d.startDate, d.endDate)}</strong></li>
  <li>Couverts moyens : <strong>${d.guestCount ?? '—'}</strong></li>
  <li>Format de service : <strong>${esc(d.serviceFormat) || '—'}</strong></li>
</ul>

<h2>Rémunération</h2>
<ul>
  <li>Montant chef : <strong>${eurFmt(d.amountHt)} HT</strong></li>
  <li>Acompte : <strong>${d.depositPct} %</strong> à la signature du présent contrat</li>
  <li>Solde : <strong>${d.balancePct} %</strong> sous <strong>${d.balanceDays} jours ouvrés</strong> après fin de mission</li>
</ul>

<h2>Per diem</h2>
<ul>
  <li>Logement : <strong>${perDiemLabel(d.perDiemLogement, d.perDiemLogementMontant)}</strong></li>
  <li>Repas : <strong>${perDiemLabel(d.perDiemRepas, d.perDiemRepasMontant)}</strong></li>
  <li>Déplacement : ${esc(d.perDiemDeplacement) || '—'}</li>
</ul>

<h2>Fonds courses</h2>
<p>Pris en charge par <strong>${fondsCoursesQuiLabel(d.fondsCoursesQuiPaye)}</strong>${d.fondsCoursesPlafond ? ', plafond ' + eurFmt(d.fondsCoursesPlafond) : ''}.</p>

<h2>Rupture</h2>
<p>${esc(d.ruptureConditions) || '—'}</p>

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<div class="signature">
  <div>Chefs Talents · Thomas Delcroix<br/>Date : __________</div>
  <div>Chef · ${esc(d.chefName) || '—'}<br/>Date : __________</div>
</div>
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
<p>L'Agence Chefs Talents, immatriculée au RCS de Bordeaux sous le SIRET ${esc(d.agencySiret)}, agit en qualité de vendeur en nom propre de la prestation. Elle confie l'exécution culinaire au Chef qui intervient en qualité de prestataire indépendant pour le compte de l'Agence. Le Chef n'est ni salarié, ni mandataire, ni préposé de l'Agence. Il agit sous sa propre responsabilité civile professionnelle.</p>
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
<div class="amount-note">(TVA française au taux en vigueur applicable au jour de la facturation)</div>
<p>Ce prix couvre l'intégralité de la prestation chef décrite à l'article 3, sur toute la période définie à l'article 2. Il inclut la rémunération du Chef négociée par l'Agence, la marge commerciale de l'Agence et la TVA applicable. Le Chef est rémunéré directement par l'Agence selon les modalités du contrat de mission qui les lie.</p>

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
