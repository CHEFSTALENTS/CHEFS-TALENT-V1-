// lib/contracts/nccPartnerTemplate.ts
//
// Template du NCC « Partenaire amont » — version 2 signataires
// (Client/Partenaire + Chefs Talents) à envoyer à un nouveau partenaire
// AVANT toute mission concrète. Distinct du NCC mission opérationnel à 4
// parties (lib/contracts/nccTemplate.ts) qui est rattaché à une mission.
//
// CONDITIONS ALIGNÉES sur le NCC Mission (même sanctions, même périmètre
// non-contournement, même définition de Mission Connexe), MAIS sans citer
// de mission précise — toutes les clauses sont rédigées au futur, pour
// couvrir toute mission qui sera réalisée pendant la durée du contrat.
//
// Structure :
//   - Article 1 : Définitions (Mission, Mission Connexe, Lead, Talents,
//     Informations Confidentielles, Contournement)
//   - Article 2 : Confidentialité (élargie : Talents + identité Client +
//     brief + contraintes + budgets)
//   - Article 3 : Non-contournement 24 mois post-mission (incluant
//     Missions Connexes)
//   - Article 4 : Commission Apporteur (5 %, clause optionnelle si le
//     Partenaire apporte des leads)
//   - Article 5 : Pénalités (30 % HT ou 30 000 €, aligné NCC Mission)
//   - Article 6 : Durée (5 ans renouvelable tacitement, préavis 3 mois)
//   - Article 7 : Dispositions générales (indépendance, cession,
//     intégralité, juridiction Bordeaux)

import {
  baseStyles,
  dateFmt,
  esc,
} from '@/app/admin/missions/[id]/_lib/contracts';

export type PartnerRole = 'client' | 'apporteur' | 'mixte';
//   - 'client'    : le Partenaire est un client final (UHNW, family office)
//                   → pas de clause commission
//   - 'apporteur' : le Partenaire apporte des leads (conciergerie, agence
//                   villa, wealth manager) → clause commission 5 % active
//   - 'mixte'     : les deux à la fois → clauses cumulatives

export type NccPartnerData = {
  // Référence + dates
  reference: string;               // "NCC-2026-XXXXXX" auto-généré si vide
  signatureDate: string;           // YYYY-MM-DD
  partnerRole: PartnerRole;        // détermine l'activation de la clause commission

  // Client / Partenaire
  clientCompany: string;           // Raison sociale
  clientSiret: string;             // SIRET (optionnel)
  clientRepFirstName: string;
  clientRepLastName: string;
  clientRepRole: string;           // Qualité du représentant (ex: "Directeur")
  clientAddress: string;           // Adresse
  clientEmail: string;             // Email du signataire

  // Chefs Talents (Agence) — défauts pré-remplis
  agencyName: string;              // "Chefs Talents"
  agencyLegalName: string;         // "SASU La cantine de Thomas"
  agencySiret: string;             // "89832072600026"
  agencyAddress: string;           // "25 cours Evrard de Fayolle, 33000 Bordeaux"
  agencyRep: string;               // "Thomas Delcroix"
  agencyRepRole: string;           // "Président"
  agencyEmail: string;             // "contact@chefstalents.com"

  // Clauses — alignées sur le NCC Mission
  nonCircumventionMonths: number;  // 24
  agreementDurationYears: number;  // 5
  noticePeriodMonths: number;      // 3
  signalDelayHours: number;        // 48 (notification approche directe)
  amiableDelayDays: number;        // 30 (avant saisine tribunal)
  paymentDelayDays: number;        // 15 (paiement sanction)
  commissionPaymentDelayDays: number; // 15 (versement commission apporteur)
  jurisdiction: string;            // "Bordeaux"

  // Commission apporteur (active uniquement si partnerRole = 'apporteur' | 'mixte')
  commissionPct: number;           // 5 (% HT du montant total de la Mission)

  // Sanctions — alignées sur le NCC Mission
  sanctionAgencyPctOrFloor: string;
  // ex: "30 % du montant HT total de la Mission contournée ou 30 000 €,
  //      le plus élevé des deux"

  customClauses: string;
};

// ────────────────────────────────────────────────────────────
// Defaults
// ────────────────────────────────────────────────────────────

function generateReference(): string {
  // Format : NCC-YYYY-NNNNNN (6 chiffres aléatoires)
  const year = new Date().getFullYear();
  const num = Math.floor(100000 + Math.random() * 900000);
  return `NCC-${year}-${num}`;
}

export function buildNccPartnerDefaults(): NccPartnerData {
  return {
    reference: generateReference(),
    signatureDate: new Date().toISOString().slice(0, 10),
    partnerRole: 'client',

    clientCompany: '',
    clientSiret: '',
    clientRepFirstName: '',
    clientRepLastName: '',
    clientRepRole: '',
    clientAddress: '',
    clientEmail: '',

    agencyName: 'Chefs Talents',
    agencyLegalName: 'SASU La cantine de Thomas',
    agencySiret: '89832072600026',
    agencyAddress: '25 cours Evrard de Fayolle, 33000 Bordeaux',
    agencyRep: 'Thomas Delcroix',
    agencyRepRole: 'Président',
    agencyEmail: 'contact@chefstalents.com',

    // Conditions alignées sur le NCC Mission
    nonCircumventionMonths: 24,
    agreementDurationYears: 5,
    noticePeriodMonths: 3,
    signalDelayHours: 48,
    amiableDelayDays: 30,
    paymentDelayDays: 15,
    commissionPaymentDelayDays: 15,
    jurisdiction: 'Bordeaux',

    commissionPct: 5,

    sanctionAgencyPctOrFloor:
      "30 % du montant HT total de la Mission concernée ou 30 000 €, le plus élevé des deux",

    customClauses: '',
  };
}

// ────────────────────────────────────────────────────────────
// Rendu HTML
// ────────────────────────────────────────────────────────────

export function renderNccPartner(d: NccPartnerData): string {
  const clientRepFull =
    `${d.clientRepFirstName} ${d.clientRepLastName}`.trim() || '—';

  // Wording adaptatif selon le rôle du Partenaire
  const isApporteur = d.partnerRole === 'apporteur' || d.partnerRole === 'mixte';
  const partyLabel = d.partnerRole === 'apporteur' ? 'PARTENAIRE' : 'CLIENT';
  const partyTerm = d.partnerRole === 'apporteur' ? 'Partenaire' : 'Client';

  // Article 4 (Commission) actif uniquement pour apporteur ou mixte
  const commissionArticle = isApporteur ? `
<h2>ARTICLE 4 — COMMISSION D'APPORT (LE CAS ÉCHÉANT)</h2>
<p><strong>4.1 Principe.</strong> Lorsque le ${partyTerm} transmet à ${esc(d.agencyName)} un Lead (opportunité de Mission qu'il n'a pas vocation à exécuter directement) et que ${esc(d.agencyName)} place un Talent en réponse à ce Lead, le ${partyTerm} perçoit une commission égale à <strong>${d.commissionPct} % du montant HT total de la Mission effectivement exécutée</strong>.</p>
<p><strong>4.2 Modalités.</strong> Cette commission est versée par ${esc(d.agencyName)} au ${partyTerm} dans un délai maximum de <strong>${d.commissionPaymentDelayDays} jours</strong> suivant l'encaissement intégral du Client final par ${esc(d.agencyName)} et la fin effective de la Mission, sur présentation par le ${partyTerm} d'une facture conforme adressée à ${esc(d.agencyName)}.</p>
<p><strong>4.3 Missions Connexes.</strong> Pour chaque Mission Connexe survenant pendant la fenêtre de ${d.nonCircumventionMonths} mois suivant la fin d'une Mission générée par le ${partyTerm}, ${esc(d.agencyName)} verse au ${partyTerm} la même commission de ${d.commissionPct} % du montant HT total de cette Mission Connexe.</p>
<p><strong>4.4 Assiette.</strong> La commission est calculée sur le montant HT facturé par ${esc(d.agencyName)} au Talent au titre de la Mission. Elle est exclusive de toute autre rémunération du ${partyTerm} au titre de la Mission.</p>
` : '';

  // Le numéro de l'article sanctions varie selon que la commission est présente
  const sanctionArtNum = isApporteur ? 5 : 4;
  const dureeArtNum = isApporteur ? 6 : 5;
  const dispoArtNum = isApporteur ? 7 : 6;

  return `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>

<div class="doc-header">
  <span>CHEFS TALENTS</span>
  <span>Accord de Non-Contournement &amp; Confidentialité — Confidentiel</span>
</div>

<div class="doc-title">
  <h1>ACCORD DE NON-CONTOURNEMENT<br/>ET DE CONFIDENTIALITÉ</h1>
  <div class="subtitle">Non-Circumvention &amp; Non-Disclosure Agreement (NCC / NCNDA)</div>
  <div class="place-date">Référence : ${esc(d.reference)} — ${esc(d.jurisdiction)}, le ${dateFmt(d.signatureDate)}</div>
</div>

<h2>ENTRE LES PARTIES</h2>
<table class="parties">
  <tr>
    <td class="label">${partyLabel}</td>
    <td>
      <strong>${esc(d.clientCompany) || '—'}</strong><br/>
      ${d.clientSiret ? `SIRET : ${esc(d.clientSiret)}<br/>` : ''}
      Représentant : ${esc(clientRepFull)}${d.clientRepRole ? ` — ${esc(d.clientRepRole)}` : ''}<br/>
      ${d.clientAddress ? `Adresse : ${esc(d.clientAddress)}<br/>` : ''}
      Email : ${esc(d.clientEmail) || '—'}
    </td>
  </tr>
  <tr>
    <td class="label">PRESTATAIRE</td>
    <td>
      <strong>${esc(d.agencyLegalName)}</strong> (nom commercial ${esc(d.agencyName)})<br/>
      SIRET : ${esc(d.agencySiret)}<br/>
      Siège : ${esc(d.agencyAddress)}<br/>
      Représentée par ${esc(d.agencyRep)}, ${esc(d.agencyRepRole)}<br/>
      Email : ${esc(d.agencyEmail)}
    </td>
  </tr>
</table>
<p style="font-style:italic;font-size:11pt">Ci-après désignées collectivement « les Parties ».</p>

<h2>PRÉAMBULE</h2>
<p>${esc(d.agencyName)} est une agence spécialisée dans le placement et la mise en relation de chefs cuisiniers, pâtissiers et professionnels de la restauration (ci-après « les Talents ») auprès de clients finaux dans le cadre de missions de conciergerie privée, d'événementiel ou de restauration à domicile.</p>
<p>Dans le cadre de leur relation actuelle ou future, les Parties seront amenées à échanger des informations confidentielles et à collaborer sur une ou plusieurs Missions (telles que définies ci-après). Le présent accord a pour objet de protéger les intérêts légitimes de ${esc(d.agencyName)} ${isApporteur ? `et du ${partyTerm} ` : ''}en empêchant tout contournement du rôle d'intermédiaire de ${esc(d.agencyName)} et toute divulgation non autorisée des informations confidentielles communiquées.</p>
<p>Le présent accord est un accord <strong>amont</strong> : il s'applique à toute Mission qui pourra être réalisée pendant sa durée, sans qu'il soit nécessaire de désigner une Mission spécifique au moment de la signature.</p>

<h2>ARTICLE 1 — DÉFINITIONS</h2>
<ul>
  <li><strong>« Mission »</strong> : désigne toute prestation culinaire ou événementielle (dîner, événement, mission saisonnière en villa, yacht ou résidence, placement de chef permanent, etc.) commandée par le ${partyTerm} — ou par un client final présenté par le ${partyTerm} — et exécutée par un Talent du réseau ${esc(d.agencyName)} dans le cadre de leur intermédiation.</li>
  <li><strong>« Mission Connexe »</strong> : désigne toute prestation ultérieure portant sur des services culinaires, événementiels ou d'hospitality privée, commandée par le ${partyTerm} (ou par une entité juridiquement liée à lui) à un Talent précédemment présenté par ${esc(d.agencyName)}, et ce dans la fenêtre de ${d.nonCircumventionMonths} mois définie à l'article 3.</li>
  <li><strong>« Lead »</strong> : désigne la connaissance de l'existence d'un besoin client final ainsi que des coordonnées permettant de l'identifier ou de le contacter${isApporteur ? `, communiquée par le ${partyTerm} à ${esc(d.agencyName)}` : ''}.</li>
  <li><strong>« Talents »</strong> : désigne tout chef cuisinier, pâtissier, sommelier ou professionnel de la restauration référencé par ${esc(d.agencyName)}, qu'il ait ou non été nommément présenté au ${partyTerm}.</li>
  <li><strong>« Informations Confidentielles »</strong> : désigne l'ensemble des informations échangées entre les Parties dans le cadre de leur relation, et notamment :
    <ul>
      <li>les profils de Talents (même anonymisés), leurs compétences, disponibilités, tarifs, références, coordonnées directes ou indirectes ;</li>
      <li>l'identité des clients finaux, leurs adresses, habitudes, préférences alimentaires et contraintes médicales ;</li>
      <li>les briefs de Mission, menus, contraintes opérationnelles ;</li>
      <li>les budgets négociés entre les Parties ou avec un client final ;</li>
      <li>les méthodes, processus et savoir-faire propriétaires de ${esc(d.agencyName)}.</li>
    </ul>
  </li>
  <li><strong>« Contournement »</strong> : désigne toute tentative par le ${partyTerm}, ou par un tiers agissant pour son compte, d'engager une relation commerciale directe avec un Talent présenté par ${esc(d.agencyName)} portant sur une Mission ou une Mission Connexe, sans passer par l'intermédiation de ${esc(d.agencyName)}.</li>
</ul>

<h2>ARTICLE 2 — OBLIGATIONS DE CONFIDENTIALITÉ</h2>
<p><strong>2.1 Engagement général.</strong> Chacune des Parties s'engage à traiter l'ensemble des Informations Confidentielles avec la plus stricte confidentialité. Le ${partyTerm} s'interdit de divulguer ces informations à tout tiers sans l'accord préalable et écrit de ${esc(d.agencyName)}.</p>
<p><strong>2.2 Utilisation restreinte.</strong> Les Informations Confidentielles ne peuvent être utilisées qu'aux fins exclusives d'évaluation et d'exécution des Missions dans le cadre de l'intermédiation de ${esc(d.agencyName)}. Toute autre utilisation est strictement prohibée.</p>
<p><strong>2.3 Personnes habilitées.</strong> Le ${partyTerm} s'engage à ne communiquer les Informations Confidentielles qu'aux seules personnes de son organisation strictement impliquées dans la Mission concernée, et à les informer des obligations du présent accord.</p>
<p><strong>2.4 Survie.</strong> Cette obligation s'impose pendant toute la durée de l'accord et survit à sa terminaison pour la durée de protection de <strong>${d.nonCircumventionMonths} mois</strong> prévue à l'article ${dureeArtNum}.</p>

<h2>ARTICLE 3 — OBLIGATION DE NON-CONTOURNEMENT (${d.nonCircumventionMonths} MOIS)</h2>
<p><strong>3.1 Interdictions principales.</strong> Pendant toute la durée du présent accord et pour une période de <strong>${d.nonCircumventionMonths} (vingt-quatre) mois</strong> suivant la fin effective de chaque Mission réalisée dans le cadre de l'intermédiation de ${esc(d.agencyName)}, le ${partyTerm} s'interdit formellement de :</p>
<ul>
  <li>contacter directement tout Talent présenté par ${esc(d.agencyName)}, par quelque moyen que ce soit (téléphone, email, réseaux sociaux, intermédiaire tiers, etc.) ;</li>
  <li>solliciter, embaucher ou conclure tout accord avec un Talent présenté par ${esc(d.agencyName)}, sans passer par son intermédiation, qu'il s'agisse d'une Mission ou d'une <strong>Mission Connexe</strong> ;</li>
  <li>tenter d'identifier un Talent présenté sous forme anonymisée par ${esc(d.agencyName)} ;</li>
  <li>transmettre à un tiers les coordonnées ou informations permettant d'identifier un Talent ou d'organiser un Contournement, qu'il soit direct ou indirect.</li>
</ul>
<p><strong>3.2 Périmètre élargi.</strong> Ces obligations s'appliquent à l'ensemble des Talents présentés par ${esc(d.agencyName)}, y compris ceux qui n'ont pas été retenus pour une Mission donnée et ceux présentés sous forme anonymisée.</p>
<p><strong>3.3 Obligation de signalement.</strong> Si le ${partyTerm} est approché directement par un Talent présenté par ${esc(d.agencyName)} en dehors du circuit d'intermédiation, il s'engage à en informer ${esc(d.agencyName)} dans les <strong>${d.signalDelayHours} heures</strong>.</p>
${commissionArticle}
<h2>ARTICLE ${sanctionArtNum} — PÉNALITÉS EN CAS DE VIOLATION</h2>
<p><strong>${sanctionArtNum}.1 Indemnité forfaitaire envers ${esc(d.agencyName)}.</strong> En cas de violation avérée des articles 2 (confidentialité) ou 3 (non-contournement) du présent accord, le ${partyTerm} sera redevable envers ${esc(d.agencyName)} d'une indemnité forfaitaire immédiatement exigible, égale à :</p>
<p style="border:1px solid #c0392b;padding:12px;text-align:center;font-weight:bold;color:#c0392b;">
${esc(d.sanctionAgencyPctOrFloor)}
</p>
${isApporteur ? `
<p><strong>${sanctionArtNum}.2 Indemnité envers le ${partyTerm} (en cas de Contournement organisé par un tiers).</strong> Si une autre Partie ou un tiers organise un Contournement portant atteinte au droit à commission du ${partyTerm} défini à l'article 4, la partie défaillante sera redevable envers le ${partyTerm} du versement intégral de la commission de ${d.commissionPct} % qui lui aurait été due si le circuit ${esc(d.agencyName)} avait été respecté, augmenté d'une indemnité forfaitaire égale au double de cette commission à titre de pénalité.</p>
` : ''}
<p><strong>${sanctionArtNum}.${isApporteur ? '3' : '2'} Dommages et intérêts complémentaires.</strong> Ces indemnités forfaitaires sont sans préjudice de tout dommage complémentaire que ${esc(d.agencyName)}${isApporteur ? ` ou le ${partyTerm}` : ''} pourrait démontrer et réclamer en justice, notamment au titre du préjudice commercial et d'image.</p>
<p><strong>${sanctionArtNum}.${isApporteur ? '4' : '3'} Exigibilité.</strong> Ces indemnités sont dues dès la constatation de la violation, sans mise en demeure préalable, et sont exigibles dans un délai de <strong>${d.paymentDelayDays} jours</strong> à compter de la notification écrite de la violation.</p>

<h2>ARTICLE ${dureeArtNum} — DURÉE</h2>
<p>Le présent accord entre en vigueur à la date de sa signature et demeure valide pour une durée de <strong>${d.agreementDurationYears} (cinq) ans</strong>, renouvelable tacitement par périodes annuelles, sauf dénonciation par lettre recommandée avec accusé de réception adressée à l'autre Partie avec un préavis de <strong>${d.noticePeriodMonths} mois</strong>.</p>
<p>Les obligations de confidentialité (article 2) et de non-contournement (article 3) survivront à l'expiration ou à la résiliation du présent accord pour une durée de <strong>${d.nonCircumventionMonths} mois</strong> à compter de la fin effective de chaque Mission réalisée pendant la durée du contrat, quelle qu'en soit la cause (exécution complète, résiliation amiable, résiliation contentieuse, force majeure).</p>
${isApporteur ? `<p>Les obligations de paiement des commissions et indemnités survivent jusqu'à parfait paiement.</p>` : ''}

<h2>ARTICLE ${dispoArtNum} — DISPOSITIONS GÉNÉRALES</h2>
<p><strong>${dispoArtNum}.1 Indépendance des clauses.</strong> Si l'une des dispositions du présent accord est déclarée nulle ou inapplicable, les autres dispositions demeureront pleinement en vigueur.</p>
<p><strong>${dispoArtNum}.2 Loi applicable et juridiction.</strong> Le présent accord est soumis au droit français. En cas de litige, et à défaut de résolution amiable dans un délai de <strong>${d.amiableDelayDays} jours</strong> à compter de la première notification écrite, les Parties conviennent de la <strong>compétence exclusive des tribunaux de ${esc(d.jurisdiction)}</strong>.</p>
<p><strong>${dispoArtNum}.3 Cession.</strong> Le présent accord ne peut être cédé par le ${partyTerm} sans l'accord préalable et écrit de ${esc(d.agencyName)}.</p>
<p><strong>${dispoArtNum}.4 Intégralité de l'accord.</strong> Le présent accord constitue l'intégralité de l'accord entre les Parties sur l'objet qu'il définit et remplace tout accord antérieur relatif à ce même objet.</p>

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<h2>SIGNATURES</h2>
<p>Fait en deux (2) exemplaires originaux, à ${esc(d.jurisdiction)}, le ${dateFmt(d.signatureDate)}.</p>
<p style="font-style:italic;font-size:10pt">Mention manuscrite obligatoire pour chaque signataire : « Lu et approuvé ».</p>

<div class="signatures" style="grid-template-columns: 1fr 1fr; gap: 24px;">
  <div class="signature-block">
    <div class="role">Pour le ${partyLabel}</div>
    <div class="name">${esc(clientRepFull)}</div>
    ${d.clientRepRole ? `<div>Qualité : ${esc(d.clientRepRole)}</div>` : ''}
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
  <div class="signature-block">
    <div class="role">Pour ${esc(d.agencyName).toUpperCase()}</div>
    <div class="name">${esc(d.agencyRep)}</div>
    <div>Qualité : ${esc(d.agencyRepRole)}</div>
    <div>Signature :</div>
    <div class="line">Date :</div>
  </div>
</div>

<div class="doc-footer">Document confidentiel — ${esc(d.agencyName)} — ${esc(d.agencyEmail)}</div>

</body></html>`.trim();
}
