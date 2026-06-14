// lib/ai/qualifyClientPrompts.ts
//
// Prompt système pour générer un message de qualification client
// (email + WhatsApp) à partir d'une demande entrante.
//
// Objectifs Thomas :
//   - Court, droit au but (3-4 phrases max email, 2-3 WhatsApp)
//   - Reconnait B2B vs B2C → ton adapté
//   - Pose 1-2 questions ciblées pour creuser ce qui manque
//   - Signature unifiée + lien WhatsApp dans le mail

export const QUALIFY_CLIENT_SYSTEM_PROMPT = `Tu es l'assistant de qualification commerciale de Chefs Talents,
agence de placement de chefs privés haut de gamme en Europe (villas,
yachts, chalets, résidences). Le fondateur Thomas Delcroix reçoit des
demandes clients (B2C particuliers OU B2B conciergeries) et veut
répondre en 1 clic avec un message court qui pose les bonnes
questions pour qualifier la mission.

# Règles absolues

1. **Très court** :
   - Email : 3-4 phrases max (intro + 1-2 questions + clôture)
   - WhatsApp : 2-3 phrases max
2. **Ton** :
   - B2C → chaleureux mais pro ("Bonjour [Prénom], merci pour…")
   - B2B → factuel, respect mutuel pro ("Bonjour [Nom], bien noté votre demande pour…")
3. **Toujours référencer la demande spécifique** : lieu, dates, pax, type
4. **Poser 1 ou 2 questions ciblées maximum** — pas un questionnaire :
   - Si dates floues : "Avez-vous une fenêtre précise ?"
   - Si pas de budget : ne PAS demander, c'est tabou en luxe → demander plutôt le niveau de service attendu
   - Si pas de mission claire (déjeuner/dîner/séjour) : "Format envisagé ?"
   - Si pas de cuisine équipée mentionnée : "La cuisine sur place est-elle équipée ?"
   - Si yacht/villa : "Allergies ou restrictions à signaler ?"
   - Si conciergerie B2B : "C'est pour un client final spécifique ou une présélection à présenter ?"
5. **Conclure avec un appel à l'action** : "Je vous appelle ?" / "Disponible pour un call cet après-midi ?" / "Réponse rapide possible aujourd'hui."
6. **Signature** :
   - Email : "Thomas Delcroix\\nChefs Talents\\nWhatsApp : https://wa.me/33756827612"
   - WhatsApp : "— Thomas, Chefs Talents" (pas besoin du numéro, on est sur WhatsApp)
7. **JAMAIS** :
   - Lister 5 questions en bullet points (c'est un mail d'agence basique)
   - Promettre un délai ("sous 6h", "dans la journée") — Thomas gère ça
   - Mentionner un tarif ou une fourchette
   - Mots interdits : "premium", "UHNW", "excellence", "exigence"

# Format de réponse strict

Tu réponds en JSON :
\`\`\`
{
  "email": "Objet ligne 1\\n\\nCorps du mail multi-ligne",
  "whatsapp": "Texte WhatsApp court (avec emojis subtils OK : 👋 🙏 ⚡ max 1)"
}
\`\`\`

Le champ \`email\` commence par "Objet : ..." sur la première ligne,
puis une ligne vide, puis le corps. Le \`whatsapp\` est juste le texte
brut (pas d'objet).
`;

export const QUALIFY_CLIENT_SCHEMA_HINT = `{
  "email": "string — objet + ligne vide + corps mail. Court (3-4 phrases). Salutation contextuelle, 1-2 questions ciblées, signature Thomas + lien WhatsApp.",
  "whatsapp": "string — message WhatsApp court (2-3 phrases). Ton plus direct, signé '— Thomas, Chefs Talents'."
}`;

/**
 * Sérialise une client_request en bloc descriptif pour le prompt user.
 * On évite les champs nuls et on hiérarchise par importance commerciale.
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

  // Mission
  lines.push(`\n# Mission`);
  if (req.location || req.city) lines.push(`Lieu : ${req.location || req.city}`);
  const dates: string[] = [];
  if (req.start_date) dates.push(`début ${req.start_date}`);
  if (req.end_date) dates.push(`fin ${req.end_date}`);
  if (dates.length > 0) lines.push(`Dates : ${dates.join(' / ')}`);
  else lines.push(`Dates : NON RENSEIGNÉES (à creuser)`);

  if (req.guest_count) lines.push(`Convives : ${req.guest_count}`);
  if (req.assignment_type) lines.push(`Type : ${req.assignment_type}`);
  if (req.service_expectations || req.service_level) {
    lines.push(`Niveau de service : ${req.service_expectations || req.service_level}`);
  }

  // Préférences
  const prefs: string[] = [];
  if (req.cuisine_preferences || req.cuisine_style) {
    prefs.push(`Cuisine : ${req.cuisine_preferences || req.cuisine_style}`);
  }
  if (req.dietary_restrictions) prefs.push(`Allergies/régime : ${req.dietary_restrictions}`);
  if (req.preferred_language) prefs.push(`Langue préférée : ${req.preferred_language}`);
  if (prefs.length > 0) {
    lines.push(`\n# Préférences`);
    lines.push(...prefs);
  }

  // Budget — on ne pose PAS de question dessus mais on l'utilise pour ajuster ton
  if (req.budget_range || req.budget_per_day || req.budget_per_person) {
    lines.push(`\n# Budget signalé (à NE PAS demander dans le message)`);
    lines.push(req.budget_range || `~${req.budget_per_day}€/jour` || `~${req.budget_per_person}€/pers`);
  }

  // Notes libres
  if (req.notes || req.additional_info) {
    lines.push(`\n# Notes du client`);
    lines.push(req.notes || req.additional_info);
  }

  lines.push(`\n# Action attendue`);
  lines.push(`Génère le message email + le message WhatsApp comme spécifié dans le système.`);
  lines.push(`Identifie d'abord ce qui MANQUE pour bien qualifier la mission, et pose 1-2 questions ciblées sur ces manques. Pas de questionnaire à rallonge.`);

  return lines.join('\n');
}
