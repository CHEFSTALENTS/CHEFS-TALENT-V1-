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
              <div className="space-y-8 text-stone-600 font-light leading-relaxed">
                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">1. Objet</p>
                  <p>
                    Les présentes Conditions Générales d’Utilisation (ci-après les « CGU ») ont pour objet de définir
                    les modalités d’accès et d’utilisation du site Chef Talents (ci-après la « Plateforme »).
                  </p>
                  <p>
                    La Plateforme a pour vocation de mettre en relation des chefs indépendants, des clients privés,
                    des conciergeries, sociétés ou gestionnaires de biens, dans le cadre de prestations culinaires
                    privées, ponctuelles ou de longue durée.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">2. Accès à la Plateforme</p>
                  <p>
                    L’accès à la Plateforme est libre pour les visiteurs. Certaines fonctionnalités nécessitent la
                    création d’un compte et la fourniture d’informations exactes et à jour.
                  </p>
                  <p>
                    Chef Talents se réserve le droit de refuser, suspendre ou supprimer l’accès à tout utilisateur ne
                    respectant pas les présentes CGU.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">3. Rôle de Chef Talents</p>
                  <p>
                    Chef Talents agit exclusivement en tant qu’intermédiaire et tiers de confiance. La société ne
                    fournit aucune prestation culinaire directe, n’emploie pas les chefs et n’intervient pas dans
                    l’exécution matérielle des prestations.
                  </p>
                  <p>
                    Les chefs sont des professionnels indépendants, responsables de leurs obligations légales, sociales,
                    fiscales et assurantielles.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">4. Comptes chefs</p>
                  <p>
                    L’inscription sur la Plateforme ne vaut ni validation automatique, ni garantie de mission. Chef
                    Talents se réserve le droit de sélectionner, refuser ou suspendre un compte chef.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">5. Exactitude des informations</p>
                  <p>
                    Chaque utilisateur s’engage à fournir des informations exactes, sincères et à jour. Chef Talents ne
                    saurait être tenu responsable des conséquences liées à des informations erronées.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">6. Propriété intellectuelle</p>
                  <p>
                    L’ensemble des contenus présents sur la Plateforme est protégé par le droit de la propriété
                    intellectuelle. Toute reproduction non autorisée est interdite.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">7. Données personnelles</p>
                  <p>
                    Les données personnelles sont traitées conformément au RGPD. Les utilisateurs peuvent exercer leurs
                    droits en écrivant à{' '}
                    <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">
                      contact@chefstalents.com
                    </a>
                    .
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">8. Responsabilité</p>
                  <p>
                    Chef Talents ne saurait être tenu responsable des prestations réalisées par les chefs, ni des litiges
                    pouvant survenir entre chefs et clients.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">9. Droit applicable</p>
                  <p>
                    Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des tribunaux
                    français.
                  </p>
                </section>
              </div>
            ) : (
              <div className="space-y-6 text-stone-600 font-light leading-relaxed">
                <p>
                  English version will be added shortly. For now, please refer to the French version which is the
                  legally binding reference.
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
                    la plateforme Chef Talents par un client particulier ou professionnel (ci-après le « Client »).
                  </p>
                  <p>
                    Toute validation de commande implique l’acceptation pleine et entière des présentes CGV, sans réserve.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">2. Nature et rôle de Chef Talents</p>
                  <p>
                    Chef Talents intervient exclusivement en tant que tiers de confiance et intermédiaire dans la mise en
                    relation entre le Client et un chef indépendant.
                  </p>
                  <p>À ce titre, Chef Talents assure notamment :</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>l’analyse du besoin exprimé par le Client ;</li>
                    <li>la sélection et la présentation de profils adaptés ;</li>
                    <li>la coordination du processus de réservation ;</li>
                    <li>la sécurisation du cadre contractuel et financier.</li>
                  </ul>
                  <p>
                    Chef Talents n’est pas partie au contrat de prestation culinaire, lequel est conclu directement entre
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
                    <li>Chef Talents analyse le besoin et les contraintes.</li>
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
                      <li>seuls les frais de service Chef Talents sont facturés à la réservation ;</li>
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
                      et le chef, éventuellement facilité par Chef Talents.
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
                    <li>les frais de service Chef Talents ne sont pas remboursables ;</li>
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
                    En cas d’indisponibilité du chef (désistement, empêchement, force majeure), Chef Talents s’efforce de
                    proposer un chef de remplacement équivalent.
                  </p>
                  <p>
                    À défaut de remplacement, les modalités de remboursement ou d’ajustement sont étudiées au cas par cas,
                    selon l’état d’avancement, les coûts engagés et le cadre validé.
                  </p>
                  <p>Chef Talents est tenu à une obligation de moyens, et non de résultat.</p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">7. Rôle de tiers de confiance et responsabilité financière</p>
                  <p>
                    Chef Talents peut intervenir comme intermédiaire de paiement afin de sécuriser les flux financiers liés
                    à la mission, sans toutefois devenir partie au contrat de prestation culinaire.
                  </p>
                  <p>
                    Toute contestation relative à l’exécution de la prestation devra être signalée dans un délai raisonnable
                    après la mission afin de permettre une analyse appropriée.
                  </p>
                  <p>
                    Chef Talents ne saurait être tenu responsable des litiges liés à l’exécution matérielle de la prestation,
                    laquelle relève du chef et du Client.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">8. Confidentialité</p>
                  <p>
                    Les missions réalisées via Chef Talents peuvent concerner des clients, lieux et informations sensibles.
                    Le Client s’engage à respecter la confidentialité des profils, informations, tarifs et échanges transmis,
                    sauf accord écrit préalable.
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-stone-900 font-medium">9. Force majeure</p>
                  <p>
                    Chef Talents ne pourra être tenu responsable en cas de non-exécution ou de retard résultant d’un événement
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
