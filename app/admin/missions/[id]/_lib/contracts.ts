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
  clientName: string;
  clientCompany: string;
  missionLocation: string;
  startDate: string;
  endDate: string;
  guestCount: number | null;
  serviceLevel: string;
  amountTtc: number | null;
  acompteMode: 'auto' | '100' | '60_40';     // auto = 100 si < 30k€, 60/40 sinon
  acomptePct: number;
  soldePct: number;
  soldeDaysBefore: number;
  paymentMethods: string[];                  // ['virement', 'stripe', 'revolut']
  cancelGte7d: number;                       // % retenu si annulation ≥ 7j
  cancelLt6d: number;                        // % retenu si annulation < 6j ou no-show
  fondsCourses: 'inclus' | 'sur_facture' | 'avance';
  fondsCoursesPlafond: number | null;
  ndaInclude: boolean;
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
    clientName: c.fullName || '',
    clientCompany: c.companyName || '',
    missionLocation: m.location || '',
    startDate: m.start_date || '',
    endDate: m.end_date || '',
    guestCount: m.guest_count ?? null,
    serviceLevel: m.service_level || '',
    amountTtc: m.client_amount ?? null,
    acompteMode: 'auto',
    acomptePct: amount >= 30000 ? 60 : 100,
    soldePct: amount >= 30000 ? 40 : 0,
    soldeDaysBefore: 2,
    paymentMethods: ['virement', 'stripe'],
    cancelGte7d: 25,
    cancelLt6d: 50,
    fondsCourses: 'sur_facture',
    fondsCoursesPlafond: null,
    ndaInclude: true,
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
  body { font-family: ui-serif, Georgia, 'Times New Roman', Times, serif; color: #161616; max-width: 720px; margin: 0 auto; padding: 32px; line-height: 1.6; font-size: 14px; }
  h1 { font-size: 22px; margin: 0 0 8px 0; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.1em; color: #7f1d1d; margin: 28px 0 8px 0; font-weight: 600; }
  p { margin: 0 0 10px 0; }
  ul { margin: 0 0 10px 20px; padding: 0; }
  li { margin: 4px 0; }
  .meta { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
  .signature { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .signature div { border-top: 1px solid #d4d4d4; padding-top: 8px; font-size: 12px; color: #6b7280; }
  strong { color: #161616; }
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
  const paymentLabels: Record<string, string> = {
    virement: 'Virement bancaire SEPA',
    stripe: 'Carte bancaire via Stripe',
    revolut: 'Revolut Pay',
  };
  const payMethods = d.paymentMethods.map((m) => paymentLabels[m] || m).join(', ') || '—';
  const acompteMode = d.amountTtc && d.amountTtc < 30000 && d.acompteMode === 'auto'
    ? `Paiement intégral à la commande (${eurFmt(d.amountTtc)} TTC).`
    : `Acompte ${d.acomptePct} % à la commande, solde ${d.soldePct} % ${d.soldeDaysBefore} h avant le début de la mission.`;
  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>
<h1>Contrat de prestation client</h1>
<p class="meta">Entre Chefs Talents (Bordeaux, France) et le client ci-dessous nommé.</p>

<h2>Client</h2>
<p><strong>${esc(d.clientName) || '—'}</strong>${d.clientCompany ? ' — ' + esc(d.clientCompany) : ''}</p>

<h2>Mission</h2>
<ul>
  <li>Lieu : <strong>${esc(d.missionLocation) || '—'}</strong></li>
  <li>Dates : <strong>${dateRange(d.startDate, d.endDate)}</strong></li>
  <li>Couverts : <strong>${d.guestCount ?? '—'}</strong></li>
  <li>Niveau de service : <strong>${esc(d.serviceLevel) || '—'}</strong></li>
</ul>

<h2>Tarif</h2>
<p>Prestation totale : <strong>${eurFmt(d.amountTtc)} TTC</strong> (TVA 20 % incluse).</p>
<p>${esc(acompteMode)}</p>
<p>Modes de paiement acceptés : <strong>${esc(payMethods)}</strong>.</p>

<h2>Annulation</h2>
<ul>
  <li>Annulation au moins 7 jours avant la mission : <strong>${d.cancelGte7d} %</strong> du total retenu</li>
  <li>Annulation à moins de 6 jours ou no-show : <strong>${d.cancelLt6d} %</strong> du total retenu</li>
</ul>

<h2>Fonds courses</h2>
<p>${fondsCoursesClientLabel(d.fondsCourses, d.fondsCoursesPlafond)}</p>

${d.ndaInclude ? `<h2>Confidentialité</h2>
<p>Chefs Talents s'engage à respecter une confidentialité absolue concernant l'identité du client, le lieu de la mission, ainsi que toute information personnelle ou patrimoniale dont elle aurait connaissance. Cet engagement perdure sans limitation de durée.</p>` : ''}

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<div class="signature">
  <div>Chefs Talents · Thomas Delcroix<br/>Date : __________</div>
  <div>Client · ${esc(d.clientName) || '—'}<br/>Date : __________</div>
</div>
</body></html>`.trim();
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

function fondsCoursesClientLabel(kind: 'inclus' | 'sur_facture' | 'avance', plafond: number | null): string {
  const plafondTxt = plafond ? ` (plafond ${eurFmt(plafond)})` : '';
  if (kind === 'inclus') return `Fonds courses inclus dans le tarif TTC${plafondTxt}.`;
  if (kind === 'sur_facture') return `Fonds courses facturés en complément, sur justificatifs${plafondTxt}.`;
  if (kind === 'avance') return `Fonds courses avancés par le client en début de mission${plafondTxt}.`;
  return '—';
}
