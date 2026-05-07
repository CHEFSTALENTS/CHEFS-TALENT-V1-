// lib/vip-guides/_guides/encaisser-proprement.ts
// Guide VIP — Encaisser proprement : factures, retenues, soldes impayés
// FR / EN — pilier "business"

import type { Guide } from '../types';

export const encaisserProprement: Guide = {
  slug: 'encaisser-proprement',
  heroImage: '/images/email/villa-service.jpg',
  readingMinutes: 6,
  pillar: 'business',
  publishedAt: '2026-05-08',

  fr: {
    title: 'Encaisser proprement : factures, retenues, soldes impayés',
    excerpt:
      'Le cycle de facturation d’un chef privé saisonnier, et la procédure de relance qui transforme un solde douteux en règlement effectif. Pourquoi 80 % des problèmes de paiement viennent du chef, pas du client.',
    body: [
      {
        kind: 'p',
        text: 'Sur les difficultés de paiement que je vois passer dans le réseau, huit cas sur dix viennent de la procédure du chef, pas de la mauvaise foi du client. Pas de facture envoyée à temps. Pas de relance structurée. Pas de date d’échéance écrite. Pas de moyen de paiement précisé. Le client UHNW reçoit cinquante factures par mois traitées par un assistant ou un family office. Si la vôtre n’est pas immédiatement claire et exploitable, elle est mise de côté en attendant un éclaircissement, et l’éclaircissement n’arrive jamais.',
      },
      {
        kind: 'p',
        text: 'Encaisser proprement n’est pas une question d’insistance, c’est une question de procédure. Les chefs qui se font payer dans les sept à quinze jours après la fin de mission appliquent les mêmes pratiques. Ce guide les détaille.',
      },

      { kind: 'h2', text: 'Le cycle de facturation type' },
      {
        kind: 'p',
        text: 'Une mission saisonnière propre se facture en trois temps. La première facture, dite facture d’acompte, part dans les sept jours suivant la signature du contrat. Elle correspond à 30 à 40 % du forfait total, plus l’éventuelle avance fonds courses. Sa réception conditionne le démarrage effectif de la mission. Sans encaissement de l’acompte, la mission n’est pas confirmée, le chef n’engage pas de prep, ne réserve pas de billet d’avion, ne signale pas la disponibilité comme prise.',
      },
      {
        kind: 'p',
        text: 'La deuxième facture, dite facture intermédiaire, part à mi-mission. Elle correspond à 30 à 40 % supplémentaires du forfait. Sa date d’émission est inscrite dans le contrat (par exemple "le 15e jour de mission"), ce qui la rend non-discutable. Le chef qui n’émet pas cette facture intermédiaire et attend la fin de mission pour facturer 70 % d’un coup expose ses revenus pendant trois à six semaines à un risque inutile.',
      },
      {
        kind: 'p',
        text: 'La troisième facture, dite facture de solde, part dans les trois jours suivant la fin de mission. Elle inclut le solde du forfait, les éventuels suppléments validés en cours de mission (dîners d’événement, prolongations), et la régularisation du fonds courses. Cette facture est précédée la veille d’un email de débriefing au client ou à l’agent, qui pose le contexte et annonce l’envoi prochain. Cette pratique double le taux de règlement à sept jours.',
      },

      { kind: 'h2', text: 'La facture qui se paie sans question' },
      {
        kind: 'p',
        text: 'Une facture chef privé bien rédigée tient sur une seule page A4, en français ou en bilingue selon le client. Elle comprend obligatoirement quelques éléments dont l’absence rallonge systématiquement le délai de paiement.',
      },
      {
        kind: 'ul',
        items: [
          'Vos coordonnées professionnelles complètes, numéro SIRET, numéro de TVA si vous y êtes assujetti, IBAN et BIC en bas de page.',
          'Les coordonnées exactes du destinataire telles qu’elles figurent dans le contrat, jamais reformulées.',
          'Un numéro de facture séquentiel, et un rappel du numéro de contrat ou du devis associé.',
          'Le détail des prestations facturées, ligne par ligne, avec le nombre de jours, le tarif unitaire et le total HT et TTC selon votre régime fiscal.',
          'La date d’émission, la date d’échéance explicite (par exemple "à régler avant le 30 juin 2026"), et les conditions de pénalité en cas de retard mentionnées dans le contrat.',
          'Une mention claire du moyen de paiement attendu (virement bancaire en priorité, jamais chèque, jamais espèces sur les missions UHNW).',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'Une facture envoyée en pièce jointe PDF nommée correctement (par exemple "Facture-001-VillaXXX-Juin2026.pdf") se traite en deux jours. Une facture envoyée en JPEG ou en photo de scan, ou avec un nom de fichier comme "doc1.pdf", se traite en deux semaines, parce qu’elle nécessite une retransmission interne dans le family office. Ce détail apparemment minime fait la différence concrète sur le délai d’encaissement.',
      },

      { kind: 'h2', text: 'La retenue de garantie, la pratique à anticiper' },
      {
        kind: 'p',
        text: 'Sur certaines missions, l’agent ou le client peut souhaiter conserver une retenue de garantie de 5 à 10 % du solde, libérée trente jours après la fin de mission, pour couvrir d’éventuelles réclamations ou des dommages constatés a posteriori. Cette pratique est légitime quand elle est inscrite dans le contrat dès le départ. Elle est abusive quand elle est imposée a posteriori sans clause préalable.',
      },
      {
        kind: 'p',
        text: 'Si vous acceptez cette retenue, la clause contractuelle doit prévoir trois éléments : le pourcentage exact, la durée maximale (jamais plus de 45 jours après la fin de mission), et les motifs précis qui peuvent justifier sa non-libération (dommages matériels documentés, plainte écrite du client). Sans ces trois éléments, la retenue devient un mécanisme d’érosion lente du tarif et il faut la refuser.',
      },

      { kind: 'h2', text: 'La procédure de relance graduée' },
      {
        kind: 'p',
        text: 'Quand une facture dépasse sa date d’échéance, la procédure de relance se déroule en quatre étapes ordonnées sur quarante-cinq jours. Sortir de cette procédure pour des raisons émotionnelles est la principale cause de soldes définitivement perdus.',
      },
      {
        kind: 'p',
        text: 'Premier niveau, à J+5 après la date d’échéance. Email court, neutre, factuel, qui rappelle la facture, sa référence, et demande confirmation de réception. Pas de relance avant ce J+5, parce que le family office traite parfois en interne et un retard de cinq jours est dans la norme du segment. Le ton est : "je m’assure simplement que la facture vous est bien parvenue".',
      },
      {
        kind: 'p',
        text: 'Deuxième niveau, à J+15. Email plus structuré qui rappelle la facture, mentionne explicitement la date d’échéance dépassée, et demande une date prévisionnelle de paiement. Le ton est encore courtois mais devient ferme : "je vous remercie de bien vouloir me communiquer une date prévisionnelle de règlement". Ce deuxième niveau déclenche le paiement dans 70 % des cas.',
      },
      {
        kind: 'p',
        text: 'Troisième niveau, à J+30. Mise en demeure formelle par lettre recommandée avec accusé de réception, qui rappelle les obligations contractuelles, applique les pénalités de retard prévues dans le contrat, et fixe un dernier délai de quinze jours avant action contentieuse. La mise en demeure est aussi un document juridique qui ouvre les voies de recours et fait courir des intérêts de retard légaux.',
      },
      {
        kind: 'p',
        text: 'Quatrième niveau, à J+45. Saisine du tribunal de commerce compétent, après consultation d’un avocat. Cette étape est rare (1 à 2 % des cas dans le segment ultra-aisé), mais quand elle s’impose, elle aboutit dans 80 % des cas à un règlement amiable dans les soixante jours qui suivent la signification de l’assignation.',
      },

      { kind: 'h2', text: 'Les signaux faibles à reconnaître tôt' },
      {
        kind: 'p',
        text: 'Certains clients ou agents émettent des signaux faibles dès le début de mission qui prédisent un encaissement compliqué. Reconnaître ces signaux à J+1 plutôt qu’à J+90 vous permet d’ajuster votre rigueur procédurale et parfois de poser des conditions supplémentaires en cours de route.',
      },
      {
        kind: 'ul',
        items: [
          'Le client négocie longuement le pourcentage de l’acompte ou cherche à le réduire en dessous de 30 %.',
          'L’agent vous demande d’attendre pour facturer "parce que le client préfère consolider".',
          'Le contrat fait l’objet de réécritures successives sur des clauses de paiement plutôt que sur des clauses opérationnelles.',
          'Le règlement de l’acompte se fait avec sept à dix jours de retard sur la date prévue.',
          'Le client ou son représentant communique en heures décalées, sans coordonnées professionnelles claires.',
        ],
      },
      {
        kind: 'p',
        text: 'Quand deux ou trois de ces signaux apparaissent ensemble, refusez la mission ou demandez un acompte de 50 % au lieu de 30 %. Sur les chefs qui ont fait ce choix dans le réseau, aucun n’a regretté un refus, plusieurs ont regretté les missions acceptées malgré ces signaux.',
      },

      { kind: 'h2', text: 'L’assurance crédit professionnel' },
      {
        kind: 'p',
        text: 'Sur les chefs privés réalisant plus de 80 000 € de chiffre d’affaires annuel, une assurance crédit professionnel devient pertinente. Pour 0,8 à 1,2 % du chiffre d’affaires assuré, elle couvre 80 à 90 % du montant en cas d’impayé constaté. Sur deux saisons à fort volume, le coût annuel d’environ 800 à 1 200 € se justifie largement par la sécurité psychologique apportée. La conversation tarifaire avec un client devient plus calme quand vous savez que votre risque maximum sur la mission est plafonné.',
      },

      { kind: 'h2', text: 'Le principe stratégique' },
      {
        kind: 'p',
        text: 'Encaisser proprement n’est pas une question de chance, c’est une question de système. Le chef qui se fait payer rapidement applique trois ou quatre règles simples avec discipline, rédige ses documents proprement, et tient sa procédure de relance sans céder à l’émotion. Le chef qui se fait mal payer improvise, attend, espère, et finit par accepter une retenue ou une remise en fin de cycle. La différence financière sur cinq ans est probablement de 8 à 15 % du chiffre d’affaires total. La discipline procédurale est l’investissement à plus haut retour de tout le métier de chef privé indépendant.',
      },
    ],
  },

  en: {
    title: 'Getting paid cleanly: invoices, retentions, unpaid balances',
    excerpt:
      'The seasonal private chef billing cycle, and the dunning procedure that turns a doubtful balance into actual payment. Why 80% of payment problems come from the chef, not the client.',
    body: [
      {
        kind: 'p',
        text: 'Across payment difficulties I see in the network, eight out of ten cases come from the chef’s procedure, not from the client’s bad faith. No invoice sent on time. No structured reminders. No written due date. No specified payment method. The UHNW client receives fifty invoices a month processed by an assistant or a family office. If yours is not immediately clear and actionable, it is set aside pending clarification, and the clarification never comes.',
      },
      {
        kind: 'p',
        text: 'Getting paid cleanly is not a matter of insistence, it is a matter of procedure. Chefs paid within seven to fifteen days of mission end apply the same practices. This guide details them.',
      },

      { kind: 'h2', text: 'The standard billing cycle' },
      {
        kind: 'p',
        text: 'A clean seasonal mission is invoiced in three steps. The first invoice, called the deposit invoice, goes out within seven days of contract signing. It corresponds to 30 to 40% of the total package, plus any grocery fund advance. Its receipt conditions the effective start of the mission. Without deposit collection, the mission is not confirmed, the chef does not engage prep, does not book a flight, does not log availability as taken.',
      },
      {
        kind: 'p',
        text: 'The second invoice, called the intermediate invoice, goes out at mid-mission. It corresponds to an additional 30 to 40% of the package. Its issue date is set in the contract (for example "the 15th day of mission"), making it non-discussable. A chef who skips this intermediate invoice and waits for mission end to bill 70% in one go exposes their revenue to unnecessary risk for three to six weeks.',
      },
      {
        kind: 'p',
        text: 'The third invoice, called the balance invoice, goes out within three days of mission end. It includes the package balance, any supplements validated during the mission (event dinners, extensions), and the grocery fund reconciliation. This invoice is preceded the day before by a debrief email to the client or agent, framing context and announcing the upcoming send. This practice doubles the seven-day collection rate.',
      },

      { kind: 'h2', text: 'The invoice that gets paid without question' },
      {
        kind: 'p',
        text: 'A well-drafted private chef invoice fits one A4 page, in French or bilingual depending on the client. It mandatorily contains a few elements whose absence systematically lengthens the payment delay.',
      },
      {
        kind: 'ul',
        items: [
          'Your full professional details, registration number, VAT number if applicable, IBAN and BIC at the bottom.',
          'The exact recipient details as they appear in the contract, never reformulated.',
          'A sequential invoice number, and a reminder of the associated contract or quote number.',
          'Detailed line-by-line services billed, with day count, unit rate, and HT/TTC total based on your tax regime.',
          'Issue date, explicit due date (for example "to be paid before June 30, 2026"), and late penalty conditions referenced from the contract.',
          'A clear mention of the expected payment method (bank wire as priority, never cheque, never cash on UHNW missions).',
        ],
      },
      {
        kind: 'callout',
        tone: 'note',
        text: 'An invoice sent as a properly named PDF attachment (for example "Invoice-001-VillaXXX-June2026.pdf") gets processed in two days. An invoice sent as a JPEG or scan photo, or with a file name like "doc1.pdf", gets processed in two weeks, because it requires internal forwarding within the family office. This seemingly small detail makes the concrete difference on collection delay.',
      },

      { kind: 'h2', text: 'The retention, a practice to anticipate' },
      {
        kind: 'p',
        text: 'On some missions, the agent or client may want to keep a 5 to 10% retention on the balance, released thirty days after mission end, to cover potential post-mission claims or damages. This practice is legitimate when written in the contract from the start. It is abusive when imposed afterwards without a prior clause.',
      },
      {
        kind: 'p',
        text: 'If you accept this retention, the contract clause must specify three elements: the exact percentage, the maximum duration (never beyond 45 days after mission end), and the precise grounds that can justify non-release (documented material damage, written client complaint). Without these three elements, the retention becomes a slow rate erosion mechanism and must be refused.',
      },

      { kind: 'h2', text: 'The graduated dunning procedure' },
      {
        kind: 'p',
        text: 'When an invoice exceeds its due date, the dunning procedure unfolds in four steps over forty-five days. Stepping out of this procedure for emotional reasons is the main cause of permanently lost balances.',
      },
      {
        kind: 'p',
        text: 'First level, at D+5 after due date. Short, neutral, factual email reminding the invoice, its reference, and asking confirmation of receipt. No reminder before D+5, because family offices sometimes process internally and a five-day delay is within segment norm. Tone: "I am simply ensuring the invoice has reached you".',
      },
      {
        kind: 'p',
        text: 'Second level, at D+15. More structured email reminding the invoice, explicitly mentioning the missed due date, and requesting an expected payment date. Tone is still courteous but firmer: "thank you for kindly providing me with an expected payment date". This second level triggers payment in 70% of cases.',
      },
      {
        kind: 'p',
        text: 'Third level, at D+30. Formal default notice by registered mail with acknowledgement of receipt, recalling contractual obligations, applying late penalties from the contract, and setting a final fifteen-day deadline before contentious action. The default notice is also a legal document that opens recourse channels and triggers statutory interest.',
      },
      {
        kind: 'p',
        text: 'Fourth level, at D+45. Filing with the competent commercial court, after consulting a lawyer. This step is rare (1 to 2% of cases in the ultra-affluent segment), but when needed, it leads in 80% of cases to an amicable settlement within sixty days of summons service.',
      },

      { kind: 'h2', text: 'The weak signals to recognise early' },
      {
        kind: 'p',
        text: 'Some clients or agents emit weak signals at mission start that predict difficult collection. Recognising these signals at D+1 rather than D+90 lets you adjust procedural rigour and sometimes set additional conditions mid-mission.',
      },
      {
        kind: 'ul',
        items: [
          'The client negotiates extensively the deposit percentage or tries to push it under 30%.',
          'The agent asks you to wait before invoicing "because the client prefers to consolidate".',
          'The contract goes through successive rewrites on payment clauses rather than operational ones.',
          'The deposit settlement comes with seven to ten days of delay versus the planned date.',
          'The client or their representative communicates at off-hours, without clear professional contacts.',
        ],
      },
      {
        kind: 'p',
        text: 'When two or three of these signals appear together, decline the mission or request a 50% deposit instead of 30%. Among chefs who made this choice in the network, none regretted a refusal, several regretted accepting missions despite these signals.',
      },

      { kind: 'h2', text: 'Professional credit insurance' },
      {
        kind: 'p',
        text: 'For private chefs generating more than 80 000 € annual revenue, professional credit insurance becomes relevant. For 0.8 to 1.2% of insured revenue, it covers 80 to 90% of the amount in case of confirmed default. Across two high-volume seasons, the annual cost of about 800 to 1 200 € is largely justified by the psychological safety provided. The pricing conversation with a client becomes calmer when you know your maximum mission risk is capped.',
      },

      { kind: 'h2', text: 'The strategic principle' },
      {
        kind: 'p',
        text: 'Getting paid cleanly is not a matter of luck, it is a matter of system. The chef who gets paid quickly applies three or four simple rules with discipline, drafts documents cleanly, and holds their dunning procedure without yielding to emotion. The chef who gets paid badly improvises, waits, hopes, and ends up accepting a retention or a discount at cycle end. The financial difference over five years is probably 8 to 15% of total revenue. Procedural discipline is the highest return investment of the entire independent private chef craft.',
      },
    ],
  },
};
