'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';

const CURRENT_TERMS_VERSION = '08/05/2026';
const LS_TERMS_KEY = `ct_chef_terms_v_${CURRENT_TERMS_VERSION}`;

export default function TermsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/chef/dashboard';

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => 'Conditions de collaboration – Chefs', []);

  const accept = async () => {
    setErr(null);

    if (!checked) {
      setErr("Merci de cocher la case d’acceptation.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) {
        router.replace('/chef/login');
        return;
      }

      const res = await fetch('/api/chef/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          userId,
          version: CURRENT_TERMS_VERSION,
          accepted: true,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'ACCEPT_FAIL');
      }

      // UX fallback
      try {
        localStorage.setItem(LS_TERMS_KEY, '1');
      } catch {}

      router.replace(next);
    } catch {
      setErr("Impossible d’enregistrer l’acceptation. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-stone-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-stone-200 bg-white shadow-sm p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-stone-400">
            Chefs Talents
          </div>

          <h1 className="mt-2 text-3xl md:text-4xl font-serif">
            {title}
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Dernière mise à jour : {CURRENT_TERMS_VERSION}
          </p>

{/* ===================== CONDITIONS ===================== */}
<div className="mt-8 prose prose-stone max-w-none">

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

  <hr />

  <h2>2. Statut du Chef et indépendance</h2>
  <p>
    Le Chef déclare exercer son activité en qualité de professionnel indépendant (auto-entrepreneur, micro-entreprise,
    société commerciale, équivalent étranger).
  </p>
  <p>À ce titre, le Chef garantit :</p>
  <ul>
    <li>être seul responsable de ses obligations fiscales, sociales et déclaratives ;</li>
    <li>disposer de toutes les autorisations légales requises pour exercer son activité ;</li>
    <li>être titulaire d’une assurance responsabilité civile professionnelle en cours de validité, dont une attestation
      pourra être demandée à tout moment ;</li>
    <li>maîtriser les règles d’hygiène et de sécurité alimentaire applicables aux prestations qu’il exécute.</li>
  </ul>

  <h3>2.1 Absence de lien de subordination</h3>
  <p>
    Le Chef intervient en tant que prestataire indépendant. Il est expressément convenu que :
  </p>
  <ul>
    <li>le Chef n’est pas salarié de Chefs Talents ;</li>
    <li>le Chef n’est pas salarié du client final auprès duquel il exécute la prestation commandée par Chefs Talents ;</li>
    <li>aucune relation de subordination, d’exclusivité ni de dépendance juridique ne peut être caractérisée entre le Chef et Chefs Talents ;</li>
    <li>le Chef demeure libre d’accepter ou de refuser toute mission proposée par Chefs Talents ;</li>
    <li>le Chef demeure libre d’exercer son activité en dehors de Chefs Talents, sous réserve du respect des obligations
      de confidentialité et de non-contournement prévues aux présentes.</li>
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
    <li>Chefs Talents n’est ni employeur, ni co-employeur, ni responsable des obligations sociales, fiscales ou
      contractuelles liées à ce contrat ;</li>
    <li>le Chef garantit, le cas échéant, être titulaire des certifications requises pour ce type de mission, notamment
      la certification STCW Basic Safety Training, l’examen médical ENG1 (ou équivalent en cours de validité), et le
      respect des standards de la convention MLC 2006 ;</li>
    <li>le Chef s’engage à fournir copie de ces certifications à Chefs Talents avant l’embarquement.</li>
  </ul>

  <hr />

  <h2>3. Processus de sélection et statuts du profil</h2>
  <p>
    L’accès à la plateforme Chefs Talents est soumis à validation. Le profil du Chef évolue successivement entre les
    statuts suivants :
  </p>
  <ol>
    <li>
      <strong>En validation</strong> : profil créé, en cours d’examen par l’équipe Chefs Talents (étude du dossier,
      parcours, références, positionnement, vérification éventuelle des certifications).
    </li>
    <li>
      <strong>Approuvé</strong> : profil validé, en attente d’activation après acceptation des présentes Conditions et
      complétion du dossier (photo, bio, expériences, langues, contraintes, justificatifs).
    </li>
    <li>
      <strong>Actif</strong> : profil visible dans les sélections envoyées aux clients et conciergeries, éligible à
      recevoir des propositions de mission.
    </li>
    <li>
      <strong>En pause</strong> : profil temporairement retiré des sélections (à la demande du Chef ou à l’initiative
      de Chefs Talents en cas de manquement, d’indisponibilité prolongée ou de retour client négatif justifiant un
      examen complémentaire).
    </li>
  </ol>
  <p>
    Chefs Talents se réserve le droit de refuser une candidature sans justification, de demander des compléments
    d’information ou justificatifs, de suspendre ou retirer un profil. L’inscription du Chef ne constitue en aucun cas
    une garantie d’attribution de missions, de volume ou de fréquence.
  </p>

  <hr />

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

  <hr />

  <h2>5. Modalités de paiement du Chef</h2>

  <h3>5.1 Acompte à la signature</h3>
  <p>
    À la signature du contrat de mission, Chefs Talents verse au Chef un acompte de <strong>quinze pour cent (15 %)
    du montant HT</strong> de la mission, sécurisant la mobilisation du Chef sur les dates convenues.
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
  <p>
    Tout retard de facturation imputable au Chef pourra reporter d’autant la date de paiement du solde.
  </p>

  <h3>5.3 Mode de règlement</h3>
  <p>
    Les règlements sont effectués par virement bancaire sur le compte communiqué par le Chef. Le Chef est seul
    responsable de l’exactitude des coordonnées bancaires fournies.
  </p>

  <hr />

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
    <li>l’obligation de transmettre l’intégralité des justificatifs (tickets, factures) sous 48 heures suivant la fin
      de mission ;</li>
    <li>la déduction automatique sur la rémunération du Chef de toute dépense non justifiée ou non autorisée ;</li>
    <li>la propriété de Chefs Talents sur tout reliquat non utilisé en fin de mission ;</li>
    <li>la désactivation systématique de la carte au dernier jour de mission, sauf accord écrit contraire.</li>
  </ul>
  <p>
    L’usage frauduleux ou détourné d’une carte de mission entraîne sa désactivation immédiate, la déduction des
    sommes concernées sur la rémunération du Chef et la fin de la collaboration, sans préjudice des poursuites
    judiciaires applicables.
  </p>

  <hr />

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

  <hr />

  <h2>8. Annulations et manquements</h2>

  <h3>8.1 Annulation par le client</h3>
  <p>
    En cas d’annulation de la mission par le client après signature du contrat, l’acompte de 15 % reste acquis au
    Chef à titre d’indemnité forfaitaire pour mobilisation des dates.
  </p>

  <h3>8.2 Annulation par le Chef</h3>
  <p>Toute annulation par le Chef doit être immédiatement signalée à Chefs Talents. En cas d’annulation :</p>
  <ul>
    <li>plus de 48 heures avant le début de la mission, sans motif légitime : Chefs Talents peut suspendre temporairement
      le compte ou limiter l’accès aux futures missions ;</li>
    <li>moins de 48 heures avant le début de la mission, sans motif légitime : l’acompte versé devra être restitué
      et une pénalité pourra être appliquée à hauteur du préjudice subi par Chefs Talents et le client.</li>
  </ul>

  <h3>8.3 Annulation grave (no-show / moins de 24 heures)</h3>
  <p>Toute annulation à moins de 24 heures sans justification valable, ou sans communication, entraîne :</p>
  <ul>
    <li>l’exclusion immédiate et définitive de la plateforme dès la première occurrence ;</li>
    <li>l’obligation de restitution intégrale de l’acompte versé ;</li>
    <li>le droit pour Chefs Talents de réclamer réparation au titre du préjudice client et du préjudice commercial.</li>
  </ul>

  <hr />

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

  <hr />

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
    <li><strong>VIP 12 mois</strong> : 40 € HT / mois (480 € HT en règlement unique anticipé) ;
      cette formule inclut un appel de positionnement avec l’équipe Chefs Talents (engagement ferme).</li>
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
    <li>le Boost <strong>ne garantit pas l’attribution de missions</strong> ; il garantit une visibilité accrue du
      profil sur les demandes des partenaires Chefs Talents pendant la période active ;</li>
    <li>le Boost est <strong>non remboursable</strong> une fois activé, y compris en l’absence de mission attribuée
      pendant la période ;</li>
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

  <hr />

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

  <hr />

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
    <li>solliciter, transmettre ou divulguer à un tiers les coordonnées d’un client, d’une conciergerie ou d’un armateur
      présenté par Chefs Talents.</li>
  </ul>
  <p>Toute tentative de contournement, directe ou indirecte, sera considérée comme un manquement grave.</p>

  <h3>12.3 Sanctions</h3>
  <p>En cas de violation avérée des obligations de confidentialité ou de non-contournement :</p>
  <ul>
    <li>Chefs Talents se réserve le droit de suspendre ou résilier immédiatement l’accès du Chef à la plateforme ;</li>
    <li>toute mission en cours pourra être annulée ;</li>
    <li>le Chef sera redevable envers Chefs Talents d’une <strong>indemnité forfaitaire égale à 30 % du montant HT
      total de la mission contournée ou 30 000 €, le plus élevé des deux montants</strong>, sans préjudice de tout
      dommage complémentaire que Chefs Talents pourrait démontrer.</li>
  </ul>
  <p>
    Cette indemnité est immédiatement exigible dès la constatation de la violation et payable dans un délai de
    quinze (15) jours à compter de la notification.
  </p>

  <hr />

  <h2>13. Données personnelles et communication</h2>
  <p>
    Le Chef autorise Chefs Talents à utiliser les éléments de son profil (photos, biographie, expériences, langues,
    spécialités) à des fins de présentation aux clients et à des fins de promotion sur le site
    chefstalents.com et ses réseaux affiliés (sauf opposition écrite préalable du Chef).
  </p>
  <p>
    Les données personnelles du Chef sont traitées dans le cadre du règlement européen RGPD. Les modalités complètes
    (finalités, durées de conservation, sous-traitants, transferts hors UE, droits du Chef) sont décrites dans la
    politique de confidentialité accessible à l’adresse{' '}
    <a href="/privacy">chefstalents.com/privacy</a>.
  </p>
  <p>
    Pour toute demande relative à ses données (accès, rectification, effacement, opposition, portabilité), le Chef
    peut écrire à <a href="mailto:privacy@chefstalents.com">privacy@chefstalents.com</a>.
  </p>

  <hr />

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

  <hr />

  <h2>15. Modification des Conditions</h2>
  <p>
    Chefs Talents peut modifier les présentes Conditions afin de les adapter à l’évolution de la plateforme, de la loi
    applicable ou des pratiques du marché. Toute modification substantielle fera l’objet d’une notification au Chef
    avec un délai de prise de connaissance, et donnera lieu à une nouvelle acceptation explicite à la prochaine
    connexion. À défaut d’acceptation, le compte du Chef pourra être suspendu.
  </p>

  <hr />

  <h2>16. Droit applicable et juridiction</h2>
  <p>Les présentes Conditions sont régies par le droit français.</p>
  <p>
    En cas de litige, et à défaut de résolution amiable dans un délai de trente (30) jours à compter de la première
    notification écrite, les Parties conviennent de la <strong>compétence exclusive des tribunaux de Bordeaux</strong>.
  </p>

  <hr />

  <h2>17. Acceptation</h2>
  <p>
    Le Chef reconnaît avoir lu, compris et accepté sans réserve les présentes Conditions de Collaboration.
  </p>

</div>
{/* ===================== FIN CONDITIONS ===================== */}

          <div className="mt-10 border-t border-stone-200 pt-6 space-y-4">
            <label className="flex items-start gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1"
              />
              <span>J’ai lu et j’accepte les Conditions de Collaboration Chefs Talents.</span>
            </label>

            {err ? <div className="text-sm text-red-600">{err}</div> : null}

            <button
              onClick={accept}
              disabled={loading || !checked}
              className="w-full rounded-2xl bg-stone-900 text-white py-3 font-medium hover:bg-stone-800 disabled:opacity-40"
            >
              {loading ? 'Enregistrement…' : 'Accepter et continuer'}
            </button>

            <div className="text-xs text-stone-400">
              Version en vigueur : {CURRENT_TERMS_VERSION}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
