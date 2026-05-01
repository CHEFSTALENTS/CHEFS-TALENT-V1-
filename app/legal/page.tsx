'use client';

import React from 'react';
import { Layout } from '../../components/Layout';
import { Section, Label, Marker } from '../../components/ui';

export default function LegalPage() {
  return (
    <Layout>
      <Section className="bg-paper pt-32">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-16">
            <Marker />
            <Label>Informations légales</Label>
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mt-6 mb-4">
              Mentions légales & Confidentialité
            </h1>
            <p className="text-stone-500 font-light">
              Dernière mise à jour : <strong>Mai 2026</strong>
            </p>
          </div>

          {/* Sommaire */}
          <div className="border border-stone-200 p-6 mb-20 bg-stone-50">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">Sommaire</p>
            <ul className="space-y-2 text-stone-700">
              <li><a href="#mentions-legales" className="hover:underline">→ Mentions légales</a></li>
              <li><a href="#confidentialite" className="hover:underline">→ Politique de confidentialité</a></li>
              <li><a href="#nda" className="hover:underline">→ Accord de non-divulgation (NDA)</a></li>
              <li><a href="#contact" className="hover:underline">→ Contact</a></li>
            </ul>
          </div>

          {/* Mentions légales */}
          <div id="mentions-legales" className="space-y-12 mb-24 scroll-mt-32">
            <h2 className="text-3xl font-serif text-stone-900">Mentions légales</h2>
            <div className="space-y-8 text-stone-600 font-light leading-relaxed">
              <div className="space-y-3">
                <p className="font-medium text-stone-800">1. Éditeur du site</p>
                <p>
                  <strong>Chefs Talents</strong><br />
                  Forme juridique : <em>SASU</em><br />
                  Capital social : <em>1000.00€</em><br />
                  SIRET : <em>89832072600026</em><br />
                  RCS : <em>Bordeaux</em><br />
                  TVA intracommunautaire : <em>FR35898320726</em><br />
                  Siège social : <em>Bordeaux, France</em>
                </p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">2. Directeur de la publication</p>
                <p>Thomas Delcroix — <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">contact@chefstalents.com</a></p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">3. Hébergement</p>
                <p>Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723 – États-Unis.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">4. Infrastructure technique</p>
                <p>La gestion des bases de données et de l'authentification est assurée par <strong>Supabase</strong>, service technique tiers.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">5. Objet du site</p>
                <p>Chefs Talents est une plateforme de mise en relation entre des chefs indépendants et des clients privés ou professionnels (conciergeries, gestionnaires de biens, sociétés), dans le cadre de prestations culinaires privées.</p>
                <p>Chefs Talents agit exclusivement en tant qu'intermédiaire et n'intervient pas comme prestataire culinaire. Les chefs référencés sont des professionnels indépendants.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">6. Propriété intellectuelle</p>
                <p>L'ensemble des éléments composant le site Chefs Talents (textes, visuels, logo, marque, structure, design) est protégé par le droit de la propriété intellectuelle.</p>
                <p>Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable, est strictement interdite.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">7. Responsabilité</p>
                <p>Chefs Talents agit exclusivement en tant qu'intermédiaire. Sa responsabilité ne saurait être engagée au titre des prestations réalisées par les chefs indépendants ni des litiges pouvant survenir entre les parties.</p>
              </div>
            </div>
          </div>

          {/* Confidentialité */}
          <div id="confidentialite" className="space-y-12 mb-24 scroll-mt-32">
            <h2 className="text-3xl font-serif text-stone-900">Politique de confidentialité</h2>
            <div className="space-y-8 text-stone-600 font-light leading-relaxed">
              <div className="space-y-3">
                <p className="font-medium text-stone-800">1. Responsable du traitement</p>
                <p>Les données personnelles collectées sur le site Chefs Talents sont traitées par Chefs Talents.<br />Contact : <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">contact@chefstalents.com</a></p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">2. Données collectées</p>
                <p>Chefs Talents est susceptible de collecter les données suivantes :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>identité (nom, prénom),</li>
                  <li>coordonnées (email, téléphone),</li>
                  <li>informations professionnelles (chefs),</li>
                  <li>informations liées aux demandes de prestations,</li>
                  <li>données de navigation (techniques uniquement).</li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">3. Finalités du traitement</p>
                <p>Les données sont collectées afin de :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>gérer les demandes de mise en relation,</li>
                  <li>permettre l'inscription et la gestion des comptes chefs,</li>
                  <li>assurer la communication entre les parties,</li>
                  <li>améliorer la qualité du service,</li>
                  <li>répondre aux obligations légales.</li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">4. Base légale</p>
                <p>Les traitements sont fondés sur l'exécution d'un contrat ou de mesures précontractuelles, l'intérêt légitime de Chefs Talents, et le consentement de l'utilisateur lorsque requis.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">5. Destinataires des données</p>
                <p>Les données peuvent être transmises uniquement aux prestataires techniques nécessaires au fonctionnement du service, notamment :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>hébergement (Vercel),</li>
                  <li>base de données et authentification (Supabase),</li>
                  <li>services de communication (email, WhatsApp).</li>
                </ul>
                <p>Aucune donnée n'est vendue ou cédée à des tiers.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">6. Durée de conservation</p>
                <p>Les données sont conservées pendant la durée de la relation contractuelle, puis archivées conformément aux obligations légales, ou supprimées sur demande de l'utilisateur.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">7. Sécurité</p>
                <p>Chefs Talents met en œuvre des mesures techniques et organisationnelles appropriées afin de garantir la sécurité et la confidentialité des données personnelles.</p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">8. Droits des utilisateurs</p>
                <p>Conformément au RGPD, chaque utilisateur dispose d'un droit d'accès, de rectification, de suppression, d'opposition et de limitation du traitement.</p>
                <p>Toute demande peut être adressée à : <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">contact@chefstalents.com</a></p>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">9. Cookies</p>
                <p>Le site Chefs Talents n'utilise que des cookies strictement nécessaires à son bon fonctionnement. Aucun cookie publicitaire n'est déployé sans consentement explicite.</p>
                <p className="text-sm text-stone-500">(Cette section pourra être mise à jour en cas d'intégration d'outils d'analyse.)</p>
              </div>
            </div>
          </div>

          {/* NDA — NOUVELLE SECTION */}
          <div id="nda" className="space-y-12 mb-24 scroll-mt-32">
            <h2 className="text-3xl font-serif text-stone-900">Accord de non-divulgation</h2>

            <div className="bg-stone-900 rounded-2xl p-6 mb-8">
              <p className="text-stone-400 text-xs uppercase tracking-widest mb-3">Engagement de confidentialité</p>
              <p className="text-white font-light leading-relaxed">
                En cochant la case de confidentialité lors de votre demande sur chefstalents.com, 
                vous acceptez les présentes conditions de non-divulgation relatives aux profils de chefs privés 
                qui vous seront présentés.
              </p>
            </div>

            <div className="space-y-8 text-stone-600 font-light leading-relaxed">
              <div className="space-y-3">
                <p className="font-medium text-stone-800">1. Objet</p>
                <p>
                  Dans le cadre de la sélection et de la présentation de profils de chefs privés, 
                  Chefs Talents s'engage à maintenir la confidentialité de vos informations et de votre demande. 
                  En contrepartie, le client s'engage à respecter la confidentialité des profils présentés.
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">2. Informations confidentielles</p>
                <p>Sont considérées comme confidentielles toutes les informations transmises par Chefs Talents dans le cadre de la sélection, notamment :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>les profils de chefs (anonymisés ou non),</li>
                  <li>les photographies et portfolios culinaires,</li>
                  <li>les références, expériences et parcours professionnels,</li>
                  <li>les coordonnées des chefs transmises après signature du contrat de mission.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">3. Engagements du client</p>
                <p>Le client s'engage à :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>ne pas contacter directement les chefs présentés en dehors du cadre de Chefs Talents,</li>
                  <li>ne pas transmettre les profils reçus à des tiers sans autorisation écrite préalable,</li>
                  <li>ne pas utiliser les informations reçues pour recruter les chefs présentés par un autre biais,</li>
                  <li>n'utiliser les profils qu'aux fins de la mission définie dans la demande initiale.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">4. Sanctions en cas de manquement</p>
                <p>
                  Tout manquement aux présentes obligations pourra donner lieu, sans mise en demeure préalable, 
                  au versement d'une <strong>indemnité forfaitaire de 5 000€ par chef contacté ou recruté directement</strong>, 
                  sans préjudice de tout autre recours judiciaire.
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">5. Durée</p>
                <p>
                  Ces obligations s'appliquent pendant toute la durée de la relation commerciale avec Chefs Talents 
                  et pendant <strong>24 mois</strong> suivant la fin de cette relation, quelle qu'en soit la cause.
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-stone-800">6. Droit applicable</p>
                <p>
                  Les présentes conditions sont soumises au droit français. En cas de litige, 
                  les tribunaux de Bordeaux seront seuls compétents.
                </p>
              </div>

              <div className="border border-stone-200 bg-stone-50 p-5 rounded-xl">
                <p className="text-sm text-stone-600 font-light">
                  <strong className="text-stone-900">Note :</strong> La case à cocher présente lors de votre demande en ligne constitue 
                  un accord de principe. Pour toutes les missions courtes ou les relations de longue durée, 
                  Chefs Talents se réserve le droit de demander la signature d'un NDA complet via DocuSign avant 
                  la transmission des profils.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div id="contact" className="border-t border-stone-200 pt-14 pb-10 scroll-mt-32">
            <h3 className="text-2xl font-serif text-stone-900 mb-6">Contact</h3>
            <p className="text-stone-600 font-light mb-6">Pour toute question relative aux présentes informations :</p>
            <ul className="space-y-3 text-stone-700">
              <li>
                Email : <a href="mailto:contact@chefstalents.com" className="underline hover:text-stone-900">contact@chefstalents.com</a>
              </li>
              <li>
                WhatsApp : <a href="https://wa.me/33756827612" target="_blank" rel="noreferrer" className="underline hover:text-stone-900">+33 7 56 82 76 12</a>
              </li>
            </ul>
          </div>

        </div>
      </Section>
    </Layout>
  );
}
