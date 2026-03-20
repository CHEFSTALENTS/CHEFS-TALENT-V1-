'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Mail, MessageCircle } from 'lucide-react';
import { Button, Section, Reveal, Marker, Label } from '../components/ui';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { TextParallaxContentExample } from '@/components/ui/text-parallax-content-scroll';

/** CONFIG CONTACT */
const SUPPORT_EMAIL = 'contact@chefstalents.com';
const WHATSAPP_NUMBER_E164 = '33756827612';
const WHATSAPP_PREFILL = encodeURIComponent(
  "Bonjour,\n\nJ’ai une demande Chef Talents.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci."
);

export default function Home() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    'Demande Chef Talents'
  )}&body=${encodeURIComponent(
    "Bonjour,\n\nJe souhaite faire une demande.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci,\n"
  )}`;

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${WHATSAPP_PREFILL}`;

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen grid md:grid-cols-12 pt-24 md:pt-0 bg-paper">
        <div className="order-2 flex flex-col justify-center px-6 py-20 md:order-1 md:col-span-7 md:px-16 md:py-0 lg:px-24">
          <div className="max-w-2xl">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 48 }}
              transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
              className="mb-12 hidden w-[1px] bg-stone-900 md:block"
            />

            <Reveal>
              <h1 className="mb-12 text-5xl font-serif leading-[1] tracking-tight text-stone-900 md:text-7xl lg:text-[5.5rem]">
                Des chefs privés, <br />
                sélectionnés pour des <br />
                <span className="italic text-stone-500">lieux d’exception.</span>
              </h1>

              <p className="mb-6 max-w-lg text-lg font-light leading-relaxed text-stone-600 md:text-xl">
                Chef Talents met en relation des chefs privés soigneusement sélectionnés avec des conciergeries, des
                résidences et des clients particuliers exigeant constance, discrétion et excellence opérationnelle,
                partout en Europe.
              </p>

              <div className="flex flex-col gap-6 sm:flex-row">
                <Link href="/request">
                  <Button size="lg" className="w-full sm:w-auto">
                    Décrire mon besoin
                  </Button>
                </Link>

                <Link href="/conciergeries">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-stone-300 text-stone-600 hover:text-stone-900 sm:w-auto"
                  >
                    Je suis une conciergerie
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 border-b border-stone-200 text-sm text-stone-500 transition hover:border-stone-900 hover:text-stone-900"
                >
                  <Mail className="h-4 w-4" />
                  Nous écrire
                </a>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border-b border-stone-200 text-sm text-stone-500 transition hover:border-stone-900 hover:text-stone-900"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="order-1 relative min-h-[55vh] overflow-hidden md:order-2 md:col-span-5 md:min-h-screen">
          <motion.div
            initial={{ scale: 1.03, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image
              src="/images/editorial/chef-dining-01.jpg.png"
              alt="Chef Talents – expérience de chef privé"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-stone-900/10" />
          </motion.div>
        </div>
      </section>

      {/* Positioning */}
      <Section className="bg-stone-100">
        <div className="grid items-start gap-16 md:grid-cols-12">
          <div className="hidden md:col-span-3 md:block">
            <Marker />
            <Label>Notre approche</Label>
          </div>

          <div className="md:col-span-9">
            <Reveal>
              <p className="text-3xl font-serif leading-tight text-stone-800 md:text-5xl">
                Plus qu’une réservation.<br />
                <span className="text-stone-400">Une mise en relation maîtrisée.</span>
              </p>

              <div className="mt-8 mb-10 max-w-3xl">
                <p className="text-lg font-light leading-relaxed text-stone-600">
                  Chef Talents a été pensé pour les situations où la qualité, la continuité et la confiance priment sur
                  la rapidité. Qu’il s’agisse d’un dîner privé ou d’une résidence de longue durée, nous sélectionnons et
                  accompagnons chaque mission avec rigueur.
                </p>
              </div>

              <div className="grid gap-12 border-t border-stone-200 pt-12 md:grid-cols-2">
                <div>
                  <h4 className="mb-6 text-xl font-serif">Pourquoi nous ?</h4>
                  <ul className="space-y-3 font-light text-stone-600">
                    <li>Des chefs sélectionnés</li>
                    <li>Une couverture européenne avec expertise locale</li>
                    <li>Gestion de la continuité et des remplacements</li>
                    <li>Chefs multilingues, habitués aux standards UHNW</li>
                    <li>Un interlocuteur unique pour les missions complexes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-6 text-xl font-serif">La discrétion comme principe</h4>
                  <p className="font-light leading-relaxed text-stone-600">
                    Nos chefs interviennent dans les villas, chalets, yachts et résidences privées à travers l’Europe.
                    Les lieux, les clients et les missions ne sont jamais rendus publics. Les références sont partagées
                    de manière sélective.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Nouveau design parallax */}
      <TextParallaxContentExample />

      {/* Visual Break */}
      <section className="relative bg-paper">
        <Reveal>
          <div className="relative flex h-[70vh] items-center justify-center overflow-hidden md:h-[85vh]">
            <Image
              src="/images/editorial/chalet-cuisine.png"
              alt="Cuisine ouverte dans un chalet avec vue montagne"
              fill
              className="object-cover"
              priority
            />

            <div className="absolute inset-0 bg-stone-900/35" />

            <div className="relative z-10 max-w-2xl px-6 text-center">
              <h2 className="mb-8 text-3xl font-serif italic text-white md:text-5xl">
                Présentez-nous votre besoin.
              </h2>

              <p className="mb-12 text-lg font-light text-stone-200">
                Nous vous répondrons avec une proposition adaptée à vos attentes et à votre niveau d’exigence.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/request">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white transition-all hover:bg-white hover:text-stone-900"
                  >
                    Décrire mon besoin
                  </Button>
                </Link>

                <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/60 text-white transition-all hover:bg-white hover:text-stone-900"
                  >
                    WhatsApp <ArrowRight className="ml-3 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Roster Section */}
      <Section className="bg-paper">
        <div className="grid items-center gap-24 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Reveal>
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src="/images/editorial/professional-kitchen-preparation.png"
                  alt="Préparation en cuisine professionnelle"
                  fill
                  className="object-cover grayscale-[20%] transition-all duration-1000 hover:grayscale-0"
                />
              </div>
            </Reveal>
          </div>

          <div className="space-y-16 md:col-span-6">
            <Reveal>
              <Marker />
              <h2 className="mb-8 text-4xl font-serif leading-tight text-stone-900 md:text-5xl">
                Deux niveaux de sélection, selon vos exigences.
              </h2>
              <p className="max-w-md text-lg font-light leading-relaxed text-stone-500">
                Tous les chefs de Chef Talents ne sont pas éligibles à la Sélection Select.
              </p>
            </Reveal>

            <div className="space-y-0 border-t border-stone-200">
              <ExpandableItem
                title="Sélection publique"
                content="Une sélection de chefs privés validés, accessible aux clients particuliers pour des prestations ponctuelles ou récurrentes."
              />
              <ExpandableItem
                title="Sélection"
                subtitle="Réservée aux conciergeries"
                isDefaultOpen
                content="Une sélection avancée, regroupant des chefs approuvés pour des missions à forts enjeux, de longue durée ou récurrentes."
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Single request card */}
      <section className="bg-stone-100 py-32 px-6 md:px-12">
        <div className="mx-auto max-w-[100rem]">
          <Reveal>
            <div className="grid gap-12 lg:grid-cols-1">
              <InteractiveCard
                theme="dark"
                icon={ShieldCheck}
                title="Soumettre une demande"
                subtitle="DEMANDE UNIQUE"
                description="Décrivez simplement votre besoin. Dîner privé, séjour, résidence, yacht ou demande plus complexe : notre équipe qualifie la mission et construit la meilleure réponse."
                hint="Vous ne choisissez plus entre plusieurs parcours. Vous remplissez une seule demande, nous faisons le reste."
                link="/request"
                cta="Décrire mon besoin"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <Section className="bg-paper">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="flex items-end justify-between gap-6">
              <div>
                <Marker />
                <h2 className="mt-6 text-4xl font-serif text-stone-900 md:text-5xl">
                  Questions fréquentes
                </h2>
                <p className="mt-4 font-light text-stone-500">
                  L’essentiel, avant de nous transmettre votre brief.
                </p>
              </div>

              <div className="hidden items-center gap-4 md:flex">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 border-b border-stone-200 text-sm text-stone-500 transition hover:border-stone-900 hover:text-stone-900"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border-b border-stone-200 text-sm text-stone-500 transition hover:border-stone-900 hover:text-stone-900"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-12 border-t border-stone-200">
              <ExpandableItem
                title="Que se passe-t-il après l’envoi de ma demande ?"
                isDefaultOpen
                content="Nous analysons votre brief (lieu, dates, attentes, budget), puis nous revenons vers vous avec une sélection de chefs disponibles et pertinents. Vous validez un profil, et nous coordonnons ensuite l’ensemble de la mission."
              />

              <ExpandableItem
                title="Est-ce que je choisis le chef ?"
                content="Oui. Chef Talents fonctionne comme un intermédiaire curateur : nous présélectionnons des profils adaptés, et vous choisissez celui qui correspond le mieux à votre style, vos contraintes et votre niveau d’exigence."
              />

              <ExpandableItem
                title="Quand le paiement est-il effectué ?"
                content="Le paiement dépend de la nature et de la durée de la mission. Pour certaines prestations ponctuelles, le règlement intervient une fois le chef sélectionné afin de confirmer la mission. Pour les missions plus longues ou plus complexes, les modalités sont précisées en amont avec transparence."
              />

              <ExpandableItem
                title="Pourquoi des frais de service sont-ils demandés ?"
                content="Les frais de service couvrent la sélection des chefs, la coordination, la sécurisation de la mission et le suivi opérationnel. Ils permettent de garantir fiabilité, continuité et réactivité, notamment sur des missions à forts enjeux."
              />

              <ExpandableItem
                title="Que se passe-t-il en cas d’annulation par le client ?"
                content="Les conditions d’annulation dépendent du délai et de l’état d’avancement de la mission. En cas d’annulation anticipée, un remboursement partiel peut être envisagé. Les frais de service, correspondant au travail engagé, sont généralement non remboursables."
              />

              <ExpandableItem
                title="Que se passe-t-il si le chef annule ou ne peut pas assurer la mission ?"
                content="Notre rôle est précisément d’éviter toute rupture. En cas d’indisponibilité du chef, nous activons immédiatement une solution de remplacement avec un profil équivalent. Si aucun remplacement n’est possible, les conditions de remboursement prévues s’appliquent."
              />

              <ExpandableItem
                title="Les chefs sont-ils vérifiés et assurés ?"
                content="Oui. Les chefs référencés sont sélectionnés pour leur expérience, leurs références et leurs certifications. Les éléments nécessaires (hygiène, assurances, statut professionnel) sont vérifiés lors de leur intégration."
              />

              <ExpandableItem
                title="Intervenez-vous hors de France ?"
                content="Oui. Certains chefs sont mobiles à l’international et habitués aux standards UHNW. Les missions à l’étranger sont étudiées au cas par cas selon la destination et les contraintes logistiques."
              />

              <ExpandableItem
                title="Que se passe-t-il si la prestation ne correspond pas aux attentes ?"
                content="Chaque mission est préparée en amont pour éviter toute mauvaise surprise. Si un ajustement est nécessaire pendant la prestation, nous restons disponibles afin d’intervenir rapidement et trouver une solution adaptée."
              />

              <ExpandableItem
                title="La prestation est-elle confidentielle ?"
                content="Absolument. La discrétion est un principe fondamental de Chef Talents. Les lieux, les clients, les chefs et les missions ne sont jamais exposés publiquement."
              />
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/request">
                <Button size="lg" className="w-full sm:w-auto">
                  Décrire mon besoin <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </Link>

              <a href={mailtoHref} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-stone-300 text-stone-600 hover:text-stone-900 sm:w-auto"
                >
                  Nous écrire
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </Section>
    </Layout>
  );
}

/* --- Sub-components --- */

const InteractiveCard = ({
  theme,
  icon: Icon,
  title,
  subtitle,
  description,
  hint,
  link,
  cta,
}: {
  theme: 'light' | 'dark';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  description: string;
  hint?: string;
  link: string;
  cta: string;
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`group relative flex flex-col justify-between border border-transparent p-12 transition-all duration-700 hover:border-stone-200 md:p-16 ${
        isDark ? 'bg-[#2E2B26] text-stone-100' : 'bg-paper text-stone-900'
      }`}
    >
      <div className="relative z-10 space-y-6">
        <Icon className={`h-6 w-6 ${isDark ? 'text-stone-300' : 'text-stone-400'}`} strokeWidth={1} />

        <div className="space-y-2">
          {subtitle ? (
            <p
              className={`text-[10px] font-medium uppercase tracking-[0.25em] ${
                isDark ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              {subtitle}
            </p>
          ) : null}

          <h3 className={`text-4xl font-serif font-normal ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {title}
          </h3>
        </div>

        <div className="max-w-md">
          <p className={`text-lg font-light leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {description}
          </p>

          {hint ? (
            <p className={`mt-6 text-sm font-light ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {hint}
            </p>
          ) : null}

          <div className="mt-10">
            <Link href={link}>
              <span
                className={`inline-flex items-center border-b pb-1 text-sm font-medium transition-all ${
                  isDark
                    ? 'border-stone-600 text-stone-400 hover:border-white hover:text-white'
                    : 'border-stone-300 text-stone-500 hover:border-stone-900 hover:text-stone-900'
                }`}
              >
                {cta} <ArrowRight className="ml-4 h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpandableItem = ({
  title,
  subtitle,
  content,
  isDefaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  content: string;
  isDefaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  return (
    <div className="border-b border-stone-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between py-8 text-left"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <h3 className="text-3xl font-serif font-normal text-stone-400 transition-colors group-hover:text-stone-900">
            {title}
          </h3>
          {subtitle ? (
            <span className="bg-stone-100 px-2 py-1 text-xs uppercase tracking-widest text-stone-500">
              {subtitle}
            </span>
          ) : null}
        </div>

        <span className={`text-xl font-light text-stone-300 transition-transform duration-500 ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-2 border-l border-stone-200 pb-8 pl-4">
              <p className="max-w-2xl text-lg font-light leading-relaxed text-stone-600">{content}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
