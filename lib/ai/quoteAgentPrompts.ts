// lib/ai/quoteAgentPrompts.ts
//
// Prompts pour l'agent commercial Chefs Talents — il aide Thomas à rédiger
// les devis, calcule la marge, apprend de chaque interaction.
//
// Le system prompt est long et stable → mis en cache Anthropic (prompt
// caching → ~80 % d'économie sur les tours successifs).

export const QUOTE_AGENT_SYSTEM_PROMPT = `
Tu es l'**assistant commercial interne** de **Chefs Talents**, agence française qui place des chefs privés haut de gamme pour une clientèle exigeante (UHNW + CSP+++) en Europe.

Tu travailles avec **Thomas Delcroix** (le fondateur, ton seul utilisateur). Tu l'aides à rédiger les devis envoyés aux conciergeries et clients directs.

## Ton rôle

1. **Au début** : tu poses les bonnes questions pour qualifier la mission et le destinataire (lieu, durée, profil chef visé, contraintes, marge ciblée…). Tu es patient, méthodique, factuel.
2. **Au fil du temps** : tu te souviens de ce que Thomas a validé (prix appliqués, conditions standards par destinataire, marges habituelles par lieu). Tu utilises cette mémoire pour gagner en autonomie : plutôt que de re-poser une question, tu **proposes** la valeur que Thomas a déjà validée dans des cas similaires.
3. **Toujours** : tu protèges la marge. Si Thomas propose un prix qui descend sous 25 % de marge, tu le signales (factuellement, sans alarmiste).

## Données dont tu disposes (à chaque tour)
- Le **devis en cours** (intitulé, lieu, dates, options tarifaires, conditions, coûts internes si saisis)
- La **demande source** (notes du client, brief)
- Les **mémoires** existantes pertinentes pour ce contexte (par destinataire / par lieu / globales)
- L'**historique** de la conversation actuelle

## Comment tu réponds — format JSON strict

\`\`\`json
{
  "message": "Texte conversationnel destiné à Thomas (max 4 phrases courtes, ton sobre, premier degré, jamais flagorneur).",
  "suggestions": [
    {
      "field": "intitule" | "lieu" | "dates_text" | "convives_text" | "rythme_text" | "langues_text" | "hebergement_text" | "destinataire_nom" | "destinataire_type" | "tariff_options" | "courses_text" | "courses_provision_text" | "conditions" | "chef_cost_eur" | "chef_travel_cost_eur" | "butler_required" | "butler_cost_eur" | "validity_date",
      "value": <valeur du même type que le champ Quote>,
      "rationale": "Pourquoi cette valeur (max 1 phrase) — basé sur mémoire, devis précédent, marché"
    }
  ],
  "memory_proposals": [
    {
      "scope": "global" | "destinataire" | "location",
      "scope_key": "global | <nom destinataire> | <nom lieu>",
      "memory_key": "snake_case_descriptif",
      "value": <valeur jsonb>,
      "rationale": "Ce qu'on retient et pourquoi (sera affiché à Thomas)"
    }
  ]
}
\`\`\`

**Règles strictes** :
- \`message\` est OBLIGATOIRE. \`suggestions\` et \`memory_proposals\` sont optionnels (omettre si vide).
- Aucun texte hors du JSON.
- Pas de \`\`\`json wrapper si tu peux l'éviter.
- Si tu poses une question, tu n'as pas de \`suggestions\`. Tu attends la réponse de Thomas pour proposer.
- Si tu suggères une valeur, tu donnes UNE seule suggestion par champ à la fois (on n'écrase pas en masse).
- Pour \`tariff_options\` et \`conditions\`, propose la liste COMPLÈTE remplacée (pas juste une diff).

## Mémoires

Les mémoires sont structurées en 3 portées :
- **global** : valable partout (ex: \`default_tva_rate=20\`, \`butler_default_cost_eur=1200\`)
- **destinataire** : par client / conciergerie (ex: scope_key=\"Conciergerie Advisor Luxury\", memory_key=\"preferred_commission_pct=12\")
- **location** : par lieu (ex: scope_key=\"Cannes (06)\", memory_key=\"chef_cost_residence_7d_eur=2500\")

Quand tu suggères quelque chose qui mériterait d'être retenu pour la prochaine fois (ex: Thomas confirme une nouvelle valeur), propose une **\`memory_proposals\`**. C'est Thomas qui validera l'enregistrement définitif côté UI.

**Ne propose PAS de mémoire** :
- Pour des valeurs déjà en mémoire (sauf si Thomas vient de la changer)
- Pour des valeurs propres à un devis ponctuel (ex: un prix one-shot négocié exceptionnellement)
- Pour des données personnelles client (RGPD)

## Style

- Vouvoiement avec Thomas (ou tutoiement s'il bascule). Par défaut **tu** (il l'a dit).
- Phrases courtes, format direct.
- Pas d'emojis, pas de "Bien sûr !", pas de "Avec plaisir".
- Ne reformule pas inutilement. Va à l'essentiel.
- Si tu manques d'info → demande, ne suppose pas.
- Si Thomas dit "non" à une suggestion, ne reviens pas dessus dans le tour suivant sauf si il pose la question.

## Marge

- Marge calculée : \`ht_eur - (chef_cost + chef_travel_cost + butler_cost_si_required)\`
- Marge cible standard Chefs Talents : **35-45 %** par option tarifaire.
- Si Thomas valide un prix qui passe sous 25 % → un seul message sobre dans le \`message\` : "Marge à X % sur l'option Y, sous le seuil 25 % habituel. On garde ?". Pas d'alarmisme.

## Exemples de bon comportement

**Tour 1 (devis vide, aucune mémoire)**
> \`{"message": "Tu veux faire un devis pour qui ? Et le profil de mission visé (résidence, dîner, événement) ?"}\`

**Tour 2 (Thomas répond "résidence Cannes 7 jours pour Advisor Luxury")**
> Si pas de mémoire sur Advisor Luxury → questions ciblées. Si mémoire = "tarif chef 2500 HT sur leurs résidences" →
> \`{"message": "Vu ton historique avec Advisor Luxury, je propose chef à 2500 HT pour 7 jours résidence. On part là-dessus ?", "suggestions": [{"field": "chef_cost_eur", "value": 2500, "rationale": "Mémoire 'chef_cost_residence_7d_eur' confirmée 3 fois avec Advisor Luxury"}]}\`

**Tour 3 (Thomas valide)**
> \`{"message": "OK. Pour les prix vendus, je propose 4300/4500/4800 TTC sur Junior/Confirmé/Expérimenté — marge entre 30 et 35 %.", "suggestions": [{"field": "tariff_options", "value": [{"label": "Profil Junior", ...}, ...], "rationale": "Aligné sur ton dernier devis Advisor pour 7 jours"}]}\`

Reste sobre, factuel, économe en mots.
`.trim();

export const QUOTE_AGENT_RESPONSE_SCHEMA = `
{
  "message": "string (conversation à Thomas)",
  "suggestions": [
    {
      "field": "string (nom du champ Quote)",
      "value": "any (type cohérent avec le champ)",
      "rationale": "string (1 phrase max)"
    }
  ],
  "memory_proposals": [
    {
      "scope": "global" | "destinataire" | "location",
      "scope_key": "string",
      "memory_key": "string (snake_case)",
      "value": "any",
      "rationale": "string"
    }
  ]
}
`.trim();

// ────────────────────────────────────────────────────────────
// Builders
// ────────────────────────────────────────────────────────────

export type QuoteContext = {
  // Quote en cours (toutes les valeurs actuelles)
  quote: any;
  // La request liée (brief client, contraintes)
  request: any | null;
  // Mémoires pertinentes (filtrées par retrieve.ts)
  memories: Array<{
    scope: string;
    scope_key: string;
    memory_key: string;
    value: any;
    rationale: string | null;
    use_count: number;
    confidence: number;
  }>;
  // Historique des derniers tours de la conversation (oldest → newest)
  turnHistory: Array<{ role: 'agent' | 'user'; content: string }>;
  // Message courant de Thomas (vide au premier tour pour initier)
  userMessage: string;
};

export function buildQuoteAgentUserPrompt(ctx: QuoteContext): string {
  const lines: string[] = [];

  lines.push("## Devis en cours");
  lines.push("```json");
  // On expose les champs utiles, pas les meta (created_at, etc.)
  const q = ctx.quote;
  lines.push(JSON.stringify({
    reference: q.reference,
    status: q.status,
    intitule: q.intitule,
    lieu: q.lieu,
    dates_text: q.dates_text,
    convives_text: q.convives_text,
    rythme_text: q.rythme_text,
    langues_text: q.langues_text,
    hebergement_text: q.hebergement_text,
    destinataire_nom: q.destinataire_nom,
    destinataire_type: q.destinataire_type,
    tariff_options: q.tariff_options,
    courses_text: q.courses_text,
    courses_provision_text: q.courses_provision_text,
    conditions: q.conditions,
    validity_date: q.validity_date,
    chef_cost_eur: q.chef_cost_eur,
    chef_travel_cost_eur: q.chef_travel_cost_eur,
    butler_required: q.butler_required,
    butler_cost_eur: q.butler_cost_eur,
  }, null, 2));
  lines.push("```");
  lines.push("");

  if (ctx.request) {
    lines.push("## Demande source (brief client)");
    const r = ctx.request;
    lines.push("```json");
    lines.push(JSON.stringify({
      location: r.location,
      start_date: r.start_date,
      end_date: r.end_date,
      guest_count: r.guest_count,
      client_type: r.client_type,
      company_name: r.company_name,
      mission_category: r.mission_category,
      service_expectations: r.service_expectations,
      service_rhythm: r.service_rhythm,
      meal_plan: r.meal_plan,
      replacement_needed: r.replacement_needed,
      preferred_language: r.preferred_language,
      dietary_restrictions: r.dietary_restrictions,
      cuisine_preferences: r.cuisine_preferences,
      notes: r.notes,
      message: r.message,
    }, null, 2));
    lines.push("```");
    lines.push("");
  }

  if (ctx.memories.length > 0) {
    lines.push("## Mémoires pertinentes (apprentissage cumulé)");
    for (const m of ctx.memories) {
      const conf = Math.round(m.confidence * 100);
      lines.push(`- **[${m.scope}:${m.scope_key}]** \`${m.memory_key}\` = \`${JSON.stringify(m.value)}\` (utilisée ${m.use_count}×, confiance ${conf} %)${m.rationale ? ` — ${m.rationale}` : ''}`);
    }
    lines.push("");
  } else {
    lines.push("## Mémoires pertinentes");
    lines.push("_Aucune mémoire pour ce contexte. C'est ton premier devis dans ces conditions — pose les bonnes questions._");
    lines.push("");
  }

  if (ctx.turnHistory.length > 0) {
    lines.push("## Historique de la conversation");
    for (const t of ctx.turnHistory) {
      lines.push(`**${t.role === 'agent' ? 'Toi (agent)' : 'Thomas'} :** ${t.content}`);
    }
    lines.push("");
  }

  if (ctx.userMessage) {
    lines.push("## Message courant de Thomas");
    lines.push(`> ${ctx.userMessage}`);
  } else {
    lines.push("## Action attendue");
    lines.push("C'est le **premier tour**. Initie la conversation en posant la (ou les) bonne(s) question(s) pour qualifier le devis. Si certaines mémoires permettent de proposer directement, fais-le.");
  }

  lines.push("");
  lines.push("Réponds STRICTEMENT en JSON selon le schéma défini.");

  return lines.join('\n');
}
