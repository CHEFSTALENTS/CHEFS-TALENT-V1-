'use client';

import { useState } from 'react';
import Link from 'next/link';
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
              {isFR
                ? 'Conditions d’utilisation & Conditions de vente'
                : 'Terms of Use & Terms of Sale'}
            </h1>

            <p className="text-stone-500 font-light">
              {isFR ? 'Dernière mise à jour' : 'Last updated'} :{' '}
              <strong>janvier 2026</strong>
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
    Conditions Générales d’Utilisation
  </h2>

  <div className="space-y-8 text-stone-600 font-light leading-relaxed">

    <p><strong>1. Objet</strong></p>
    <p>
      Les présentes Conditions Générales d’Utilisation (ci-après les « CGU ») ont pour objet
      de définir les modalités d’accès et d’utilisation du site Chef Talents (ci-après la « Plateforme »).
    </p>
    <p>
      La Plateforme a pour vocation de mettre en relation des chefs indépendants,
      des clients privés, des conciergeries, sociétés ou gestionnaires de biens,
      dans le cadre de prestations culinaires privées, ponctuelles ou de longue durée.
    </p>

    <p><strong>2. Accès à la Plateforme</strong></p>
    <p>
      L’accès à la Plateforme est libre pour les visiteurs. Certaines fonctionnalités nécessitent
      la création d’un compte et la fourniture d’informations exactes et à jour.
    </p>
    <p>
      Chef Talents se réserve le droit de refuser, suspendre ou supprimer l’accès
      à tout utilisateur ne respectant pas les présentes CGU.
    </p>

    <p><strong>3. Rôle de Chef Talents</strong></p>
    <p>
      Chef Talents agit exclusivement en tant qu’intermédiaire et tiers de confiance.
      La société ne fournit aucune prestation culinaire directe, n’emploie pas les chefs
      et n’intervient pas dans l’exécution matérielle des prestations.
    </p>
    <p>
      Les chefs sont des professionnels indépendants, responsables de leurs obligations
      légales, sociales, fiscales et assurantielles.
    </p>

    <p><strong>4. Comptes chefs</strong></p>
    <p>
      L’inscription sur la Plateforme ne vaut ni validation automatique, ni garantie de mission.
      Chef Talents se réserve le droit de sélectionner, refuser ou suspendre un compte chef.
    </p>

    <p><strong>5. Exactitude des informations</strong></p>
    <p>
      Chaque utilisateur s’engage à fournir des informations exactes, sincères et à jour.
      Chef Talents ne saurait être tenu responsable des conséquences liées à des informations erronées.
    </p>

    <p><strong>6. Propriété intellectuelle</strong></p>
    <p>
      L’ensemble des contenus présents sur la Plateforme est protégé par le droit
      de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
    </p>

    <p><strong>7. Données personnelles</strong></p>
    <p>
      Les données personnelles sont traitées conformément au RGPD.
      Les utilisateurs peuvent exercer leurs droits en écrivant à :
      <a href="mailto:contact@chefstalents.com" className="underline ml-1">
        contact@chefstalents.com
      </a>
    </p>

    <p><strong>8. Responsabilité</strong></p>
    <p>
      Chef Talents ne saurait être tenu responsable des prestations réalisées par les chefs,
      ni des litiges pouvant survenir entre chefs et clients.
    </p>

    <p><strong>9. Droit applicable</strong></p>
    <p>
      Les présentes CGU sont soumises au droit français.
      Tout litige relève de la compétence des tribunaux français.
    </p>

  </div>
</div>
          {/* CGV */}
          <div id="cgv" className="space-y-12 mb-32 scroll-mt-32">
  <h2 className="text-3xl font-serif text-stone-900">
    Conditions Générales de Vente
  </h2>

  <div className="space-y-8 text-stone-600 font-light leading-relaxed">

    <p><strong>1. Champ d’application</strong></p>
    <p>
      Les présentes Conditions Générales de Vente s’appliquent à toute commande passée
      via la Plateforme Chef Talents par un client privé ou professionnel.
    </p>

    <p><strong>2. Nature de la prestation</strong></p>
    <p>
      Chef Talents intervient en qualité de tiers de confiance, assurant la mise en relation,
      la coordination et la sécurisation du cadre contractuel et financier.
    </p>
    <p>
      Chef Talents n’est pas partie au contrat de prestation culinaire,
      lequel est conclu directement entre le client et le chef.
    </p>

    <p><strong>3. Processus de réservation</strong></p>
    <p>
      Le processus comprend la demande client, l’analyse du besoin,
      la proposition de chefs, le choix du chef, la validation des conditions
      et le paiement déclenchant la confirmation de la mission.
    </p>

    <p><strong>4. Modalités de paiement</strong></p>

    <p><strong>4.1 Prestations ponctuelles (One Shot – 1 à 3 jours)</strong></p>
    <p>
      Le règlement de 100 % du montant est exigé après sélection du chef.
      Sans paiement, la prestation n’est pas confirmée et le chef n’est pas réservé.
    </p>

    <p><strong>4.2 Missions de longue durée</strong></p>
    <p>
      Pour les missions supérieures à une semaine, seuls les frais de service
      Chef Talents sont facturés à la réservation.
    </p>
    <p>
      Ces frais valident le démarrage de la mission, le cadre contractuel
      et les conditions générales de collaboration.
    </p>
    <p>
      La rémunération du chef fait l’objet d’un accord distinct.
    </p>

    <p><strong>5. Annulation – Client</strong></p>
    <p>
      Les frais de service Chef Talents ne sont pas remboursables.
      Toute annulation tardive peut entraîner la facturation partielle
      ou totale de la prestation selon les engagements pris.
    </p>

    <p><strong>6. Annulation – Chef / indisponibilité</strong></p>
    <p>
      En cas d’indisponibilité du chef, Chef Talents s’efforce de proposer
      un remplacement équivalent. L’obligation est une obligation de moyens.
    </p>

    <p><strong>7. Responsabilité financière</strong></p>
    <p>
      Chef Talents agit comme intermédiaire de paiement et tiers de confiance.
      Toute contestation doit être signalée dans un délai raisonnable après la mission.
    </p>

    <p><strong>8. Force majeure</strong></p>
    <p>
      Chef Talents ne saurait être tenu responsable en cas de force majeure.
    </p>

    <p><strong>9. Droit applicable</strong></p>
    <p>
      Les présentes CGV sont soumises au droit français.
      Tout litige relève de la compétence exclusive des tribunaux français.
    </p>

  </div>
</div>

          {/* Contact */}
          <div id="contact" className="border-t border-stone-200 pt-16 scroll-mt-32">
            <h3 className="text-2xl font-serif text-stone-900 mb-6">
              {isFR ? 'Contact' : 'Contact'}
            </h3>

            <p className="text-stone-600 font-light mb-6">
              {isFR
                ? 'Pour toute question relative aux présentes conditions :'
                : 'For any questions regarding these terms:'}
            </p>

            <ul className="space-y-3 text-stone-700">
              <li>
                Email :{' '}
                <a
                  href="mailto:contact@chefstalents.com"
                  className="underline hover:text-stone-900"
                >
                  contact@chefstalents.com
                </a>
              </li>
              <li>
                WhatsApp :{' '}
                <a
                  href="https://wa.me/33756827612"
                  target="_blank"
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
