'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, ShieldCheck } from 'lucide-react';
import { Button, Section, Reveal, Marker, Label } from '../components/ui';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
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

              <p className="text-lg md:text-xl text-stone-600 font-light max-w-lg leading-relaxed mb-12">
                Chef Talents met en relation des chefs privés soigneusement sélectionnés avec des conciergeries, des résidences et des clients particuliers exigeant constance, discrétion et excellence opérationnelle, partout en Europe.
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link href="/conciergeries">
                  <Button size="lg" className="w-full sm:w-auto">
                    Pour les conciergeries
                  </Button>
                </Link>
                <Link href="/private-clients">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-stone-300 text-stone-600 hover:text-stone-900"
                  >
                    Pour les clients privés
                  </Button>
                </Link>
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
                <span className="text-stone-400">Une prise en charge maîtrisée.</span>
              </p>
              <div className="mt-8 mb-16 max-w-3xl">
                <p className="text-lg text-stone-600 font-light leading-relaxed">
                  Chef Talents a été pensé pour les situations où la qualité, la continuité et la confiance priment sur la rapidité. Qu’il s’agisse d’un dîner privé ou d’une résidence de longue durée, nous sélectionnons et accompagnons chaque mission avec rigueur.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 border-t border-stone-200 pt-12">
                <div>
                  <h4 className="font-serif text-xl mb-6">Pourquoi nous ?</h4>
                  <ul className="text-stone-600 font-light space-y-3">
                    <li>— Des chefs sélectionnés, jamais en libre accès</li>
                    <li>— Une couverture européenne avec expertise locale</li>
                    <li>— Gestion de la continuité et des remplacements</li>
                    <li>— Chefs multilingues, habitués aux standards UHNW</li>
                    <li>— Un interlocuteur unique pour les missions complexes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-serif text-xl mb-6">La discrétion comme principe</h4>
                  <p className="text-stone-600 font-light leading-relaxed">
                    Nos chefs interviennent dans des villas, chalets et résidences privées à travers l’Europe. Les lieux, les clients et les missions ne sont jamais rendus publics. Les références sont partagées de manière sélective.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Roster Section - Paper Background */}
      <Section className="bg-paper">
        <div className="grid md:grid-cols-12 gap-24 items-center">
          <div className="md:col-span-6 relative">
            <Reveal>
              <div className="aspect-[3/4] overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop"
                  alt="Kitchen preparation"
                  className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
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
                title="Sélection Select"
                subtitle="Réservée aux conciergeries"
                isDefaultOpen
                content="Une sélection avancée, destinée aux conciergeries et propriétés, regroupant des chefs approuvés pour des missions à forts enjeux, de longue durée ou récurrentes."
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Full Width Visual Break - Final CTA Content */}
      <section className="relative py-40 md:py-64 bg-stone-900 text-stone-100 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1595856488371-d820d2919379?q=80&w=2070&auto=format&fit=crop"
            alt="Warm interior dining"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-serif italic mb-8">"Présentez-nous votre besoin."</h2>
            <p className="text-stone-300 text-lg font-light max-w-xl mx-auto mb-12">
              Nous vous répondrons avec une proposition adaptée à vos attentes et à votre niveau d’exigence.
            </p>
            <Link href="/request">
              <Button className="bg-paper text-stone-900 border-none hover:bg-white px-12 h-16">
                Soumettre une demande
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

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
                link="/private-clients"
                cta="Démarrer Fast Match"
              />

              <InteractiveCard
                theme="dark"
                icon={ShieldCheck}
                title="Concierge Match"
                subtitle="DEMANDE COMPLEXE"
                description="Pour les demandes complexes ou sensibles. Séjours prolongés, résidences, yachts ou exigences particulières sont gérés via un processus accompagné et curaté par notre équipe."
                link="/conciergeries"
                cta="Contacter l'équipe"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}

// --- Sub-components for Home Page ---

const InteractiveCard = ({ theme, icon: Icon, title, subtitle, description, link, cta }: any) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`group relative flex flex-col justify-between p-12 md:p-16 transition-all duration-700 border border-transparent hover:border-stone-200 ${
        isDark ? 'bg-[#2E2B26] text-stone-100' : 'bg-paper text-stone-900'
      }`}
    >
      <div className="relative z-10 space-y-8">
        <Icon className={`h-6 w-6 ${isDark ? 'text-bronze' : 'text-stone-400'}`} strokeWidth={1} />

        <div className="space-y-2">
          <p className={`text-[10px] uppercase tracking-[0.25em] font-medium ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
            {subtitle}
          </p>
          <h3 className="text-4xl font-serif font-normal">{title}</h3>
        </div>

        <div className="max-w-md">
          <p className={`text-lg font-light leading-relaxed mb-12 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            {description}
          </p>
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
          {subtitle && <span className="text-xs uppercase tracking-widest text-stone-500 bg-stone-100 px-2 py-1">{subtitle}</span>}
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
