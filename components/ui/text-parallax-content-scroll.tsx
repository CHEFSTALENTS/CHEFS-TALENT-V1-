'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';

const IMG_PADDING = 12;

type TextParallaxSectionProps = {
  imgUrl: string;
  subheading: string;
  heading: string;
  children: React.ReactNode;
};

type ExampleContentBlockProps = {
  title: string;
  text1: string;
  text2?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export const TextParallaxContentExample = () => {
  return (
    <div className="bg-white">
      <TextParallaxContent
        imgUrl="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80"
        subheading="Chef Talents"
        heading="Des chefs privés, partout en Europe."
      >
        <ExampleContentBlock
          title="Une mise en relation pensée pour les missions exigeantes"
          text1="Chef Talents sélectionne et coordonne des chefs privés pour des villas, chalets, résidences et séjours à travers l’Europe."
          text2="Nous ne proposons pas un simple annuaire : nous analysons chaque besoin, qualifions la mission et identifions les profils réellement adaptés."
          ctaLabel="Décrire mon besoin"
          ctaHref="/request"
        />
      </TextParallaxContent>

      <TextParallaxContent
        imgUrl="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
        subheading="Exigence"
        heading="La qualité ne s’improvise pas."
      >
        <ExampleContentBlock
          title="Sélection, continuité, discrétion"
          text1="Nos chefs sont référencés selon leur niveau d’expérience, leur posture, leur mobilité et leur capacité à intervenir dans des environnements haut de gamme."
          text2="Nous sécurisons également la continuité des missions avec un suivi opérationnel rigoureux et des solutions de remplacement si nécessaire."
          ctaLabel="Nous écrire"
          ctaHref="mailto:contact@chefstalents.com"
        />
      </TextParallaxContent>

      <TextParallaxContent
        imgUrl="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
        subheading="Simplicité"
        heading="Une seule demande. Le bon chef."
      >
        <ExampleContentBlock
          title="Un brief unique, un traitement sur mesure"
          text1="Que votre besoin concerne un dîner privé, un séjour, une résidence longue, un yacht ou une demande plus complexe, vous remplissez un seul formulaire."
          text2="Notre équipe qualifie ensuite la demande et construit la meilleure réponse selon le lieu, les dates, les attentes et le niveau de service recherché."
          ctaLabel="Je suis une conciergerie"
          ctaHref="/conciergeries"
        />
      </TextParallaxContent>
    </div>
  );
};

const TextParallaxContent = ({
  imgUrl,
  subheading,
  heading,
  children,
}: TextParallaxSectionProps) => {
  return (
    <div
      style={{
        paddingLeft: IMG_PADDING,
        paddingRight: IMG_PADDING,
      }}
    >
      <div className="relative h-[150vh]">
        <StickyImage imgUrl={imgUrl} />
        <OverlayCopy heading={heading} subheading={subheading} />
      </div>
      {children}
    </div>
  );
};

const StickyImage = ({ imgUrl }: { imgUrl: string }) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['end end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

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
      className="sticky z-0 overflow-hidden rounded-3xl"
    >
      <motion.div
        className="absolute inset-0 bg-neutral-950/55"
        style={{
          opacity,
        }}
      />
    </motion.div>
  );
};

const OverlayCopy = ({
  subheading,
  heading,
}: {
  subheading: string;
  heading: string;
}) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [250, -250]);
  const opacity = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 1, 0]);

  return (
    <motion.div
      ref={targetRef}
      style={{
        y,
        opacity,
      }}
      className="absolute left-0 top-0 flex h-screen w-full flex-col items-center justify-center px-6 text-white"
    >
      <p className="mb-2 text-center text-lg md:mb-4 md:text-2xl">{subheading}</p>
      <p className="max-w-6xl text-center text-4xl font-bold leading-tight md:text-7xl">
        {heading}
      </p>
    </motion.div>
  );
};

const ExampleContentBlock = ({
  title,
  text1,
  text2,
  ctaLabel = 'En savoir plus',
  ctaHref = '/request',
}: ExampleContentBlockProps) => (
  <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-24 pt-12 md:grid-cols-12">
    <h2 className="col-span-1 text-3xl font-bold text-neutral-900 md:col-span-4">
      {title}
    </h2>

    <div className="col-span-1 md:col-span-8">
      <p className="mb-4 text-lg text-neutral-600 md:text-2xl">{text1}</p>
      {text2 ? <p className="mb-8 text-lg text-neutral-600 md:text-2xl">{text2}</p> : null}

      {ctaHref.startsWith('mailto:') ? (
        <a
          href={ctaHref}
          className="inline-flex w-full items-center justify-center rounded bg-neutral-900 px-9 py-4 text-lg text-white transition-colors hover:bg-neutral-700 md:w-fit"
        >
          {ctaLabel} <FiArrowUpRight className="ml-2 inline" />
        </a>
      ) : (
        <Link
          href={ctaHref}
          className="inline-flex w-full items-center justify-center rounded bg-neutral-900 px-9 py-4 text-lg text-white transition-colors hover:bg-neutral-700 md:w-fit"
        >
          {ctaLabel} <FiArrowUpRight className="ml-2 inline" />
        </Link>
      )}
    </div>
  </div>
);
