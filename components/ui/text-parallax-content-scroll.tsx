
'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Mail, MessageCircle } from 'lucide-react';

const IMG_PADDING = 12;
const SUPPORT_EMAIL = 'contact@chefstalents.com';
const WHATSAPP_NUMBER_E164 = '33756827612';
const WHATSAPP_PREFILL = encodeURIComponent(
  "Bonjour,\n\nJ’ai une demande Chefs Talents.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci."
);

type TextParallaxSectionProps = {
  imgUrl: string;
  subheading: string;
  heading: string;
  children: React.ReactNode;
};

type ContentBlockProps = {
  eyebrow?: string;
  title: string;
  text1: string;
  text2?: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export function ChefTalentsHome() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    'Demande Chefs Talents'
  )}&body=${encodeURIComponent(
    "Bonjour,\n\nJe souhaite faire une demande.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci,\n"
  )}`;

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${WHATSAPP_PREFILL}`;

  return (
    <div className="bg-[#f4f1eb] text-[#161616]">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-24 pt-28 md:px-10 lg:px-16 lg:pt-36">
        <div className="mx-auto grid max-w-7xl items-end gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="mb-8 h-12 w-px bg-[#161616]/70" />

            <p className="mb-6 text-[11px] uppercase tracking-[0.24em] text-[#7a7369]">
              Chefs Talents
            </p>

            <h1 className="max-w-4xl text-5xl font-serif leading-[0.96] tracking-tight md:text-7xl lg:text-[5.3rem]">
              Des chefs privés,
              <br />
              sélectionnés pour des
              <br />
              <span className="italic text-[#7a7369]">missions exigeantes.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-[#57534e] md:text-xl">
              Chefs Talents met en relation des chefs privés soigneusement sélectionnés avec des
              conciergeries, des résidences et des clients particuliers recherchant discrétion,
              constance et excellence opérationnelle à travers l’Europe.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/request"
                className="inline-flex items-center justify-center rounded-full bg-[#161616] px-8 py-4 text-sm font-medium text-white transition hover:bg-black"
              >
                Décrire mon besoin
              </Link>

              <Link
                href="/conciergeries"
                className="inline-flex items-center justify-center rounded-full border border-[#d6d0c7] bg-transparent px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ece7df]"
              >
                Je suis une conciergerie
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-5">
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-2 border-b border-[#cfc8bd] pb-1 text-sm text-[#6a655d] transition hover:border-[#161616] hover:text-[#161616]"
              >
                <Mail className="h-4 w-4" />
                Nous écrire
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border-b border-[#cfc8bd] pb-1 text-sm text-[#6a655d] transition hover:border-[#161616] hover:text-[#161616]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] bg-[#d9d3ca]">
           <img
  src="/images/editorial/hero-chef-talents.jpg"
  alt="Chef privé en résidence"
  className="h-full w-full object-cover"
/>
              <div className="absolute inset-0 bg-black/18" />
            </div>
          </div>
        </div>
      </section>

      {/* INTRO BLOCK */}
      <section className="px-6 pb-10 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl border-t border-[#d8d1c7] pt-10">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#7a7369]">
                Notre approche
              </p>
            </div>

            <div className="md:col-span-9">
              <h2 className="max-w-4xl text-3xl font-serif leading-tight text-[#161616] md:text-5xl">
                Plus qu’une réservation.
                <br />
                Une mise en relation maîtrisée.
              </h2>

              <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-[#57534e] md:text-xl">
                Chef Talents a été pensé pour les situations où la qualité, la continuité et la confiance
                priment sur la rapidité. Chaque mission est cadrée, qualifiée et suivie avec précision.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TextParallaxContent
        imgUrl="/images/editorial/private-dining-room.jpg"
        subheading="Positionnement"
        heading="Une mise en relation pensée pour les missions exigeantes."
      >
        <ContentBlock
          eyebrow="Positionnement"
          title="Nous ne proposons pas un simple annuaire"
          text1="Qu’il s’agisse d’un dîner privé, d’un séjour ou d’une résidence de longue durée, nous sélectionnons et accompagnons chaque mission avec rigueur."
          text2="Chaque demande est qualifiée, structurée et traitée avec précision afin d’identifier le bon profil, au bon endroit, au bon moment."
          ctaLabel="Décrire mon besoin"
          ctaHref="/request"
        />
      </TextParallaxContent>

      <TextParallaxContent
        imgUrl="/images/editorial/villa-service.jpg"
        subheading="Exigence"
        heading="Sélection, continuité, standards élevés."
      >
        <ContentBlock
          eyebrow="Pourquoi nous"
          title="Une sélection pensée pour les environnements premium"
          text1="Nos chefs sont sélectionnés selon leur niveau d’expérience, leur posture, leur mobilité et leur capacité d’adaptation dans des environnements haut de gamme."
          bullets={[
            'Des chefs sélectionnés',
            'Une couverture européenne avec expertise locale',
            'Gestion de la continuité et des remplacements',
            'Chefs multilingues, habitués aux standards UHNW',
            'Un interlocuteur unique pour les missions complexes',
          ]}
          ctaLabel="Je suis une conciergerie"
          ctaHref="/conciergeries"
        />
      </TextParallaxContent>

      {/* CONFIDENTIALITY */}
      <section className="bg-[#1b1b1b] px-6 py-24 text-white md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
              Confidentialité
            </p>
            <h2 className="mt-4 text-4xl font-serif leading-tight md:text-6xl">
              La discrétion
              <br />
              n’est pas une option.
            </h2>
          </div>

          <div className="md:col-span-8">
            <p className="max-w-3xl text-lg font-light leading-relaxed text-white/75 md:text-2xl">
              Nos chefs interviennent dans les villas, chalets, yachts et résidences privées à
              travers l’Europe. Les lieux, les clients et les missions ne sont jamais rendus publics.
            </p>

            <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-white/55 md:text-xl">
              Les références sont partagées de manière sélective. La confidentialité fait partie
              intégrante de notre méthode de travail.
            </p>

            <a
              href={mailtoHref}
              className="mt-10 inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-sm font-medium text-white transition hover:bg-white/5"
            >
              Nous écrire
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* SELECTION */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7a7369]">Sélection</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-serif leading-tight md:text-6xl">
            Deux niveaux de sélection,
            <br />
            selon vos exigences.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-[#57534e]">
            Tous les chefs de Chef Talents ne sont pas éligibles à la Sélection Select.
          </p>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <SelectionCard
              title="Sélection publique"
              subtitle="Clients particuliers"
              description="Une sélection de chefs privés validés, accessible pour des prestations ponctuelles ou récurrentes."
            />

            <SelectionCard
              title="Sélection"
              subtitle="Réservée aux conciergeries"
              description="Une sélection avancée regroupant des chefs approuvés pour des missions à forts enjeux, de longue durée ou récurrentes."
              dark
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#efe9df] px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[30px] bg-[#161616] px-8 py-12 text-white md:px-14 md:py-16">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Demande unique</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-serif leading-tight md:text-6xl">
              Une seule demande.
              <br />
              La bonne réponse.
            </h2>
            <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-white/70">
              Dîner privé, séjour, résidence longue, yacht ou demande plus complexe : vous remplissez
              une seule demande, notre équipe qualifie ensuite le besoin et construit la meilleure réponse.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/request"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#161616] transition hover:bg-[#ece7df]"
              >
                Décrire mon besoin <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/conciergeries"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Je suis une conciergerie
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7a7369]">FAQ</p>
          <h2 className="mt-4 text-4xl font-serif leading-tight md:text-6xl">
            Questions fréquentes
          </h2>
          <p className="mt-6 text-lg font-light leading-relaxed text-[#57534e]">
            L’essentiel, avant de nous transmettre votre brief.
          </p>

          <div className="mt-12 border-t border-[#d6d0c7]">
            <FaqItem
              title="Que se passe-t-il après l’envoi de ma demande ?"
              content="Nous analysons votre brief (lieu, dates, attentes, budget), puis nous revenons vers vous avec une sélection de chefs disponibles et pertinents. Vous validez un profil, et nous coordonnons ensuite l’ensemble de la mission."
              isDefaultOpen
            />
            <FaqItem
              title="Est-ce que je choisis le chef ?"
              content="Oui. Chefs Talents fonctionne comme un intermédiaire curateur : nous présélectionnons des profils adaptés, et vous choisissez celui qui correspond le mieux à votre style, vos contraintes et votre niveau d’exigence."
            />
            <FaqItem
              title="Quand le paiement est-il effectué ?"
              content="Le paiement dépend de la nature et de la durée de la mission. Pour certaines prestations ponctuelles, le règlement intervient une fois le chef sélectionné afin de confirmer la mission. Pour les missions plus longues ou plus complexes, les modalités sont précisées en amont avec transparence."
            />
            <FaqItem
              title="Pourquoi des frais de service sont-ils demandés ?"
              content="Les frais de service couvrent la sélection des chefs, la coordination, la sécurisation de la mission et le suivi opérationnel."
            />
            <FaqItem
              title="Que se passe-t-il si le chef annule ou ne peut pas assurer la mission ?"
              content="En cas d’indisponibilité du chef, nous activons immédiatement une solution de remplacement avec un profil équivalent."
            />
            <FaqItem
              title="La prestation est-elle confidentielle ?"
              content="Absolument. La discrétion est un principe fondamental de Chef Talents."
            />
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/request"
              className="inline-flex items-center justify-center rounded-full bg-[#161616] px-8 py-4 text-sm font-medium text-white transition hover:bg-black"
            >
              Décrire mon besoin <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center rounded-full border border-[#d6d0c7] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ece7df]"
            >
              Nous écrire
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#d6d0c7] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ece7df]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function TextParallaxContent({
  imgUrl,
  subheading,
  heading,
  children,
}: TextParallaxSectionProps) {
  return (
    <div
      style={{
        paddingLeft: IMG_PADDING,
        paddingRight: IMG_PADDING,
      }}
    >
      <div className="relative h-[125vh]">
        <StickyImage imgUrl={imgUrl} />
        <OverlayCopy subheading={subheading} heading={heading} />
      </div>
      {children}
    </div>
  );
}

function StickyImage({ imgUrl }: { imgUrl: string }) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['end end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.28]);

  return (
    <motion.div
      ref={targetRef}
      style={{
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: `calc(100vh - ${IMG_PADDING * 2}px)`,
        top: IMG_PADDING,
        scale,
      }}
      className="sticky z-0 overflow-hidden rounded-[30px]"
    >
      <motion.div className="absolute inset-0 bg-black/50" style={{ opacity }} />
    </motion.div>
  );
}

function OverlayCopy({
  subheading,
  heading,
}: {
  subheading: string;
  heading: string;
}) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [160, -160]);
  const opacity = useTransform(scrollYProgress, [0.2, 0.45, 0.75], [0, 1, 0]);

  return (
    <motion.div
      ref={targetRef}
      style={{ y, opacity }}
      className="absolute left-0 top-0 flex h-screen w-full flex-col items-center justify-center px-6 text-white"
    >
      <p className="mb-4 text-center text-[11px] uppercase tracking-[0.24em] text-white/75 md:text-sm">
        {subheading}
      </p>
      <h2 className="max-w-6xl text-center text-4xl font-serif leading-tight md:text-6xl lg:text-8xl">
        {heading}
      </h2>
    </motion.div>
  );
}

function ContentBlock({
  eyebrow,
  title,
  text1,
  text2,
  bullets,
  ctaLabel = 'En savoir plus',
  ctaHref = '/request',
}: ContentBlockProps) {
  const isMail = ctaHref.startsWith('mailto:');

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-24 pt-14 md:grid-cols-12">
      <div className="md:col-span-4">
        {eyebrow ? (
          <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-[#7a7369]">
            {eyebrow}
          </p>
        ) : null}

        <h3 className="text-3xl font-serif leading-tight text-[#161616]">{title}</h3>
      </div>

      <div className="md:col-span-8">
        <p className="mb-5 text-lg font-light leading-relaxed text-[#57534e] md:text-2xl">
          {text1}
        </p>

        {text2 ? (
          <p className="mb-8 text-lg font-light leading-relaxed text-[#57534e] md:text-2xl">
            {text2}
          </p>
        ) : null}

        {bullets && bullets.length > 0 ? (
          <ul className="mb-8 space-y-3 text-lg font-light leading-relaxed text-[#57534e] md:text-xl">
            {bullets.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        ) : null}

        {isMail ? (
          <a
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-[#161616] px-7 py-4 text-sm font-medium text-white transition hover:bg-black"
          >
            {ctaLabel}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </a>
        ) : (
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-[#161616] px-7 py-4 text-sm font-medium text-white transition hover:bg-black"
          >
            {ctaLabel}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function SelectionCard({
  title,
  subtitle,
  description,
  dark = false,
}: {
  title: string;
  subtitle?: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[30px] border p-8 md:p-10 ${
        dark
          ? 'border-transparent bg-[#161616] text-white'
          : 'border-[#d6d0c7] bg-white text-[#161616]'
      }`}
    >
      {subtitle ? (
        <p
          className={`mb-4 text-[11px] uppercase tracking-[0.22em] ${
            dark ? 'text-white/45' : 'text-[#7a7369]'
          }`}
        >
          {subtitle}
        </p>
      ) : null}

      <h3 className="text-3xl font-serif leading-tight">{title}</h3>
      <p className={`mt-5 text-lg font-light leading-relaxed ${dark ? 'text-white/70' : 'text-[#57534e]'}`}>
        {description}
      </p>
    </div>
  );
}

function FaqItem({
  title,
  content,
  isDefaultOpen = false,
}: {
  title: string;
  content: string;
  isDefaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  return (
    <div className="border-b border-[#d6d0c7]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-7 text-left"
      >
        <span className="pr-6 text-xl font-serif text-[#161616] md:text-2xl">{title}</span>
        <span className={`text-2xl text-[#8a7f73] transition-transform ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="pb-7 pr-8 text-lg font-light leading-relaxed text-[#57534e]">
              {content}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
