// lib/contracts/nccPartnerTemplate.ts
//
// Template du NCC « Partenaire amont » — version 2 signataires
// (Client + Chefs Talents) à envoyer à un nouveau partenaire AVANT toute
// mission concrète. Distinct du NCC mission opérationnel à 4 parties
// (lib/contracts/nccTemplate.ts) qui est rattaché à une request/mission.
//
// Aligné sur le contrat papier « Contrat_NCC_ChefsTalents.docx » :
//   - Article 1 : Définitions (Informations Confidentielles, Talents, Contournement)
//   - Article 2 : Obligations de confidentialité
//   - Article 3 : Obligation de non-contournement (24 mois post mission)
//   - Article 4 : Pénalités (6 mois de commissions sur tarif journalier)
//   - Article 5 : Durée (5 ans renouvelable tacitement, préavis 3 mois)
//   - Article 6 : Dispositions générales (juridiction Bordeaux)

import {
  baseStyles,
  dateFmt,
  esc,
} from '@/app/admin/missions/[id]/_lib/contracts';

export type NccPartnerData = {
  // Référence + dates
  reference: string;               // "NCC-2026-XXXXXX" auto-généré si vide
  signatureDate: string;           // YYYY-MM-DD

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

  // Clauses
  nonCircumventionMonths: number;  // 24
  agreementDurationYears: number;  // 5
  noticePeriodMonths: number;      // 3
  signalDelayHours: number;        // 48
  amiableDelayDays: number;        // 30
  paymentDelayDays: number;        // 15
  jurisdiction: string;            // "Bordeaux"

  // Description sanction (texte libre car formulation spécifique)
  sanctionDescription: string;

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

    nonCircumventionMonths: 24,
    agreementDurationYears: 5,
    noticePeriodMonths: 3,
    signalDelayHours: 48,
    amiableDelayDays: 30,
    paymentDelayDays: 15,
    jurisdiction: 'Bordeaux',

    sanctionDescription:
      "Six (6) mois de commissions calculées sur la base du tarif journalier du Talent concerné, majorés de tous les frais engagés par Chefs Talents pour faire valoir ses droits.",

    customClauses: '',
  };
}

// ────────────────────────────────────────────────────────────
// Rendu HTML
// ────────────────────────────────────────────────────────────

export function renderNccPartner(d: NccPartnerData): string {
  const clientRepFull =
    `${d.clientRepFirstName} ${d.clientRepLastName}`.trim() || '—';

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
    <td class="label">CLIENT</td>
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
<p>Dans ce cadre, ${esc(d.agencyName)} est susceptible de présenter au Client, sous forme anonymisée et confidentielle, des profils de Talents correspondant à ses besoins. Ces profils constituent des informations propriétaires de ${esc(d.agencyName)}.</p>
<p>Le présent accord a pour objet de protéger les intérêts légitimes de ${esc(d.agencyName)} en empêchant tout contournement de son rôle d'intermédiaire et toute divulgation non autorisée des informations confidentielles communiquées.</p>

<h2>ARTICLE 1 — DÉFINITIONS</h2>
<ul>
  <li><strong>« Informations Confidentielles »</strong> : désigne l'ensemble des informations communiquées par ${esc(d.agencyName)}, notamment les profils de Talents (même anonymisés), leurs compétences, disponibilités, tarifs, références, coordonnées directes ou indirectes, ainsi que toute information permettant de les identifier.</li>
  <li><strong>« Talents »</strong> : désigne tout chef cuisinier, pâtissier, sommelier ou professionnel de la restauration référencé par ${esc(d.agencyName)}, qu'il ait ou non été nommément présenté au Client.</li>
  <li><strong>« Contournement »</strong> : désigne toute tentative du Client de prendre contact, directement ou indirectement, avec un Talent présenté par ${esc(d.agencyName)}, dans le but d'établir une relation commerciale en dehors de l'intermédiation de ${esc(d.agencyName)}.</li>
</ul>

<h2>ARTICLE 2 — OBLIGATIONS DE CONFIDENTIALITÉ</h2>
<p><strong>2.1 Engagement général.</strong> Le Client s'engage à traiter l'ensemble des Informations Confidentielles communiquées par ${esc(d.agencyName)} avec la plus stricte confidentialité. Il s'interdit de divulguer ces informations à tout tiers sans l'accord préalable et écrit de ${esc(d.agencyName)}.</p>
<p><strong>2.2 Utilisation restreinte.</strong> Les Informations Confidentielles ne peuvent être utilisées qu'aux fins exclusives d'évaluation des Talents dans le cadre de la mission pour laquelle elles ont été communiquées. Toute autre utilisation est strictement prohibée.</p>
<p><strong>2.3 Personnes habilitées.</strong> Le Client s'engage à ne communiquer les Informations Confidentielles qu'aux seules personnes de son organisation strictement impliquées dans la mission concernée, et à les informer des obligations du présent accord.</p>

<h2>ARTICLE 3 — OBLIGATION DE NON-CONTOURNEMENT</h2>
<p><strong>3.1 Interdiction de contact direct.</strong> Le Client s'interdit formellement, pendant toute la durée du présent accord et pour une période de <strong>${d.nonCircumventionMonths} (vingt-quatre) mois</strong> suivant la fin de la dernière mission réalisée, de :</p>
<ul>
  <li>contacter directement tout Talent présenté par ${esc(d.agencyName)}, par quelque moyen que ce soit (téléphone, email, réseaux sociaux, intermédiaire tiers, etc.) ;</li>
  <li>solliciter, embaucher ou conclure tout accord avec un Talent présenté par ${esc(d.agencyName)}, sans passer par l'intermédiation de ${esc(d.agencyName)} ;</li>
  <li>tenter d'identifier un Talent présenté sous forme anonymisée par ${esc(d.agencyName)} ;</li>
  <li>transmettre à un tiers les coordonnées ou informations permettant d'identifier un Talent.</li>
</ul>
<p><strong>3.2 Périmètre élargi.</strong> Ces obligations s'appliquent à l'ensemble des Talents présentés par ${esc(d.agencyName)}, y compris ceux qui n'ont pas été retenus pour la mission concernée.</p>
<p><strong>3.3 Obligation de signalement.</strong> Si le Client est approché directement par un Talent présenté par ${esc(d.agencyName)}, il s'engage à en informer ${esc(d.agencyName)} dans les <strong>${d.signalDelayHours} heures</strong>.</p>

<h2>ARTICLE 4 — PÉNALITÉS EN CAS DE VIOLATION</h2>
<p><strong>4.1 Indemnité forfaitaire.</strong> En cas de violation avérée des articles 2 ou 3 du présent accord, le Client sera redevable envers ${esc(d.agencyName)} d'une indemnité forfaitaire immédiatement exigible, égale à :</p>
<p style="border:1px solid #c0392b;padding:12px;text-align:center;font-weight:bold;color:#c0392b;">
${esc(d.sanctionDescription)}
</p>
<p><strong>4.2 Dommages et intérêts complémentaires.</strong> Cette indemnité forfaitaire est sans préjudice de tout dommage complémentaire que ${esc(d.agencyName)} pourrait démontrer et réclamer en justice, notamment au titre du préjudice commercial et d'image.</p>
<p><strong>4.3 Exigibilité.</strong> L'indemnité est due dès la constatation de la violation, sans mise en demeure préalable, et est exigible dans un délai de <strong>${d.paymentDelayDays} jours</strong> à compter de la notification de la violation.</p>

<h2>ARTICLE 5 — DURÉE</h2>
<p>Le présent accord entre en vigueur à la date de sa signature et demeure valide pour une durée de <strong>${d.agreementDurationYears} (cinq) ans</strong>, renouvelable tacitement par périodes annuelles, sauf dénonciation par lettre recommandée avec accusé de réception adressée à l'autre Partie avec un préavis de <strong>${d.noticePeriodMonths} mois</strong>.</p>
<p>Les obligations de non-contournement visées à l'article 3 survivront à l'expiration ou à la résiliation du présent accord pour une durée de <strong>${d.nonCircumventionMonths} mois</strong>.</p>

<h2>ARTICLE 6 — DISPOSITIONS GÉNÉRALES</h2>
<p><strong>6.1 Indépendance des clauses.</strong> Si l'une des dispositions du présent accord est déclarée nulle ou inapplicable, les autres dispositions demeureront pleinement en vigueur.</p>
<p><strong>6.2 Loi applicable et juridiction.</strong> Le présent accord est soumis au droit français. En cas de litige, et à défaut de résolution amiable dans un délai de <strong>${d.amiableDelayDays} jours</strong>, les Parties conviennent de la <strong>compétence exclusive des tribunaux de ${esc(d.jurisdiction)}</strong>.</p>
<p><strong>6.3 Cession.</strong> Le présent accord ne peut être cédé par le Client sans l'accord préalable et écrit de ${esc(d.agencyName)}.</p>
<p><strong>6.4 Intégralité de l'accord.</strong> Le présent accord constitue l'intégralité de l'accord entre les Parties sur l'objet qu'il définit et remplace tout accord antérieur relatif à ce même objet.</p>

${d.customClauses ? `<h2>Clauses spécifiques</h2><p>${esc(d.customClauses).replaceAll('\n', '<br/>')}</p>` : ''}

<h2>SIGNATURES</h2>
<p>Fait en deux (2) exemplaires originaux, à ${esc(d.jurisdiction)}, le ${dateFmt(d.signatureDate)}.</p>
<p style="font-style:italic;font-size:10pt">Mention manuscrite obligatoire pour chaque signataire : « Lu et approuvé ».</p>

<div class="signatures" style="grid-template-columns: 1fr 1fr; gap: 24px;">
  <div class="signature-block">
    <div class="role">Pour le CLIENT</div>
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
