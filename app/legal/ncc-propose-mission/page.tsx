'use client';

import React from 'react';
import { Layout } from '../../../components/Layout';
import { Section, Label, Marker } from '../../../components/ui';

export default function NccProposeMissionPage() {
  return (
    <Layout>
      <Section className="bg-paper pt-32">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-16">
            <Marker />
            <Label>Annexe contractuelle</Label>
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mt-6 mb-4">
              Accord de Non-Contournement et de Confidentialité
            </h1>
            <p className="text-stone-700 font-light text-lg mb-2">
              Mission transmise au réseau Chefs Talents
            </p>
            <p className="text-stone-500 font-light">
              Version : <strong>08/05/2026</strong> — annexe complémentaire aux Conditions de Collaboration et au
              contrat de mission
            </p>
          </div>

          {/* Note d'usage */}
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 mb-16">
            <p className="text-stone-400 text-xs uppercase tracking-widest mb-3">Usage</p>
            <p className="font-light leading-relaxed">
              Le présent accord est établi à chaque transmission d'une mission par un Chef au réseau Chefs Talents
              via la fonctionnalité « Proposer une mission ». Il est signé par les <strong className="text-white">quatre
              parties</strong> impliquées :
            </p>
            <ol className="list-decimal pl-6 mt-3 space-y-1 font-light">
              <li>le Chef à l'origine de la transmission (« Chef Référent ») ;</li>
              <li>le Chef qui prend en charge l'exécution (« Chef Exécutant ») ;</li>
              <li>le client final auquel la mission est destinée (« Client ») ;</li>
              <li>SASU La cantine de Thomas, exploitée sous le nom commercial Chefs Talents (« Chefs Talents »).</li>
            </ol>
            <p className="mt-3 font-light leading-relaxed">
              Il garantit au Chef Référent une commission sur la mission ainsi qu'une protection contre tout
              contournement par les autres parties pendant 24 mois.
            </p>
          </div>

          {/* Sommaire */}
          <div className="border border-stone-200 p-6 mb-16 bg-stone-50">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">Sommaire</p>
            <ul className="space-y-2 text-stone-700 text-sm">
              <li><a href="#parties" className="hover:underline">→ 1. Parties</a></li>
              <li><a href="#preambule" className="hover:underline">→ 2. Préambule et contexte</a></li>
              <li><a href="#definitions" className="hover:underline">→ 3. Définitions</a></li>
              <li><a href="#confidentialite" className="hover:underline">→ 4. Obligations de confidentialité</a></li>
              <li><a href="#non-contournement" className="hover:underline">→ 5. Obligation de non-contournement (24 mois)</a></li>
              <li><a href="#commission" className="hover:underline">→ 6. Commission du Chef Référent</a></li>
              <li><a href="#sanctions" className="hover:underline">→ 7. Sanctions en cas de violation</a></li>
              <li><a href="#duree" className="hover:underline">→ 8. Durée et survie</a></li>
              <li><a href="#droit" className="hover:underline">→ 9. Droit applicable et juridiction</a></li>
              <li><a href="#signatures" className="hover:underline">→ 10. Signatures</a></li>
            </ul>
          </div>

          <div className="space-y-12 text-stone-600 font-light leading-relaxed">

            {/* 1. Parties */}
            <section id="parties" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">1. Parties</h2>

              <div className="border border-stone-200 p-5 rounded-xl space-y-3">
                <p className="font-medium text-stone-800">Chef Référent</p>
                <p className="text-sm">
                  Nom, Prénom : <span className="font-mono">_____________________________</span><br />
                  Statut professionnel : <span className="font-mono">_____________________________</span><br />
                  SIRET ou numéro équivalent : <span className="font-mono">_____________________________</span><br />
                  Adresse : <span className="font-mono">_____________________________</span><br />
                  Email : <span className="font-mono">_____________________________</span>
                </p>
              </div>

              <div className="border border-stone-200 p-5 rounded-xl space-y-3">
                <p className="font-medium text-stone-800">Chef Exécutant</p>
                <p className="text-sm">
                  Nom, Prénom : <span className="font-mono">_____________________________</span><br />
                  Statut professionnel : <span className="font-mono">_____________________________</span><br />
                  SIRET ou numéro équivalent : <span className="font-mono">_____________________________</span><br />
                  Adresse : <span className="font-mono">_____________________________</span><br />
                  Email : <span className="font-mono">_____________________________</span>
                </p>
              </div>

              <div className="border border-stone-200 p-5 rounded-xl space-y-3">
                <p className="font-medium text-stone-800">Client</p>
                <p className="text-sm">
                  Nom, Prénom (ou Raison sociale) : <span className="font-mono">_____________________________</span><br />
                  SIRET le cas échéant : <span className="font-mono">_____________________________</span><br />
                  Représenté par : <span className="font-mono">_____________________________</span><br />
                  Adresse : <span className="font-mono">_____________________________</span><br />
                  Email : <span className="font-mono">_____________________________</span>
                </p>
              </div>

              <div className="border border-stone-200 p-5 rounded-xl space-y-3">
                <p className="font-medium text-stone-800">Chefs Talents</p>
                <p className="text-sm">
                  SASU La cantine de Thomas (nom commercial Chefs Talents) — SIRET 89832072600026<br />
                  Siège : 25 cours Evrard de Fayolle, 33000 Bordeaux, France<br />
                  Représentée par Thomas Delcroix, Président<br />
                  Email : <a href="mailto:contact@chefstalents.com" className="underline">contact@chefstalents.com</a>
                </p>
              </div>

              <p className="text-sm italic">
                Référence mission : <span className="font-mono">_____________________________</span>{' '}
                — Date de transmission : <span className="font-mono">_____________________________</span>
              </p>
            </section>

            {/* 2. Préambule */}
            <section id="preambule" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">2. Préambule et contexte</h2>
              <p>
                Dans le cadre de son inscription sur la plateforme Chefs Talents, le Chef Référent s'est vu proposer
                une mission de prestation culinaire qu'il n'est pas en mesure d'honorer personnellement (planning,
                indisponibilité, format incompatible).
              </p>
              <p>
                Plutôt que de décliner sèchement, le Chef Référent a choisi d'utiliser la fonctionnalité « Proposer
                une mission » pour transmettre cette opportunité au réseau Chefs Talents, qui l'a alors orientée
                vers le Chef Exécutant signataire des présentes.
              </p>
              <p>
                Le présent accord a pour objet de protéger les intérêts du Chef Référent en lui garantissant la
                rémunération de l'opportunité ainsi générée, et d'empêcher tout contournement du circuit
                contractuel par l'une des autres parties.
              </p>
            </section>

            {/* 3. Définitions */}
            <section id="definitions" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">3. Définitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Mission</strong> : la prestation culinaire identifiée à l'article 1 ci-dessus, telle que
                  formalisée dans le contrat de mission signé entre Chefs Talents et le Chef Exécutant.
                </li>
                <li>
                  <strong>Lead</strong> : la connaissance de l'existence du besoin Client ainsi que des coordonnées
                  permettant de l'identifier ou de le contacter, communiquée par le Chef Référent au réseau
                  Chefs Talents.
                </li>
                <li>
                  <strong>Mission Connexe</strong> : toute prestation ultérieure commandée par le Client (ou par
                  une entité juridiquement liée à lui), portant sur des services culinaires, événementiels ou
                  d'hospitality privée, dans la fenêtre de protection de 24 mois définie ci-après.
                </li>
                <li>
                  <strong>Contournement</strong> : toute tentative par le Chef Exécutant, le Client ou un tiers
                  agissant pour leur compte, d'engager une relation commerciale directe portant sur une Mission
                  ou une Mission Connexe sans passer par Chefs Talents et sans verser au Chef Référent la
                  commission qui lui revient.
                </li>
              </ul>
            </section>

            {/* 4. Confidentialité */}
            <section id="confidentialite" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">4. Obligations de confidentialité</h2>
              <p>
                Chacune des Parties s'engage à traiter avec la plus stricte confidentialité l'ensemble des
                informations échangées dans le cadre de la Mission, et notamment :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>l'identité du Client, son adresse, ses habitudes, ses préférences ;</li>
                <li>le brief de la Mission, le menu retenu, les contraintes médicales et alimentaires ;</li>
                <li>le profil professionnel et les coordonnées du Chef Référent et du Chef Exécutant ;</li>
                <li>les budgets négociés entre les Parties.</li>
              </ul>
              <p>
                Cette obligation s'impose pendant toute la durée de la Mission et survit à sa terminaison pour la
                durée de protection de 24 mois prévue à l'article 8.
              </p>
            </section>

            {/* 5. Non-contournement */}
            <section id="non-contournement" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">5. Obligation de non-contournement (24 mois)</h2>
              <p>
                Pendant toute la durée de la Mission et pour une période de <strong>vingt-quatre (24) mois</strong>{' '}
                à compter de la fin de l'exécution effective de cette Mission, les Parties s'interdisent
                réciproquement :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Le Chef Exécutant</strong> s'interdit de contracter directement avec le Client, ou avec
                  toute entité juridiquement liée au Client, en dehors du circuit Chefs Talents.
                </li>
                <li>
                  <strong>Le Client</strong> s'interdit de solliciter directement le Chef Exécutant, ou de lui
                  confier toute Mission Connexe, en dehors du circuit Chefs Talents.
                </li>
                <li>
                  <strong>Toutes les Parties</strong> s'interdisent de transmettre à des tiers les informations
                  confidentielles relatives à la Mission afin d'organiser un contournement, qu'il soit direct ou
                  indirect.
                </li>
              </ul>
              <p>
                Si l'une des Parties est approchée par une autre Partie en dehors du circuit Chefs Talents, elle
                s'engage à en informer Chefs Talents dans un délai de <strong>48 heures</strong>.
              </p>
            </section>

            {/* 6. Commission */}
            <section id="commission" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">6. Commission du Chef Référent</h2>
              <p>
                En contrepartie de la transmission de l'opportunité commerciale, le Chef Référent perçoit une
                commission égale à <strong>cinq pour cent (5 %) du montant HT total de la Mission effectivement
                exécutée</strong>.
              </p>
              <p>
                Cette commission est versée par Chefs Talents au Chef Référent dans un délai maximum de quinze
                (15) jours suivant l'encaissement intégral du Client par Chefs Talents et la fin effective de la
                Mission, sur présentation par le Chef Référent d'une facture conforme adressée à Chefs Talents.
              </p>
              <p>
                En cas de Mission Connexe survenant pendant la fenêtre de 24 mois définie à l'article 8 ci-après
                et confiée à un Chef du réseau Chefs Talents, le Chef Référent perçoit la même commission
                de 5 % du montant HT total de cette Mission Connexe.
              </p>
              <p>
                <strong>Modalités</strong> : la commission est calculée sur le montant HT facturé par Chefs Talents
                au Chef Exécutant pour la Mission, et non sur le prix TTC vendu au Client. La commission est
                exclusive de toute autre rémunération du Chef Référent au titre de la Mission.
              </p>
            </section>

            {/* 7. Sanctions */}
            <section id="sanctions" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">7. Sanctions en cas de violation</h2>
              <p>
                En cas de violation avérée des articles 4 (confidentialité) ou 5 (non-contournement) par l'une
                des Parties, la Partie défaillante sera redevable :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  envers <strong>Chefs Talents</strong>, d'une indemnité forfaitaire égale à 30 % du montant HT
                  total de la Mission ou Mission Connexe contournée, ou 30 000 €, le plus élevé des deux ;
                </li>
                <li>
                  envers <strong>le Chef Référent</strong>, du versement intégral de la commission de 5 % qui
                  lui aurait été due si le circuit Chefs Talents avait été respecté, augmenté d'une indemnité
                  forfaitaire égale au double de cette commission à titre de pénalité ;
                </li>
                <li>
                  sans préjudice de tout dommage complémentaire que Chefs Talents ou le Chef Référent pourraient
                  démontrer, notamment au titre du préjudice commercial et d'image.
                </li>
              </ul>
              <p>
                Ces indemnités sont immédiatement exigibles dès la constatation de la violation et payables dans
                un délai de quinze (15) jours à compter de la notification écrite, sans mise en demeure préalable.
              </p>
              <p>
                En cas de violation par le Chef Exécutant, Chefs Talents pourra en outre suspendre ou résilier
                immédiatement son accès à la plateforme.
              </p>
            </section>

            {/* 8. Durée */}
            <section id="duree" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">8. Durée et survie</h2>
              <p>
                Le présent accord entre en vigueur à la date de sa signature par les quatre Parties et demeure
                applicable :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>pendant toute la durée d'exécution de la Mission ;</li>
                <li>
                  pour les obligations de confidentialité (article 4) et de non-contournement (article 5),
                  pendant <strong>vingt-quatre (24) mois</strong> à compter de la date de fin effective de la
                  Mission, quelle qu'en soit la cause (exécution complète, résiliation amiable, résiliation
                  contentieuse, force majeure).
                </li>
              </ul>
              <p>
                Les obligations de paiement des commissions et indemnités survivent jusqu'à parfait paiement.
              </p>
            </section>

            {/* 9. Droit */}
            <section id="droit" className="space-y-4 scroll-mt-32">
              <h2 className="text-2xl font-serif text-stone-900">9. Droit applicable et juridiction</h2>
              <p>
                Le présent accord est régi par le droit français. En cas de litige, et à défaut de résolution
                amiable dans un délai de trente (30) jours à compter de la première notification écrite, les
                Parties conviennent de la <strong>compétence exclusive des tribunaux de Bordeaux</strong>.
              </p>
            </section>

            {/* 10. Signatures */}
            <section id="signatures" className="space-y-4 scroll-mt-32 border-t border-stone-200 pt-12">
              <h2 className="text-2xl font-serif text-stone-900">10. Signatures</h2>
              <p className="text-sm">
                Fait en quatre (4) exemplaires originaux, à <span className="font-mono">_______________</span>, le
                {' '}<span className="font-mono">_______________</span>.
              </p>
              <p className="text-sm italic">
                Mention manuscrite obligatoire pour chaque signataire : « Lu et approuvé ».
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="border border-stone-200 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">Chef Référent</p>
                  <p className="text-sm">
                    Nom, Prénom : <span className="font-mono">_____________________________</span><br /><br />
                    Date : <span className="font-mono">_______________</span><br /><br />
                    Signature :
                  </p>
                </div>

                <div className="border border-stone-200 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">Chef Exécutant</p>
                  <p className="text-sm">
                    Nom, Prénom : <span className="font-mono">_____________________________</span><br /><br />
                    Date : <span className="font-mono">_______________</span><br /><br />
                    Signature :
                  </p>
                </div>

                <div className="border border-stone-200 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">Client</p>
                  <p className="text-sm">
                    Nom, Prénom : <span className="font-mono">_____________________________</span><br /><br />
                    Date : <span className="font-mono">_______________</span><br /><br />
                    Signature :
                  </p>
                </div>

                <div className="border border-stone-200 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">Chefs Talents</p>
                  <p className="text-sm">
                    Nom, Prénom : Thomas Delcroix<br />
                    Qualité : Président, SASU La cantine de Thomas (Chefs Talents)<br /><br />
                    Date : <span className="font-mono">_______________</span><br /><br />
                    Signature :
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
