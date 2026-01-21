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
              {isFR ? 'Dernière mise à jour' : 'Last updated'} : <strong>janvier 2026</strong>
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
          Chefs Talents agit exclusivement en tant qu’intermédiaire et tiers de confiance. Chefs Talents :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>ne fournit aucune prestation culinaire directe ;</li>
          <li>n’emploie pas les chefs référencés ;</li>
          <li>n’intervient pas dans l’exécution matérielle des prestations.</li>
        </ul>
        <p>
          Les Chefs sont des professionnels indépendants, responsables de leurs obligations légales, sociales, fiscales et
          assurantielles. Le contrat de prestation culinaire est conclu entre le Client et le Chef, sous réserve des règles
          applicables au parcours et aux outils de la Plateforme (paiements, validation, coordination).
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
          Chefs Talents ne saurait être tenu responsable : (i) des prestations réalisées par les Chefs, (ii) des dommages liés
          à l’exécution des missions, (iii) des litiges entre Chefs et Clients. Chefs Talents est soumis à une obligation de
          moyens dans la mise en relation et la coordination, et non de résultat.
        </p>
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
        <p className="text-stone-900 font-medium">19. Droit applicable</p>
        <p>
          Les présentes CGU sont soumises au droit français. Tout litige relèvera de la compétence des tribunaux français.
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
                    Chefs Talents intervient exclusivement en tant que tiers de confiance et intermédiaire dans la mise en
                    relation entre le Client et un chef indépendant.
                  </p>
                  <p>À ce titre, Chefs Talents assure notamment :</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>l’analyse du besoin exprimé par le Client ;</li>
                    <li>la sélection et la présentation de profils adaptés ;</li>
                    <li>la coordination du processus de réservation ;</li>
                    <li>la sécurisation du cadre contractuel et financier.</li>
                  </ul>
                  <p>
                    Chefs Talents n’est pas partie au contrat de prestation culinaire, lequel est conclu directement entre
                    le Client et le chef sélectionné.
                  </p>
                  <p>
                    Les chefs référencés sont des professionnels indépendants, seuls responsables de l’exécution de leurs
                    prestations, de leurs obligations légales et de leurs assurances.
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
                  <p className="text-stone-900 font-medium">4. Modalités de paiement</p>

                  <div className="space-y-2">
                    <p className="text-stone-900 font-medium">4.1 Prestations ponctuelles (One Shot – 1 à 3 jours)</p>
                    <p>Pour toute prestation courte ou événementielle :</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>le règlement de 100 % du montant total de la prestation est exigé ;</li>
                      <li>le paiement intervient après sélection du chef ;</li>
                      <li>
                        en l’absence de paiement, le chef n’est pas réservé et la mission n’est pas confirmée.
                      </li>
                    </ul>
                    <p>
                      Ce règlement permet de sécuriser l’engagement du chef, de confirmer la date, et de cadrer les
                      conditions d’exécution (horaires, convives, contraintes, etc.).
                    </p>
                  </div>

                  <div className="space-y-2 mt-6">
                    <p className="text-stone-900 font-medium">4.2 Missions de longue durée (résidences, yachts, séjours)</p>
                    <p>Pour les missions supérieures à une semaine :</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>seuls les frais de service Chefs Talents sont facturés à la réservation ;</li>
                      <li>
                        ces frais permettent de valider :
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                          <li>le démarrage de la mission ;</li>
                          <li>le cadre contractuel ;</li>
                          <li>les conditions générales de collaboration.</li>
                        </ul>
                      </li>
                    </ul>
                    <p>
                      La rémunération du chef fait l’objet d’un accord distinct, selon un calendrier défini entre le Client
                      et le chef, éventuellement facilité par Chefs Talents.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">5. Annulation – Client</p>
                  <p>
                    Les conditions d’annulation dépendent de la nature de la mission, de sa durée et du délai d’annulation.
                  </p>
                  <p>Sauf stipulation contraire communiquée avant validation :</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>les frais de service Chefs Talents ne sont pas remboursables ;</li>
                    <li>
                      toute annulation tardive peut entraîner la facturation partielle ou totale de la prestation,
                      conformément aux engagements pris avec le chef (réservation de dates, organisation, achats, etc.).
                    </li>
                  </ul>
                  <p>
                    Les conditions précises (barème et délais) sont communiquées au Client avant confirmation de la mission.
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
                  <p className="text-stone-900 font-medium">7. Rôle de tiers de confiance et responsabilité financière</p>
                  <p>
                    Chefs Talents peut intervenir comme intermédiaire de paiement afin de sécuriser les flux financiers liés
                    à la mission, sans toutefois devenir partie au contrat de prestation culinaire.
                  </p>
                  <p>
                    Toute contestation relative à l’exécution de la prestation devra être signalée dans un délai raisonnable
                    après la mission afin de permettre une analyse appropriée.
                  </p>
                  <p>
                    Chefs Talents ne saurait être tenu responsable des litiges liés à l’exécution matérielle de la prestation,
                    laquelle relève du chef et du Client.
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
                  <p className="text-stone-900 font-medium">10. Droit applicable et juridiction compétente</p>
                  <p>
                    Les présentes CGV sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur
                    exécution relève de la compétence exclusive des tribunaux français.
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
