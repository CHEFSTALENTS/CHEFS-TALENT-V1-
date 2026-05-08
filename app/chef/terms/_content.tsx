// app/chef/terms/_content.tsx
// Contenu des CGU chef en 3 langues (FR / EN / ES) + table des matières partagée.
// Toute modification éditoriale doit être appliquée aux 3 versions et bumper
// CURRENT_TERMS_VERSION dans terms-client.tsx pour forcer une nouvelle acceptation.

import React from 'react';

export type Locale = 'fr' | 'en' | 'es';

export type TocEntry = {
  /** ancre HTML, doit matcher le `id` du <section> dans chaque body */
  id: string;
  /** numéro affiché à gauche dans le sommaire */
  number: string;
  /** label localisé */
  label: { fr: string; en: string; es: string };
};

export const TOC: TocEntry[] = [
  { id: 'sec-1', number: '1', label: { fr: 'Objet et parties', en: 'Purpose and parties', es: 'Objeto y partes' } },
  { id: 'sec-2', number: '2', label: { fr: 'Statut du Chef et indépendance', en: 'Chef status and independence', es: 'Estatuto del Chef e independencia' } },
  { id: 'sec-3', number: '3', label: { fr: 'Sélection et statuts du profil', en: 'Selection and profile statuses', es: 'Selección y estados del perfil' } },
  { id: 'sec-4', number: '4', label: { fr: 'Modèle commercial et tarifs', en: 'Commercial model and pricing', es: 'Modelo comercial y tarifas' } },
  { id: 'sec-5', number: '5', label: { fr: 'Modalités de paiement du Chef', en: 'Chef payment terms', es: 'Modalidades de pago al Chef' } },
  { id: 'sec-6', number: '6', label: { fr: 'Carte de mission', en: 'Mission card', es: 'Tarjeta de misión' } },
  { id: 'sec-7', number: '7', label: { fr: 'Déroulé d’une mission', en: 'Mission workflow', es: 'Desarrollo de una misión' } },
  { id: 'sec-8', number: '8', label: { fr: 'Annulations et manquements', en: 'Cancellations and breaches', es: 'Cancelaciones e incumplimientos' } },
  { id: 'sec-9', number: '9', label: { fr: 'Qualité, image et comportement', en: 'Quality, image, conduct', es: 'Calidad, imagen y conducta' } },
  { id: 'sec-10', number: '10', label: { fr: 'Plans payants : VIP et Boost', en: 'Paid plans: VIP and Boost', es: 'Planes de pago: VIP y Boost' } },
  { id: 'sec-11', number: '11', label: { fr: 'Proposition de mission au réseau', en: 'Forwarding a mission to the network', es: 'Transmisión de misión a la red' } },
  { id: 'sec-12', number: '12', label: { fr: 'Confidentialité et non-contournement', en: 'Confidentiality and non-circumvention', es: 'Confidencialidad y no circunvención' } },
  { id: 'sec-13', number: '13', label: { fr: 'Données personnelles et communication', en: 'Personal data and communication', es: 'Datos personales y comunicación' } },
  { id: 'sec-14', number: '14', label: { fr: 'Suspension et résiliation', en: 'Suspension and termination', es: 'Suspensión y rescisión' } },
  { id: 'sec-15', number: '15', label: { fr: 'Modification des Conditions', en: 'Modification of the Conditions', es: 'Modificación de las Condiciones' } },
  { id: 'sec-16', number: '16', label: { fr: 'Droit applicable et juridiction', en: 'Applicable law and jurisdiction', es: 'Derecho aplicable y jurisdicción' } },
  { id: 'sec-17', number: '17', label: { fr: 'Acceptation', en: 'Acceptance', es: 'Aceptación' } },
];

export function getTocLabel(entry: TocEntry, locale: Locale): string {
  return entry.label[locale];
}

// ============================================================
// FR — version contractuelle de référence
// ============================================================

export function BodyFR() {
  return (
    <div className="prose prose-stone max-w-none">
      <section id="sec-1">
        <h2>1. Objet et parties</h2>
        <p>
          Les présentes Conditions de Collaboration (ci-après les « Conditions ») ont pour objet de définir les modalités
          selon lesquelles les chefs cuisiniers, pâtissiers, sommeliers, butlers et professionnels de la restauration
          indépendants (ci-après le « Chef ») collaborent avec :
        </p>
        <p>
          <strong>SASU Chefs Talents</strong>, immatriculée au RCS de Bordeaux sous le SIRET 89832072600026,
          dont le siège social est situé 73 rue Porte Dijeaux, 33000 Bordeaux, représentée par Thomas Delcroix
          (ci-après « Chefs Talents »).
        </p>
        <p>
          Chefs Talents est une agence spécialisée dans le placement et la commercialisation de prestations culinaires
          privées auprès de clients finaux (particuliers UHNW, conciergeries, gestionnaires de biens, armateurs, agences
          événementielles).
        </p>
        <p>
          Chefs Talents agit comme <strong>vendeur en nom propre</strong> de la prestation auprès du client final :
          Chefs Talents commande la prestation au Chef en qualité de prestataire indépendant et la revend au client final
          sous sa propre responsabilité commerciale et fiscale. Chefs Talents n’agit ni en tant que mandataire du Chef,
          ni en tant qu’intermédiaire transparent au sens fiscal.
        </p>
      </section>

      <section id="sec-2">
        <h2>2. Statut du Chef et indépendance</h2>
        <p>
          Le Chef déclare exercer son activité en qualité de professionnel indépendant (auto-entrepreneur, micro-entreprise,
          société commerciale, équivalent étranger).
        </p>
        <p>À ce titre, le Chef garantit :</p>
        <ul>
          <li>être seul responsable de ses obligations fiscales, sociales et déclaratives ;</li>
          <li>disposer de toutes les autorisations légales requises pour exercer son activité ;</li>
          <li>être titulaire d’une assurance responsabilité civile professionnelle en cours de validité, dont une attestation pourra être demandée à tout moment ;</li>
          <li>maîtriser les règles d’hygiène et de sécurité alimentaire applicables aux prestations qu’il exécute.</li>
        </ul>
        <h3>2.1 Absence de lien de subordination</h3>
        <p>Le Chef intervient en tant que prestataire indépendant. Il est expressément convenu que :</p>
        <ul>
          <li>le Chef n’est pas salarié de Chefs Talents ;</li>
          <li>le Chef n’est pas salarié du client final auprès duquel il exécute la prestation commandée par Chefs Talents ;</li>
          <li>aucune relation de subordination, d’exclusivité ni de dépendance juridique ne peut être caractérisée entre le Chef et Chefs Talents ;</li>
          <li>le Chef demeure libre d’accepter ou de refuser toute mission proposée par Chefs Talents ;</li>
          <li>le Chef demeure libre d’exercer son activité en dehors de Chefs Talents, sous réserve du respect des obligations de confidentialité et de non-contournement prévues aux présentes.</li>
        </ul>
        <p>
          Le Chef conserve l’entière liberté de fixer ses tarifs, d’organiser son travail et de définir ses méthodes
          d’exécution, dans le respect du cahier des charges validé pour chaque mission.
        </p>
        <h3>2.2 Cas particulier des missions yachting</h3>
        <p>
          Pour les missions à bord de yachts, navires de plaisance ou superyachts commerciaux, le Chef peut être amené à
          intervenir en qualité de salarié du yacht, de l’armateur ou de la société d’exploitation du navire. Dans ce cas :
        </p>
        <ul>
          <li>le contrat de travail est établi directement entre le Chef et l’entité exploitante du yacht ;</li>
          <li>Chefs Talents n’est ni employeur, ni co-employeur, ni responsable des obligations sociales, fiscales ou contractuelles liées à ce contrat ;</li>
          <li>le Chef garantit, le cas échéant, être titulaire des certifications requises pour ce type de mission, notamment la certification STCW Basic Safety Training, l’examen médical ENG1 (ou équivalent en cours de validité), et le respect des standards de la convention MLC 2006 ;</li>
          <li>le Chef s’engage à fournir copie de ces certifications à Chefs Talents avant l’embarquement.</li>
        </ul>
        <h3>2.3 Responsabilité civile professionnelle et indemnisation de Chefs Talents</h3>
        <p>
          Le Chef étant un prestataire indépendant intervenant sous sa propre responsabilité, il est seul responsable des
          dommages, préjudices et sinistres qu’il cause pendant l’exécution matérielle de la prestation. Il garantit
          Chefs Talents contre toute réclamation, action ou poursuite, exercée par le Client ou par un tiers, relative
          notamment à :
        </p>
        <ul>
          <li>des dommages causés aux équipements, installations, mobilier ou biens du Client lors de l’exécution de la prestation ;</li>
          <li>des préjudices corporels ou matériels survenus pendant la prestation du fait du Chef ;</li>
          <li>des manquements aux règles d’hygiène, de sécurité alimentaire ou des normes professionnelles applicables à l’exécution culinaire ;</li>
          <li>des pertes ou détériorations de matériel, équipements ou ingrédients placés sous la garde du Chef pendant la mission.</li>
        </ul>
        <p>
          Le Chef s’engage à <strong>indemniser intégralement Chefs Talents</strong> de toute somme que cette dernière
          serait amenée à supporter au titre d’une réclamation Client liée à un manquement du Chef (frais de défense,
          indemnités versées, frais d’expertise, honoraires d’avocat), sur première demande et sans contestation
          possible une fois la responsabilité du Chef établie.
        </p>
        <p>
          Le Chef communique à Chefs Talents une copie à jour de son attestation de responsabilité civile professionnelle
          à chaque renouvellement annuel, ainsi qu’à toute demande de Chefs Talents. Toute mission peut être suspendue
          par Chefs Talents en l’absence d’attestation valide.
        </p>
      </section>

      <section id="sec-3">
        <h2>3. Processus de sélection et statuts du profil</h2>
        <p>
          L’accès à la plateforme Chefs Talents est soumis à validation. Le profil du Chef évolue successivement entre les
          statuts suivants :
        </p>
        <ol>
          <li><strong>En validation</strong> : profil créé, en cours d’examen par l’équipe Chefs Talents (étude du dossier, parcours, références, positionnement, vérification éventuelle des certifications).</li>
          <li><strong>Approuvé</strong> : profil validé, en attente d’activation après acceptation des présentes Conditions et complétion du dossier (photo, bio, expériences, langues, contraintes, justificatifs).</li>
          <li><strong>Actif</strong> : profil visible dans les sélections envoyées aux clients et conciergeries, éligible à recevoir des propositions de mission.</li>
          <li><strong>En pause</strong> : profil temporairement retiré des sélections (à la demande du Chef ou à l’initiative de Chefs Talents en cas de manquement, d’indisponibilité prolongée ou de retour client négatif justifiant un examen complémentaire).</li>
        </ol>
        <p>
          Chefs Talents se réserve le droit de refuser une candidature sans justification, de demander des compléments
          d’information ou justificatifs, de suspendre ou retirer un profil. L’inscription du Chef ne constitue en aucun cas
          une garantie d’attribution de missions, de volume ou de fréquence.
        </p>
      </section>

      <section id="sec-4">
        <h2>4. Modèle commercial et fixation des tarifs</h2>
        <h3>4.1 Modèle « vendeur en nom propre »</h3>
        <p>
          Pour chaque mission, Chefs Talents et le Chef conviennent d’un budget HT au terme d’une négociation
          bilatérale. Ce budget constitue la rémunération du Chef pour la prestation commandée.
        </p>
        <p>
          Chefs Talents revend ensuite la prestation au client final à un tarif TTC qui inclut la marge commerciale de
          Chefs Talents et la TVA applicable. Le Chef ne facture jamais le client final : il facture exclusivement
          Chefs Talents pour le budget convenu.
        </p>
        <p>
          Le Chef reconnaît que la marge réalisée par Chefs Talents entre le prix de revente client et le prix d’achat de
          la prestation au Chef constitue une donnée commerciale propre à Chefs Talents. Le Chef s’interdit de la
          communiquer ou d’en exiger la divulgation.
        </p>
        <h3>4.2 Liberté tarifaire du Chef</h3>
        <p>Le Chef fixe librement le tarif qu’il facture à Chefs Talents, notamment :</p>
        <ul>
          <li>prix par personne pour les prestations ponctuelles (déjeuner, dîner, événement, cocktail) ;</li>
          <li>prix par jour pour les missions de résidence (villa, chalet, yacht, séjour long format) ;</li>
          <li>forfait global pour les missions saisonnières.</li>
        </ul>
        <p>
          Le tarif convenu pour une mission donnée est fixé dans le contrat de mission spécifique signé pour cette mission
          et ne peut être modifié unilatéralement.
        </p>
      </section>

      <section id="sec-5">
        <h2>5. Modalités de paiement du Chef</h2>
        <h3>5.1 Acompte à la signature</h3>
        <p>
          À la signature du contrat de mission, Chefs Talents verse au Chef un acompte de <strong>quinze pour cent (15 %) du montant HT</strong> de la mission, sécurisant la mobilisation du Chef sur les dates convenues.
        </p>
        <p>
          Cet acompte reste acquis au Chef en cas d’annulation de la mission par le client après signature, à titre
          d’indemnité forfaitaire pour mobilisation des dates.
        </p>
        <h3>5.2 Solde après exécution</h3>
        <p>
          Le solde du montant HT (85 %) est versé au Chef <strong>au plus tard 4 jours ouvrés après la fin effective de la
          mission</strong>, sur présentation par le Chef d’une facture conforme adressée à Chefs Talents.
        </p>
        <p>
          Pour les missions d’une durée égale ou supérieure à six (6) semaines, le règlement intervient
          <strong> mensuellement à terme échu</strong>, par tranches calculées au prorata du temps écoulé.
        </p>
        <p>Tout retard de facturation imputable au Chef pourra reporter d’autant la date de paiement du solde.</p>
        <h3>5.3 Mode de règlement</h3>
        <p>
          Les règlements sont effectués par virement bancaire sur le compte communiqué par le Chef. Le Chef est seul
          responsable de l’exactitude des coordonnées bancaires fournies.
        </p>
      </section>

      <section id="sec-6">
        <h2>6. Carte de mission</h2>
        <p>
          Pour certaines missions, et selon leur durée et leur complexité, Chefs Talents met à disposition du Chef une
          <strong> carte de paiement virtuelle nominative</strong> (Revolut Business) destinée à couvrir exclusivement les
          achats de matières premières et produits alimentaires nécessaires à l’exécution de la mission.
        </p>
        <p>
          L’attribution d’une carte de mission est décidée par Chefs Talents au cas par cas en fonction de la durée
          prévisionnelle, du budget alloué et du contexte logistique. Lorsqu’une carte est fournie, son utilisation est
          régie par le <em>Règlement d’utilisation – Carte de dépenses mission</em> remis et signé séparément, qui prévoit
          notamment :
        </p>
        <ul>
          <li>un plafond fixe non rechargeable sauf accord écrit préalable ;</li>
          <li>une liste limitative de dépenses autorisées (matières premières, condiments, produits d’entretien alimentaire) ;</li>
          <li>l’obligation de transmettre l’intégralité des justificatifs (tickets, factures) sous 48 heures suivant la fin de mission ;</li>
          <li>la déduction automatique sur la rémunération du Chef de toute dépense non justifiée ou non autorisée ;</li>
          <li>la propriété de Chefs Talents sur tout reliquat non utilisé en fin de mission ;</li>
          <li>la désactivation systématique de la carte au dernier jour de mission, sauf accord écrit contraire.</li>
        </ul>
        <p>
          L’usage frauduleux ou détourné d’une carte de mission entraîne sa désactivation immédiate, la déduction des
          sommes concernées sur la rémunération du Chef et la fin de la collaboration, sans préjudice des poursuites
          judiciaires applicables.
        </p>
      </section>

      <section id="sec-7">
        <h2>7. Déroulé d’une mission</h2>
        <ol>
          <li>Réception du brief client par Chefs Talents.</li>
          <li>Présélection et présentation de profils de chefs au client.</li>
          <li>Échange et validation du périmètre (menu, rythme, contraintes médicales et alimentaires).</li>
          <li>Validation par les parties du contrat de mission (budget HT, dates, prestation, carte de mission le cas échéant).</li>
          <li>Encaissement du client par Chefs Talents.</li>
          <li>Versement de l’acompte 15 % au Chef.</li>
          <li>Réalisation de la prestation par le Chef sur site.</li>
          <li>Facturation par le Chef à Chefs Talents.</li>
          <li>Versement du solde 85 % au Chef sous 4 jours ouvrés après fin de mission (ou mensuellement si mission ≥ 6 semaines).</li>
        </ol>
        <p>Le Chef s’engage à respecter le cahier des charges validé et à maintenir un niveau de service conforme à son positionnement.</p>
      </section>

      <section id="sec-8">
        <h2>8. Annulations et manquements</h2>
        <h3>8.1 Annulation par le client</h3>
        <p>
          En cas d’annulation de la mission par le client après signature du contrat, l’acompte de 15 % reste acquis au
          Chef à titre d’indemnité forfaitaire pour mobilisation des dates.
        </p>
        <h3>8.2 Annulation par le Chef</h3>
        <p>Toute annulation par le Chef doit être immédiatement signalée à Chefs Talents. En cas d’annulation :</p>
        <ul>
          <li>plus de 48 heures avant le début de la mission, sans motif légitime : Chefs Talents peut suspendre temporairement le compte ou limiter l’accès aux futures missions ;</li>
          <li>moins de 48 heures avant le début de la mission, sans motif légitime : l’acompte versé devra être restitué et une pénalité pourra être appliquée à hauteur du préjudice subi par Chefs Talents et le client.</li>
        </ul>
        <h3>8.3 Annulation grave (no-show / moins de 24 heures)</h3>
        <p>Toute annulation à moins de 24 heures sans justification valable, ou sans communication, entraîne :</p>
        <ul>
          <li>l’exclusion immédiate et définitive de la plateforme dès la première occurrence ;</li>
          <li>l’obligation de restitution intégrale de l’acompte versé ;</li>
          <li>le droit pour Chefs Talents de réclamer réparation au titre du préjudice client et du préjudice commercial.</li>
        </ul>
      </section>

      <section id="sec-9">
        <h2>9. Qualité, image et comportement</h2>
        <p>Le Chef s’engage à :</p>
        <ul>
          <li>adopter une tenue et une attitude professionnelles adaptées à l’environnement privé UHNW ;</li>
          <li>respecter les règles d’hygiène, de sécurité alimentaire et de discrétion ;</li>
          <li>maintenir une hygiène irréprochable (tenue, espace de travail, manipulations) ;</li>
          <li>informer Chefs Talents de toute difficulté rencontrée en cours de mission ;</li>
          <li>ne pas nuire à l’image de Chefs Talents ni à celle du client.</li>
        </ul>
        <p>Tout comportement inapproprié pourra entraîner suspension ou exclusion immédiate.</p>
      </section>

      <section id="sec-10">
        <h2>10. Plans payants : VIP et Boost</h2>
        <p>
          Chefs Talents propose au Chef, à titre facultatif et sans aucune obligation pour rester inscrit sur la plateforme,
          deux dispositifs payants destinés à améliorer sa visibilité et à enrichir son accompagnement.
        </p>
        <h3>10.1 Statut VIP</h3>
        <p>
          Le statut VIP confère au Chef une priorité dans les sélections envoyées aux clients et conciergeries, un badge de
          visibilité sur son profil et un accès aux briefs en avant-première. Trois durées d’engagement sont proposées :
        </p>
        <ul>
          <li><strong>VIP 3 mois</strong> : 59 € HT / mois (177 € HT en règlement unique anticipé).</li>
          <li><strong>VIP 6 mois</strong> : 55 € HT / mois (330 € HT en règlement unique anticipé).</li>
          <li><strong>VIP 12 mois</strong> : 40 € HT / mois (480 € HT en règlement unique anticipé) ; cette formule inclut un appel de positionnement avec l’équipe Chefs Talents (engagement ferme).</li>
        </ul>
        <p>
          Les paiements sont effectués via Stripe. En formule mensuelle, l’abonnement est automatiquement résilié à terme
          de l’engagement (mécanisme <em>cancel_at</em>) ; aucun renouvellement tacite n’est appliqué.
        </p>
        <h3>10.2 Boost de profil</h3>
        <p>
          Le Boost confère au Chef une visibilité maximale et accrue de son profil dans les sélections envoyées aux
          partenaires (clients privés, conciergeries) pendant <strong>trente (30) jours consécutifs</strong> à compter de
          son activation. Le profil bénéficie d’un badge « Disponible » et apparaît en priorité dans les présélections
          correspondant à ses critères.
        </p>
        <p>
          Le Boost est facturé <strong>119 € HT en paiement unique</strong> via Stripe. Il est expressément précisé que :
        </p>
        <ul>
          <li>le Boost <strong>ne garantit pas l’attribution de missions</strong> ; il garantit une visibilité accrue du profil sur les demandes des partenaires Chefs Talents pendant la période active ;</li>
          <li>le Boost est <strong>non remboursable</strong> une fois activé, y compris en l’absence de mission attribuée pendant la période ;</li>
          <li>le Boost ne peut faire l’objet d’une suspension, d’un report ou d’un transfert vers un autre profil.</li>
        </ul>
        <h3>10.3 Caractère professionnel et absence de droit de rétractation</h3>
        <p>
          Les achats VIP et Boost étant directement liés à l’activité professionnelle du Chef, le droit de rétractation
          de quatorze (14) jours prévu par le Code de la consommation pour les contrats à distance entre professionnels et
          consommateurs ne s’applique pas. Le Chef reconnaît effectuer ces achats à titre exclusivement professionnel.
        </p>
        <h3>10.4 Suspension et résiliation</h3>
        <p>
          En cas de suspension ou résiliation du compte du Chef pour manquement aux présentes Conditions, les montants
          déjà versés au titre du VIP ou du Boost restent acquis à Chefs Talents. Aucun remboursement, prorata ou avoir
          ne peut être réclamé sur ce fondement.
        </p>
      </section>

      <section id="sec-11">
        <h2>11. Proposition de mission au réseau</h2>
        <p>
          Si une mission entre dans le périmètre Chefs Talents et que le Chef se trouve dans l’incapacité de l’honorer
          (planning saturé, indisponibilité, format hors zone, contraintes incompatibles), le Chef peut transmettre cette
          mission au réseau Chefs Talents via la fonctionnalité dédiée de son tableau de bord
          (« Proposer une mission »).
        </p>
        <h3>11.1 Commission de transmission</h3>
        <p>
          Si la mission ainsi transmise aboutit avec un autre Chef du réseau, le Chef à l’origine de la proposition perçoit
          une commission de <strong>5 % du montant HT total de la mission exécutée</strong>, versée par Chefs Talents à la
          fin de l’exécution effective de la mission par le Chef qui l’a prise en charge.
        </p>
        <h3>11.2 Encadrement contractuel et NCC dédié</h3>
        <p>
          Toute proposition de mission au réseau s’accompagne de la signature d’un Accord de Non-Contournement et de
          Confidentialité dédié (« NCC propose-mission ») entre les quatre parties concernées : (i) le Chef à l’origine de
          la transmission, (ii) le Chef qui exécute la mission, (iii) le client final, (iv) Chefs Talents.
        </p>
        <p>
          Ce NCC garantit pendant <strong>vingt-quatre (24) mois</strong> à compter de la fin de la mission qu’aucune des
          parties signataires ne pourra contourner le circuit pour engager directement une relation commerciale avec une
          autre partie sans reverser au Chef à l’origine la commission de 5 % qui lui est due.
        </p>
        <p>
          En cas de violation de ce NCC, l’indemnité forfaitaire prévue à l’article 12.3 ci-dessous s’applique au profit
          du Chef à l’origine de la transmission, dans des conditions identiques à celles applicables à Chefs Talents.
        </p>
      </section>

      <section id="sec-12">
        <h2>12. Confidentialité et non-contournement</h2>
        <h3>12.1 Confidentialité</h3>
        <p>
          Le Chef reconnaît que l’ensemble des informations auxquelles il a accès dans le cadre de son inscription et de
          ses missions via Chefs Talents (incluant notamment : identité des clients, conciergeries, lieux, budgets,
          habitudes, contraintes logistiques, échanges, documents, menus, coordonnées) revêt un caractère strictement
          confidentiel.
        </p>
        <p>
          Le Chef s’engage à ne divulguer aucune de ces informations à des tiers, sauf accord écrit préalable de
          Chefs Talents ou obligation légale.
        </p>
        <h3>12.2 Non-contournement</h3>
        <p>
          Le Chef s’interdit formellement, pendant toute la durée de sa collaboration avec Chefs Talents et pendant une
          période de <strong>vingt-quatre (24) mois</strong> après la dernière mission, de :
        </p>
        <ul>
          <li>contracter directement avec un client, une conciergerie, un armateur ou toute entité présentée par Chefs Talents ;</li>
          <li>accepter une mission similaire ou équivalente avec ces mêmes parties, en dehors du cadre de Chefs Talents ;</li>
          <li>utiliser les informations obtenues via Chefs Talents à des fins personnelles ou concurrentes ;</li>
          <li>solliciter, transmettre ou divulguer à un tiers les coordonnées d’un client, d’une conciergerie ou d’un armateur présenté par Chefs Talents.</li>
        </ul>
        <p>Toute tentative de contournement, directe ou indirecte, sera considérée comme un manquement grave.</p>
        <h3>12.3 Sanctions</h3>
        <p>En cas de violation avérée des obligations de confidentialité ou de non-contournement :</p>
        <ul>
          <li>Chefs Talents se réserve le droit de suspendre ou résilier immédiatement l’accès du Chef à la plateforme ;</li>
          <li>toute mission en cours pourra être annulée ;</li>
          <li>le Chef sera redevable envers Chefs Talents d’une <strong>indemnité forfaitaire égale à 30 % du montant HT total de la mission contournée ou 30 000 €, le plus élevé des deux montants</strong>, sans préjudice de tout dommage complémentaire que Chefs Talents pourrait démontrer.</li>
        </ul>
        <p>
          Cette indemnité est immédiatement exigible dès la constatation de la violation et payable dans un délai de
          quinze (15) jours à compter de la notification.
        </p>
      </section>

      <section id="sec-13">
        <h2>13. Données personnelles et communication</h2>
        <p>
          Le Chef autorise Chefs Talents à utiliser les éléments de son profil (photos, biographie, expériences, langues,
          spécialités) à des fins de présentation aux clients et à des fins de promotion sur le site
          chefstalents.com et ses réseaux affiliés (sauf opposition écrite préalable du Chef).
        </p>
        <p>
          Les données personnelles du Chef sont traitées dans le cadre du règlement européen RGPD. Les modalités complètes
          (finalités, durées de conservation, sous-traitants, transferts hors UE, droits du Chef) sont décrites dans la
          politique de confidentialité accessible à l’adresse <a href="/privacy">chefstalents.com/privacy</a>.
        </p>
        <p>
          Pour toute demande relative à ses données (accès, rectification, effacement, opposition, portabilité), le Chef
          peut écrire à <a href="mailto:privacy@chefstalents.com">privacy@chefstalents.com</a>.
        </p>
      </section>

      <section id="sec-14">
        <h2>14. Suspension et résiliation</h2>
        <p>Chefs Talents peut suspendre ou résilier l’accès d’un Chef :</p>
        <ul>
          <li>en cas de manquement aux présentes Conditions ;</li>
          <li>en cas de retours clients négatifs répétés ou de comportement inapproprié ;</li>
          <li>en cas d’indisponibilité prolongée non signalée ;</li>
          <li>pour préserver la qualité du réseau et l’intérêt des clients.</li>
        </ul>
        <p>
          Le Chef peut demander la suppression de son compte à tout moment par simple message écrit à
          <a href="mailto:contact@chefstalents.com"> contact@chefstalents.com</a>. Cette suppression n’éteint pas les
          obligations post-collaboration prévues à l’article 12 (confidentialité, non-contournement).
        </p>
      </section>

      <section id="sec-15">
        <h2>15. Modification des Conditions</h2>
        <p>
          Chefs Talents peut modifier les présentes Conditions afin de les adapter à l’évolution de la plateforme, de la loi
          applicable ou des pratiques du marché. Toute modification substantielle fera l’objet d’une notification au Chef
          avec un délai de prise de connaissance, et donnera lieu à une nouvelle acceptation explicite à la prochaine
          connexion. À défaut d’acceptation, le compte du Chef pourra être suspendu.
        </p>
      </section>

      <section id="sec-16">
        <h2>16. Droit applicable et juridiction</h2>
        <p>Les présentes Conditions sont régies par le droit français.</p>
        <p>
          En cas de litige, et à défaut de résolution amiable dans un délai de trente (30) jours à compter de la première
          notification écrite, les Parties conviennent de la <strong>compétence exclusive des tribunaux de Bordeaux</strong>.
        </p>
      </section>

      <section id="sec-17">
        <h2>17. Acceptation</h2>
        <p>Le Chef reconnaît avoir lu, compris et accepté sans réserve les présentes Conditions de Collaboration.</p>
      </section>
    </div>
  );
}

// ============================================================
// EN — translation for reference, the FR version prevails in case of conflict
// ============================================================

export function BodyEN() {
  return (
    <div className="prose prose-stone max-w-none">
      <p className="text-xs italic text-stone-500">
        English translation provided for convenience. In case of conflict, the French version prevails.
      </p>

      <section id="sec-1">
        <h2>1. Purpose and parties</h2>
        <p>
          These Terms of Collaboration (hereafter the “Terms”) define the conditions under which independent chefs,
          pastry chefs, sommeliers, butlers and hospitality professionals (hereafter the “Chef”) collaborate with:
        </p>
        <p>
          <strong>SASU Chefs Talents</strong>, registered with the Bordeaux Trade Register under SIRET 89832072600026,
          headquartered at 73 rue Porte Dijeaux, 33000 Bordeaux, France, represented by Thomas Delcroix
          (hereafter “Chefs Talents”).
        </p>
        <p>
          Chefs Talents is an agency specialised in the placement and commercialisation of private culinary services to
          end clients (UHNW individuals, concierges, property managers, yacht owners, event agencies).
        </p>
        <p>
          Chefs Talents acts as a <strong>seller in its own name</strong> of the service to the end client: Chefs Talents
          orders the service from the Chef as an independent contractor and resells it to the end client under its own
          commercial and fiscal responsibility. Chefs Talents is neither an agent of the Chef nor a transparent
          intermediary in the fiscal sense.
        </p>
      </section>

      <section id="sec-2">
        <h2>2. Chef status and independence</h2>
        <p>
          The Chef declares to operate as an independent professional (auto-entrepreneur, micro-business, commercial
          company, foreign equivalent).
        </p>
        <p>As such, the Chef warrants:</p>
        <ul>
          <li>being solely responsible for tax, social and reporting obligations;</li>
          <li>holding all legal authorisations required to operate;</li>
          <li>holding a valid professional liability insurance, a certificate of which may be requested at any time;</li>
          <li>mastering the hygiene and food safety rules applicable to the services performed.</li>
        </ul>
        <h3>2.1 Absence of subordination</h3>
        <p>The Chef acts as an independent contractor. It is expressly agreed that:</p>
        <ul>
          <li>the Chef is not an employee of Chefs Talents;</li>
          <li>the Chef is not an employee of the end client where the service is performed;</li>
          <li>no relationship of subordination, exclusivity or legal dependency exists between the Chef and Chefs Talents;</li>
          <li>the Chef remains free to accept or decline any mission proposed by Chefs Talents;</li>
          <li>the Chef remains free to operate outside of Chefs Talents, subject to the confidentiality and non-circumvention obligations defined herein.</li>
        </ul>
        <p>
          The Chef retains full autonomy to set rates, organise work and define execution methods, within the scope of
          the brief validated for each mission.
        </p>
        <h3>2.2 Yachting missions</h3>
        <p>
          For missions on board yachts, pleasure crafts or commercial superyachts, the Chef may operate as an employee of
          the yacht, the owner or the operating company of the vessel. In such cases:
        </p>
        <ul>
          <li>the employment contract is entered into directly between the Chef and the operating entity;</li>
          <li>Chefs Talents is neither employer, co-employer, nor responsible for the social, tax or contractual obligations of that contract;</li>
          <li>the Chef warrants, where applicable, holding the certifications required for this type of mission, in particular STCW Basic Safety Training, the ENG1 medical examination (or valid equivalent), and compliance with MLC 2006 standards;</li>
          <li>the Chef agrees to provide copies of these certifications to Chefs Talents prior to embarkation.</li>
        </ul>
        <h3>2.3 Professional liability and indemnification of Chefs Talents</h3>
        <p>
          As an independent contractor acting under their own responsibility, the Chef is solely liable for any damages,
          prejudice or claims caused during the material execution of the service. The Chef indemnifies Chefs Talents
          against any claim, action or proceedings brought by the Client or a third party relating in particular to:
        </p>
        <ul>
          <li>damages caused to the Client’s equipment, premises, furniture or property during the performance of the service;</li>
          <li>bodily or material harm occurring during the service due to the Chef;</li>
          <li>breaches of hygiene, food safety rules or professional standards applicable to culinary execution;</li>
          <li>loss or deterioration of materials, equipment or ingredients placed under the Chef’s custody during the mission.</li>
        </ul>
        <p>
          The Chef commits to <strong>fully indemnify Chefs Talents</strong> for any sum it may have to bear as a result
          of a Client claim linked to a Chef breach (defense costs, indemnities paid, expert fees, attorney fees), upon
          first demand and without challenge once the Chef’s liability has been established.
        </p>
        <p>
          The Chef provides Chefs Talents with an up-to-date copy of their professional liability insurance certificate
          upon each annual renewal and upon any request from Chefs Talents. Any mission may be suspended by Chefs Talents
          in the absence of a valid certificate.
        </p>
      </section>

      <section id="sec-3">
        <h2>3. Selection and profile statuses</h2>
        <p>
          Access to the Chefs Talents platform is subject to validation. The Chef’s profile evolves through the following
          statuses:
        </p>
        <ol>
          <li><strong>Pending validation</strong>: profile created, under review by the Chefs Talents team (file, background, references, positioning, certification verification where applicable).</li>
          <li><strong>Approved</strong>: profile validated, awaiting activation upon acceptance of these Terms and completion of the file (photo, bio, experiences, languages, constraints, supporting documents).</li>
          <li><strong>Active</strong>: profile visible in selections sent to clients and concierges, eligible to receive mission proposals.</li>
          <li><strong>Paused</strong>: profile temporarily removed from selections (at the Chef’s request or by Chefs Talents in case of breach, prolonged unavailability or negative client feedback warranting further review).</li>
        </ol>
        <p>
          Chefs Talents reserves the right to refuse a candidacy without justification, request additional information or
          documents, suspend or remove a profile. Registration does not constitute a guarantee of mission allocation,
          volume or frequency.
        </p>
      </section>

      <section id="sec-4">
        <h2>4. Commercial model and pricing</h2>
        <h3>4.1 Seller-in-its-own-name model</h3>
        <p>
          For each mission, Chefs Talents and the Chef agree on a net-of-tax (HT) budget through bilateral negotiation.
          That budget constitutes the Chef’s remuneration for the commissioned service.
        </p>
        <p>
          Chefs Talents then resells the service to the end client at an inclusive-of-tax (TTC) price comprising
          Chefs Talents’ commercial margin and applicable VAT. The Chef never invoices the end client: the Chef
          invoices Chefs Talents for the agreed budget.
        </p>
        <p>
          The Chef acknowledges that the margin realised by Chefs Talents between the resale price and the purchase price
          is commercial information proprietary to Chefs Talents. The Chef shall not disclose it nor demand its disclosure.
        </p>
        <h3>4.2 Pricing freedom</h3>
        <p>The Chef freely sets the rate invoiced to Chefs Talents, in particular:</p>
        <ul>
          <li>price per person for one-off services (lunch, dinner, event, cocktail);</li>
          <li>price per day for residency missions (villa, chalet, yacht, long-format stay);</li>
          <li>flat-fee package for seasonal missions.</li>
        </ul>
        <p>
          The rate agreed for a given mission is set in the specific mission contract signed for that mission and may
          not be modified unilaterally.
        </p>
      </section>

      <section id="sec-5">
        <h2>5. Chef payment terms</h2>
        <h3>5.1 Deposit on signature</h3>
        <p>
          Upon signature of the mission contract, Chefs Talents pays the Chef a deposit of <strong>fifteen percent (15 %)
          of the HT amount</strong> of the mission, securing the Chef’s commitment to the agreed dates.
        </p>
        <p>
          This deposit remains acquired by the Chef in the event of cancellation by the client after signature, as a
          fixed indemnity for date reservation.
        </p>
        <h3>5.2 Balance after performance</h3>
        <p>
          The HT balance (85 %) is paid to the Chef <strong>no later than 4 working days after the effective end of the
          mission</strong>, upon presentation by the Chef of a compliant invoice addressed to Chefs Talents.
        </p>
        <p>
          For missions of six (6) weeks or more, payment is made <strong>monthly in arrears</strong>, in tranches calculated
          pro rata to the elapsed time.
        </p>
        <p>Any invoicing delay attributable to the Chef may correspondingly delay the payment of the balance.</p>
        <h3>5.3 Payment method</h3>
        <p>
          Payments are made by bank transfer to the account provided by the Chef. The Chef is solely responsible for the
          accuracy of the bank details supplied.
        </p>
      </section>

      <section id="sec-6">
        <h2>6. Mission card</h2>
        <p>
          For certain missions, depending on duration and complexity, Chefs Talents provides the Chef with a
          <strong> nominative virtual payment card</strong> (Revolut Business) intended exclusively for purchases of
          ingredients and food products needed for the mission.
        </p>
        <p>
          The allocation of a mission card is decided by Chefs Talents on a case-by-case basis depending on planned
          duration, allocated budget and logistics. When provided, its use is governed by the
          <em> Mission Spending Card Usage Rules</em> handed over and signed separately, which provide notably:
        </p>
        <ul>
          <li>a fixed cap, non-rechargeable except by prior written agreement;</li>
          <li>a limited list of authorised expenses (raw materials, condiments, food-related cleaning supplies);</li>
          <li>the obligation to transmit all supporting documents (receipts, invoices) within 48 hours after end of mission;</li>
          <li>automatic deduction from the Chef’s remuneration of any unjustified or unauthorised expense;</li>
          <li>Chefs Talents’ ownership of any unused balance at the end of the mission;</li>
          <li>systematic deactivation of the card on the last day of the mission, except by written agreement.</li>
        </ul>
        <p>
          Fraudulent or diverted use of a mission card results in its immediate deactivation, deduction of the amounts
          concerned from the Chef’s remuneration and termination of the collaboration, without prejudice to applicable
          legal proceedings.
        </p>
      </section>

      <section id="sec-7">
        <h2>7. Mission workflow</h2>
        <ol>
          <li>Reception of the client brief by Chefs Talents.</li>
          <li>Pre-selection and presentation of chef profiles to the client.</li>
          <li>Discussion and validation of scope (menu, rhythm, medical and dietary constraints).</li>
          <li>Validation by the parties of the mission contract (HT budget, dates, scope, mission card if applicable).</li>
          <li>Client invoicing and collection by Chefs Talents.</li>
          <li>Payment of the 15 % deposit to the Chef.</li>
          <li>Performance of the service by the Chef on site.</li>
          <li>Invoicing by the Chef to Chefs Talents.</li>
          <li>Payment of the 85 % balance to the Chef within 4 working days after end of mission (or monthly if mission ≥ 6 weeks).</li>
        </ol>
        <p>The Chef commits to respect the validated brief and maintain a level of service consistent with their positioning.</p>
      </section>

      <section id="sec-8">
        <h2>8. Cancellations and breaches</h2>
        <h3>8.1 Cancellation by the client</h3>
        <p>
          In the event of cancellation by the client after contract signature, the 15 % deposit remains acquired by the
          Chef as a fixed indemnity for date reservation.
        </p>
        <h3>8.2 Cancellation by the Chef</h3>
        <p>Any cancellation by the Chef must be reported immediately to Chefs Talents. In case of cancellation:</p>
        <ul>
          <li>more than 48 hours before mission start, without legitimate reason: Chefs Talents may temporarily suspend the account or limit access to future missions;</li>
          <li>less than 48 hours before mission start, without legitimate reason: the deposit must be returned and a penalty may be applied up to the loss suffered by Chefs Talents and the client.</li>
        </ul>
        <h3>8.3 Severe cancellation (no-show / less than 24 hours)</h3>
        <p>Any cancellation under 24 hours without valid reason or communication results in:</p>
        <ul>
          <li>immediate and definitive exclusion from the platform from the first occurrence;</li>
          <li>obligation to fully return the deposit;</li>
          <li>the right for Chefs Talents to claim damages for client and commercial loss.</li>
        </ul>
      </section>

      <section id="sec-9">
        <h2>9. Quality, image and conduct</h2>
        <p>The Chef commits to:</p>
        <ul>
          <li>adopt professional dress and demeanor adapted to the UHNW private environment;</li>
          <li>respect hygiene, food safety and discretion rules;</li>
          <li>maintain impeccable hygiene (clothing, work area, handling);</li>
          <li>inform Chefs Talents of any difficulty encountered during the mission;</li>
          <li>not damage the image of Chefs Talents or the client.</li>
        </ul>
        <p>Any inappropriate behaviour may lead to immediate suspension or exclusion.</p>
      </section>

      <section id="sec-10">
        <h2>10. Paid plans: VIP and Boost</h2>
        <p>
          Chefs Talents offers the Chef, optionally and without any obligation to remain registered, two paid plans
          designed to enhance visibility and support.
        </p>
        <h3>10.1 VIP status</h3>
        <p>
          The VIP status grants the Chef priority in selections sent to clients and concierges, a visibility badge on the
          profile and early access to briefs. Three commitment durations are available:
        </p>
        <ul>
          <li><strong>VIP 3 months</strong>: €59 HT/month (€177 HT in single upfront payment).</li>
          <li><strong>VIP 6 months</strong>: €55 HT/month (€330 HT upfront).</li>
          <li><strong>VIP 12 months</strong>: €40 HT/month (€480 HT upfront); this plan includes a positioning call with the Chefs Talents team (firm commitment).</li>
        </ul>
        <p>
          Payments are made via Stripe. In monthly mode, the subscription is automatically terminated at the end of the
          commitment (<em>cancel_at</em> mechanism); no tacit renewal applies.
        </p>
        <h3>10.2 Profile Boost</h3>
        <p>
          The Boost grants the Chef enhanced visibility of their profile in selections sent to partners (private clients,
          concierges) for <strong>thirty (30) consecutive days</strong> from activation. The profile carries an
          “Available” badge and appears in priority in pre-selections matching its criteria.
        </p>
        <p>The Boost is invoiced <strong>€119 HT in a single payment</strong> via Stripe. It is expressly stated that:</p>
        <ul>
          <li>the Boost <strong>does not guarantee mission allocation</strong>; it guarantees enhanced profile visibility on partner requests during the active period;</li>
          <li>the Boost is <strong>non-refundable</strong> once activated, even in the absence of mission allocation during the period;</li>
          <li>the Boost cannot be suspended, postponed or transferred to another profile.</li>
        </ul>
        <h3>10.3 Professional nature and absence of withdrawal right</h3>
        <p>
          As VIP and Boost purchases are directly related to the Chef’s professional activity, the 14-day withdrawal
          right provided by the French Consumer Code for distance contracts between professionals and consumers does not
          apply. The Chef acknowledges making these purchases on a strictly professional basis.
        </p>
        <h3>10.4 Suspension and termination</h3>
        <p>
          In the event of suspension or termination of the Chef’s account for breach of these Terms, amounts already paid
          for VIP or Boost remain acquired by Chefs Talents. No refund, prorata or credit may be claimed on this basis.
        </p>
      </section>

      <section id="sec-11">
        <h2>11. Forwarding a mission to the network</h2>
        <p>
          If a mission falls within the Chefs Talents scope and the Chef cannot honour it (full schedule, unavailability,
          out-of-area format, incompatible constraints), the Chef may forward this mission to the Chefs Talents network
          via the dedicated dashboard feature (“Forward a mission”).
        </p>
        <h3>11.1 Forwarding commission</h3>
        <p>
          If the forwarded mission is performed by another Chef of the network, the originating Chef receives a
          commission of <strong>5 % of the total HT amount of the executed mission</strong>, paid by Chefs Talents at the
          end of the effective execution by the Chef who took it on.
        </p>
        <h3>11.2 Contractual framework and dedicated NCC</h3>
        <p>
          Any mission forwarding is accompanied by the signature of a dedicated Non-Circumvention and Confidentiality
          Agreement (“propose-mission NCC”) between the four parties involved: (i) the originating Chef, (ii) the Chef who
          executes the mission, (iii) the end client, (iv) Chefs Talents.
        </p>
        <p>
          This NCC guarantees for <strong>twenty-four (24) months</strong> from the end of the mission that no signing
          party may bypass the circuit to engage directly with another party without paying the originating Chef the
          5 % commission due.
        </p>
        <p>
          In the event of a violation of this NCC, the fixed indemnity provided in article 12.3 below applies in favour
          of the originating Chef under the same conditions as those applicable to Chefs Talents.
        </p>
      </section>

      <section id="sec-12">
        <h2>12. Confidentiality and non-circumvention</h2>
        <h3>12.1 Confidentiality</h3>
        <p>
          The Chef acknowledges that all information accessed in the context of registration and missions via
          Chefs Talents (including: client and concierge identity, locations, budgets, habits, logistical constraints,
          exchanges, documents, menus, contact details) is strictly confidential.
        </p>
        <p>
          The Chef commits not to disclose any such information to third parties, save for prior written approval from
          Chefs Talents or legal obligation.
        </p>
        <h3>12.2 Non-circumvention</h3>
        <p>
          The Chef formally undertakes, throughout the duration of the collaboration with Chefs Talents and for a period
          of <strong>twenty-four (24) months</strong> after the last mission, not to:
        </p>
        <ul>
          <li>contract directly with any client, concierge, yacht owner or entity introduced by Chefs Talents;</li>
          <li>accept any similar or equivalent mission with the same parties outside the Chefs Talents framework;</li>
          <li>use information obtained via Chefs Talents for personal or competing purposes;</li>
          <li>solicit, transmit or disclose to third parties the contact details of a client, concierge or yacht owner introduced by Chefs Talents.</li>
        </ul>
        <p>Any attempt at circumvention, direct or indirect, will be deemed a serious breach.</p>
        <h3>12.3 Sanctions</h3>
        <p>In the event of a confirmed breach of confidentiality or non-circumvention obligations:</p>
        <ul>
          <li>Chefs Talents reserves the right to immediately suspend or terminate the Chef’s access to the platform;</li>
          <li>any ongoing mission may be cancelled;</li>
          <li>the Chef shall be liable to Chefs Talents for a <strong>fixed indemnity equal to 30 % of the total HT amount of the circumvented mission or €30,000, whichever is greater</strong>, without prejudice to any further damages Chefs Talents may demonstrate.</li>
        </ul>
        <p>
          This indemnity is immediately due upon detection of the violation and payable within fifteen (15) days from
          notification.
        </p>
      </section>

      <section id="sec-13">
        <h2>13. Personal data and communication</h2>
        <p>
          The Chef authorises Chefs Talents to use the elements of their profile (photos, biography, experience, languages,
          specialties) for client presentation and promotion on chefstalents.com and affiliated networks (unless prior
          written objection from the Chef).
        </p>
        <p>
          The Chef’s personal data is processed in accordance with the European GDPR. Full processing terms (purposes,
          retention periods, sub-processors, transfers outside the EU, Chef’s rights) are described in the privacy policy
          available at <a href="/privacy">chefstalents.com/privacy</a>.
        </p>
        <p>
          For any data-related request (access, rectification, erasure, opposition, portability), the Chef may write to
          <a href="mailto:privacy@chefstalents.com"> privacy@chefstalents.com</a>.
        </p>
      </section>

      <section id="sec-14">
        <h2>14. Suspension and termination</h2>
        <p>Chefs Talents may suspend or terminate a Chef’s access:</p>
        <ul>
          <li>in case of breach of these Terms;</li>
          <li>in case of repeated negative client feedback or inappropriate behaviour;</li>
          <li>in case of prolonged unreported unavailability;</li>
          <li>to preserve the quality of the network and client interest.</li>
        </ul>
        <p>
          The Chef may request account deletion at any time by simple written message to
          <a href="mailto:contact@chefstalents.com"> contact@chefstalents.com</a>. Such deletion does not extinguish
          post-collaboration obligations under article 12 (confidentiality, non-circumvention).
        </p>
      </section>

      <section id="sec-15">
        <h2>15. Modification of the Terms</h2>
        <p>
          Chefs Talents may modify these Terms to adapt them to platform evolution, applicable law or market practice.
          Any substantive change will be notified to the Chef with a reasonable awareness period and will require a new
          explicit acceptance at the next login. Failing acceptance, the Chef’s account may be suspended.
        </p>
      </section>

      <section id="sec-16">
        <h2>16. Applicable law and jurisdiction</h2>
        <p>These Terms are governed by French law.</p>
        <p>
          In case of dispute, and failing amicable resolution within thirty (30) days from the first written notification,
          the Parties agree on the <strong>exclusive jurisdiction of the Bordeaux courts</strong>.
        </p>
      </section>

      <section id="sec-17">
        <h2>17. Acceptance</h2>
        <p>The Chef acknowledges having read, understood and accepted these Terms of Collaboration without reservation.</p>
      </section>
    </div>
  );
}

// ============================================================
// ES — traducción para conveniencia, prevalece la versión FR en caso de conflicto
// ============================================================

export function BodyES() {
  return (
    <div className="prose prose-stone max-w-none">
      <p className="text-xs italic text-stone-500">
        Traducción al español por conveniencia. En caso de conflicto, prevalece la versión francesa.
      </p>

      <section id="sec-1">
        <h2>1. Objeto y partes</h2>
        <p>
          Las presentes Condiciones de Colaboración (en adelante las «Condiciones») tienen por objeto definir las modalidades
          según las cuales los chefs cocineros, pasteleros, sommeliers, butlers y profesionales de la restauración independientes
          (en adelante el «Chef») colaboran con:
        </p>
        <p>
          <strong>SASU Chefs Talents</strong>, inscrita en el RCS de Burdeos con SIRET 89832072600026, con domicilio social en
          73 rue Porte Dijeaux, 33000 Burdeos (Francia), representada por Thomas Delcroix (en adelante «Chefs Talents»).
        </p>
        <p>
          Chefs Talents es una agencia especializada en la colocación y comercialización de prestaciones culinarias privadas
          ante clientes finales (particulares UHNW, conciergeries, gestores de inmuebles, armadores, agencias de eventos).
        </p>
        <p>
          Chefs Talents actúa como <strong>vendedor en nombre propio</strong> de la prestación ante el cliente final:
          encarga la prestación al Chef en calidad de prestador independiente y la revende al cliente final bajo su propia
          responsabilidad comercial y fiscal. Chefs Talents no actúa como mandatario del Chef ni como intermediario transparente
          en el sentido fiscal.
        </p>
      </section>

      <section id="sec-2">
        <h2>2. Estatuto del Chef e independencia</h2>
        <p>
          El Chef declara ejercer su actividad en calidad de profesional independiente (auto-empresario, microempresa,
          sociedad mercantil, equivalente extranjero).
        </p>
        <p>A tal efecto, el Chef garantiza:</p>
        <ul>
          <li>ser único responsable de sus obligaciones fiscales, sociales y declarativas;</li>
          <li>disponer de todas las autorizaciones legales requeridas para ejercer su actividad;</li>
          <li>poseer un seguro de responsabilidad civil profesional vigente, cuyo certificado podrá ser solicitado en cualquier momento;</li>
          <li>dominar las normas de higiene y seguridad alimentaria aplicables a las prestaciones que ejecuta.</li>
        </ul>
        <h3>2.1 Ausencia de subordinación</h3>
        <p>El Chef interviene como prestador independiente. Se conviene expresamente que:</p>
        <ul>
          <li>el Chef no es asalariado de Chefs Talents;</li>
          <li>el Chef no es asalariado del cliente final;</li>
          <li>no existe relación de subordinación, exclusividad o dependencia jurídica entre el Chef y Chefs Talents;</li>
          <li>el Chef es libre de aceptar o rechazar cualquier misión propuesta por Chefs Talents;</li>
          <li>el Chef es libre de ejercer su actividad fuera de Chefs Talents, respetando las obligaciones de confidencialidad y no circunvención previstas en las presentes.</li>
        </ul>
        <p>
          El Chef conserva plena libertad para fijar sus tarifas, organizar su trabajo y definir sus métodos de ejecución,
          en el respeto del pliego validado para cada misión.
        </p>
        <h3>2.2 Caso particular de las misiones de yachting</h3>
        <p>
          Para las misiones a bordo de yates, embarcaciones de recreo o superyates comerciales, el Chef puede intervenir como
          asalariado del yate, del armador o de la sociedad explotadora del buque. En tal caso:
        </p>
        <ul>
          <li>el contrato laboral se establece directamente entre el Chef y la entidad explotadora del yate;</li>
          <li>Chefs Talents no es ni empleador, ni co-empleador, ni responsable de las obligaciones sociales, fiscales o contractuales asociadas;</li>
          <li>el Chef garantiza, en su caso, poseer las certificaciones requeridas para este tipo de misión, en particular STCW Basic Safety Training, examen médico ENG1 (o equivalente vigente) y cumplimiento de los estándares del Convenio MLC 2006;</li>
          <li>el Chef se compromete a entregar copia de dichas certificaciones a Chefs Talents antes del embarque.</li>
        </ul>
        <h3>2.3 Responsabilidad civil profesional e indemnización a Chefs Talents</h3>
        <p>
          El Chef, al actuar como prestador independiente bajo su propia responsabilidad, es el único responsable de los
          daños, perjuicios y siniestros que cause durante la ejecución material de la prestación. Garantiza a
          Chefs Talents frente a toda reclamación, acción o procedimiento ejercido por el Cliente o un tercero,
          relativos en particular a:
        </p>
        <ul>
          <li>daños causados a los equipos, instalaciones, mobiliario o bienes del Cliente durante la ejecución de la prestación;</li>
          <li>perjuicios corporales o materiales ocurridos durante la prestación por hecho del Chef;</li>
          <li>incumplimientos de las normas de higiene, seguridad alimentaria o estándares profesionales aplicables a la ejecución culinaria;</li>
          <li>pérdidas o deterioros de material, equipos o ingredientes bajo la custodia del Chef durante la misión.</li>
        </ul>
        <p>
          El Chef se compromete a <strong>indemnizar íntegramente a Chefs Talents</strong> por cualquier importe que esta
          última deba soportar en virtud de una reclamación del Cliente vinculada a un incumplimiento del Chef (gastos de
          defensa, indemnizaciones pagadas, gastos de peritaje, honorarios de abogado), a primer requerimiento y sin
          posibilidad de impugnación una vez establecida la responsabilidad del Chef.
        </p>
        <p>
          El Chef facilita a Chefs Talents una copia actualizada de su certificado de responsabilidad civil profesional
          en cada renovación anual, así como a cualquier solicitud de Chefs Talents. Cualquier misión podrá ser
          suspendida por Chefs Talents en ausencia de certificado válido.
        </p>
      </section>

      <section id="sec-3">
        <h2>3. Selección y estados del perfil</h2>
        <p>
          El acceso a la plataforma Chefs Talents está sometido a validación. El perfil del Chef evoluciona sucesivamente entre
          los siguientes estados:
        </p>
        <ol>
          <li><strong>Pendiente de validación</strong>: perfil creado, en proceso de revisión por el equipo Chefs Talents (expediente, trayectoria, referencias, posicionamiento, verificación de certificaciones cuando proceda).</li>
          <li><strong>Aprobado</strong>: perfil validado, en espera de activación tras aceptación de las presentes Condiciones y completado del expediente (foto, biografía, experiencias, idiomas, restricciones, justificantes).</li>
          <li><strong>Activo</strong>: perfil visible en las selecciones enviadas a clientes y conciergeries, elegible para recibir propuestas de misión.</li>
          <li><strong>En pausa</strong>: perfil retirado temporalmente de las selecciones (a petición del Chef o por iniciativa de Chefs Talents en caso de incumplimiento, indisponibilidad prolongada o feedback negativo de cliente que justifique un análisis adicional).</li>
        </ol>
        <p>
          Chefs Talents se reserva el derecho de rechazar una candidatura sin justificación, solicitar información o justificantes
          adicionales, suspender o retirar un perfil. La inscripción no constituye en ningún caso garantía de asignación de misiones,
          de volumen ni de frecuencia.
        </p>
      </section>

      <section id="sec-4">
        <h2>4. Modelo comercial y fijación de tarifas</h2>
        <h3>4.1 Modelo de «vendedor en nombre propio»</h3>
        <p>
          Para cada misión, Chefs Talents y el Chef acuerdan un presupuesto sin IVA (HT) tras una negociación bilateral. Ese
          presupuesto constituye la remuneración del Chef por la prestación encargada.
        </p>
        <p>
          Chefs Talents revende a continuación la prestación al cliente final a una tarifa con IVA incluido (TTC) que comprende
          el margen comercial de Chefs Talents y el IVA aplicable. El Chef nunca factura al cliente final: factura exclusivamente
          a Chefs Talents por el presupuesto convenido.
        </p>
        <p>
          El Chef reconoce que el margen obtenido por Chefs Talents entre el precio de reventa al cliente y el precio de compra
          al Chef constituye un dato comercial propio de Chefs Talents. El Chef se prohíbe comunicarlo o exigir su divulgación.
        </p>
        <h3>4.2 Libertad tarifaria</h3>
        <p>El Chef fija libremente la tarifa que factura a Chefs Talents, en particular:</p>
        <ul>
          <li>precio por persona para prestaciones puntuales (almuerzo, cena, evento, cóctel);</li>
          <li>precio por día para misiones de residencia (villa, chalet, yate, estancia larga);</li>
          <li>tarifa global para misiones estacionales.</li>
        </ul>
        <p>
          La tarifa convenida para una misión determinada queda fijada en el contrato de misión específico firmado para esa
          misión y no puede modificarse unilateralmente.
        </p>
      </section>

      <section id="sec-5">
        <h2>5. Modalidades de pago al Chef</h2>
        <h3>5.1 Anticipo a la firma</h3>
        <p>
          A la firma del contrato de misión, Chefs Talents abona al Chef un anticipo del <strong>quince por ciento (15 %) del
          importe HT</strong> de la misión, asegurando la movilización del Chef en las fechas convenidas.
        </p>
        <p>
          Este anticipo queda adquirido por el Chef en caso de cancelación de la misión por parte del cliente tras la firma,
          a título de indemnización a tanto alzado por reserva de fechas.
        </p>
        <h3>5.2 Saldo tras ejecución</h3>
        <p>
          El saldo del importe HT (85 %) se abona al Chef <strong>como muy tarde 4 días hábiles después del fin efectivo de la
          misión</strong>, previa presentación por el Chef de una factura conforme dirigida a Chefs Talents.
        </p>
        <p>
          Para misiones de seis (6) semanas o más, el pago se realiza <strong>mensualmente a término vencido</strong>, en
          tramos calculados a prorrata del tiempo transcurrido.
        </p>
        <p>Cualquier retraso en la facturación imputable al Chef podrá retrasar en consecuencia la fecha de pago del saldo.</p>
        <h3>5.3 Medio de pago</h3>
        <p>
          Los pagos se efectúan por transferencia bancaria a la cuenta indicada por el Chef. El Chef es único responsable de
          la exactitud de los datos bancarios suministrados.
        </p>
      </section>

      <section id="sec-6">
        <h2>6. Tarjeta de misión</h2>
        <p>
          Para ciertas misiones, según su duración y complejidad, Chefs Talents pone a disposición del Chef una
          <strong> tarjeta de pago virtual nominativa</strong> (Revolut Business) destinada exclusivamente a cubrir compras de
          materias primas y productos alimenticios necesarios para la ejecución de la misión.
        </p>
        <p>
          La asignación de una tarjeta de misión se decide por Chefs Talents caso por caso en función de la duración prevista,
          el presupuesto asignado y el contexto logístico. Cuando se entrega, su uso se rige por el
          <em> Reglamento de uso – Tarjeta de gastos misión</em> entregado y firmado aparte, que prevé en particular:
        </p>
        <ul>
          <li>un tope fijo no recargable salvo acuerdo escrito previo;</li>
          <li>una lista limitada de gastos autorizados (materias primas, condimentos, productos de mantenimiento alimentario);</li>
          <li>la obligación de transmitir la totalidad de los justificantes (tickets, facturas) en las 48 horas posteriores al fin de misión;</li>
          <li>la deducción automática sobre la remuneración del Chef de cualquier gasto no justificado o no autorizado;</li>
          <li>la propiedad de Chefs Talents sobre cualquier saldo no utilizado al final de la misión;</li>
          <li>la desactivación sistemática de la tarjeta el último día de la misión, salvo acuerdo escrito en contrario.</li>
        </ul>
        <p>
          El uso fraudulento o desviado de una tarjeta de misión conlleva su desactivación inmediata, la deducción de los
          importes correspondientes sobre la remuneración del Chef y la finalización de la colaboración, sin perjuicio de las
          acciones judiciales aplicables.
        </p>
      </section>

      <section id="sec-7">
        <h2>7. Desarrollo de una misión</h2>
        <ol>
          <li>Recepción del brief del cliente por Chefs Talents.</li>
          <li>Preselección y presentación de perfiles de chefs al cliente.</li>
          <li>Diálogo y validación del alcance (menú, ritmo, restricciones médicas y alimentarias).</li>
          <li>Validación por las partes del contrato de misión (presupuesto HT, fechas, prestación, tarjeta de misión en su caso).</li>
          <li>Cobro al cliente por Chefs Talents.</li>
          <li>Pago del anticipo del 15 % al Chef.</li>
          <li>Ejecución de la prestación por el Chef in situ.</li>
          <li>Facturación por el Chef a Chefs Talents.</li>
          <li>Pago del saldo del 85 % al Chef en los 4 días hábiles siguientes al fin de misión (o mensualmente si la misión ≥ 6 semanas).</li>
        </ol>
        <p>El Chef se compromete a respetar el pliego validado y a mantener un nivel de servicio acorde con su posicionamiento.</p>
      </section>

      <section id="sec-8">
        <h2>8. Cancelaciones e incumplimientos</h2>
        <h3>8.1 Cancelación por el cliente</h3>
        <p>
          En caso de cancelación de la misión por el cliente tras la firma del contrato, el anticipo del 15 % queda adquirido
          por el Chef en concepto de indemnización a tanto alzado por reserva de fechas.
        </p>
        <h3>8.2 Cancelación por el Chef</h3>
        <p>Cualquier cancelación por parte del Chef debe comunicarse inmediatamente a Chefs Talents. En caso de cancelación:</p>
        <ul>
          <li>más de 48 horas antes del inicio de la misión, sin motivo legítimo: Chefs Talents podrá suspender temporalmente la cuenta o limitar el acceso a futuras misiones;</li>
          <li>menos de 48 horas antes del inicio, sin motivo legítimo: el anticipo abonado deberá restituirse y podrá aplicarse una penalización por el perjuicio sufrido por Chefs Talents y el cliente.</li>
        </ul>
        <h3>8.3 Cancelación grave (no-show / menos de 24 horas)</h3>
        <p>Cualquier cancelación a menos de 24 horas sin justificación válida o sin comunicación conlleva:</p>
        <ul>
          <li>la exclusión inmediata y definitiva de la plataforma desde la primera ocurrencia;</li>
          <li>la obligación de restitución íntegra del anticipo;</li>
          <li>el derecho de Chefs Talents a reclamar reparación por el perjuicio del cliente y el perjuicio comercial.</li>
        </ul>
      </section>

      <section id="sec-9">
        <h2>9. Calidad, imagen y conducta</h2>
        <p>El Chef se compromete a:</p>
        <ul>
          <li>adoptar una vestimenta y actitud profesionales acordes al entorno privado UHNW;</li>
          <li>respetar las normas de higiene, seguridad alimentaria y discreción;</li>
          <li>mantener una higiene irreprochable (vestimenta, espacio de trabajo, manipulaciones);</li>
          <li>informar a Chefs Talents de cualquier dificultad encontrada durante la misión;</li>
          <li>no perjudicar la imagen de Chefs Talents ni la del cliente.</li>
        </ul>
        <p>Cualquier comportamiento inapropiado podrá conllevar suspensión o exclusión inmediata.</p>
      </section>

      <section id="sec-10">
        <h2>10. Planes de pago: VIP y Boost</h2>
        <p>
          Chefs Talents ofrece al Chef, de forma facultativa y sin obligación alguna para permanecer inscrito, dos dispositivos
          de pago destinados a mejorar su visibilidad y enriquecer su acompañamiento.
        </p>
        <h3>10.1 Estatus VIP</h3>
        <p>
          El estatus VIP otorga al Chef prioridad en las selecciones enviadas a clientes y conciergeries, una insignia de
          visibilidad en su perfil y acceso anticipado a los briefs. Tres duraciones de compromiso disponibles:
        </p>
        <ul>
          <li><strong>VIP 3 meses</strong>: 59 € HT/mes (177 € HT en pago único anticipado).</li>
          <li><strong>VIP 6 meses</strong>: 55 € HT/mes (330 € HT anticipado).</li>
          <li><strong>VIP 12 meses</strong>: 40 € HT/mes (480 € HT anticipado); este plan incluye una llamada de posicionamiento con el equipo Chefs Talents (compromiso firme).</li>
        </ul>
        <p>
          Los pagos se realizan vía Stripe. En modalidad mensual, la suscripción se rescinde automáticamente al término del
          compromiso (mecanismo <em>cancel_at</em>); no se aplica renovación tácita.
        </p>
        <h3>10.2 Boost de perfil</h3>
        <p>
          El Boost otorga al Chef una visibilidad máxima e incrementada de su perfil en las selecciones enviadas a los socios
          (clientes privados, conciergeries) durante <strong>treinta (30) días consecutivos</strong> a partir de su activación.
          El perfil obtiene la insignia «Disponible» y aparece prioritariamente en las preselecciones que coinciden con sus
          criterios.
        </p>
        <p>
          El Boost se factura <strong>119 € HT en pago único</strong> vía Stripe. Se precisa expresamente que:
        </p>
        <ul>
          <li>el Boost <strong>no garantiza la asignación de misiones</strong>; garantiza una visibilidad incrementada del perfil sobre las solicitudes de los socios Chefs Talents durante el período activo;</li>
          <li>el Boost es <strong>no reembolsable</strong> una vez activado, incluso en ausencia de misión asignada durante el período;</li>
          <li>el Boost no puede ser objeto de suspensión, aplazamiento o transferencia a otro perfil.</li>
        </ul>
        <h3>10.3 Carácter profesional y ausencia de derecho de retractación</h3>
        <p>
          Al estar las compras VIP y Boost directamente vinculadas a la actividad profesional del Chef, el derecho de
          retractación de catorce (14) días previsto por el Código de Consumo francés para los contratos a distancia entre
          profesionales y consumidores no se aplica. El Chef reconoce realizar estas compras a título estrictamente profesional.
        </p>
        <h3>10.4 Suspensión y rescisión</h3>
        <p>
          En caso de suspensión o rescisión de la cuenta del Chef por incumplimiento de las presentes Condiciones, los importes
          ya abonados por VIP o Boost quedan adquiridos por Chefs Talents. No se podrá reclamar ningún reembolso, prorrata ni
          haber por este motivo.
        </p>
      </section>

      <section id="sec-11">
        <h2>11. Transmisión de misión a la red</h2>
        <p>
          Si una misión entra en el perímetro Chefs Talents y el Chef se encuentra incapacitado para honrarla (agenda saturada,
          indisponibilidad, formato fuera de zona, restricciones incompatibles), el Chef puede transmitir esta misión a la red
          Chefs Talents mediante la funcionalidad dedicada de su panel de control («Proponer una misión»).
        </p>
        <h3>11.1 Comisión de transmisión</h3>
        <p>
          Si la misión así transmitida es ejecutada por otro Chef de la red, el Chef de origen percibe una comisión del
          <strong> 5 % del importe HT total de la misión ejecutada</strong>, abonada por Chefs Talents al final de la
          ejecución efectiva por parte del Chef que la asumió.
        </p>
        <h3>11.2 Marco contractual y NCC dedicado</h3>
        <p>
          Toda transmisión de misión a la red se acompaña de la firma de un Acuerdo de No Circunvención y Confidencialidad
          dedicado («NCC propose-mission») entre las cuatro partes implicadas: (i) el Chef de origen, (ii) el Chef ejecutante,
          (iii) el cliente final, (iv) Chefs Talents.
        </p>
        <p>
          Este NCC garantiza durante <strong>veinticuatro (24) meses</strong> a partir del fin de la misión que ninguna de
          las partes signatarias podrá eludir el circuito para entablar directamente una relación comercial con otra parte
          sin abonar al Chef de origen la comisión del 5 % que le corresponde.
        </p>
        <p>
          En caso de violación de este NCC, la indemnización a tanto alzado prevista en el artículo 12.3 a continuación se
          aplica en favor del Chef de origen en condiciones idénticas a las aplicables a Chefs Talents.
        </p>
      </section>

      <section id="sec-12">
        <h2>12. Confidencialidad y no circunvención</h2>
        <h3>12.1 Confidencialidad</h3>
        <p>
          El Chef reconoce que toda la información a la que accede en el marco de su inscripción y de sus misiones vía
          Chefs Talents (incluyendo en particular: identidad de clientes, conciergeries, lugares, presupuestos, hábitos,
          restricciones logísticas, intercambios, documentos, menús, datos de contacto) tiene carácter estrictamente confidencial.
        </p>
        <p>
          El Chef se compromete a no divulgar ninguna de estas informaciones a terceros, salvo acuerdo escrito previo de
          Chefs Talents u obligación legal.
        </p>
        <h3>12.2 No circunvención</h3>
        <p>
          El Chef se prohíbe formalmente, durante toda la duración de su colaboración con Chefs Talents y por un período de
          <strong> veinticuatro (24) meses</strong> tras la última misión:
        </p>
        <ul>
          <li>contratar directamente con un cliente, conciergerie, armador o cualquier entidad presentada por Chefs Talents;</li>
          <li>aceptar una misión similar o equivalente con dichas partes fuera del marco de Chefs Talents;</li>
          <li>utilizar las informaciones obtenidas vía Chefs Talents con fines personales o competidores;</li>
          <li>solicitar, transmitir o divulgar a terceros los datos de contacto de un cliente, conciergerie o armador presentado por Chefs Talents.</li>
        </ul>
        <p>Cualquier intento de circunvención, directo o indirecto, se considerará un incumplimiento grave.</p>
        <h3>12.3 Sanciones</h3>
        <p>En caso de violación demostrada de las obligaciones de confidencialidad o no circunvención:</p>
        <ul>
          <li>Chefs Talents se reserva el derecho de suspender o rescindir inmediatamente el acceso del Chef a la plataforma;</li>
          <li>cualquier misión en curso podrá ser cancelada;</li>
          <li>el Chef adeudará a Chefs Talents una <strong>indemnización a tanto alzado igual al 30 % del importe HT total de la misión circunvalada o 30 000 €, el más alto de ambos importes</strong>, sin perjuicio de cualquier daño complementario que Chefs Talents pueda demostrar.</li>
        </ul>
        <p>
          Esta indemnización es inmediatamente exigible desde la constatación de la violación y pagadera en un plazo de
          quince (15) días desde la notificación.
        </p>
      </section>

      <section id="sec-13">
        <h2>13. Datos personales y comunicación</h2>
        <p>
          El Chef autoriza a Chefs Talents a utilizar los elementos de su perfil (fotos, biografía, experiencias, idiomas,
          especialidades) con fines de presentación a los clientes y de promoción en chefstalents.com y sus redes afiliadas
          (salvo oposición escrita previa del Chef).
        </p>
        <p>
          Los datos personales del Chef se tratan en el marco del Reglamento Europeo RGPD. Las modalidades completas
          (finalidades, duraciones de conservación, subcontratistas, transferencias fuera de la UE, derechos del Chef) se
          describen en la política de privacidad accesible en <a href="/privacy">chefstalents.com/privacy</a>.
        </p>
        <p>
          Para cualquier solicitud relativa a sus datos (acceso, rectificación, supresión, oposición, portabilidad), el Chef
          puede escribir a <a href="mailto:privacy@chefstalents.com">privacy@chefstalents.com</a>.
        </p>
      </section>

      <section id="sec-14">
        <h2>14. Suspensión y rescisión</h2>
        <p>Chefs Talents puede suspender o rescindir el acceso de un Chef:</p>
        <ul>
          <li>en caso de incumplimiento de las presentes Condiciones;</li>
          <li>en caso de feedback negativo repetido por parte de los clientes o conducta inapropiada;</li>
          <li>en caso de indisponibilidad prolongada no comunicada;</li>
          <li>para preservar la calidad de la red y el interés de los clientes.</li>
        </ul>
        <p>
          El Chef puede solicitar la supresión de su cuenta en cualquier momento mediante simple mensaje escrito a
          <a href="mailto:contact@chefstalents.com"> contact@chefstalents.com</a>. Esta supresión no extingue las obligaciones
          posteriores a la colaboración previstas en el artículo 12 (confidencialidad, no circunvención).
        </p>
      </section>

      <section id="sec-15">
        <h2>15. Modificación de las Condiciones</h2>
        <p>
          Chefs Talents puede modificar las presentes Condiciones para adaptarlas a la evolución de la plataforma, de la ley
          aplicable o de las prácticas del mercado. Toda modificación sustancial será notificada al Chef con un plazo razonable
          de toma de conocimiento, y dará lugar a una nueva aceptación explícita en la siguiente conexión. A falta de aceptación,
          la cuenta del Chef podrá ser suspendida.
        </p>
      </section>

      <section id="sec-16">
        <h2>16. Derecho aplicable y jurisdicción</h2>
        <p>Las presentes Condiciones se rigen por el derecho francés.</p>
        <p>
          En caso de litigio, y a falta de resolución amistosa en un plazo de treinta (30) días desde la primera notificación
          escrita, las Partes convienen la <strong>competencia exclusiva de los tribunales de Burdeos</strong>.
        </p>
      </section>

      <section id="sec-17">
        <h2>17. Aceptación</h2>
        <p>El Chef reconoce haber leído, comprendido y aceptado sin reservas las presentes Condiciones de Colaboración.</p>
      </section>
    </div>
  );
}
