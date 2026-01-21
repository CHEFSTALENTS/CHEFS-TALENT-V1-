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
              {isFR ? 'Conditions Générales d’Utilisation' : 'Terms of Use'}
            </h2>

            <div className="space-y-6 text-stone-600 font-light leading-relaxed">
              {isFR ? (
                <>
                  <p>
                    Chef Talents est une plateforme de mise en relation entre des chefs
                    indépendants et des clients privés ou professionnels.
                  </p>

                  <p>
                    L’utilisation du site implique l’acceptation pleine et entière des présentes
                    Conditions Générales d’Utilisation.
                  </p>

                  <p>
                    Chef Talents agit exclusivement en tant qu’intermédiaire et tiers de confiance.
                    La plateforme n’emploie pas les chefs et ne fournit aucune prestation culinaire
                    directe.
                  </p>

                  <p>
                    Les chefs référencés sont des professionnels indépendants, seuls responsables
                    de leurs obligations légales, sociales, fiscales et assurantielles.
                  </p>

                  <p>
                    L’ensemble des contenus du site (textes, images, marques, logos) est protégé
                    par le droit de la propriété intellectuelle.
                  </p>

                  <p>
                    Les données personnelles sont traitées conformément à la réglementation en vigueur.
                  </p>

                  <p>
                    Les présentes CGU sont soumises au droit français.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Chef Talents is a matchmaking platform connecting independent private chefs
                    with private and professional clients.
                  </p>

                  <p>
                    Access to and use of the website implies full acceptance of these Terms of Use.
                  </p>

                  <p>
                    Chef Talents acts solely as an intermediary and trusted third party.
                    It does not employ chefs and does not provide culinary services directly.
                  </p>

                  <p>
                    Listed chefs operate as independent professionals and are solely responsible
                    for their legal, tax, social, and insurance obligations.
                  </p>

                  <p>
                    All content on the website (texts, images, brands, logos) is protected by
                    intellectual property law.
                  </p>

                  <p>
                    Personal data is processed in accordance with applicable regulations.
                  </p>

                  <p>
                    These Terms of Use are governed by French law.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* CGV */}
          <div id="cgv" className="space-y-12 mb-32 scroll-mt-32">
            <h2 className="text-3xl font-serif text-stone-900">
              {isFR ? 'Conditions Générales de Vente' : 'Terms of Sale'}
            </h2>

            <div className="space-y-6 text-stone-600 font-light leading-relaxed">
              {isFR ? (
                <>
                  <p>
                    Chef Talents intervient en tant que tiers de confiance dans la mise en relation,
                    la coordination et le cadre contractuel des prestations réalisées par des chefs
                    indépendants.
                  </p>

                  <p>
                    Pour les prestations ponctuelles (One Shot ou missions de 1 à 3 jours),
                    le règlement de 100 % de la prestation est exigé après sélection du chef.
                    Sans règlement, la prestation n’est pas confirmée.
                  </p>

                  <p>
                    Pour les missions de longue durée (supérieures à une semaine),
                    seuls les frais de service Chef Talents sont facturés à la réservation.
                    Ces frais valident le démarrage de la mission et le cadre contractuel.
                  </p>

                  <p>
                    La rémunération du chef pour les missions longues est définie séparément
                    selon un calendrier convenu entre les parties.
                  </p>

                  <p>
                    En cas d’annulation par le client, les frais de service ne sont pas remboursables.
                    Des frais supplémentaires peuvent s’appliquer selon le délai d’annulation.
                  </p>

                  <p>
                    En cas d’indisponibilité du chef, Chef Talents s’efforce de proposer une
                    solution alternative équivalente, sans obligation de résultat.
                  </p>

                  <p>
                    Les présentes CGV sont soumises au droit français.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Chef Talents acts as a trusted third party for the coordination and contractual
                    framework of services provided by independent chefs.
                  </p>

                  <p>
                    For short-term services (One Shot or 1–3 day missions),
                    full payment is required after chef selection to confirm the booking.
                  </p>

                  <p>
                    For long-term missions (over one week),
                    only Chef Talents service fees are invoiced at booking.
                    These fees validate the mission start and contractual framework.
                  </p>

                  <p>
                    Chef remuneration for long-term missions is defined separately
                    according to an agreed schedule.
                  </p>

                  <p>
                    In case of client cancellation, service fees are non-refundable.
                    Additional charges may apply depending on notice period.
                  </p>

                  <p>
                    If a chef becomes unavailable, Chef Talents will attempt to provide
                    an equivalent replacement, without obligation of result.
                  </p>

                  <p>
                    These Terms of Sale are governed by French law.
                  </p>
                </>
              )}
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
