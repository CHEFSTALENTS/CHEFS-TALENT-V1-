// lib/vip-guides/_guides/brief-client-huit-questions.ts
// Guide VIP — Le brief client en 8 questions
// FR / EN — pilier "operations"

import type { Guide } from '../types';

export const briefClientHuitQuestions: Guide = {
  slug: 'brief-client-huit-questions',
  heroImage: '/images/email/kitchen-preparation.jpg',
  readingMinutes: 7,
  pillar: 'operations',
  publishedAt: '2026-05-07',

  fr: {
    title: 'Le brief client en huit questions, avant d’accepter une mission',
    excerpt:
      'Les questions précises qu’un chef privé installé pose avant d’engager sa signature sur une mission. Ce que la conversation doit contenir, et ce qu’elle révèle si elle reste floue.',
    body: [
      {
        kind: 'p',
        text: 'La majorité des missions qui se passent mal n’ont pas dérapé pendant l’exécution. Elles ont dérapé au brief. Soit parce que le chef a accepté trop vite sur des informations partielles. Soit parce que le client n’a pas été poussé à formaliser ce qu’il attendait. Une heure de conversation cadrée en amont règle 90 % des frictions opérationnelles qui apparaissent ensuite sur place.',
      },
      {
        kind: 'p',
        text: 'Un chef privé installé pose huit questions avant de signer. Ces questions ne sont pas un interrogatoire, elles sont la marque d’un professionnel qui sait qu’une mission ratée vaut deux à trois missions perdues derrière. Voici la trame que j’utilise quand je conseille les chefs du réseau sur leurs nouveaux briefs.',
      },

      { kind: 'h2', text: 'Question 1 : qui mange, vraiment' },
      {
        kind: 'p',
        text: 'Au-delà du nombre de couverts, vous voulez comprendre la composition réelle du tablée. Combien d’adultes, combien d’enfants par tranche d’âge, combien d’invités tournants. Une famille de huit personnes avec quatre enfants entre 5 et 14 ans n’a rien à voir avec huit adultes en mode dîner d’affaires. Le rythme, les portions, les exigences sur la présentation, tout change. Demandez aussi si le client reçoit pendant le séjour, et avec quelle fréquence prévue.',
      },

      { kind: 'h2', text: 'Question 2 : les contraintes médicales et religieuses' },
      {
        kind: 'p',
        text: 'Pas les "préférences", les contraintes. Allergies sévères, intolérances, régimes médicaux suivis, casher strict ou souple, halal, restrictions liées à un suivi diététique en cours. Si le client ne sait pas répondre dans le détail, demandez à parler à la personne qui suit ces sujets dans l’entourage (souvent l’assistante personnelle ou le coach santé). Ne signez pas tant que cette information n’est pas formalisée par écrit.',
      },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'Une allergie aux fruits à coque non communiquée, c’est une mission qui se termine à l’hôpital et un dossier d’assurance que vous ne voulez pas avoir. Ce point doit figurer dans un email validé par le client ou son agent avant la signature, pas dans une conversation orale.',
      },

      { kind: 'h2', text: 'Question 3 : le rythme attendu' },
      {
        kind: 'p',
        text: 'Combien de services par jour, à quels horaires, sept jours sur sept ou avec un rythme aménagé. Petit-déjeuner servi ou en libre-service. Goûter prévu pour les enfants. Snacks disponibles toute la journée. Un dîner formel chaque soir ou alternance dîner-bistronomique-pizzas-pieds nus. Ce point conditionne votre dimensionnement et le moment où vous tombez en surchauffe.',
      },
      {
        kind: 'p',
        text: 'Posez la question du dîner tardif explicitement. Sur la Côte d’Azur, certains clients dînent à 22h30, ce qui décale tout le service de fin de soirée et conditionne l’heure à laquelle vous quittez la cuisine. Sur les yachts, le dîner peut basculer à 23h selon les sorties en tender.',
      },

      { kind: 'h2', text: 'Question 4 : la cuisine et son équipement' },
      {
        kind: 'p',
        text: 'Demandez des photos. Pas une description. Les briefs parlent souvent de "cuisine entièrement équipée" qui se révèle être une plaque induction trois feux et un four à 220°C maximum, dans un yacht où vous devez sortir 14 services par jour. Vous voulez voir le piano, le four, la chambre froide, le garde-manger, la zone d’assemblage, et la zone de service.',
      },
      {
        kind: 'p',
        text: 'Vérifiez en particulier la capacité de stockage froid, le nombre de zones de cuisson disponibles en parallèle, la présence ou l’absence d’un four à basse température, et les conditions de plonge. Un manque de plonge sur une mission longue oblige à dimensionner différemment vos préparations en amont.',
      },

      { kind: 'h2', text: 'Question 5 : l’équipe sur place' },
      {
        kind: 'p',
        text: 'Y a-t-il un commis prévu, un plongeur, un service en salle, une house manager ou une stewardess. Qui décide quoi entre ces personnes. À qui rapportez-vous au quotidien. Un chef privé qui arrive sur une mission yacht sans savoir que la chief stew gère le timing du service prend le risque d’un conflit d’autorité dès le deuxième jour.',
      },
      {
        kind: 'p',
        text: 'Si une équipe existe, demandez la liste des prénoms et des rôles, et confirmez avec qui vous coordonnez les achats et les commandes. Cette clarification en amont évite les triangulations qui font perdre une heure par jour pendant trois semaines.',
      },

      { kind: 'h2', text: 'Question 6 : le budget courses et la chaîne d’approvisionnement' },
      {
        kind: 'p',
        text: 'Quel est le budget alloué aux courses par semaine. Qui paie quoi, comment, et selon quel circuit administratif. Y a-t-il déjà des fournisseurs en place que la résidence souhaite que vous utilisiez. Avez-vous une marge pour proposer vos propres adresses locales. Le client achète-t-il certains produits en direct (vins, spiritueux, viandes maturées) ou êtes-vous responsable de tout.',
      },
      {
        kind: 'p',
        text: 'Posez aussi la question des restes et de la consommation des équipages. Sur une mission yacht ou chalet, l’équipage attend des repas, et leur budget peut soit être inclus dans le fonds courses (pratique courante mais à formaliser), soit faire l’objet d’une enveloppe dédiée. Cette zone grise vous coûte 200 à 400 € par semaine si elle n’est pas posée.',
      },

      { kind: 'h2', text: 'Question 7 : les usages de la maison' },
      {
        kind: 'p',
        text: 'Le client mange-t-il à table avec ses invités ou se fait-il servir à part. Tient-il à la présence du chef pour la présentation des plats ou préfère-t-il que le service reste dans la cuisine. Apprécie-t-il un échange en début de séjour pour caler les goûts ou délègue-t-il entièrement. Y a-t-il des tabous (alcool, certaines viandes, certains parfums) liés à des invités spécifiques ou à des occasions.',
      },
      {
        kind: 'p',
        text: 'Ces questions ne semblent pas opérationnelles, elles sont pourtant celles qui font la différence entre un chef que la maison rappelle l’année suivante et un chef qu’on remplace sans drama mais sans regret non plus. Le niveau ultra-aisé recrute autant sur la culture relationnelle que sur l’assiette.',
      },

      { kind: 'h2', text: 'Question 8 : la sortie de mission' },
      {
        kind: 'p',
        text: 'Personne n’aime parler de la fin de la mission au moment de la signer, et c’est pour cette raison que la sortie est souvent ratée. Posez les conditions claires. Comment la mission se termine. Y a-t-il un solde à régler à la sortie ou une retenue. Quels sont les délais et les modalités de paiement final. Que se passe-t-il si le client souhaite prolonger d’une semaine, sur quel tarif et avec quel préavis. À l’inverse, que se passe-t-il s’il souhaite raccourcir.',
      },
      {
        kind: 'p',
        text: 'Cette conversation prend dix minutes en amont et vous évite des semaines de relance après la mission. Sur un dossier propre, le solde tombe dans les sept jours suivant la fin de mission. Sur un dossier mal cadré, il tombe trois mois plus tard, après six relances et une concession sur la facture.',
      },

      { kind: 'h2', text: 'Ce que le brief révèle de la mission à venir' },
      {
        kind: 'p',
        text: 'Si l’agent ou le client répond précisément aux huit questions, vous travaillez avec un dossier sain. Vous pouvez signer en confiance et concentrer votre énergie sur la cuisine. Si plusieurs questions restent floues malgré vos relances, vous tenez probablement un signal faible : la mission n’est pas pilotée côté client, ou le client lui-même n’est pas un acheteur expérimenté de chef privé.',
      },
      {
        kind: 'p',
        text: 'Dans ce dernier cas, deux options. Soit vous prenez la mission en sachant que vous porterez seul le cadre opérationnel, et vous tarifez ce travail supplémentaire dans votre forfait. Soit vous passez. Une mission mal cadrée n’est jamais une opportunité, c’est un risque qui paie au prix d’une mission propre.',
      },
      {
        kind: 'p',
        text: 'Le brief en huit questions n’est pas une checklist défensive. C’est l’expression d’une posture : celle d’un chef qui sait que sa signature engage trois à douze semaines de sa vie professionnelle, et qui choisit ses dossiers comme un avocat choisit ses clients.',
      },
    ],
  },

  en: {
    title: 'The client brief in eight questions, before you accept a mission',
    excerpt:
      'The precise questions a settled private chef asks before committing on a mission. What the conversation must contain, and what it reveals when it stays vague.',
    body: [
      {
        kind: 'p',
        text: 'Most missions that go badly did not derail during execution. They derailed at the brief. Either because the chef accepted too quickly on partial information. Or because the client was not pushed to formalise what they expected. One hour of structured conversation upstream resolves 90% of the operational frictions that surface later on site.',
      },
      {
        kind: 'p',
        text: 'A settled private chef asks eight questions before signing. These questions are not an interrogation, they are the mark of a professional who knows that a failed mission costs two to three lost missions behind it. Here is the framework I use when I advise chefs in the network on new briefs.',
      },

      { kind: 'h2', text: 'Question 1: who actually eats' },
      {
        kind: 'p',
        text: 'Beyond the headcount, you want to understand the real composition of the table. How many adults, how many children by age bracket, how many rotating guests. A family of eight with four children between 5 and 14 has nothing to do with eight adults in business dinner mode. Pace, portions, plating expectations, everything changes. Also ask whether the client receives guests during the stay, and at what expected frequency.',
      },

      { kind: 'h2', text: 'Question 2: medical and religious constraints' },
      {
        kind: 'p',
        text: 'Not "preferences", constraints. Severe allergies, intolerances, monitored medical diets, strict or relaxed kosher, halal, restrictions linked to an ongoing diet protocol. If the client cannot answer in detail, ask to speak with the person who handles these matters (often the personal assistant or the health coach). Do not sign until this information is formalised in writing.',
      },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'A nut allergy that was not communicated is a mission that ends in hospital and an insurance file you do not want to face. This point must appear in an email validated by the client or their agent before signature, not in a verbal conversation.',
      },

      { kind: 'h2', text: 'Question 3: the expected pace' },
      {
        kind: 'p',
        text: 'How many services per day, at what times, seven days a week or with adapted rhythm. Breakfast served or self-service. Snack scheduled for the children. Snacks available throughout the day. Formal dinner every evening or alternation between dinner, bistro, pizza nights. This point conditions your dimensioning and the moment you will hit overload.',
      },
      {
        kind: 'p',
        text: 'Ask the late dinner question explicitly. On the French Riviera, some clients dine at 10:30 pm, which shifts the entire late evening service and dictates when you leave the kitchen. On yachts, dinner can move to 11 pm depending on tender outings.',
      },

      { kind: 'h2', text: 'Question 4: the kitchen and its equipment' },
      {
        kind: 'p',
        text: 'Ask for photos. Not a description. Briefs often mention "fully equipped kitchen" that turns out to be a three-burner induction plate and an oven capped at 220°C, in a yacht where you have to deliver 14 services per day. You want to see the range, the oven, the cold room, the pantry, the assembly area and the service area.',
      },
      {
        kind: 'p',
        text: 'Check in particular the cold storage capacity, the number of cooking zones available in parallel, the presence or absence of a low-temperature oven, and the dishwashing setup. A missing dishwashing zone on a long mission forces a different upstream prep dimensioning.',
      },

      { kind: 'h2', text: 'Question 5: the team on site' },
      {
        kind: 'p',
        text: 'Is there a sous-chef, a dishwasher, a service in dining room, a house manager or a stewardess. Who decides what among these people. Whom do you report to day to day. A private chef who arrives on a yacht mission unaware that the chief stew runs the service timing risks an authority conflict by day two.',
      },
      {
        kind: 'p',
        text: 'If a team exists, ask for the first names and roles list, and confirm with whom you coordinate shopping and orders. This upstream clarification avoids the triangulations that cost one hour per day for three weeks.',
      },

      { kind: 'h2', text: 'Question 6: grocery budget and supply chain' },
      {
        kind: 'p',
        text: 'What is the weekly grocery budget. Who pays what, how, and through which administrative channel. Are there already suppliers in place that the residence wants you to use. Do you have room to suggest your own local addresses. Does the client buy some items directly (wines, spirits, aged meats) or are you responsible for everything.',
      },
      {
        kind: 'p',
        text: 'Also ask the question of leftovers and crew meals. On a yacht or chalet mission, the crew expects meals, and their budget can either be included in the grocery fund (common practice but to formalise) or sit in a dedicated envelope. This grey zone costs you 200 to 400 € per week if it is not framed.',
      },

      { kind: 'h2', text: 'Question 7: the customs of the house' },
      {
        kind: 'p',
        text: 'Does the client eat at the table with their guests or get served separately. Do they value the chef presence for plating presentation or prefer the service stays in the kitchen. Do they appreciate a conversation at the start of the stay to align tastes or delegate entirely. Are there taboos (alcohol, certain meats, certain perfumes) tied to specific guests or occasions.',
      },
      {
        kind: 'p',
        text: 'These questions seem non-operational, yet they are the ones that make the difference between a chef the house calls back the following year and a chef who is replaced without drama but without regret either. The ultra-affluent level hires as much on relational culture as on the plate.',
      },

      { kind: 'h2', text: 'Question 8: how the mission ends' },
      {
        kind: 'p',
        text: 'Nobody likes to discuss the end of the mission at the time of signing, and that is precisely why the exit is often badly handled. Set clear conditions. How does the mission close. Is there a balance due at exit or a retention. What are the deadlines and methods for final payment. What happens if the client wishes to extend by a week, at what rate and with what notice. Conversely, what happens if they wish to shorten.',
      },
      {
        kind: 'p',
        text: 'This conversation takes ten minutes upstream and saves you weeks of follow-up after the mission. On a clean file, the balance lands within seven days of the end of mission. On a poorly framed file, it lands three months later, after six reminders and one concession on the invoice.',
      },

      { kind: 'h2', text: 'What the brief reveals about the mission ahead' },
      {
        kind: 'p',
        text: 'If the agent or the client answers all eight questions precisely, you work with a healthy file. You can sign in confidence and focus your energy on the cooking. If several questions remain vague despite your reminders, you likely face a weak signal: the mission is not piloted on the client side, or the client is not an experienced buyer of private chef services.',
      },
      {
        kind: 'p',
        text: 'In that case, two options. Either you take the mission knowing you will carry the operational frame alone, and you price that extra work into your fee. Or you pass. A poorly framed mission is never an opportunity, it is a risk you pay for at the cost of one clean mission.',
      },
      {
        kind: 'p',
        text: 'The brief in eight questions is not a defensive checklist. It is the expression of a stance: a chef who understands that their signature commits three to twelve weeks of professional life, and who chooses their files the way a lawyer chooses their clients.',
      },
    ],
  },
};
