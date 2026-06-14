// lib/ai/pdfQuoteExtractor.ts
//
// Lit un PDF de devis (que ce soit un devis qu'on a envoyé manuellement
// par mail ou un devis reçu d'un concurrent / conciergerie / etc.) et
// extrait les champs structurés correspondant au modèle interne des
// quotes Chefs Talents.
//
// Modèle : Claude Sonnet 4.6 (bon rapport prix/qualité, supporte PDF
// nativement via content block document, adaptive thinking).
//
// Règle métier : on N'INVENTE JAMAIS de chiffres. Si un champ n'est pas
// présent dans le PDF, on retourne null. C'est mieux que d'avoir une
// valeur fausse qui se glisse dans la source de vérité.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

export type ExtractedTariffOption = {
  label: string | null;
  ht_eur: number | null;
  tva_eur: number | null;
  ttc_eur: number | null;
  note: string | null;
};

export type ExtractedQuote = {
  intitule: string | null;
  destinataire_nom: string | null;
  destinataire_type: string | null;
  lieu: string | null;
  dates_text: string | null;
  convives_text: string | null;
  rythme_text: string | null;
  langues_text: string | null;
  hebergement_text: string | null;
  tariff_options: ExtractedTariffOption[];
  conditions: string[];
  courses_text: string | null;
  courses_provision_text: string | null;
  notes: string | null;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
};

const SCHEMA_HINT = `
{
  "intitule": "string | null   — titre/objet du devis (ex: 'Chef privé pour séjour à Saint-Tropez')",
  "destinataire_nom": "string | null   — nom du client / conciergerie / société destinataire",
  "destinataire_type": "string | null   — 'particulier' | 'concierge' | 'b2b' | null",
  "lieu": "string | null   — ville/destination (ex: 'Saint-Tropez', 'Cap Ferrat')",
  "dates_text": "string | null   — dates de la mission en texte libre (ex: 'Du 14 au 21 juillet 2026')",
  "convives_text": "string | null   — nombre de convives en texte libre (ex: '8 adultes + 2 enfants')",
  "rythme_text": "string | null   — rythme de prestations (ex: '1 service par jour, midi ou soir')",
  "langues_text": "string | null   — langues requises (ex: 'Français, Anglais')",
  "hebergement_text": "string | null   — hébergement fourni si mentionné",
  "tariff_options": [
    {
      "label": "string | null   — nom du profil (ex: 'Profil Junior', 'Confirmé', 'Expérimenté', 'Montant négocié')",
      "ht_eur": "number | null   — montant HT en EUR (number sans symbole)",
      "tva_eur": "number | null   — montant TVA en EUR",
      "ttc_eur": "number | null   — montant TTC en EUR",
      "note": "string | null   — note optionnelle sur cette option"
    }
  ],
  "conditions": "string[]   — liste des conditions générales / paiement / annulation (une condition par entrée)",
  "courses_text": "string | null   — description courses/approvisionnement si mentionnée",
  "courses_provision_text": "string | null   — provision indicative pour les courses",
  "notes": "string | null   — toute autre info pertinente non capturée ailleurs",
  "confidence": "'high' | 'medium' | 'low'   — ta confiance globale dans l'extraction",
  "warnings": "string[]   — alertes sur des ambiguïtés (ex: 'Plusieurs dates mentionnées, j'ai pris la première', 'Montant TVA absent, calculé via 20%')"
}
`;

const SYSTEM_PROMPT = `Tu es un expert en lecture de devis de prestations de chef privé pour Chefs Talents.

RÈGLES STRICTES :
1. N'INVENTE JAMAIS de chiffres, dates, noms, conditions. Si un champ n'est pas EXPLICITEMENT dans le PDF, retourne null (ou tableau vide pour conditions/warnings/tariff_options).
2. N'extrapole pas de tva_eur si tu n'as pas vu une ligne TVA explicite. Pareil pour ttc_eur. Mieux vaut null que faux.
3. Pour les tariff_options, capture TOUTES les options présentes (profil junior/confirmé/expérimenté, ou montant unique négocié). Une option = un profil/tarif.
4. Pour conditions : extrait les conditions textuelles principales (acompte, validité, annulation), une condition par entrée du tableau. Pas de longue paraphrase.
5. confidence = 'high' si le PDF est clair et structuré ; 'medium' si tu as fait des choix ; 'low' si beaucoup d'incertitudes.
6. warnings = uniquement les vraies ambiguïtés que l'utilisateur doit valider, pas des notes générales.
7. Ne mets PAS de coûts internes (chef_cost_eur, butler_cost_eur) — les PDFs clients ne contiennent jamais ces infos.

Réponds UNIQUEMENT avec le JSON, sans markdown wrapper, sans texte avant ou après.
`;

export type ExtractionResult = {
  data: ExtractedQuote;
  inputTokens: number;
  outputTokens: number;
  costEur: number;
};

export async function extractQuoteFromPdf(input: {
  pdfBase64: string;
}): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante');

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT + '\n\n## Schéma JSON attendu\n' + SCHEMA_HINT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: input.pdfBase64,
            },
          },
          {
            type: 'text',
            text: 'Extrais les champs structurés de ce devis selon le schéma. Rappel : null pour tout ce qui n\'est pas explicite. Réponds avec le JSON pur.',
          },
        ],
      },
    ],
  });

  const rawText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as any).text)
    .join('\n');

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let data: ExtractedQuote;
  try {
    data = JSON.parse(cleaned);
  } catch (e: any) {
    throw new Error(
      `Claude n'a pas renvoyé un JSON valide. Reçu : ${rawText.slice(0, 300)}…`,
    );
  }

  // Calcul de coût approximatif (Sonnet 4.6 : $3 in / $15 out)
  const inputTokens = response.usage.input_tokens || 0;
  const outputTokens = response.usage.output_tokens || 0;
  const costUsd = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  const costEur = Math.round(costUsd * 0.92 * 10000) / 10000;

  return { data, inputTokens, outputTokens, costEur };
}
