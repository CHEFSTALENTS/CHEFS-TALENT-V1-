// lib/contracts/nccTemplate.ts
//
// Template HTML + types pour le NCC (Accord de Non-Contournement et
// Confidentialité), envoyé à 4 signataires :
//   - Apporteur (Chef Référent ou Concierge)
//   - Chef Exécutant
//   - Client
//   - Chefs Talents (Thomas)
//
// Aligné sur la page publique /legal/ncc-propose-mission/page.tsx.
//
// Réutilise les helpers (esc, dateFmt, baseStyles) du module contrats missions
// pour cohérence visuelle entre tous les documents YouSign.

import {
  baseStyles,
  dateFmt,
  esc,
} from '@/app/admin/missions/[id]/_lib/contracts';

export type NccData = {
  // En-tête
  contractTypeLabel: string;            // "ACCORD DE NON-CONTOURNEMENT & CONFIDENTIALITÉ"
  contractSubtitle: string;             // "Mission transmise au réseau Chefs Talents"
  signatureCity: string;                // "Bordeaux"
  signatureDate: string;                // YYYY-MM-DD

  // Apporteur (Chef Référent ou Concierge)
  apporteurFirstName: string;
  apporteurLastName: string;
  apporteurEmail: string;
  apporteurStatut: string;              // ex: "Concierge — Villa Mirage Ibiza" ou "Chef du réseau"
  apporteurSiret: string;               // optionnel
  apporteurAddress: string;             // optionnel

  // Chef Exécutant
  chefFirstName: string;
  chefLastName: string;
  chefEmail: string;
  chefSiret: string;                    // optionnel
  chefAddress: string;                  // optionnel

  // Client
  clientCivilite: 'Monsieur' | 'Madame' | '';
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientCompany: string;                // optionnel
  clientCompanySiret: string;           // optionnel
  clientAddress: string;                // optionnel

  // Chefs Talents (Agence)
  agencyRep: string;                    // "Thomas Delcroix"
  agencyEmail: string;                  // "contact@chefstalents.com"
  agencySiret: string;                  // "89832072600026"

  // Mission
  missionRef: string;                   // ex: "REQ-2026-05-1234" (id de la request)
  missionLocation: string;
  missionStartDate: string;             // YYYY-MM-DD
  missionEndDate: string;               // YYYY-MM-DD
  missionAmountHt: number | null;       // pour calcul indicatif commission 5 %

  // Conditions
  commissionPct: number;                // 5 (commission apporteur sur HT)
  exclusiviteDureeMois: number;         // 24
  sanctionAgencyPctOrFloor: string;     // "30 % du montant HT ou 30 000 €, le plus élevé"
  delaiNotificationContournement: number; // 48 (heures pour notifier si approché en dehors du circuit)
  delaiPaiementSanctionJours: number;   // 15
  delaiCommissionVersementJours: number;// 15
  delaiAmiableJours: number;            // 30
  juridiction: string;                  // "Bordeaux"

  // Custom
  customClauses: string;
};

// ────────────────────────────────────────────────────────────
// Defaults — pré-remplis depuis la request quand on l'a sous la main
// ────────────────────────────────────────────────────────────

export type RequestLike = {
  id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  location?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  budget_amount?: number | null;
};

function splitName(full: string | null | undefined): { first: string; last: string } {
  const s = String(full || '').trim();
  if (!s) return { first: '', last: '' };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export function buildNccDefaults(req?: RequestLike | null): NccData {
  const nameSplit = splitName(req?.full_name || req?.first_name || '');
  const location = req?.location || '';
  return {
    contractTypeLabel: 'ACCORD DE NON-CONTOURNEMENT & CONFIDENTIALITÉ',
    contractSubtitle: 'Mission transmise au réseau Chefs Talents',
    signatureCity: 'Bordeaux',
    signatureDate: new Date().toISOString().slice(0, 10),

    apporteurFirstName: '',
    apporteurLastName: '',
    apporteurEmail: '',
    apporteurStatut: '',
    apporteurSiret: '',
    apporteurAddress: '',

    chefFirstName: '',
    chefLastName: '',
    chefEmail: '',
    chefSiret: '',
    chefAddress: '',

    clientCivilite: '',
    clientFirstName: nameSplit.first,
    clientLastName: nameSplit.last,
    clientEmail: req?.email || '',
    clientCompany: req?.company_name || '',
    clientCompanySiret: '',
    clientAddress: '',

    agencyRep: 'Thomas Delcroix',
    agencyEmail: 'contact@chefstalents.com',
    agencySiret: '89832072600026',

    missionRef: req?.id ? `REQ-${req.id.slice(0, 8)}` : '',
    missionLocation: location,
    missionStartDate: req?.date_start || '',
    missionEndDate: req?.date_end || '',
    missionAmountHt: req?.budget_amount ?? null,

    commissionPct: 5,
    exclusiviteDureeMois: 24,
    sanctionAgencyPctOrFloor: '30 % du montant HT total de la Mission ou 30 000 €, le plus élevé des deux',
    delaiNotificationContournement: 48,
    delaiPaiementSanctionJours: 15,
    delaiCommissionVersementJours: 15,
    delaiAmiableJours: 30,
    juridiction: 'Bordeaux',

    customClauses: '',
  };
}

// ────────────────────────────────────────────────────────────
// Rendu HTML
// ────────────────────────────────────────────────────────────

export function renderNcc(d: NccData): string {
  const clientFull = [d.clientCivilite, d.clientFirstName, d.clientLastName]
    .filter(Boolean).join(' ').trim() || '—';
  const clientCompanyLine = d.clientCompany
    ? ` — ${esc(d.clientCompany)}${d.clientCompanySiret ? ` (SIRET ${esc(d.clientCompanySiret)})` : ''}`
    : '';
  const apporteurFull = `${d.apporteurFirstName} ${d.apporteurLastName}`.trim() || '—';
  const chefFull = `${d.chefFirstName} ${d.chefLastName}`.trim() || '—';

  const missionPeriod = d.missionStartDate
    ? d.missionEndDate
      ? `du ${dateFmt(d.missionStartDate)} au ${dateFmt(d.missionEndDate)}`
      : dateFmt(d.missionStartDate)
    : '—';

  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>

<div class="doc-header">
  <span>CHEFS TALENTS</span>
  <span>Accord de Non-Contournement &amp; Confidentialité — Confidentiel</span>
</div>

<div class="doc-title">
  <h1>${esc(d.contractTypeLabel)}</h1>
  ${d.contractSubtitle ? `<div class="subtitle">${esc(d.contractSubtitle)}</div>` : ''}
  <div class="place-date">${esc(d.signatureCity)}, le ${dateFmt(d.signatureDate)}</div>
</div>

<h2>Article 1. — PARTIES</h2>
<table class="parties">
  <tr>
    <td class="label">Apporteur<br/><span style="font-weight:normal;font-style:italic;font-size:10pt">(Chef Référent / Concierge)</span></td>
    <td>
      <strong>${esc(apporteurFull)}</strong><br/>
      ${d.apporteurStatut ? `Statut : ${esc(d.apporteurStatut)}<br/>` : ''}
      ${d.apporteurSiret ? `SIRET : ${esc(d.apporteurSiret)}<br/>` : ''}
      ${d.apporteurAddress ? `Adresse : ${esc(d.apporteurAddress)}<br/>` : ''}
      Email : ${esc(d.apporteurEmail) || '—'}
    </td>
  </tr>
  <tr>
    <td class="label">Chef Exécutant</td>
    <td>
      <strong>${esc(chefFull)}</strong><br/>
      ${d.chefSiret ? `SIRET : ${esc(d.chefSiret)}<br/>` : ''}
      ${d.chefAddress ? `Adresse : ${esc(d.chefAddress)}<br/>` : ''}
      Email : ${esc(d.chefEmail) || '—'}
    </td>
  </tr>
  <tr>
    <td class="label">Client</td>
    <td>
      <strong>${esc(clientFull)}</strong>${clientCompanyLine}<br/>
      ${d.clientAddress ? `Adresse : ${esc(d.clientAddress)}<br/>` : ''}
      Email : ${esc(d.clientEmail) || '—'}
    </td>
  </tr>
  <tr>
    <td class="label">Chefs Talents</td>
    <td>
      <strong>SASU La cantine de Thomas</strong> (nom commercial Chefs Talents)<br/>
      SIRET ${esc(d.agencySiret)} — Siège : 25 cours Evrard de Fayolle, 33000 Bordeaux<br/>
      Représentée par ${esc(d.agencyRep)}, Président<br/>
      Email : ${esc(d.agencyEmail)}
    </td>
  </tr>
</table>
<p style="font-style:italic;font-size:11pt">
  Référence mission : <strong>${esc(d.missionRef) || '—'}</strong> — Lieu : ${esc(d.missionLocation) || '—'} — Période : ${missionPeriod}
</p>

<h2>Article 2. — PRÉAMBULE ET CONTEXTE</h2>
<p>Dans le cadre des activités de Chefs Talents, l'Apporteur a transmis au réseau une opportunité de mission culinaire qu'il n'a pas vocation à honorer personnellement. Cette opportunité a été orientée par Chefs Talents vers le Chef Exécutant signataire des présentes pour le compte du Client.</p>
<p>Le présent accord a pour objet de protéger les intérêts de l'Apporteur en lui garantissant la rémunération de l'opportunité ainsi générée, et d'empêcher tout contournement du circuit contractuel par l'une des autres Parties.</p>

<h2>Article 3. — DÉFINITIONS</h2>
<ul>
  <li><strong>Mission</strong> : la prestation culinaire identifiée à l'article 1, telle que formalisée dans le contrat de mission signé entre Chefs Talents et le Chef Exécutant.</li>
  <li><strong>Lead</strong> : la connaissance de l'existence du besoin Client ainsi que des coordonnées permettant de l'identifier ou de le contacter, communiquée par l'Apporteur à Chefs Talents.</li>
  <li><strong>Mission Connexe</strong> : toute prestation ultérieure commandée par le Client (ou par une entité juridiquement liée à lui), portant sur des services culinaires, événementiels ou d'hospitality privée, dans la fenêtre de protection de ${d.exclusiviteDureeMois} mois définie ci-après.</li>
  <li><strong>Contournement</strong> : toute tentative par le Chef Exécutant, le Client ou un tiers agissant pour leur compte, d'engager une relation commerciale directe portant sur une Mission ou une Mission Connexe sans passer par Chefs Talents et sans verser à l'Apporteur la commission qui lui revient.</li>
</ul>

<h2>Article 4. — OBLIGATIONS DE CONFIDENTIALITÉ</h2>
<p>Chacune des Parties s'engage à traiter avec la plus stricte confidentialité l'ensemble des informations échangées dans le cadre de la Mission, et notamment :</p>
<ul>
  <li>l'identité du Client, son adresse, ses habitudes, ses préférences ;</li>
  <li>le brief de la Mission, le menu retenu, les contraintes médicales et alimentaires ;</li>
  <li>le profil professionnel et les coordonnées de l'Apporteur et du Chef Exécutant ;</li>
  <li>les budgets négociés entre les Parties.</li>
</ul>
<p>Cette obligation s'impose pendant toute la durée de la Mission et survit à sa terminaison pour la durée de protection de ${d.exclusiviteDureeMois} mois prévue à l'article 8.</p>

<h2>Article 5. — OBLIGATION DE NON-CONTOURNEMENT (${d.exclusiviteDureeMois} MOIS)</h2>
<p>Pendant toute la durée de la Mission et pour une période de <strong>${d.exclusiviteDureeMois} (${numberInWords(d.exclusiviteDureeMois)}) mois</strong> à compter de la fin de l'exécution effective de cette Mission, les Parties s'interdisent réciproquement :</p>
<ul>
  <li><strong>Le Chef Exécutant</strong> s'interdit de contracter directement avec le Client, ou avec toute entité juridiquement liée au Client, en dehors du circuit Chefs Talents.</li>
  <li><strong>Le Client</strong> s'interdit de solliciter directement le Chef Exécutant, ou de lui confier toute Mission Connexe, en dehors du circuit Chefs Talents.</li>
  <li><strong>Toutes les Parties</strong> s'interdisent de transmettre à des tiers les informations confidentielles relatives à la Mission afin d'organiser un contournement, qu'il soit direct ou indirect.</li>
</ul>
<p>Si l'une des Parties est approchée par une autre Partie en dehors du circuit Chefs Talents, elle s'engage à en informer Chefs Talents dans un délai de <strong>${d.delaiNotificationContournement} heures</strong>.</p>

<h2>Article 6. — COMMISSION DE L'APPORTEUR</h2>
<p>En contrepartie de la transmission de l'opportunité commerciale, l'Apporteur perçoit une commission égale à <strong>${d.commissionPct} % du montant HT total de la Mission effectivement exécutée</strong>.</p>
<p>Cette commission est versée par Chefs Talents à l'Apporteur dans un délai maximum de <strong>${d.delaiCommissionVersementJours} jours</strong> suivant l'encaissement intégral du Client par Chefs Talents et la fin effective de la Mission, sur présentation par l'Apporteur d'une facture conforme adressée à Chefs Talents.</p>
<p>En cas de Mission Connexe survenant pendant la fenêtre de ${d.exclusiviteDureeMois} mois définie à l'article 8 ci-après et confiée à un Chef du réseau Chefs Talents, l'Apporteur perçoit la même commission de ${d.commissionPct} % du montant HT total de cette Mission Connexe.</p>
<p><strong>Modalités</strong> : la commission est calculée sur le montant HT facturé par Chefs Talents au Chef Exécutant pour la Mission, et non sur le prix TTC vendu au Client. Elle est exclusive de toute autre rémunération de l'Apporteur au titre de la Mission.</p>

<h2>Article 7. — SANCTIONS EN CAS DE VIOLATION</h2>
<p>En cas de violation avérée des articles 4 (confidentialité) ou 5 (non-contournement) par l'une des Parties, la Partie défaillante sera redevable :</p>
<ul>
  <li>envers <strong>Chefs Talents</strong>, d'une indemnité forfaitaire égale à <strong>${esc(d.sanctionAgencyPctOrFloor)}</strong> ;</li>
  <li>envers <strong>l'Apporteur</strong>, du versement intégral de la commission de ${d.commissionPct} % qui lui aurait été due si le circuit Chefs Talents avait été respecté, augmenté d'une indemnité forfaitaire égale au double de cette commission à titre de pénalité ;</li>
  <li>sans préjudice de tout dommage complémentaire que Chefs Talents ou l'Apporteur pourraient démontrer, notamment au titre du préjudice commercial et d'image.</li>
</ul>
<p>Ces indemnités sont immédiatement exigibles dès la constatation de la violation et payables dans un délai de <strong>${d.delaiPaiementSanctionJours} jours</strong> à compter de la notification écrite, sans mise en demeure préalable.</p>
<p>En cas de violation par le Chef Exécutant, Chefs Talents pourra en outre suspendre ou résilier immédiatement son accès à la plateforme.</p>

<h2>Article 8. — DURÉE ET SURVIE</h2>
<p>Le présent accord entre en vigueur à la date de sa signature par les quatre Parties et demeure applicable :</p>
<ul>
  <li>pendant toute la durée d'exécution de la Mission ;</li>
  <li>pour les obligations de confidentialité (article 4) et de non-contournement (article 5), pendant <strong>${d.exclusiviteDureeMois} (${numberInWords(d.exclusiviteDureeMois)}) mois</strong> à compter de la date de fin effective de la Mission, quelle qu'en soit la cause (exécution complète, résiliation amiable, résiliation contentieuse, force majeure).</li>
</ul>
<p>Les obligations de paiement des commissions et indemnités survivent jusqu'à parfait paiement.</p>

<h2>Article 9. — DROIT APPLICABLE ET JURIDICTION</h2>
<p>Le présent accord est régi par le droit français. En cas de litige, et à défaut de résolution amiable dans un délai de <strong>${d.delaiAmiableJours} jours</strong> à compter de la première notification écrite, les Parties conviennent de la <strong>compétence exclusive des tribunaux de ${esc(d.juridiction) || 'Bordeaux'}</strong>.</p>

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<h2>SIGNATURES</h2>
<p>Fait à ${esc(d.signatureCity)}, le ${dateFmt(d.signatureDate)}, en quatre exemplaires originaux.</p>
<p style="font-style:italic;font-size:10pt">Mention manuscrite obligatoire pour chaque signataire : « Lu et approuvé ».</p>

<div class="signatures" style="grid-template-columns: 1fr 1fr; gap: 24px;">
  <div class="signature-block">
    <div class="role">Apporteur</div>
    <div class="name">${esc(apporteurFull)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
  <div class="signature-block">
    <div class="role">Chef Exécutant</div>
    <div class="name">${esc(chefFull)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
  <div class="signature-block">
    <div class="role">Client</div>
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

<div class="doc-footer">Document confidentiel — Chefs Talents — contact@chefstalents.com</div>

</body></html>`.trim();
}

// Reprise locale (le helper est privé dans contracts.ts)
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
