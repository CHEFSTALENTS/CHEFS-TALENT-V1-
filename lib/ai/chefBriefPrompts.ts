// lib/ai/chefBriefPrompts.ts
//
// Prompt système pour générer le brief chef à envoyer J-1.
// L'objectif est d'aider Thomas à transmettre tous les éléments
// contractuels SANS RIEN INVENTER. Si une info manque dans le
// contrat → "[À PRÉCISER PAR THOMAS]" plutôt qu'inventer.
//
// Sortie : { brief: string, whatsapp: string, missingFields: string[] }

export const CHEF_BRIEF_SYSTEM_PROMPT = `Tu rédiges le brief chef que Thomas Delcroix (Chefs Talents) envoie
au chef en amont de la mission, idéalement à J-1. Le brief doit être
construit STRICTEMENT à partir des éléments du contrat — JAMAIS
d'invention.

# Règle absolue : zéro invention

Si une info N'EST PAS dans les données fournies (lieu, dates, services
contractuels, allergies, etc.) → tu écris "[À PRÉCISER PAR THOMAS]"
au lieu d'inventer. Tu listes ces manques dans \`missingFields\`.

C'est un OUTIL DE RAPPEL pour Thomas — il complétera lui-même avant
d'envoyer. Mieux vaut un brief honnête avec des trous explicites
qu'un brief plausible mais faux.

# Structure obligatoire du brief

\`\`\`
🍽 BRIEF CHEF — [Nom client] — [Lieu]
[Dates précises de la mission]

────────────────────────────
📍 CONTEXTE
────────────────────────────
• Client : ...
• Lieu : ...
• Dates : du ... au ... (X jours)
• Couverts : ...
• Type de mission : ...

────────────────────────────
🍴 SERVICES CONTRACTUELS
────────────────────────────
[Liste ligne par ligne TOUS les services du contrat, sans en omettre.
Ex :
 • Petit-déjeuner — 6 personnes — quotidien
 • Déjeuner — 4 à 6 personnes — j2, j4, j5
 • Dîner — 8 personnes — quotidien (formule enrichie j3)
 • Fromage / amuse-bouche / etc. si mentionné]

────────────────────────────
🚫 RESTRICTIONS / ALLERGIES
────────────────────────────
[Liste exacte des restrictions communiquées dans la demande. Si rien
n'est mentionné : "Aucune restriction signalée par le client."]

────────────────────────────
🍳 MENU
────────────────────────────
[À PRÉCISER PAR THOMAS]
(Note : le menu est rarement dans le contrat — Thomas relit et complète.)

────────────────────────────
⏰ HORAIRES
────────────────────────────
• Amplitude prévue : ...h / jour
• Seuil heures sup : ...
[Si absent : "[À PRÉCISER PAR THOMAS]"]

────────────────────────────
🛒 COURSES
────────────────────────────
[Mode de gestion : Carte Revolut / Provision client / Avance chef
+ remboursement]
• Justificatifs : obligatoires (tickets de caisse à conserver)
[Si absent : "[À PRÉCISER PAR THOMAS]"]

────────────────────────────
💶 RÉMUNÉRATION
────────────────────────────
• Montant net chef : ... € HT
• Acompte : ... % à la signature
• Solde : ... % sous ... jours ouvrés après fin de mission

────────────────────────────
📋 RC PRO
────────────────────────────
• Attestation RC Pro obligatoire avant mission
• Statut actuel : [✓ fournie | ⚠ EN ATTENTE — à envoyer à Thomas]

────────────────────────────
\`\`\`

# Message WhatsApp d'accompagnement (court)

3-4 phrases max. Ton chaleureux mais pro. Format :

> Salut [Prénom] 👋
>
> Voici le brief complet pour [Lieu] du [date] — à relire avant le jour J.
> [1 phrase sur ce qui mérite attention si pertinent — ex: "Attention au passage en formule enrichie le j3."]
>
> Tu confirmes réception et tu me poses les questions si quelque chose
> est flou.
>
> — Thomas

# Contrôle anti-oubli "fromage"

Si le contrat liste des prestations spécifiques (formule enrichie,
fromage, amuse-bouche, plateau apéritif, etc.) et qu'elles
N'APPARAISSENT PAS dans ton brief, ajoute-les. Ne JAMAIS perdre une
ligne du contrat. Si tu as un doute → mets-la en signalant
"[À CONFIRMER, présent au contrat]".

# Format JSON strict

\`\`\`
{
  "brief": "Le brief chef formaté multi-ligne avec emojis, séparateurs, comme spécifié.",
  "whatsapp": "Message WhatsApp court signé '— Thomas'.",
  "missingFields": ["Liste des champs marqués [À PRÉCISER] : ex 'menu', 'horaires', 'mode courses'"]
}
\`\`\`
`;

export const CHEF_BRIEF_SCHEMA_HINT = `{
  "brief": "string — Brief chef formaté complet, multi-ligne, avec emojis et séparateurs. Reprend ligne par ligne le contrat. Marque [À PRÉCISER PAR THOMAS] pour les infos manquantes.",
  "whatsapp": "string — Message WhatsApp court d'accompagnement (3-4 phrases), signé '— Thomas'.",
  "missingFields": "string[] — Liste des champs qui sont marqués [À PRÉCISER] dans le brief (ex: 'menu', 'horaires'). Aide Thomas à savoir quoi compléter avant envoi."
}`;

/**
 * Sérialise une mission + son contrat chef en bloc descriptif
 * pour le prompt user. Hiérarchise par importance.
 */
export function buildChefBriefUserPrompt(mission: Record<string, any>): string {
  const lines: string[] = [];
  const chefContract = (mission.contracts_data?.chef ?? {}) as any;

  // Header
  lines.push(`# Mission à briefer`);
  lines.push(`Mission ID : ${mission.id}`);

  // Identité
  lines.push(`\n## Client + lieu`);
  lines.push(`Client : ${mission.client_name || mission.contracts_data?.client?.nom || '[À PRÉCISER]'}`);
  lines.push(`Lieu : ${chefContract.lieu || mission.location || '[À PRÉCISER]'}`);

  // Dates
  lines.push(`\n## Dates`);
  if (mission.start_date) lines.push(`Début : ${mission.start_date}`);
  else lines.push(`Début : [À PRÉCISER]`);
  if (mission.end_date) lines.push(`Fin : ${mission.end_date}`);

  // Couverts + format
  lines.push(`\n## Convives + format`);
  if (mission.guest_count) lines.push(`Couverts moyens : ${mission.guest_count}`);
  if (chefContract.rythme) lines.push(`Rythme : ${chefContract.rythme}`);
  if (chefContract.jourRepos) lines.push(`Jour repos : ${chefContract.jourRepos}`);

  // Services contractuels — c'est CRITIQUE
  lines.push(`\n## Services vendus (contrat)`);
  const servicesText = chefContract.services
    || chefContract.prestations
    || chefContract.formats
    || mission.service_level
    || '';
  if (servicesText) {
    lines.push(servicesText);
  } else {
    lines.push(`[À LIRE DANS LE CONTRAT — non extrait automatiquement]`);
  }

  // Allergies / régimes
  lines.push(`\n## Restrictions / allergies`);
  const restrictions = chefContract.restrictions
    || mission.notes
    || mission.contracts_data?.client?.restrictions
    || '';
  if (restrictions) {
    lines.push(restrictions);
  } else {
    lines.push(`[Aucune restriction signalée par le client]`);
  }

  // Horaires
  lines.push(`\n## Horaires`);
  if (chefContract.amplitude) lines.push(`Amplitude : ${chefContract.amplitude}`);
  if (chefContract.seuilHeuresSup) lines.push(`Seuil heures sup : ${chefContract.seuilHeuresSup}`);

  // Courses / approvisionnements
  lines.push(`\n## Approvisionnements / courses`);
  if (chefContract.approvisionnements) lines.push(chefContract.approvisionnements);

  // Rémunération
  lines.push(`\n## Rémunération`);
  if (chefContract.amountHt != null) lines.push(`Net HT chef : ${chefContract.amountHt} €`);
  else if (mission.chef_amount != null) lines.push(`Net HT chef : ${mission.chef_amount} €`);
  if (chefContract.depositPct != null) lines.push(`Acompte : ${chefContract.depositPct}%`);
  if (chefContract.balanceDays != null) lines.push(`Solde sous : ${chefContract.balanceDays} jours ouvrés après fin de mission`);

  // RC Pro
  lines.push(`\n## RC Pro chef`);
  if (mission.brief_chef_rc_pro_url || mission.brief_chef_rc_pro_file_path) {
    lines.push(`Attestation fournie ✓`);
  } else {
    lines.push(`Attestation NON fournie — à demander au chef avant le jour J`);
  }

  // Chef identifié
  lines.push(`\n## Chef sélectionné`);
  if (mission.chef_name) lines.push(`Prénom : ${(mission.chef_name as string).split(' ')[0]}`);
  if (mission.chef_email) lines.push(`Email : ${mission.chef_email}`);

  lines.push(`\n# Ta tâche`);
  lines.push(`Génère le brief chef formaté + le message WhatsApp d'accompagnement.`);
  lines.push(`JAMAIS d'invention. Si une info manque → "[À PRÉCISER PAR THOMAS]" et liste-la dans missingFields.`);
  lines.push(`Reprends ligne par ligne le contrat — ne perds aucune prestation.`);

  return lines.join('\n');
}
