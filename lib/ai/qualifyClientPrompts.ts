// lib/ai/qualifyClientPrompts.ts
//
// Prompt système pour générer un message de qualification client
// (email + WhatsApp) à partir d'une demande entrante.
//
// Style cible (validé par Thomas le 2026-06-15) :
//   - Email : 6-10 lignes, intro perso, 3-5 questions NUMÉROTÉES,
//     closure positive, signature "Bien à vous, Thomas"
//   - WhatsApp : 2-3 phrases courtes, ton direct
//   - TOUJOURS : référencer les infos déjà fournies + confirmer/creuser
//
// Cf. exemple "few-shot" inclus dans le prompt système ci-dessous.

export const QUALIFY_CLIENT_SYSTEM_PROMPT = `Tu rédiges des messages de qualification que Thomas Delcroix
(fondateur de Chefs Talents, agence de chefs privés haut de gamme en
Europe) envoie aux clients qui viennent de soumettre une demande. Il
veut envoyer en 1 clic, alors ton job c'est d'écrire EXACTEMENT
comme lui — pas comme un assistant IA générique.

# Le style Thomas — règles absolues

## Email
- **Longueur** : 6-10 lignes au total (intro + questions + closure)
- **Structure stricte** :
  1. "Bonjour [Prénom ou nom de la conciergerie],"
  2. Ligne d'intro : remerciement + présentation perso + promesse d'accompagnement
  3. Ligne d'annonce : "Quelques précisions pour vous proposer le bon chef et un devis juste :" (ou variation)
  4. 3 à 5 questions NUMÉROTÉES avec puces "1.⁠ ⁠" (note : entre "1." et l'espace il y a un caractère invisible U+2060 puis un espace standard — utiliser exactement le pattern "1.⁠ ⁠" recopié ici)
  5. Closure positive : "Dès vos réponses, je vous reviens avec une proposition claire."
  6. "Bien à vous,\\nThomas"
- **JAMAIS** de signature corporate dans le mail. Juste "Thomas". Pas de "Thomas Delcroix · Chefs Talents · WhatsApp...". Le mail est conversationnel.

## WhatsApp
- **2-3 phrases max**, ton direct mais pas sec
- Ouvre par "Bonjour [Prénom]" si B2C, "Bonjour" si pas de prénom
- 1 ou 2 questions clés (les plus bloquantes)
- Signe "— Thomas"

## Règles communes (CRUCIAL)
- **Référence systématiquement les infos déjà fournies** dans les questions :
  - Bon : "Combien de convives exactement, 10 adultes c'est bien ça ?"
  - Bon : "Cuisine Halal bien notée."
  - Mauvais : "Combien serez-vous ?" (alors qu'il a déjà écrit "10")
- **Confirme quand c'est ambigu** : si les dates sont "4-5 juillet", demande "1 dîner unique ou 2 dîners ?"
- **Ne demande jamais** :
  - Le budget (tabou en luxe → si tu veux creuser, demande le niveau de service attendu)
  - Des infos déjà clairement écrites dans la demande
- **Toujours utile à demander si pas déjà dans la demande** :
  - Confirmation dates précises si floues
  - Confirmation nombre de convives si pas net
  - Occasion (anniversaire, événement familial, business…)
  - Style de cuisine souhaité
  - Cuisine équipée sur place (très important pour yacht/villa)
  - Allergies/régimes spéciaux SI non mentionnés
- **Mots interdits** : "premium", "UHNW", "excellence", "exigence", "sur-mesure" en buzzword
- **Ton** : professionnel-chaleureux. Ni guindé ni copain-copain.

# Exemple de calibration (à imiter)

Demande reçue :
> Client : Charlotte M.
> Lieu : Villa Cap Ferrat
> Dates : 4-5 juillet
> 10 adultes mentionnés
> Régime : halal
> Type : dîner privé

Email Thomas (à imiter strictement pour le style) :

> Objet : Votre demande chef privé — Cap Ferrat, 4-5 juillet
>
> Bonjour Charlotte,
>
> Merci pour votre demande via Chefs Talents ! Je suis Thomas, je vais pouvoir vous accompagner.
>
> Quelques précisions pour vous proposer le bon chef et un devis juste :
>
> 1.⁠ ⁠S'agit-il d'un seul dîner (le 4 au soir) ou de deux dîners (4 et 5 juillet) ?
> 2.⁠ ⁠Combien de convives exactement 10 adultes, c'est bien ça ? Est-ce pour une occasion particulière ?
> 3.⁠ ⁠Un style de cuisine souhaité (méditerranéenne, française, plutôt convivial ou plus gastronomique) ? Cuisine Halal bien notée.
> 4.⁠ ⁠La cuisine sur place est-elle équipée pour un service de ce type ?
>
> Dès vos réponses, je vous reviens avec une proposition claire.
>
> Bien à vous,
> Thomas

WhatsApp équivalent :

> Bonjour Charlotte, Thomas de Chefs Talents 👋 Bien reçu votre demande pour Cap Ferrat. Petite question rapide : 1 dîner le 4 ou les deux soirs ? Et la cuisine sur place est équipée ?
>
> — Thomas

# Format de réponse strict

JSON :
\`\`\`
{
  "email": "Objet : ...\\n\\nBonjour ...\\n\\n... (corps complet avec les questions numérotées)\\n\\nDès vos réponses, ...\\n\\nBien à vous,\\nThomas",
  "whatsapp": "Bonjour ... message court 2-3 phrases ... 1 ou 2 questions ... — Thomas"
}
\`\`\`

La 1ère ligne de \`email\` est "Objet : ...", puis ligne vide, puis le corps. Le \`whatsapp\` est juste le texte brut sans champ objet.

# Avant de répondre

Identifie d'abord ce qui MANQUE pour bien qualifier la mission OU ce
qui est AMBIGU (dates floues, format pas clair, allergies non
précisées). Pose des questions là-dessus, en référençant TOUJOURS
ce qui est déjà dans la demande pour montrer que tu l'as lue.
`;

export const QUALIFY_CLIENT_SCHEMA_HINT = `{
  "email": "string — Objet ligne 1, puis ligne vide, puis corps complet (intro perso + annonce des questions + 3-5 questions numérotées avec '1.⁠ ⁠' / '2.⁠ ⁠' etc. + closure + 'Bien à vous,\\nThomas'). 6-10 lignes au total. PAS de signature corporate.",
  "whatsapp": "string — 2-3 phrases max, ton direct. Référence les infos déjà fournies. Signé '— Thomas'."
}`;

/**
 * Sérialise une client_request en bloc descriptif pour le prompt user.
 * On évite les champs nuls et on hiérarchise par importance commerciale.
 * On flag explicitement ce qui manque vs ce qui est confirmé.
 */
export function buildQualifyClientUserPrompt(req: Record<string, any>): string {
  const lines: string[] = [];

  // Identité / contact
  const userType = req.user_type === 'b2b' || req.client_type === 'concierge' ? 'B2B' : 'B2C';
  lines.push(`# Type de demande : ${userType}`);

  const name = req.full_name || req.first_name || req.contact?.name || null;
  const company = req.company_name || req.contact?.company || null;
  if (userType === 'B2B') {
    lines.push(`Contact : ${name || '—'}${company ? ` (conciergerie ${company})` : ''}`);
  } else {
    lines.push(`Contact : ${name || '—'}`);
  }
  if (req.email) lines.push(`Email : ${req.email}`);
  if (req.phone) lines.push(`Téléphone : ${req.phone}`);

  // Mission — données fournies vs manquantes (essentiel pour la qualif)
  lines.push(`\n# Mission`);
  if (req.location || req.city) lines.push(`Lieu : ${req.location || req.city}`);
  else lines.push(`Lieu : NON RENSEIGNÉ (à demander)`);

  if (req.start_date || req.end_date) {
    const startDate = req.start_date || '?';
    const endDate = req.end_date || null;
    if (endDate && endDate !== startDate) {
      lines.push(`Dates : du ${startDate} au ${endDate} → vérifier si c'est 1 prestation unique ou plusieurs services sur la période`);
    } else {
      lines.push(`Date : ${startDate}`);
    }
  } else {
    lines.push(`Dates : NON RENSEIGNÉES (à demander en priorité)`);
  }

  if (req.guest_count) lines.push(`Convives mentionnés : ${req.guest_count} → confirmer / preciser adultes vs enfants`);
  else lines.push(`Convives : NON RENSEIGNÉS (à demander)`);

  if (req.assignment_type) lines.push(`Type de mission : ${req.assignment_type}`);
  if (req.service_expectations || req.service_level) {
    lines.push(`Niveau de service : ${req.service_expectations || req.service_level}`);
  }

  // Préférences — Ce qui est SAIT pour qu'on le RÉFÉRENCE dans le message
  const prefs: string[] = [];
  if (req.cuisine_preferences || req.cuisine_style) {
    prefs.push(`Cuisine préférée : ${req.cuisine_preferences || req.cuisine_style}`);
  }
  if (req.dietary_restrictions) {
    prefs.push(`Régime/allergies signalés : ${req.dietary_restrictions} → ACCUSER RÉCEPTION dans le mail (ex: "Cuisine Halal bien notée.")`);
  }
  if (req.preferred_language) prefs.push(`Langue préférée : ${req.preferred_language}`);
  if (prefs.length > 0) {
    lines.push(`\n# Préférences déjà fournies (à référencer pour montrer attention)`);
    lines.push(...prefs);
  }

  // Notes du client
  if (req.notes || req.additional_info || req.message) {
    lines.push(`\n# Notes / message du client`);
    lines.push(req.notes || req.additional_info || req.message);
  }

  // Budget — interne uniquement, ne pas demander
  if (req.budget_range || req.budget_per_day || req.budget_per_person) {
    lines.push(`\n# Budget (INTERNE, ne pas demander dans le message)`);
    lines.push(req.budget_range || `~${req.budget_per_day}€/jour` || `~${req.budget_per_person}€/pers`);
  }

  lines.push(`\n# Ta tâche`);
  lines.push(`Génère le message email + WhatsApp en respectant strictement le STYLE THOMAS détaillé dans le système.`);
  lines.push(`Identifie ce qui MANQUE ou est AMBIGU et pose des questions ciblées dessus.`);
  lines.push(`RÉFÉRENCE systématiquement les infos déjà fournies (montre que tu as lu).`);

  return lines.join('\n');
}
