'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Section, Label, Marker } from '@/components/ui';

type Lang = 'fr' | 'en';

export default function ConditionsPage() {
  const [lang, setLang] = useState<Lang>('fr');
  const isFR = lang === 'fr';

  return (
    <Layout>
      <Section className="bg-paper pt-32">
        <div className="max-w-4xl mx-auto px-6">
          {/* Language switch */}
          <div className="flex justify-end mb-12">
            <div className="inline-flex border border-stone-200">
              <button
                onClick={() => setLang('fr')}
                className={`px-4 py-2 text-xs uppercase tracking-widest ${
                  isFR ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-4 py-2 text-xs uppercase tracking-widest ${
                  !isFR ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="mb-20">
            <Marker />
            <Label>{isFR ? 'Informations légales' : 'Legal information'}</Label>

            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mt-6 mb-6">
              {isFR ? 'Conditions d’utilisation & Conditions de vente' : 'Terms of Use & Terms of Sale'}
            </h1>

            <p className="text-stone-500 font-light">
              {isFR ? 'Dernière mise à jour' : 'Last updated'} : <strong>{isFR ? 'mai 2026' : 'May 2026'}</strong>
            </p>
          </div>

          {/* Sommaire */}
          <div className="border border-stone-200 p-6 mb-20 bg-stone-50">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">
              {isFR ? 'Sommaire' : 'Contents'}
            </p>
            <ul className="space-y-2 text-stone-700">
              <li>
                <a href="#cgu" className="hover:underline">
                  → {isFR ? 'Conditions Générales d’Utilisation (CGU)' : 'Terms of Use (TOU)'}
                </a>
              </li>
              <li>
                <a href="#cgv" className="hover:underline">
                  → {isFR ? 'Conditions Générales de Vente (CGV)' : 'Terms of Sale (TOS)'}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:underline">
                  → {isFR ? 'Contact' : 'Contact'}
                </a>
              </li>
            </ul>
          </div>

          {/* CGU */}
<div id="cgu" className="space-y-12 mb-32 scroll-mt-32">
  <h2 className="text-3xl font-serif text-stone-900">
    {isFR ? "Conditions Générales d’Utilisation" : 'Terms of Use'}
  </h2>

  {isFR ? (
    <div className="space-y-10 text-stone-600 font-light leading-relaxed">
      <section className="space-y-3">
        <p className="text-stone-900 font-medium">1. Objet</p>
        <p>
          Les présentes Conditions Générales d’Utilisation (ci-après les « CGU ») ont pour objet de définir les modalités
          d’accès et d’utilisation du site Chefs Talents (ci-après la « Plateforme »).
        </p>
        <p>
          La Plateforme met en relation : (i) des chefs indépendants, (ii) des clients privés, (iii) des conciergeries,
          sociétés ou gestionnaires de biens, dans le cadre de prestations culinaires privées, ponctuelles ou de longue durée.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">2. Définitions</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Plateforme</strong> : le site Chefs Talents et ses fonctionnalités.</li>
          <li><strong>Utilisateur</strong> : toute personne naviguant ou utilisant la Plateforme.</li>
          <li><strong>Client</strong> : utilisateur déposant une demande de prestation (particulier ou professionnel).</li>
          <li><strong>Chef</strong> : professionnel indépendant référencé ou candidat au référencement.</li>
          <li><strong>Demande</strong> : brief soumis par un Client (lieu, dates, format, budget, contraintes).</li>
          <li><strong>Mise en relation</strong> : présentation, introduction, transmission d’un profil ou de coordonnées, ou tout échange initié via Chefs Talents.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">3. Accès à la Plateforme</p>
        <p>
          L’accès à la Plateforme est libre pour les visiteurs. Certaines fonctionnalités (création de compte, dépôt de
          demande, accès à un espace professionnel, consultation avancée) nécessitent la création d’un compte et la fourniture
          d’informations exactes, complètes et à jour.
        </p>
        <p>
          Chefs Talents se réserve le droit de refuser, suspendre ou supprimer l’accès à tout Utilisateur ne respectant pas les
          présentes CGU ou portant atteinte au bon fonctionnement de la Plateforme.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">4. Création de compte & sécurité</p>
        <p>
          L’Utilisateur est responsable de la confidentialité de ses identifiants et de toute activité effectuée depuis son
          compte. En cas de suspicion d’accès non autorisé, l’Utilisateur doit en informer Chefs Talents dans les meilleurs
          délais.
        </p>
        <p>
          Chefs Talents peut mettre en œuvre des mesures de sécurité (vérification d’email, double validation, limitation des accès,
          dispositifs anti-abus) afin de protéger les Utilisateurs et l’intégrité de la Plateforme.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">5. Rôle de Chefs Talents</p>
        <p>
          Chefs Talents (SASU Chefs Talents, SIRET 89832072600026, siège 73 rue Porte Dijeaux, 33000 Bordeaux)
          agit en qualité de <strong>vendeur en nom propre</strong> de la prestation culinaire commandée par le Client.
          Chefs Talents :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>vend la prestation au Client en son nom et pour son compte ;</li>
          <li>confie l’exécution matérielle de la prestation à un Chef indépendant qu’elle a sélectionné et avec lequel elle a négocié les conditions ;</li>
          <li>n’emploie pas les Chefs référencés, qui interviennent comme prestataires indépendants pour le compte de Chefs Talents ;</li>
          <li>n’intervient pas dans la réalisation culinaire elle-même, mais demeure l’interlocuteur contractuel du Client.</li>
        </ul>
        <p>
          Le contrat de prestation est conclu entre le Client et Chefs Talents. Le Chef qui exécute la prestation est lié à
          Chefs Talents par un contrat de mission distinct, sans relation contractuelle directe avec le Client. Chefs Talents
          engage sa propre responsabilité commerciale vis-à-vis du Client pour la conformité de la prestation.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">6. Comptes chefs, sélection & validation</p>
        <p>
          L’inscription d’un Chef sur la Plateforme ne vaut ni validation automatique, ni garantie de mission. Chefs Talents se
          réserve le droit de :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>sélectionner les profils selon ses critères internes ;</li>
          <li>demander des compléments d’information ou justificatifs ;</li>
          <li>refuser, suspendre ou retirer un profil, notamment en cas d’informations inexactes ou de manquements constatés.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">7. Obligations des Utilisateurs</p>
        <p>En utilisant la Plateforme, l’Utilisateur s’engage notamment à :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>fournir des informations exactes, sincères et à jour ;</li>
          <li>ne pas usurper l’identité d’un tiers ;</li>
          <li>ne pas détourner la Plateforme (scraping, extraction massive, contournement de process, etc.) ;</li>
          <li>respecter la confidentialité des informations reçues (profils, coordonnées, conditions, etc.) ;</li>
          <li>ne pas porter atteinte à l’image, aux droits ou à la sécurité de Chefs Talents, des Clients ou des Chefs ;</li>
          <li>se comporter de manière loyale et professionnelle dans les échanges.</li>
        </ul>
      </section>

      {/* ✅ NEW: Anti-contournement */}
      <section className="space-y-3">
        <p className="text-stone-900 font-medium">8. Anti-contournement & loyauté de la mise en relation</p>
        <p>
          Afin de préserver la qualité du réseau et le rôle de tiers de confiance, tout Utilisateur s’interdit de contourner la
          Plateforme. Constitue un contournement, notamment (sans que cette liste soit limitative) :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>le fait de contractualiser directement avec un Chef ou un Client présenté via Chefs Talents en dehors du process prévu ;</li>
          <li>le fait d’utiliser une mise en relation, un profil, des informations ou un brief obtenus via Chefs Talents pour organiser une mission sans Chefs Talents ;</li>
          <li>le fait de solliciter ou partager des coordonnées afin d’éviter la coordination, la sécurisation du cadre ou les frais de service.</li>
        </ul>
        <p>
          Chefs Talents peut, en cas de contournement suspecté ou avéré, limiter l’accès, suspendre un compte, refuser de futures
          mises en relation et/ou engager toute action utile pour faire cesser les manquements.
        </p>
      </section>

      {/* ✅ NEW: Confidentialité UHNW */}
      <section className="space-y-3">
        <p className="text-stone-900 font-medium">9. Confidentialité & standards UHNW</p>
        <p>
          Les missions gérées via Chefs Talents impliquent souvent des lieux, calendriers et clients sensibles (villas, chalets,
          yachts, séjours privés). Par conséquent, les Utilisateurs s’engagent à une confidentialité stricte, notamment à :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>ne pas divulguer l’identité des Clients, adresses, localisations précises, dates, habitudes ou informations de sécurité ;</li>
          <li>ne pas publier de contenus (photos/vidéos) liés à une mission sans autorisation préalable expresse du Client ;</li>
          <li>ne pas partager les profils, conditions et documents reçus via Chefs Talents à des tiers non autorisés.</li>
        </ul>
        <p>
          Toute violation de confidentialité pourra entraîner une suspension immédiate du compte et l’exclusion du réseau,
          sans préjudice des actions éventuelles.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">10. Exactitude des informations</p>
        <p>
          Chefs Talents ne saurait être tenu responsable des conséquences liées à des informations erronées, incomplètes ou
          trompeuses fournies par un Utilisateur (Chef ou Client). Chefs Talents peut effectuer des vérifications, sans que cela
          ne constitue une obligation générale de contrôle.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">11. Propriété intellectuelle</p>
        <p>
          L’ensemble des contenus présents sur la Plateforme (textes, images, logos, marques, structure, design) est protégé
          par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est
          strictement interdite.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">12. Données personnelles</p>
        <p>
          Les données personnelles sont traitées conformément à la réglementation en vigueur (RGPD). Les Utilisateurs
          disposent d’un droit d’accès, de rectification et de suppression en écrivant à{' '}
          <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">
            contact@chefstalents.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">13. Disponibilité de la Plateforme</p>
        <p>
          Chefs Talents s’efforce d’assurer l’accès à la Plateforme, sans garantie d’absence d’interruptions (maintenance,
          mise à jour, incidents techniques). Chefs Talents pourra suspendre l’accès pour des raisons de sécurité ou
          d’amélioration, dans la mesure du possible.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">14. Liens, contenus externes</p>
        <p>
          La Plateforme peut contenir des liens vers des sites ou services tiers. Chefs Talents n’exerce aucun contrôle sur ces
          contenus et décline toute responsabilité quant à leur disponibilité ou leurs pratiques.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">15. Responsabilité</p>
        <p>
          Chefs Talents agit en qualité de vendeur en nom propre de la prestation et engage sa responsabilité
          commerciale vis-à-vis du Client uniquement sur la mise à disposition d’un Chef qualifié et la conformité
          au cahier des charges convenu. Le détail (périmètre, exclusions, plafond, traitement des dommages) est
          défini à l’article 7 des CGV.
        </p>
        <p>
          Les Chefs sont des professionnels indépendants intervenant sous leur propre responsabilité civile
          professionnelle. <strong>Chefs Talents n’est en aucun cas garante des dommages causés par un Chef pendant
          l’exécution matérielle de la prestation</strong>, qui relèvent de la responsabilité personnelle du Chef
          et de son assurance.
        </p>
        <p>Chefs Talents ne saurait par ailleurs être tenue responsable :</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>des cas de force majeure tels que définis à l’article 9 des CGV ;</li>
          <li>des conséquences liées à des informations erronées, incomplètes ou trompeuses fournies par le Client (allergies, contraintes médicales, dates, lieu, accès, équipements) ;</li>
          <li>des dommages causés par le Client à ses propres équipements, installations ou tiers présents pendant la prestation.</li>
        </ul>
      </section>

      {/* ✅ NEW: Sanctions */}
      <section className="space-y-3">
        <p className="text-stone-900 font-medium">16. Suspension, sanctions, suppression</p>
        <p>
          En cas de manquement aux présentes CGU (notamment contournement, fraude, abus, atteinte à la confidentialité,
          comportements inappropriés), Chefs Talents pourra, sans préavis si nécessaire :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>suspendre ou limiter l’accès à la Plateforme ;</li>
          <li>retirer un profil, masquer des informations ou refuser une demande ;</li>
          <li>supprimer un compte ;</li>
          <li>conserver les éléments techniques nécessaires à la prévention des abus et à la preuve des manquements.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">17. Preuve & communications</p>
        <p>
          Les enregistrements informatiques (emails, logs, horodatages, confirmations) conservés par Chefs Talents pourront
          constituer des éléments de preuve, sauf preuve contraire. L’Utilisateur accepte de recevoir des communications liées
          au service (emails transactionnels, notifications) nécessaires au fonctionnement de la Plateforme.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">18. Modification des CGU</p>
        <p>
          Chefs Talents peut modifier les présentes CGU afin de les adapter à l’évolution de la Plateforme, de la loi ou des
          pratiques. La date de « dernière mise à jour » fait foi. En cas de désaccord, l’Utilisateur doit cesser d’utiliser
          la Plateforme.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-stone-900 font-medium">19. Droit applicable et juridiction</p>
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable dans un délai
          de trente (30) jours à compter de la première notification écrite, les Parties conviennent de la compétence exclusive
          des tribunaux de Bordeaux.
        </p>
      </section>
    </div>
  ) : (
    <div className="space-y-6 text-stone-600 font-light leading-relaxed">
      <p>
        English version will be added shortly. For now, please refer to the French version which is the legally binding
        reference.
      </p>
    </div>
  )}
</div>

          {/* CGV */}
          <div id="cgv" className="space-y-12 mb-32 scroll-mt-32">
            <h2 className="text-3xl font-serif text-stone-900">
              {isFR ? 'Conditions Générales de Vente' : 'Terms of Sale'}
            </h2>

            {isFR ? (
              <div className="space-y-10 text-stone-600 font-light leading-relaxed">
                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">1. Champ d’application</p>
                  <p>
                    Les présentes Conditions Générales de Vente (ci-après les « CGV ») régissent toute commande passée via
                    la plateforme Chefs Talents par un client particulier ou professionnel (ci-après le « Client »).
                  </p>
                  <p>
                    Toute validation de commande implique l’acceptation pleine et entière des présentes CGV, sans réserve.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">2. Nature et rôle de Chefs Talents</p>
                  <p>
                    <strong>SASU Chefs Talents</strong>, immatriculée au RCS de Bordeaux sous le SIRET 89832072600026,
                    siège 73 rue Porte Dijeaux 33000 Bordeaux, agit en qualité de <strong>vendeur en nom propre</strong>
                    {' '}de la prestation culinaire commandée par le Client.
                  </p>
                  <p>À ce titre, Chefs Talents :</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>analyse le besoin exprimé par le Client et formalise le périmètre de la prestation ;</li>
                    <li>sélectionne le ou les Chefs adaptés et négocie avec eux le budget de leur intervention ;</li>
                    <li>vend la prestation au Client à un prix incluant la marge commerciale de Chefs Talents et la TVA applicable ;</li>
                    <li>confie l’exécution au Chef sélectionné, qui intervient en qualité de prestataire indépendant pour le compte de Chefs Talents ;</li>
                    <li>demeure l’interlocuteur contractuel du Client tout au long de la mission.</li>
                  </ul>
                  <p>
                    Le contrat de prestation est conclu entre le Client et Chefs Talents. Le Chef qui exécute la prestation
                    est lié à Chefs Talents par un contrat de mission distinct, sans relation contractuelle directe avec
                    le Client. Chefs Talents engage sa propre responsabilité commerciale pour la conformité de la prestation.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">3. Processus de réservation</p>
                  <p>Le processus de réservation s’effectue selon les étapes suivantes :</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Le Client soumet une demande détaillée via la Plateforme.</li>
                    <li>Chefs Talents analyse le besoin et les contraintes.</li>
                    <li>Une sélection de chefs disponibles est proposée.</li>
                    <li>Le Client choisit le chef.</li>
                    <li>Les conditions opérationnelles et financières sont validées.</li>
                    <li>Le paiement requis déclenche la confirmation de la mission.</li>
                  </ol>
                  <p>
                    Aucune mission n’est considérée comme confirmée tant que le paiement applicable n’a pas été effectué.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">4. Tarification et modalités de paiement</p>

                  <div className="space-y-2">
                    <p className="text-stone-900 font-medium">4.1 Tarification</p>
                    <p>
                      Le prix facturé au Client est exprimé toutes taxes comprises (TTC). Il inclut la prestation
                      culinaire convenue, la marge commerciale de Chefs Talents et la TVA française au taux applicable.
                      Pour les missions à l’étranger, les règles de TVA spécifiques sont précisées dans le contrat de
                      mission signé entre les parties.
                    </p>
                    <p>
                      Le prix est ferme et définitif une fois le contrat de mission signé, sauf modification écrite du
                      périmètre acceptée par les deux parties.
                    </p>
                  </div>

                  <div className="space-y-2 mt-6">
                    <p className="text-stone-900 font-medium">4.2 Missions inférieures à 30 000 € TTC et d’une durée maximale de 10 semaines</p>
                    <p>
                      Pour toute mission dont le montant est inférieur à 30 000 € TTC <strong>et</strong> dont la durée
                      n’excède pas dix (10) semaines consécutives, le règlement intégral du montant TTC est exigé à la
                      commande pour confirmer la mission. À défaut de paiement intégral, la mission n’est pas réputée
                      confirmée et le Chef n’est pas mobilisé.
                    </p>
                  </div>

                  <div className="space-y-2 mt-6">
                    <p className="text-stone-900 font-medium">4.3 Missions de 30 000 € TTC ou plus, ou de plus de 10 semaines</p>
                    <p>
                      Pour toute mission dont le montant est égal ou supérieur à 30 000 € TTC <strong>ou</strong> dont la
                      durée excède dix (10) semaines consécutives, le Client règle selon le calendrier suivant, sauf
                      stipulation contraire dans le contrat de mission spécifique :
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>un <strong>acompte de 60 %</strong> à la réservation, pour bloquer les dates et activer le Chef ;</li>
                      <li>le <strong>solde de 40 %</strong> au plus tard <strong>48 heures</strong> avant le début de la mission.</li>
                    </ul>
                    <p>
                      Pour les missions saisonnières d’une durée supérieure ou égale à six (6) semaines, un échelonnement
                      mensuel à terme échu peut être formalisé dans le contrat de mission spécifique, par accord exprès
                      entre les parties.
                    </p>
                  </div>

                  <div className="space-y-2 mt-6">
                    <p className="text-stone-900 font-medium">4.4 Carte de mission (avance courses)</p>
                    <p>
                      Pour certaines missions, Chefs Talents alloue au Chef une carte de paiement dédiée pour les courses
                      alimentaires et matières premières. Le budget de cette carte est distinct du prix de la prestation
                      et peut faire l’objet d’une avance complémentaire prélevée auprès du Client à la commande, dont le
                      montant est précisé dans le contrat de mission.
                    </p>
                  </div>

                  <div className="space-y-2 mt-6">
                    <p className="text-stone-900 font-medium">4.5 Moyens de paiement</p>
                    <p>
                      Les paiements sont effectués par virement bancaire SEPA ou carte bancaire via une plateforme de
                      paiement sécurisée. Les coordonnées de règlement sont communiquées au Client à la commande.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">5. Annulation par le Client</p>
                  <p>
                    Le barème précis applicable à chaque mission est défini dans le contrat de mission signé pour cette
                    mission. À défaut de stipulation contraire, le barème suivant s’applique à toute annulation à
                    l’initiative du Client :
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>annulation à <strong>7 jours ou plus avant le début</strong> de la mission : <strong>25 %</strong> du montant TTC retenu à titre d’indemnité forfaitaire ;</li>
                    <li>annulation <strong>dans les 6 jours précédant le début</strong> de la mission, no-show, ou en cours de mission : <strong>50 %</strong> du montant TTC retenu.</li>
                  </ul>
                  <p>
                    Ces retenues couvrent les engagements pris par Chefs Talents et le Chef (mobilisation des dates,
                    organisation, achats déjà engagés, manque à gagner) et ne peuvent faire l’objet d’une contestation
                    fondée sur l’absence d’exécution effective de la prestation, l’annulation étant le fait du Client.
                  </p>
                  <p>
                    En cas de force majeure dûment caractérisée affectant le Client, les modalités sont étudiées au
                    cas par cas dans le respect du droit français.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">6. Annulation – Chef / indisponibilité</p>
                  <p>
                    En cas d’indisponibilité du chef (désistement, empêchement, force majeure), Chefs Talents s’efforce de
                    proposer un chef de remplacement équivalent.
                  </p>
                  <p>
                    À défaut de remplacement, les modalités de remboursement ou d’ajustement sont étudiées au cas par cas,
                    selon l’état d’avancement, les coûts engagés et le cadre validé.
                  </p>
                  <p>Chefs Talents est tenu à une obligation de moyens, et non de résultat.</p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">7. Responsabilité de Chefs Talents et du Chef</p>

                  <p className="text-stone-900 font-medium">7.1 Périmètre de responsabilité de Chefs Talents</p>
                  <p>
                    Chefs Talents agit en qualité de vendeur en nom propre de la prestation. Elle engage sa
                    responsabilité commerciale vis-à-vis du Client <strong>uniquement</strong> sur les éléments suivants :
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>la mise à disposition d’un Chef qualifié, sélectionné, validé et assuré conformément aux Conditions de Collaboration ;</li>
                    <li>la conformité de la prestation au cahier des charges convenu (format, dates, menu, périmètre, contraintes médicales et alimentaires communiquées par le Client) ;</li>
                    <li>la coordination administrative et financière de la mission.</li>
                  </ul>

                  <p className="text-stone-900 font-medium">7.2 Statut indépendant du Chef et exclusion de garantie</p>
                  <p>
                    Le Chef est un <strong>professionnel indépendant</strong> intervenant pour le compte de Chefs
                    Talents en exécution du contrat de mission qui les lie. <strong>Il n’est ni salarié, ni mandataire,
                    ni préposé de Chefs Talents</strong>. Il agit sous sa propre responsabilité civile professionnelle,
                    dont la souscription est une condition contractuelle obligatoire vérifiée par Chefs Talents.
                  </p>
                  <p>
                    <strong>Chefs Talents n’est en aucun cas garante</strong> des dommages, préjudices ou sinistres
                    causés par le Chef pendant l’exécution matérielle de la prestation. Sont expressément exclus de la
                    responsabilité de Chefs Talents :
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>les dommages causés aux équipements, installations, mobilier ou biens du Client par le fait du Chef ;</li>
                    <li>les préjudices corporels ou matériels survenus pendant la prestation du fait du Chef ;</li>
                    <li>les manquements aux règles d’hygiène, de sécurité alimentaire ou des normes professionnelles applicables à l’exécution culinaire ;</li>
                    <li>les pertes ou détériorations de matériel, équipements ou ingrédients placés sous la garde du Chef pendant la mission.</li>
                  </ul>
                  <p>
                    Pour ces catégories de dommages, le Client est invité à faire valoir ses droits directement auprès
                    du Chef et de son assureur en responsabilité civile professionnelle. Chefs Talents fournira au Client,
                    sur simple demande, les éléments d’identification du Chef et la copie de son attestation RC Pro en
                    cours de validité.
                  </p>

                  <p className="text-stone-900 font-medium">7.3 Réclamation pour non-conformité de la prestation</p>
                  <p>
                    En cas de <strong>non-conformité de la prestation</strong> (Chef qui ne se présente pas, prestation
                    matériellement différente du cahier des charges convenu, manquement structurel à l’obligation de
                    moyens dans la mise à disposition d’un Chef qualifié), le Client adresse sa contestation par écrit
                    à Chefs Talents dans un délai de trente (30) jours après la fin de la mission.
                  </p>
                  <p>
                    La responsabilité de Chefs Talents au titre de la non-conformité est limitée au montant TTC facturé
                    pour la prestation concernée, à l’exclusion de tout dommage indirect, perte de jouissance,
                    préjudice moral non démontré, perte commerciale ou conséquence d’un cas de force majeure.
                  </p>

                  <p className="text-stone-900 font-medium">7.4 Information erronée du Client</p>
                  <p>
                    Chefs Talents ne peut être tenue responsable des préjudices résultant d’informations erronées,
                    incomplètes ou trompeuses fournies par le Client (notamment allergies, contraintes médicales,
                    accès aux lieux, présence d’animaux, équipements de cuisine, conditions de sécurité). Le Client
                    est seul garant de l’exactitude des informations transmises au moment du brief.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">8. Confidentialité</p>
                  <p>
                    Les missions réalisées via Chefs Talents peuvent concerner des clients, lieux et informations sensibles.
                    Le Client s’engage à respecter la confidentialité des profils, informations, tarifs et échanges transmis,
                    sauf accord écrit préalable.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">9. Force majeure</p>
                  <p>
                    Chefs Talents ne pourra être tenu responsable en cas de non-exécution ou de retard résultant d’un événement
                    de force majeure tel que défini par la jurisprudence française (catastrophe naturelle, restrictions
                    administratives, événements sanitaires, etc.).
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">10. Abonnements et services premium aux Chefs (VIP, Boost)</p>
                  <p>
                    Indépendamment des prestations vendues aux Clients finaux, Chefs Talents propose aux Chefs référencés
                    sur la Plateforme des produits payants destinés à améliorer leur visibilité et leur accompagnement.
                    Les présentes stipulations s’appliquent à toute souscription par un Chef à l’un de ces produits. Elles
                    complètent les Conditions de Collaboration acceptées par le Chef à son inscription.
                  </p>

                  <div className="space-y-2 mt-4">
                    <p className="text-stone-900 font-medium">10.1 Statut VIP</p>
                    <p>
                      Le statut VIP confère au Chef une priorité dans les sélections envoyées aux Clients et conciergeries,
                      un badge de visibilité et l’accès aux briefs en avant-première. Trois durées d’engagement sont
                      proposées :
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>VIP 3 mois</strong> : 59 € HT / mois (177 € HT en règlement unique anticipé).</li>
                      <li><strong>VIP 6 mois</strong> : 55 € HT / mois (330 € HT en règlement unique anticipé).</li>
                      <li><strong>VIP 12 mois</strong> : 40 € HT / mois (480 € HT en règlement unique anticipé) ; cette
                        formule inclut un appel de positionnement avec l’équipe Chefs Talents.</li>
                    </ul>
                    <p>
                      Les paiements sont effectués via Stripe. En formule mensuelle, l’abonnement est automatiquement
                      résilié à terme de l’engagement (mécanisme <em>cancel_at</em>) et ne fait l’objet d’aucun
                      renouvellement tacite.
                    </p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <p className="text-stone-900 font-medium">10.2 Boost de profil</p>
                    <p>
                      Le Boost confère au Chef une visibilité maximale et accrue de son profil dans les sélections
                      envoyées aux partenaires (Clients privés, conciergeries) pendant <strong>trente (30) jours
                      consécutifs</strong> à compter de son activation. Le profil bénéficie d’un badge « Disponible »
                      et apparaît en priorité dans les présélections correspondant à ses critères.
                    </p>
                    <p>
                      Le Boost est facturé <strong>119 € HT en paiement unique</strong> via Stripe. Il est expressément
                      précisé que :
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>le Boost <strong>ne garantit pas l’attribution de missions</strong> ; il garantit une visibilité
                        accrue du profil sur les demandes des partenaires pendant la période active ;</li>
                      <li>le Boost est <strong>non remboursable</strong> une fois activé, y compris en l’absence de
                        mission attribuée pendant la période ;</li>
                      <li>le Boost ne peut faire l’objet d’une suspension, d’un report ou d’un transfert vers un autre
                        profil.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 mt-4">
                    <p className="text-stone-900 font-medium">10.3 Caractère professionnel et absence de droit de rétractation</p>
                    <p>
                      Les achats VIP et Boost étant directement liés à l’activité professionnelle du Chef, le droit de
                      rétractation de quatorze (14) jours prévu par le Code de la consommation pour les contrats à
                      distance entre professionnels et consommateurs ne s’applique pas. Le Chef reconnaît effectuer ces
                      achats à titre exclusivement professionnel.
                    </p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <p className="text-stone-900 font-medium">10.4 Suspension ou résiliation du compte Chef</p>
                    <p>
                      En cas de suspension ou résiliation du compte du Chef pour manquement à ses obligations contractuelles,
                      les montants déjà versés au titre du VIP ou du Boost restent acquis à Chefs Talents. Aucun
                      remboursement, prorata ou avoir ne peut être réclamé sur ce fondement.
                    </p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <p className="text-stone-900 font-medium">10.5 TVA</p>
                    <p>
                      Les tarifs ci-dessus sont exprimés hors taxes. La TVA française au taux applicable est ajoutée à
                      la facturation. Une facture conforme est mise à disposition du Chef après chaque paiement.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">11. Droit applicable et juridiction compétente</p>
                  <p>
                    Les présentes CGV sont soumises au droit français. En cas de litige, et à défaut de résolution amiable
                    dans un délai de trente (30) jours à compter de la première notification écrite, les Parties conviennent
                    de la compétence exclusive des tribunaux de Bordeaux.
                  </p>
                </section>
              </div>
            ) : (
              <div className="space-y-6 text-stone-600 font-light leading-relaxed">
                <p>
                  English version will be added shortly. For now, please refer to the French version which is the legally
                  binding reference.
                </p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div id="contact" className="border-t border-stone-200 pt-16 scroll-mt-32">
            <h3 className="text-2xl font-serif text-stone-900 mb-6">{isFR ? 'Contact' : 'Contact'}</h3>

            <p className="text-stone-600 font-light mb-6">
              {isFR ? 'Pour toute question relative aux présentes conditions :' : 'For any questions regarding these terms:'}
            </p>

            <ul className="space-y-3 text-stone-700">
              <li>
                Email :{' '}
                <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">
                  contact@chefstalents.com
                </a>
              </li>
              <li>
                WhatsApp :{' '}
                <a
                  href="https://wa.me/33756827612"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-stone-900"
                >
                  +33 7 56 82 76 12
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
