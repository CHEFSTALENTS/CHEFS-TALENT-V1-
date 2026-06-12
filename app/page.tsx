'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ProcessTimeline from '@/components/landing/ProcessTimeline';
import FloatingCTA from '@/components/landing/FloatingCTA';

const SUPPORT_EMAIL = 'contact@chefstalents.com';
const WHATSAPP_NUMBER_E164 = '33756827612';
const WHATSAPP_PREFILL = encodeURIComponent(
  "Bonjour,\n\nJ'ai une demande Chef Talents.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci."
);

const FAQ_ITEMS = [
  {
    title: "Que se passe-t-il après l'envoi de ma demande ?",
    content:
      "Nous analysons votre brief (lieu, dates, attentes, budget), puis nous revenons vers vous avec une sélection de chefs disponibles et pertinents dans les 6 heures. Vous validez un profil, et nous coordonnons ensuite l'ensemble de la mission.",
  },
  {
    title: "Est-ce que je choisis le chef ?",
    content:
      "Oui. Chefs Talents fonctionne comme un intermédiaire qui présélectionne deux ou trois profils. Vous choisissez celui qui colle le mieux à votre style et à vos contraintes.",
  },
  {
    title: "Quand le paiement est-il effectué ?",
    content:
      "Le paiement dépend de la nature et de la durée de la mission. Pour certaines prestations ponctuelles, le règlement intervient une fois le chef sélectionné afin de confirmer la mission. Pour les missions plus longues ou plus complexes, les modalités sont précisées en amont avec transparence.",
  },
  {
    title: "Pourquoi des frais de service sont-ils demandés ?",
    content:
      "Les frais de service couvrent la sélection des chefs, la coordination, la sécurisation de la mission et le suivi opérationnel.",
  },
  {
    title: "Que se passe-t-il si le chef annule ou ne peut pas assurer la mission ?",
    content:
      "En cas d'indisponibilité du chef, nous activons immédiatement une solution de remplacement avec un profil équivalent.",
  },
  {
    title: "La prestation est-elle confidentielle ?",
    content:
      "Absolument. La discrétion est un principe fondamental de Chefs Talents. Les lieux, clients et détails des missions ne sont jamais rendus publics.",
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.title,
    acceptedAnswer: { '@type': 'Answer', text: item.content },
  })),
};

const DESTINATIONS_FEATURED = [
  { name: 'Saint-Tropez', country: 'France', emoji: '🇫🇷' },
  { name: 'Ibiza', country: 'Espagne', emoji: '🇪🇸' },
  { name: 'Mykonos', country: 'Grèce', emoji: '🇬🇷' },
  { name: 'Courchevel', country: 'France', emoji: '🇫🇷' },
  { name: 'Monaco', country: 'Monaco', emoji: '🇲🇨' },
  { name: 'Sardaigne', country: 'Italie', emoji: '🇮🇹' },
  { name: 'Cannes', country: 'France', emoji: '🇫🇷' },
  { name: 'Dubaï', country: 'Émirats', emoji: '🇦🇪' },
  { name: 'Portofino', country: 'Italie', emoji: '🇮🇹' },
  { name: 'Cap Ferrat', country: 'France', emoji: '🇫🇷' },
  { name: 'Verbier', country: 'Suisse', emoji: '🇨🇭' },
  { name: 'Positano', country: 'Italie', emoji: '🇮🇹' },
];

// ── Switcher de langue ────────────────────────────────────────
function LangSwitcher() {
  const router = useRouter();
  const langs = [
    { code: 'fr', label: 'FR', href: '/' },
    { code: 'en', label: 'EN', href: '/en' },
    { code: 'es', label: 'ES', href: '/es' },
  ];

  return (
    <div className="inline-flex items-center rounded-full border border-white/30 overflow-hidden">
      {langs.map((l, i) => (
        <Link
          key={l.code}
          href={l.href}
          className={[
            'px-4 py-1.5 text-xs font-medium tracking-wide transition',
            i > 0 ? 'border-l border-white/20' : '',
            l.code === 'fr'
              ? 'bg-white text-[#161616] cursor-default'
              : 'text-white/70 hover:text-white hover:bg-white/10',
          ].join(' ')}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default function ChefTalentsHome() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    'Demande Chef Talents'
  )}&body=${encodeURIComponent(
    "Bonjour,\n\nJe souhaite faire une demande.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci,\n"
  )}`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${WHATSAPP_PREFILL}`;

  return (
    <div className="bg-white text-[#161616] flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* CTA flottant mobile — apparaît au scroll, donne toujours un point d'action */}
      <FloatingCTA whatsappHref={whatsappHref} />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[680px] w-full overflow-hidden">
        {/* Vidéo hero — extraite et compressée depuis 0612.mov (33 MB → 1.3 MB)
            Poster = frame extraite de la vidéo (cohérence visuelle dès le chargement).
            autoplay+muted+playsInline = compat iOS, preload metadata = LCP léger.
        */}
        <motion.video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/editorial/hero-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </motion.video>
        <motion.div
          className="absolute inset-0 bg-black/58"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/28 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-black/10" />

        {/* ── Switcher langue en haut à droite ── */}
        <div className="absolute top-6 right-6 z-20 md:top-8 md:right-10 lg:right-20">
          <LangSwitcher />
        </div>

        <div className="relative z-10 flex h-full items-center justify-center px-6 pb-14 md:px-12 lg:px-20 text-center">
          <motion.div
            className="max-w-[820px] text-white"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-6 text-[10px] uppercase tracking-[0.4em] text-white/80">Chefs Talents</p>
            <h1 className="text-[2.6rem] leading-[1.02] tracking-tight text-white md:text-6xl lg:text-[4.4rem] font-serif">
              Le chef qu'il vous faut,<br /><span className="italic font-light text-[#d4a86a]">sur place</span>, sans surprise.
            </h1>
            <p className="mt-7 mx-auto max-w-[560px] text-[16px] leading-[1.7] text-white/85 md:text-[17px]">
              On place des chefs privés dans des villas, des yachts et des résidences en Europe depuis 2023. Sélection à la main.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/request" className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-[#161616] transition hover:bg-white/90">
                Décrire mon besoin
              </Link>
              <Link href="/conciergeries" className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-white/45 px-8 text-sm font-medium text-white transition hover:bg-white/10">
                Je suis une conciergerie
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS — bandeau minimaliste blanc cassé ────────── */}
      <section className="bg-[#fafaf8] border-y border-[#e8e1d4] px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '400+', label: 'Chefs', sub: 'sélectionnés un par un' },
              { value: '400+', label: 'Missions', sub: 'depuis juin 2023' },
              { value: '50+', label: 'Destinations', sub: 'Europe, Méditerranée' },
              { value: '< 6h', label: 'Réponse', sub: 'Thomas ou l\'équipe' },
            ].map((stat, i) => (
              <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <p className="font-serif text-[2.2rem] leading-none text-[#161616] md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-[13px] font-medium text-[#3f3a34]">{stat.label}</p>
                <p className="mt-0.5 text-[11px] text-[#8a7f73]">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POSITIONING — centré, court, accent ──────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d756a]">Comment on travaille</p>
          <h2 className="mt-5 font-serif text-[2.2rem] leading-[1.08] text-[#161616] md:text-[3.6rem]">
            Pas une marketplace.<br />
            <span className="italic font-light text-[#7f1d1d]">Trois au téléphone.</span>
          </h2>
          <p className="mt-7 mx-auto max-w-[560px] text-[17px] leading-[1.7] text-[#59544d] md:text-lg">
            Aucun moteur de recherche, aucune liste à parcourir. Vous nous racontez votre mission, on revient avec deux ou trois noms qu'on connaît personnellement.
          </p>
        </div>
      </section>

      {/* ── DESTINATIONS — version centrée compacte ──────── */}
      <section className="bg-[#fafaf8] px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d756a]">Où on opère</p>
            <h2 className="mt-5 font-serif text-[2.2rem] leading-[1.08] text-[#161616] md:text-[3.4rem]">
              Là où vous <span className="italic font-light text-[#7f1d1d]">passez l'été</span>.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {DESTINATIONS_FEATURED.slice(0, 8).map((dest, i) => (
                  <motion.div key={dest.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                    <Link
                      href={`/destinations/chef-prive-${dest.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/'/g, '-')}`}
                      className="group flex flex-col items-center text-center rounded-[16px] border border-[#e8e1d4] bg-white px-3 py-4 transition hover:border-[#7f1d1d]/30 hover:shadow-sm"
                    >
                      <span className="text-lg mb-1.5">{dest.emoji}</span>
                      <p className="text-[13px] font-medium text-[#161616]">{dest.name}</p>
                      <p className="text-[11px] text-[#8a7f73] mt-0.5">{dest.country}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
          <div className="mt-10 text-center">
            <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-medium text-[#7f1d1d] hover:opacity-80 transition">
              Voir les 50 destinations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMMENT ON VALIDE UN CHEF — centré, épuré ──── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d756a]">Comment on valide un chef</p>
            <h2 className="mt-5 font-serif text-[2.2rem] leading-[1.08] text-[#161616] md:text-[3.4rem]">
              Un process <span className="italic font-light text-[#7f1d1d]">de vérification</span>.
            </h2>
            <p className="mt-6 mx-auto max-w-[520px] text-[16px] leading-[1.7] text-[#59544d]">
              Pas de candidature acceptée d'office. Chaque chef passe par une évaluation avant d'intégrer le réseau.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ValueCard text="Vérification du background professionnel et du parcours" />
            <ValueCard text="Évaluation du niveau cuisine (CV, références, cas pratiques)" />
            <ValueCard text="NDA signé — confidentialité contractuelle dès l'entrée" />
            <ValueCard text="Langues parlées et mobilité vérifiées" />
            <ValueCard text="Statut professionnel en règle (micro-entreprise, salariat, KBIS)" />
            <ValueCard text="Engagement écrit sur la discrétion réseaux sociaux" />
          </div>
        </div>
      </section>

      {/* ── CONFIDENTIALITÉ — centrée, raccourcie ──────── */}
      <section className="bg-[#161616] px-6 py-24 text-white md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/72">Ce qu'on ne dit pas</p>
          <h2 className="mt-5 font-serif text-[2.2rem] leading-[1.08] text-white md:text-[3.6rem]">
            Vous ne verrez aucun <span className="italic font-light text-[#d4a86a]">témoignage</span> ici.
          </h2>
          <p className="mt-7 mx-auto max-w-[520px] text-[16px] leading-[1.7] text-white/85 md:text-[17px]">
            C'est volontaire. Nos clients préfèrent. Ni photo de villa, ni prénom de famille, ni post qui géolocalise leur été. Les références, on les transmet en direct au téléphone.
          </p>
        </div>
      </section>

      {/* ── PROCESS — timeline animée 8 étapes ─────────────── */}
      <ProcessTimeline />

      {/* ── CTA INTERMÉDIAIRE — après la timeline ────────── */}
      <section className="bg-[#f4efe8] px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[18px] font-light leading-8 text-[#59544d] md:text-xl">
            Vous voyez le déroulé. Reste à nous dire ce dont vous avez besoin.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/request" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#161616] px-8 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
              Décrire mon besoin <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-[#161616]/20 px-8 text-sm font-medium text-[#161616] transition hover:bg-[#161616]/5 sm:w-auto">
              WhatsApp — Thomas
            </a>
          </div>
        </div>
      </section>

      {/* ── CE QU'ON COUVRE — centré, 3 cartes serrées ──── */}
      <section className="bg-[#fafaf8] px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d756a]">Ce qu'on couvre</p>
            <h2 className="mt-5 font-serif text-[2.2rem] leading-[1.08] text-[#161616] md:text-[3.4rem]">
              Du dîner unique <span className="italic font-light text-[#7f1d1d]">à la saison</span> entière.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-[#e8e1d4] bg-white p-6 text-center">
              <p className="font-serif text-[1.15rem] text-[#161616] mb-2">Création d'événement</p>
              <p className="text-[14px] text-[#59544d] leading-6">Déjeuner, dîner, soirée à thème. Menu construit avec vous, chef sélectionné pour son style.</p>
            </div>
            <div className="rounded-[20px] border border-[#e8e1d4] bg-white p-6 text-center">
              <p className="font-serif text-[1.15rem] text-[#161616] mb-2">Missions résidentielles</p>
              <p className="text-[14px] text-[#59544d] leading-6">Villa, chalet, yacht. De quelques jours à plusieurs semaines, chef intégré au quotidien.</p>
            </div>
            <div className="rounded-[20px] border border-[#e8e1d4] bg-white p-6 text-center">
              <p className="font-serif text-[1.15rem] text-[#161616] mb-2">Remplacements</p>
              <p className="text-[14px] text-[#59544d] leading-6">Votre chef habituel est indisponible ? Un remplaçant aligné sur son style sous 48h.</p>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/request" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#161616] px-7 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
              Démarrer une demande <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/conciergeries" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#161616]/20 px-7 text-sm font-medium text-[#161616] transition hover:bg-[#161616]/5 sm:w-auto">
              Accès conciergeries
            </Link>
          </div>
        </div>
      </section>

      {/* ── SÉLECTION ─────────────────────────────────────── */}
      {/* ── À PROPOS — version raccourcie, centrée image-texte ──── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row gap-10 md:gap-14 items-center">
            <div className="relative w-40 h-40 md:w-52 md:h-52 shrink-0 rounded-full overflow-hidden border-2 border-[#e8e1d4]">
              <Image
                src="/images/editorial/IMG_8782.JPG"
                alt="Thomas Delcroix — Fondateur Chefs Talents"
                fill
                sizes="208px"
                className="object-cover object-top"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d756a] mb-3">Pourquoi j'ai monté ça</p>
              <h2 className="font-serif text-[1.8rem] leading-[1.1] text-[#161616] md:text-[2.6rem] mb-5">
                Thomas <span className="italic font-light text-[#7f1d1d]">Delcroix</span>
              </h2>
              <p className="text-[16px] font-light leading-[1.7] text-[#59544d] mb-5">
                Trois ans chef privé avant de monter Chefs Talents. Plus de 200 missions sur la Côte d'Azur, en Méditerranée, dans des chalets l'hiver.
              </p>
              <p className="text-[15px] italic leading-[1.7] text-[#7d756a] mb-6">
                {/* TODO Thomas — Remplacer par TON anecdote vraie (date + lieu + ce qui a mal tourné). */}
                « Été 2022, yacht à Monaco. Chef envoyé par la conciergerie : jamais bossé en cuisine pro. C'est là que j'ai compris. »
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-start justify-center">
                <Link href="/about" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#d4cdc2] px-6 text-sm font-medium text-[#3f3a34] transition hover:bg-[#fafaf8]">
                  En savoir plus
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER_E164}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#161616] px-6 text-sm font-medium text-white transition hover:bg-black">
                  Me contacter <span className="text-xs text-white/55">— Thomas</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final — centré, sobre ───────────────────── */}
      <section className="bg-[#161616] px-6 py-24 md:px-10 lg:px-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/65">Vous appelez</p>
          <h2 className="mt-5 font-serif text-[2.2rem] leading-[1.08] text-white md:text-[3.6rem]">
            Décrivez votre besoin.<br />
            <span className="italic font-light text-[#d4a86a]">On revient sous 6 heures.</span>
          </h2>
          <p className="mt-7 mx-auto max-w-[520px] text-[16px] leading-[1.7] text-white/80">
            Trois lignes suffisent — lieu, dates, nombre de couverts. Si on peut, on revient avec des noms. Si on ne peut pas, on vous le dit dans le même délai.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/request" className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-[#161616] transition hover:bg-white/90">
              Décrire mon besoin <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/conciergeries" className="inline-flex min-h-[54px] items-center justify-center rounded-full border border-white/30 px-8 text-sm font-medium text-white transition hover:bg-white/10">
              Je suis une conciergerie
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ — recentrée, plus aérée ─────────────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#7d756a]">FAQ</p>
            <h2 className="mt-5 font-serif text-[2rem] leading-[1.08] text-[#161616] md:text-[3rem]">
              Questions <span className="italic font-light text-[#7f1d1d]">fréquentes</span>
            </h2>
          </div>
          <div className="border-t border-[#e8e1d4]">
            <FaqItem title="Que se passe-t-il après l'envoi de ma demande ?" content="Nous analysons votre brief (lieu, dates, attentes, budget), puis nous revenons vers vous avec une sélection de chefs disponibles et pertinents dans les 6 heures. Vous validez un profil, et nous coordonnons ensuite l'ensemble de la mission." isDefaultOpen />
            <FaqItem title="Est-ce que je choisis le chef ?" content="Oui. Chefs Talents fonctionne comme un intermédiaire qui présélectionne deux ou trois profils. Vous choisissez celui qui colle le mieux à votre style et à vos contraintes." />
            <FaqItem title="Quand le paiement est-il effectué ?" content="Le paiement dépend de la nature et de la durée de la mission. Pour certaines prestations ponctuelles, le règlement intervient une fois le chef sélectionné afin de confirmer la mission. Pour les missions plus longues ou plus complexes, les modalités sont précisées en amont avec transparence." />
            <FaqItem title="Pourquoi des frais de service sont-ils demandés ?" content="Les frais de service couvrent la sélection des chefs, la coordination, la sécurisation de la mission et le suivi opérationnel." />
            <FaqItem title="Que se passe-t-il si le chef annule ou ne peut pas assurer la mission ?" content="En cas d'indisponibilité du chef, nous activons immédiatement une solution de remplacement avec un profil équivalent." />
            <FaqItem title="La prestation est-elle confidentielle ?" content="Absolument. La discrétion est un principe fondamental de Chefs Talents. Les lieux, clients et détails des missions ne sont jamais rendus publics." />
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link href="/request" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#161616] px-8 py-4 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
              Décrire mon besoin
            </Link>
            <a href={mailtoHref} className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db] sm:w-auto">
              Nous écrire
            </a>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db] sm:w-auto">
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="mt-auto bg-stone-900 text-stone-400 py-20 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-5">
              <span className="font-serif text-2xl text-white">CHEFS TALENTS</span>
              <p className="text-sm leading-relaxed font-light text-stone-500 max-w-xs">
                La référence pour l'expérience culinaire privée en Europe. Service sur-mesure pour villas, yachts et résidences privées.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <a href={`https://wa.me/${WHATSAPP_NUMBER_E164}`} target="_blank" rel="noreferrer" className="text-sm text-stone-400 hover:text-white transition flex items-center gap-2">
                  <span className="text-green-500">●</span> WhatsApp — Thomas
                </a>
                <a href={mailtoHref} className="text-sm text-stone-400 hover:text-white transition">
                  contact@chefstalents.com
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Plateforme</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/request" className="hover:text-white transition">Soumettre une demande</Link></li>
                <li><Link href="/conciergeries" className="hover:text-white transition">Conciergeries</Link></li>
                <li><Link href="/private-clients" className="hover:text-white transition">Clients Privés</Link></li>
                <li><Link href="/destinations" className="hover:text-white transition">Destinations</Link></li>
                <li><Link href="/chefs" className="hover:text-white transition">Espace chef</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Destinations</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/destinations/chef-prive-saint-tropez" className="hover:text-white transition">Chef privé Saint-Tropez</Link></li>
                <li><Link href="/destinations/chef-prive-ibiza" className="hover:text-white transition">Chef privé Ibiza</Link></li>
                <li><Link href="/destinations/chef-prive-mykonos" className="hover:text-white transition">Chef privé Mykonos</Link></li>
                <li><Link href="/destinations/chef-prive-courchevel" className="hover:text-white transition">Chef privé Courchevel</Link></li>
                <li><Link href="/destinations/chef-prive-monaco" className="hover:text-white transition">Chef privé Monaco</Link></li>
                <li><Link href="/destinations" className="hover:text-white transition text-stone-500">Voir toutes →</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">À propos</h4>
              <ul className="space-y-3 text-sm font-light mb-8">
                <li><Link href="/about" className="hover:text-white transition">Thomas Delcroix</Link></li>
                <li><Link href="/insights" className="hover:text-white transition">Journal</Link></li>
              </ul>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Légal</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/conditions" className="hover:text-white transition">CGU & CGV</Link></li>
                <li><Link href="/legal" className="hover:text-white transition">Mentions Légales</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <span>© {new Date().getFullYear()} Chefs Talents — Thomas Delcroix. Tous droits réservés.</span>
            <span className="text-stone-700">Bordeaux, France</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ── Composants ── */
function MiniTrust({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-base font-medium text-[#161616]">{title}</h3>
      <p className="mt-2 max-w-[22rem] text-[15px] leading-7 text-[#59544d] md:max-w-none">{text}</p>
    </div>
  );
}

function ValueCard({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-[#d8d1c7] bg-[#fcfbf9] px-6 py-7">
      <p className="text-[17px] font-light leading-8 text-[#3f3a34]">{text}</p>
    </div>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-[#d8d1c7] bg-white px-6 py-8">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[#8a7f73]">{number}</p>
      <h3 className="mt-4 text-[2rem] font-serif leading-tight text-[#161616]">{title}</h3>
      <p className="mt-4 text-[17px] font-light leading-8 text-[#59544d]">{text}</p>
    </div>
  );
}

function FaqItem({ title, content, isDefaultOpen = false }: { title: string; content: string; isDefaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  return (
    <div className="border-b border-[#d8d1c7]">
      <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between py-7 text-left">
        <span className="pr-6 text-[1.55rem] font-serif leading-tight text-[#161616] md:text-2xl">{title}</span>
        <span className={`text-2xl text-[#8a7f73] transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <div className="max-w-[24rem] pb-7 pr-2 text-[18px] font-light leading-8 text-[#59544d] md:max-w-none md:pr-8 md:text-lg md:leading-relaxed">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
