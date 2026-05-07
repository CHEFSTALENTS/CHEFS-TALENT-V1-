// lib/vip-guides/_guides/cuisine-wellness-uhnw.ts
// Guide VIP — Cuisine wellness, retraite santé, régimes médicaux UHNW
// FR / EN — pilier "metier"

import type { Guide } from '../types';

export const cuisineWellnessUhnw: Guide = {
  slug: 'cuisine-wellness-uhnw',
  heroImage: '/images/email/plating.jpg',
  readingMinutes: 7,
  pillar: 'metier',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Cuisine wellness, retraite santé, régimes médicaux UHNW',
    excerpt:
      'Cétogène, jeûne intermittent, casher, allergies sévères, postopératoire. Tenir le niveau dans la contrainte est un avantage tarifaire majeur, pour qui sait travailler ces régimes sans les subir.',
    body: [
      {
        kind: 'p',
        text: 'Une part croissante des missions UHNW intègre une dimension santé, soit parce que le client suit un protocole médical ou diététique encadré, soit parce qu’il s’est engagé dans une retraite wellness pendant sa saison. Sur les chefs que je suis dans le réseau depuis 2023, ce type de mission représente aujourd’hui 25 à 35 % des placements en haute saison, contre moins de 10 % cinq ans plus tôt. Le segment se déplace, et les chefs qui ne savent pas livrer un menu cétogène propre ou un régime FODMAP rigoureux passent à côté de ces missions.',
      },
      {
        kind: 'p',
        text: 'L’opportunité tarifaire est forte. Une mission wellness ou médicale rigoureuse se paie 20 à 35 % au-dessus d’une mission classique de même durée, parce que le chef qui la livre est plus rare et que l’enjeu de santé déplace la conversation tarifaire. Encore faut-il savoir l’exécuter sans risque.',
      },

      { kind: 'h2', text: 'Distinguer les trois familles de régimes' },
      {
        kind: 'p',
        text: 'Trois familles de régimes dominent dans le segment ultra-aisé, et la posture du chef varie selon la famille.',
      },
      {
        kind: 'p',
        text: 'La première famille couvre les régimes wellness lifestyle. Plant-based, paléo, cétogène moderne, jeûne intermittent à fenêtre courte. Ces régimes sont choisis par le client pour des raisons de performance ou de bien-être, sans suivi médical strict. Vous avez une marge d’interprétation et l’erreur ponctuelle est récupérable. Votre rôle est de livrer un menu cohérent avec le régime, pas de l’imposer comme une religion.',
      },
      {
        kind: 'p',
        text: 'La deuxième famille couvre les régimes médicaux suivis. Cétogène thérapeutique pour épilepsie ou maladie neurodégénérative, postopératoire, FODMAP pour syndrome intestinal, régime rénal, régime diabétique de type 1. Ces régimes sont prescrits par un médecin ou un nutritionniste qui suit le client. Vous travaillez sous la supervision implicite de ce praticien et l’erreur n’est pas récupérable. Demandez systématiquement le contact du nutritionniste référent et faites valider votre menu hebdomadaire.',
      },
      {
        kind: 'p',
        text: 'La troisième famille couvre les contraintes religieuses ou éthiques durables. Casher, halal strict, hindouisme végétarien, jaïnisme. Ces contraintes sont permanentes, le client les vit depuis des années et il sait reconnaître une erreur. Votre marge d’interprétation est nulle. Vous devez maîtriser les règles de séparation et les ingrédients interdits avant de signer la mission, pas pendant.',
      },

      { kind: 'h2', text: 'Les régimes les plus demandés en 2026' },
      {
        kind: 'p',
        text: 'Cinq régimes représentent à eux seuls 80 % des demandes wellness ou médicales que je vois passer dans le réseau. Vous gagnez à les maîtriser de fond avant de les rencontrer en mission.',
      },
      {
        kind: 'ul',
        items: [
          'Cétogène strict (moins de 30 g de glucides nets par jour) avec ratio matières grasses 70 à 75 %, protéines 20 à 25 %, glucides 5 à 10 %.',
          'Plant-based exigeant, sans soja transformé, sans gluten ajouté, avec apports protéiques végétaux travaillés (légumineuses, quinoa, sarrasin, oléagineux).',
          'FODMAP en phase d’élimination puis réintroduction, avec rotation hebdomadaire des familles autorisées validée par le nutritionniste.',
          'Anti-inflammatoire, élimination des sucres ajoutés, des laitages, des nightshades, des huiles industrielles, valorisation des poissons gras et des herbes anti-oxydantes.',
          'Postopératoire chirurgie bariatrique ou digestive, textures progressives sur six à dix semaines, portions très réduites, surveillance des apports protéiques et hydriques.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Construire une bibliothèque personnelle de quarante recettes maîtrisées (dix par grand régime) est un investissement de trois à quatre semaines de travail hors saison. Il vous positionne durablement comme chef capable de livrer dans la contrainte, ce qui se paie cher dans le segment.',
      },

      { kind: 'h2', text: 'Le brief médical, indispensable' },
      {
        kind: 'p',
        text: 'Sur un régime médical strict, ne signez jamais une mission sans avoir reçu et validé un brief médical écrit. Ce document liste les aliments interdits absolument, les aliments à limiter quantitativement, les apports nutritionnels minimaux journaliers, les réactions à surveiller et la procédure en cas d’incident.',
      },
      {
        kind: 'p',
        text: 'Demandez explicitement à parler au nutritionniste référent du client en début de mission, idéalement par téléphone. Cette conversation de quinze minutes vaut deux jours de prudence anxieuse en cuisine. Le nutritionniste est généralement très favorable à cet échange : il préfère piloter un chef qui pose les bonnes questions plutôt que rectifier les erreurs d’un chef silencieux.',
      },
      {
        kind: 'p',
        text: 'Conservez ce brief par écrit pendant toute la durée de la mission, avec mises à jour datées si le régime évolue. Ce document est aussi votre couverture légale en cas d’incident. Sans brief écrit, vous portez seul la responsabilité d’une réaction allergique ou d’une décompensation médicale, ce qui peut peser plusieurs centaines de milliers d’euros en RC pro.',
      },

      { kind: 'h2', text: 'Construire un menu wellness qui ne semble pas wellness' },
      {
        kind: 'p',
        text: 'L’erreur la plus fréquente sur ces missions est la cuisine apparente. Le client n’a pas envie de manger une assiette qui hurle "cétogène" ou "FODMAP", il veut une assiette qui ressemble à de la grande cuisine et qui respecte la contrainte sans la souligner. La signature d’un chef qui maîtrise ces missions est de rendre la contrainte invisible.',
      },
      {
        kind: 'p',
        text: 'Sur un menu cétogène, cela passe par le travail des matières grasses comme matière noble (huile d’olive d’infusion longue, beurre noisette aux algues, ghee à la truffe) plutôt que par l’empilement caricatural de bacon et de fromage. Sur un menu plant-based, cela passe par la cuisson lente des légumes racines pour développer les umamis, plutôt que par les substituts de viande industriels. Sur un menu anti-inflammatoire, cela passe par le travail des herbes fraîches comme structure aromatique, plutôt que par l’ascétisme apparent.',
      },
      {
        kind: 'p',
        text: 'Cette discipline esthétique est ce que le client paie. Un menu cétogène servi avec la même intention culinaire qu’un menu classique est ce qui distingue un chef wellness véritable d’un cuisinier qui applique une fiche technique.',
      },

      { kind: 'h2', text: 'Le matériel et les fournisseurs spécifiques' },
      {
        kind: 'p',
        text: 'Les missions wellness ou médicales mobilisent du matériel et des fournisseurs spécifiques que vous gagnez à intégrer dans votre boîte à outils.',
      },
      {
        kind: 'p',
        text: 'Côté matériel, équipez-vous d’une balance de précision (à 0,1 g), d’un thermomètre de cuisson rigoureux, d’un mixeur haute puissance pour les textures lisses postopératoires, et de contenants en verre pour les portions calibrées par repas. Cette panoplie représente 600 à 1 000 € d’investissement personnel et vous suit toute votre carrière.',
      },
      {
        kind: 'p',
        text: 'Côté fournisseurs, identifiez sur chacune de vos destinations principales un primeur bio strict, une boucherie qui travaille la viande herbe sans antibiotiques, un poissonnier qui fournit du sauvage tracé, et un fournisseur de produits spécifiques (farines sans gluten certifiées, sucres alternatifs, huiles non chauffées). Cet écosystème met deux saisons à se construire et il est ensuite votre actif majeur sur les missions wellness.',
      },

      { kind: 'h2', text: 'La tarification spécifique' },
      {
        kind: 'p',
        text: 'Une mission wellness ou médicale se tarife différemment d’une mission classique. Le travail invisible (recherche de produits spécifiques, calculs nutritionnels, validation par le nutritionniste, prep allongée pour des textures spécifiques) double presque le temps réel de mission par rapport à un service classique. Cette charge se reflète dans deux lignes du devis.',
      },
      {
        kind: 'ul',
        items: [
          'Surcoût de 20 à 35 % sur le tarif jour habituel, justifié par la spécialisation et la responsabilité accrue.',
          'Forfait nutritionnel mensuel de 600 à 1 200 € net pour la coordination avec le praticien référent et la mise à jour des menus.',
          'Surcoût matière de 30 à 60 % sur le fonds courses, lié aux produits bio, sans gluten, ou aux protéines tracées.',
          'Forfait d’étude initiale de 800 à 1 800 € net pour la conception des menus de la première semaine et leur validation médicale.',
        ],
      },

      { kind: 'h2', text: 'Le principe stratégique' },
      {
        kind: 'p',
        text: 'La cuisine wellness et médicale est aujourd’hui un segment à part entière dans le marché du chef privé UHNW. Le chef qui le maîtrise se positionne sur des missions plus longues, plus rémunératrices, et plus fidélisantes (un client qui suit un protocole médical ne change pas de chef chaque saison). Investir trois à six mois pour bâtir cette spécialisation est probablement le mouvement de carrière le plus rentable que peut faire un chef privé installé entre la cinquième et la huitième année d’activité dans le segment.',
      },
    ],
  },

  en: {
    title: 'Wellness cooking, health retreats, UHNW medical diets',
    excerpt:
      'Keto, intermittent fasting, kosher, severe allergies, post-surgery. Holding level under constraint is a major rate advantage, for those who can deliver these diets without enduring them.',
    body: [
      {
        kind: 'p',
        text: 'A growing share of UHNW missions integrates a health dimension, either because the client follows a supervised medical or dietary protocol, or because they have committed to a wellness retreat for their season. Across chefs I have followed in the network since 2023, this type of mission represents today 25 to 35% of high-season placements, against under 10% five years earlier. The segment is moving, and chefs who cannot deliver a clean keto menu or a strict FODMAP regimen miss those missions.',
      },
      {
        kind: 'p',
        text: 'The pricing opportunity is strong. A rigorous wellness or medical mission pays 20 to 35% above a classic mission of equal duration, because the chef who delivers it is rarer and the health stakes shift the rate conversation. Provided one knows how to execute it without risk.',
      },

      { kind: 'h2', text: 'Distinguishing the three diet families' },
      {
        kind: 'p',
        text: 'Three diet families dominate in the ultra-affluent segment, and the chef’s posture varies by family.',
      },
      {
        kind: 'p',
        text: 'The first family covers wellness lifestyle diets. Plant-based, paleo, modern keto, short-window intermittent fasting. These diets are chosen by the client for performance or wellbeing reasons, without strict medical follow-up. You have interpretation latitude and a punctual mistake is recoverable. Your role is to deliver a menu coherent with the diet, not to enforce it as a religion.',
      },
      {
        kind: 'p',
        text: 'The second family covers supervised medical diets. Therapeutic keto for epilepsy or neurodegenerative disease, post-surgery, FODMAP for intestinal syndrome, renal diet, type 1 diabetic diet. These diets are prescribed by a physician or nutritionist following the client. You work under the implicit supervision of that practitioner and a mistake is not recoverable. Always ask for the contact of the referent nutritionist and have your weekly menu validated.',
      },
      {
        kind: 'p',
        text: 'The third family covers durable religious or ethical constraints. Kosher, strict halal, Hindu vegetarian, Jain. These constraints are permanent, the client has lived with them for years and recognises any mistake. Your interpretation latitude is zero. You must master separation rules and forbidden ingredients before signing, not during the mission.',
      },

      { kind: 'h2', text: 'The most requested regimens in 2026' },
      {
        kind: 'p',
        text: 'Five regimens make up 80% of wellness or medical requests I see in the network. You gain by mastering them deeply before encountering them on a mission.',
      },
      {
        kind: 'ul',
        items: [
          'Strict keto (under 30 g net carbs per day) with ratio fats 70 to 75%, proteins 20 to 25%, carbs 5 to 10%.',
          'Demanding plant-based, no processed soy, no added gluten, with worked plant protein intake (legumes, quinoa, buckwheat, oilseeds).',
          'FODMAP in elimination then reintroduction phase, with weekly rotation of allowed families validated by the nutritionist.',
          'Anti-inflammatory, eliminating added sugars, dairies, nightshades, industrial oils, leveraging fatty fish and antioxidant herbs.',
          'Post bariatric or digestive surgery, progressive textures over six to ten weeks, very reduced portions, monitoring of protein and fluid intakes.',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Building a personal library of forty mastered recipes (ten per major regimen) is a three to four week off-season investment. It positions you durably as a chef able to deliver under constraint, which pays well in the segment.',
      },

      { kind: 'h2', text: 'The medical brief, indispensable' },
      {
        kind: 'p',
        text: 'On a strict medical regimen, never sign a mission without having received and validated a written medical brief. This document lists absolutely forbidden foods, foods limited quantitatively, daily minimum nutritional intakes, reactions to monitor, and incident procedure.',
      },
      {
        kind: 'p',
        text: 'Explicitly ask to speak with the client referent nutritionist at the start of the mission, ideally by phone. That fifteen-minute conversation is worth two days of anxious caution in the kitchen. The nutritionist is generally very supportive of this exchange: they prefer guiding a chef who asks the right questions rather than correcting silent mistakes.',
      },
      {
        kind: 'p',
        text: 'Keep this brief in writing for the duration of the mission, with dated updates if the regimen evolves. This document is also your legal cover in case of incident. Without a written brief, you alone bear the responsibility of an allergic reaction or medical decompensation, which can amount to several hundred thousand euros in liability claims.',
      },

      { kind: 'h2', text: 'Building a wellness menu that does not look wellness' },
      {
        kind: 'p',
        text: 'The most frequent error on these missions is apparent cooking. The client does not want a plate that screams "keto" or "FODMAP", they want a plate that looks like fine dining and respects the constraint without underlining it. The signature of a chef mastering these missions is making the constraint invisible.',
      },
      {
        kind: 'p',
        text: 'On a keto menu, this means treating fats as a noble matter (long-infusion olive oil, brown butter with seaweed, truffle ghee) rather than caricatural piling of bacon and cheese. On a plant-based menu, slow cooking of root vegetables to develop umamis, rather than industrial meat substitutes. On an anti-inflammatory menu, fresh herbs as aromatic structure, rather than apparent asceticism.',
      },
      {
        kind: 'p',
        text: 'This aesthetic discipline is what the client pays for. A keto menu served with the same culinary intent as a classic menu separates a true wellness chef from a cook applying a tech sheet.',
      },

      { kind: 'h2', text: 'Specific equipment and suppliers' },
      {
        kind: 'p',
        text: 'Wellness or medical missions mobilise specific equipment and suppliers you gain by integrating into your toolbox.',
      },
      {
        kind: 'p',
        text: 'On the equipment side, equip yourself with a precision scale (0.1 g), a rigorous cooking thermometer, a high-power blender for smooth post-surgical textures, and glass containers for calibrated portions per meal. This kit represents a 600 to 1 000 € personal investment and follows you through your career.',
      },
      {
        kind: 'p',
        text: 'On the supplier side, identify on each main destination a strict organic greengrocer, a butcher working antibiotic-free grass-fed meat, a fishmonger supplying traceable wild fish, and a supplier of specific products (certified gluten-free flours, alternative sugars, unheated oils). This ecosystem takes two seasons to build and then becomes your major asset on wellness missions.',
      },

      { kind: 'h2', text: 'Specific pricing' },
      {
        kind: 'p',
        text: 'A wellness or medical mission is priced differently from a classic mission. Invisible work (specific product sourcing, nutritional calculations, nutritionist validation, longer prep for specific textures) almost doubles the real mission time compared to standard service. This load reflects in two lines of the quote.',
      },
      {
        kind: 'ul',
        items: [
          'Day rate premium of 20 to 35% above standard, justified by specialisation and increased responsibility.',
          'Monthly nutritional fee of 600 to 1 200 € net for coordination with the referent practitioner and menu updates.',
          'Grocery overhead of 30 to 60% on the food fund, linked to organic, gluten-free, or traced protein products.',
          'Initial study fee of 800 to 1 800 € net for the design of the first week menus and their medical validation.',
        ],
      },

      { kind: 'h2', text: 'The strategic principle' },
      {
        kind: 'p',
        text: 'Wellness and medical cooking is today a segment in itself within the UHNW private chef market. The chef who masters it positions on longer, better paid, and more loyalty-building missions (a client following a medical protocol does not change chef every season). Investing three to six months to build this specialisation is probably the most profitable career move a settled private chef can make between their fifth and eighth year of activity in the segment.',
      },
    ],
  },
};
