'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, ShieldCheck, Mail, MessageCircle } from 'lucide-react';
import { Button, Section, Reveal, Marker, Label } from '../components/ui';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';

/** ✅ CONFIG CONTACT (remplace ces valeurs) */
const SUPPORT_EMAIL = 'thomas@chef-talents.com';
const WHATSAPP_NUMBER_E164 = '33756827612'; // ex: 33623846170 (sans +)
const WHATSAPP_PREFILL = encodeURIComponent(
  "Bonjour, j'ai une demande Chef Talents. Pouvez-vous m’aider ?"
);

export default function Home() {
  const mailtoHref = `mailto:${contact@chefstalents.com}?subject=${encodeURIComponent(
    'Demande Chef Talents'
  )}&body=${encodeURIComponent(
    "Bonjour,\n\nJe souhaite faire une demande.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci,\n"
  )}`;

  const whatsappHref = `https://wa.me/${+33756827612}?text=${WHATSAPP_PREFILL}`;

  return (
    <Layout>
      {/* Hero Section - Split Layout */}
      <section className="relative min-h-screen grid md:grid-cols-12 pt-24 md:pt-0 bg-paper">
        {/* Left: Text Content */}
        <div className="md:col-span-7 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-20 md:py-0 order-2 md:order-1">
          <div className="max-w-2xl">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 48 }}
              transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-[1px] bg-stone-900 mb-12 hidden md:block"
            />

            <Reveal>
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif text-stone-900 leading-[1] tracking-tight mb-12">
                Des chefs privés, <br />
                sélectionnés pour des <br />
                <span className="italic text-stone-500">lieux d’exception.</span>
              </h1>

              <p className="text-lg md:text-xl text-stone-600 font-light max-w-lg leading-relaxed mb-6">
                Chef Talents met en relation des chefs privés soigneusement sélectionnés avec des conciergeries, des
                résidences et des clients particuliers exigeant constance, discrétion et excellence opérationnelle,
                partout en Europe.
              </p>

              {/* ✅ phrase concrète */}
              <p className="text-sm text-stone-500 font-light mb-12">
                Dîners privés • séjours en résidence • yachts • événements • remplacements longue durée
              </p>

              {/* ✅ CTA simplifiés : 1 principal + 1 secondaire */}
              <div className="flex flex-col sm:flex-row gap-6">
                <Link href="/request">
                  <Button size="lg" className="w-full sm:w-auto">
                    Décrire mon besoin
                  </Button>
                </Link>

                <Link href="/conciergeries">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-stone-300 text-stone-600 hover:text-stone-900"
                  >
                    Je suis une conciergerie
                  </Button>
                </Link>
              </div>

              {/* ✅ contacts rapides mail / whatsapp */}
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 border-b border-stone-200 hover:border-stone-900 transition"
                >
                  <Mail className="w-4 h-4" />
                  Nous écrire
                </a>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 border-b border-stone-200 hover:border-stone-900 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Right: Single Image (no background) */}
        <div className="md:col-span-5 relative min-h-[55vh] md:min-h-screen order-1 md:order-2 overflow-hidden">
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

      {/* Positioning - Warm Background */}
      <Section className="bg-stone-100">
        <div className="grid md:grid-cols-12 gap-16 items-start">
          <div className="md:col-span-3 hidden md:block">
            <Marker />
            <Label>Notre approche</Label>
          </div>
          <div className="md:col-span-9">
            <Reveal>
              <p className="text-3xl md:text-5xl font-serif text-stone-800 leading-tight">
                Plus qu’une réservation.<br />
                <span className="text-stone-400">Une mise en relation maîtrisée.</span>
              </p>
              <div className="mt-8 mb-10 max-w-3xl">
                <p className="text-lg text-stone-600 font-light leading-relaxed">
                  Chef Talents a été pensé pour les situations où la qualité, la continuité et la confiance priment sur
                  la rapidité. Qu’il s’agisse d’un dîner privé ou d’une résidence de longue durée, nous sélectionnons et
                  accompagnons chaque mission avec rigueur.
                </p>
              </div>

              {/* ✅ mini how it works */}
              <ul className="text-stone-600 font-light space-y-2 mb-16">
                <li>• Vous décrivez votre besoin (lieu, dates, style, budget)</li>
                <li>• Nous sélectionnons les chefs disponibles et pertinents</li>
                <li>• Vous choisissez, nous coordonnons (service, logistique, continuité)</li>
              </ul>

              <div className="grid md:grid-cols-2 gap-12 border-t border-stone-200 pt-12">
                <div>
                  <h4 className="font-serif text-xl mb-6">Pourquoi nous ?</h4>
                  <ul className="text-stone-600 font-light space-y-3">
                    <li>Des chefs sélectionnés</li>
                    <li>Une couverture européenne avec expertise locale</li>
                    <li>Gestion de la continuité et des remplacements</li>
                    <li>Chefs multilingues, habitués aux standards UHNW</li>
                    <li>Un interlocuteur unique pour les missions complexes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-serif text-xl mb-6">La discrétion comme principe</h4>
                  <p className="text-stone-600 font-light leading-relaxed">
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

      {/* Visual Break – Chalet with CTA */}
      <section className="relative bg-paper">
        <Reveal>
          <div className="relative h-[70vh] md:h-[85vh] overflow-hidden flex items-center justify-center">
            <Image
              src="/images/editorial/chalet-cuisine.png"
              alt="Cuisine ouverte dans un chalet avec vue montagne"
              fill
              className="object-cover"
              priority
            />

            <div className="absolute inset-0 bg-stone-900/35" />

            <div className="relative z-10 text-center px-6 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-serif text-white italic mb-8">
                Présentez-nous votre besoin.
              </h2>

              <p className="text-stone-200 text-lg font-light mb-12">
                Nous vous répondrons avec une proposition adaptée à vos attentes et à votre niveau d’exigence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/request">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-stone-900 transition-all"
                  >
                    Décrire mon besoin
                  </Button>
                </Link>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/60 text-white hover:bg-white hover:text-stone-900 transition-all"
                  >
                    WhatsApp <ArrowRight className="ml-3 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Roster Section - Paper Background (déplacée après CTA) */}
      <Section className="bg-paper">
        <div className="grid md:grid-cols-12 gap-24 items-center">
          <div className="md:col-span-6 relative">
            <Reveal>
              <div className="aspect-[3/4] overflow-hidden relative">
                <Image
                  src="/images/editorial/professional-kitchen-preparation.png"
                  alt="Préparation en cuisine professionnelle"
                  fill
                  className="object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
                />
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-6 space-y-16">
            <Reveal>
              <Marker />
              <h2 className="text-4xl md:text-5xl font-serif mb-8 text-stone-900 font-normal leading-tight">
                Deux niveaux de sélection, selon vos exigences.
              </h2>
              <p className="text-lg text-stone-500 font-light leading-relaxed max-w-md">
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
                content="Une sélection avancée, destinée aux conciergeries et propriétés, regroupant des chefs approuvés pour des missions à forts enjeux, de longue durée ou récurrentes."
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Match Types - Warm Cards */}
      <section className="py-32 px-6 md:px-12 bg-stone-100">
        <div className="max-w-[100rem] mx-auto">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-12">
              <InteractiveCard
                theme="light"
                icon={Star}
                title="Fast Match"
                subtitle="DATE UNIQUE"
                description="Pour des demandes simples, sur une date unique. Nous identifions des chefs disponibles correspondant à votre brief et encadrons la mission dans des conditions claires."
                hint="Si votre demande nécessite un process plus accompagné, nous vous orientons vers l’autre format."
                link="/request"
                cta="Décrire mon besoin"
              />

              <InteractiveCard
                theme="dark"
                icon={ShieldCheck}
                title="Concierge Match"
                subtitle="DEMANDE COMPLEXE"
                description="Pour les demandes complexes. Séjours prolongés, résidences, yachts ou exigences particulières sont gérés via un processus accompagné et curaté par notre équipe."
                hint="Vous ne pouvez pas vous tromper : on valide ensemble le format après votre brief."
                link="/request"
                cta="Décrire mon besoin"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ✅ FAQ visible (courte, stratégique) */}
      <Section className="bg-paper">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="flex items-end justify-between gap-6">
              <div>
                <Marker />
                <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mt-6">
                  Questions fréquentes
                </h2>
                <p className="text-stone-500 font-light mt-4">
                  L’essentiel, avant de nous transmettre votre brief.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 border-b border-stone-200 hover:border-stone-900 transition"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 border-b border-stone-200 hover:border-stone-900 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-12 border-t border-stone-200">
              <ExpandableItem
                title="Que se passe-t-il après l’envoi de ma demande ?"
                isDefaultOpen
                content="Nous analysons votre brief, puis nous revenons vers vous avec une sélection de chefs disponibles et pertinents. Vous choisissez, et nous coordonnons ensuite la mission."
              />
              <ExpandableItem
                title="Est-ce que je choisis le chef ?"
                content="Oui. Nous proposons une sélection curatée et vous choisissez le profil qui correspond le mieux à votre style, vos contraintes et vos attentes."
              />
              <ExpandableItem
                title="Quand paye-t-on ?"
                content="Le paiement dépend du type de mission. Pour les dates uniques, le règlement se fait une fois le chef sélectionné. Pour les missions longues, nous facturons les frais de service à la réservation puis le reste selon le planning convenu."
              />
              <ExpandableItem
                title="Et si le chef ne convient pas / se désiste ?"
                content="Notre rôle est d’assurer la continuité. Si un remplacement est nécessaire, nous relançons la recherche et proposons une alternative adaptée, sans vous laisser seul dans l’urgence."
              />
              <ExpandableItem
                title="Intervenez-vous hors de France ?"
                content="Oui, selon les profils et les disponibilités. Certains chefs sont mobiles à l’international et habitués aux standards UHNW."
              />
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/request">
                <Button size="lg" className="w-full sm:w-auto">
                  Décrire mon besoin <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </Link>
              <a href={mailtoHref} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-stone-300 text-stone-600 hover:text-stone-900"
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

const InteractiveCard = ({ theme, icon: Icon, title, subtitle, description, hint, link, cta }: any) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`group relative flex flex-col justify-between p-12 md:p-16 transition-all duration-700 border border-transparent hover:border-stone-200 ${
        isDark ? 'bg-[#2E2B26] text-stone-100' : 'bg-paper text-stone-900'
      }`}
    >
      <div className="relative z-10 space-y-6">
        <Icon className={`h-6 w-6 ${isDark ? 'text-bronze' : 'text-stone-400'}`} strokeWidth={1} />

        <div className="space-y-2">
          <p
            className={`text-[10px] uppercase tracking-[0.25em] font-medium ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}
          >
            {subtitle}
          </p>

          <h3 className={`text-4xl font-serif font-normal ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {title}
          </h3>
        </div>

        <div className="max-w-md">
          <p className={`text-lg font-light leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {description}
          </p>

          {/* ✅ anti “peur de se tromper” */}
          {hint ? (
            <p className={`text-sm font-light mt-6 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              {hint}
            </p>
          ) : null}

          <div className="mt-10">
            <Link href={link}>
              <span
                className={`inline-flex items-center text-sm font-medium border-b pb-1 transition-all ${
                  isDark
                    ? 'border-stone-600 text-stone-400 hover:text-white hover:border-white'
                    : 'border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-900'
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
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left group py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h3 className="text-3xl font-serif font-normal text-stone-400 group-hover:text-stone-900 transition-colors">
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs uppercase tracking-widest text-stone-500 bg-stone-100 px-2 py-1">{subtitle}</span>
          )}
        </div>
        <span className={`text-xl font-light text-stone-300 transition-transform duration-500 ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-8 pl-4 border-l border-stone-200 ml-2">
              <p className="text-stone-600 text-lg font-light leading-relaxed max-w-2xl">{content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
