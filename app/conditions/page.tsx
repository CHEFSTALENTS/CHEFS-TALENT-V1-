'use client';

import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Section, Label, Marker, Reveal } from '@/components/ui';

export default function ConditionsPage() {
  return (
    <Layout>
      <Section className="bg-paper pt-32">
        <div className="max-w-4xl mx-auto px-6">

          {/* Header */}
          <div className="mb-20">
            <Marker />
            <Label>Informations légales</Label>

            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mt-6 mb-6">
              Conditions d’utilisation & Conditions de vente
            </h1>

            <p className="text-stone-500 font-light">
              Dernière mise à jour : <strong>janvier 2026</strong>
            </p>
          </div>

          {/* Sommaire */}
          <div className="border border-stone-200 p-6 mb-20 bg-stone-50">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-4">
              Sommaire
            </p>
            <ul className="space-y-2 text-stone-700">
              <li>
                <a href="#cgu" className="hover:underline">
                  → Conditions Générales d’Utilisation (CGU)
                </a>
              </li>
              <li>
                <a href="#cgv" className="hover:underline">
                  → Conditions Générales de Vente (CGV)
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:underline">
                  → Contact
                </a>
              </li>
            </ul>
          </div>

          {/* CGU */}
          <div id="cgu" className="space-y-12 mb-32 scroll-mt-32">
            <h2 className="text-3xl font-serif text-stone-900">
              Conditions Générales d’Utilisation
            </h2>

            <div className="space-y-6 text-stone-600 font-light leading-relaxed">
              <p>
                Chef Talents est une plateforme de mise en relation entre des chefs indépendants
                et des clients privés ou professionnels.
              </p>

              <p>
                L’accès et l’utilisation du site impliquent l’acceptation pleine et entière
                des présentes Conditions Générales d’Utilisation.
              </p>

              <p>
                Chef Talents agit exclusivement en tant qu’intermédiaire et ne fournit aucune
                prestation culinaire directe.
              </p>

              <p>
                Les contenus du site (textes, images, marques) sont protégés et ne peuvent
                être reproduits sans autorisation.
              </p>

              <p>
                Les données personnelles sont traitées conformément à la réglementation en vigueur.
              </p>
            </div>
          </div>

          {/* CGV */}
          <div id="cgv" className="space-y-12 mb-32 scroll-mt-32">
            <h2 className="text-3xl font-serif text-stone-900">
              Conditions Générales de Vente
            </h2>

            <div className="space-y-6 text-stone-600 font-light leading-relaxed">
              <p>
                Chef Talents intervient en tant que tiers de confiance dans la mise en relation
                et la coordination des prestations réalisées par des chefs indépendants.
              </p>

              <p>
                Pour les prestations ponctuelles (One Shot, 1 à 3 jours), le règlement de 100 %
                de la prestation est exigé après sélection du chef afin de confirmer la mission.
              </p>

              <p>
                Pour les missions de longue durée, seuls les frais de service Chef Talents
                sont facturés à la réservation. Les conditions de mission et de rémunération
                du chef sont définies séparément.
              </p>

              <p>
                En cas d’annulation ou d’indisponibilité, Chef Talents s’efforce de proposer
                une solution alternative sans obligation de résultat.
              </p>

              <p>
                Les présentes CGV sont soumises au droit français.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div id="contact" className="border-t border-stone-200 pt-16 scroll-mt-32">
            <h3 className="text-2xl font-serif text-stone-900 mb-6">
              Contact
            </h3>

            <p className="text-stone-600 font-light mb-6">
              Pour toute question relative aux présentes conditions :
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
