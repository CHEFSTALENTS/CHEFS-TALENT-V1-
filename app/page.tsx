'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

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
      "Oui. Chefs Talents fonctionne comme un intermédiaire curateur : nous présélectionnons des profils adaptés, et vous choisissez celui qui correspond le mieux à votre style, vos contraintes et votre niveau d'exigence.",
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
    <div className="bg-[#f4efe8] text-[#161616] flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[680px] w-full overflow-hidden">
        <motion.img
          src="/images/editorial/hero-chef-talents.jpg"
          alt="Chef privé"
          className="absolute inset-0 h-full w-full object-cover object-center"
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
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

        <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-12 md:pb-16 lg:px-20 lg:pb-20">
          <motion.div
            className="max-w-[880px] text-white"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-white/78 md:mb-6">Chefs Talents</p>
            <h1 className="max-w-[900px] text-[2.75rem] leading-[0.98] tracking-tight text-white md:text-6xl lg:text-[5rem]">
              Des chefs privés,<br />pour des missions<br /><span className="italic">d'exception.</span>
            </h1>
            <p className="mt-6 max-w-[620px] text-[17px] leading-8 text-white/90 md:text-lg md:leading-relaxed">
              Un réseau de chefs sélectionnés pour des clients exigeants. Villas, yachts, résidences privées. Une exécution sans friction, partout en Europe.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/request" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition hover:bg-white/85 sm:w-auto">
                Décrire mon besoin
              </Link>
              <Link href="/conciergeries" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-white/40 bg-black/10 px-8 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto">
                Je suis une conciergerie
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="bg-[#161616] px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '400+', label: 'Chefs sélectionnés', sub: 'formés aux standards du luxe' },
              { value: '400+', label: 'Missions réalisées', sub: 'depuis 2023' },
              { value: '50+', label: 'Destinations', sub: "à travers l'Europe" },
              { value: '< 6h', label: 'Délai de réponse', sub: 'une personne dédiée' },
            ].map((stat, i) => (
              <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <p className="font-serif text-[2.8rem] leading-none text-white md:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-white/90">{stat.label}</p>
                <p className="mt-1 text-[12px] text-white/45">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────── */}
      <section className="px-6 pb-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl border-b border-[#d8d1c7] py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <MiniTrust title="Sélection rigoureuse" text="Des profils choisis pour leur niveau, leur posture et leur fiabilité sur le terrain." />
            <MiniTrust title="Couverture européenne" text="Des chefs mobiles, habitués aux résidences privées, villas, chalets et yachts." />
            <MiniTrust title="Coordination maîtrisée" text="Un interlocuteur unique pour cadrer, sécuriser et suivre les missions sensibles." />
          </div>
        </div>
      </section>

      {/* ── POSITIONING ───────────────────────────────────── */}
      <section className="px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Notre approche</p>
          </div>
          <div className="lg:col-span-9">
            <h2 className="max-w-4xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
              Plus qu'une réservation.<br />Une mise en relation maîtrisée.
            </h2>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-2xl md:leading-relaxed">
              Chefs Talents a été pensé pour les situations où la qualité, la continuité et la confiance priment sur la rapidité.
            </p>
            <p className="mt-5 max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-xl md:leading-relaxed">
              Nous ne proposons pas un simple annuaire. Chaque demande est qualifiée, cadrée et traitée avec précision afin d'identifier le bon profil, au bon endroit, au bon moment.
            </p>
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ──────────────────────────────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Couverture</p>
              <h2 className="text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
                Partout où<br />vous êtes.
              </h2>
              <p className="mt-6 text-[17px] font-light leading-8 text-[#59544d]">
                De la Côte d'Azur aux Alpes, d'Ibiza à Mykonos — nos chefs opèrent dans plus de 50 destinations premium à travers l'Europe et au-delà.
              </p>
              <Link href="/destinations" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#161616] underline underline-offset-4 hover:opacity-70 transition">
                Voir toutes les destinations <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {DESTINATIONS_FEATURED.map((dest, i) => (
                  <motion.div key={dest.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                    <Link
                      href={`/destinations/chef-prive-${dest.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/'/g, '-')}`}
                      className="group flex flex-col items-start rounded-[20px] border border-[#d8d1c7] bg-white px-4 py-4 transition hover:border-[#a09890] hover:shadow-sm"
                    >
                      <span className="text-xl mb-2">{dest.emoji}</span>
                      <p className="text-[14px] font-medium text-[#161616] group-hover:text-[#3f3a34]">{dest.name}</p>
                      <p className="text-[12px] text-[#8a7f73] mt-0.5">{dest.country}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY US ────────────────────────────────────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-[#d8d1c7] bg-white px-8 py-10 md:px-12 md:py-14">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Exigence</p>
              <h2 className="text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
                Un réseau pensé pour les environnements premium.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <p className="max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-xl md:leading-relaxed">
                Nos 400 chefs sont sélectionnés selon leur expérience, leur mobilité, leur capacité d'adaptation et leur exigence opérationnelle dans des contextes privés haut de gamme.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <ValueCard text="400 chefs sélectionnés, formés aux standards du luxe" />
                <ValueCard text="Couverture européenne avec expertise locale" />
                <ValueCard text="Gestion de la continuité et des remplacements" />
                <ValueCard text="Chefs multilingues, habitués aux standards UHNW" />
                <ValueCard text="Un interlocuteur unique pour les missions complexes" />
                <ValueCard text="Relation discrète, structurée et maîtrisée" />
              </div>
              <div className="mt-10">
                <Link href="/conciergeries" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#161616] px-7 py-4 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
                  Je suis une conciergerie <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONFIDENTIALITÉ ───────────────────────────────── */}
      <section className="bg-[#161616] px-6 py-24 text-white md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Confidentialité</p>
            <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
              La discrétion<br />n'est pas une option.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <p className="max-w-[24rem] text-[18px] font-light leading-8 text-white/88 md:max-w-3xl md:text-2xl md:leading-relaxed">
              Nos chefs interviennent dans les villas, chalets, yachts et résidences privées à travers l'Europe. Les lieux, les clients et les missions ne sont jamais rendus publics.
            </p>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/78 md:max-w-3xl md:text-xl md:leading-relaxed">
              Les références sont partagées de manière sélective. La confidentialité fait partie intégrante de notre manière de travailler.
            </p>
            <a href={mailtoHref} className="mt-10 inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-white/28 px-7 py-4 text-sm font-medium text-white transition hover:bg-white/6 sm:w-auto">
              Nous écrire
            </a>
          </div>
        </div>
      </section>

      {/* ── IMAGE BREAK ───────────────────────────────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px]">
          <div className="relative h-[58vh] md:h-[72vh]">
            <img src="/images/editorial/villa-service.jpg" alt="Environnement privé" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/18" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-3xl px-8 pb-10 md:px-12 md:pb-14">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/80">Exécution</p>
                <h3 className="mt-3 text-[2.2rem] font-serif leading-[1.06] text-white md:text-5xl">
                  Une présence discrète, une exécution constante, un niveau de service tenu.
                </h3>
                <p className="mt-4 max-w-[23rem] text-[17px] font-light leading-8 text-white/88 md:max-w-2xl md:text-lg md:leading-relaxed">
                  Des interventions calibrées pour répondre à des standards élevés, sans friction et avec une vraie continuité opérationnelle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────────────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Méthode</p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            Une demande simple.<br />Un traitement structuré.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard number="01" title="Qualification" text="Nous analysons le lieu, les dates, le niveau de service, le format de mission et le budget indicatif." />
            <StepCard number="02" title="Sélection" text="Nous identifions les profils les plus pertinents selon la mission, l'environnement et les exigences exprimées." />
            <StepCard number="03" title="Coordination" text="Une fois le profil validé, nous cadrons la mission et restons le point de contact pour son bon déroulement." />
          </div>
        </div>
      </section>

      {/* ── SÉLECTION ─────────────────────────────────────── */}
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] bg-[#161616] px-8 py-12 md:px-14 md:py-16 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">
            <div className="lg:col-span-5 mb-8 lg:mb-0">
              <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-white/60">Sélection</p>
              <h2 className="text-[2.4rem] font-serif leading-[1.04] text-white md:text-5xl">
                Un seul réseau.<br />Deux entrées.
              </h2>
            </div>
            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-3">Clients privés</p>
                <h3 className="text-xl font-serif text-white mb-3">Accès direct</h3>
                <p className="text-[15px] font-light leading-7 text-white/70">Villas, yachts, chalets — décrivez votre mission, notre équipe sélectionne le bon profil en moins de 6h.</p>
                <Link href="/request" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
                  Soumettre une demande <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-[24px] border border-white/20 bg-white/10 px-6 py-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-3">Conciergeries</p>
                <h3 className="text-xl font-serif text-white mb-3">Accès partenaire</h3>
                <p className="text-[15px] font-light leading-7 text-white/70">Un accès dédié aux profils validés pour des missions complexes, longue durée ou récurrentes.</p>
                <Link href="/conciergeries" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
                  Accès conciergeries <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── À PROPOS ──────────────────────────────────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] border border-[#d8d1c7] bg-white overflow-hidden">
            <div className="grid lg:grid-cols-12">
              <div className="lg:col-span-4 relative h-72 lg:h-auto min-h-[320px]">
                <img
                  src="images/editorial/IMG_8782.JPG"
                  alt="Thomas Delcroix — Fondateur Chefs Talents"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5" />
              </div>
              <div className="lg:col-span-8 px-8 py-10 md:px-12 md:py-14 flex flex-col justify-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">Fondateur</p>
                <h2 className="text-[2.2rem] font-serif leading-[1.04] text-[#161616] md:text-4xl mb-6">Thomas Delcroix</h2>
                <p className="text-[18px] font-light leading-8 text-[#59544d] mb-4 max-w-2xl">
                  Chef privé depuis 2020, passionné par le monde du luxe et de la gastronomie privée. J'ai exercé dans des tables étoilées en France, navigué plusieurs mois en yachting privé en Méditerranée, et réalisé plus de 200 missions dans des villas, chalets et résidences à travers l'Europe.
                </p>
                <p className="text-[18px] font-light leading-8 text-[#59544d] mb-8 max-w-2xl">
                  J'ai fondé Chefs Talents en 2023 pour mettre ce réseau : des chefs rencontrés dans des cuisines étoilées et à bord de superyachts : au service de clients qui exigent l'excellence.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/about" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#d4cdc2] px-7 text-sm font-medium text-[#3f3a34] transition hover:bg-[#f4efe8] sm:w-auto">
                    En savoir plus
                  </Link>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER_E164}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#161616] px-7 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
                    Me contacter
                    <span className="text-xs text-white/55">— Thomas</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="bg-[#ebe4d9] px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-[#161616] px-8 py-10 text-white md:px-14 md:py-16">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Demande unique</p>
          <h2 className="mt-4 max-w-4xl text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
            Une seule demande.<br />La bonne réponse.
          </h2>
          <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/86 md:max-w-3xl md:text-xl md:leading-relaxed">
            Dîner privé, séjour, résidence longue, yacht ou demande plus complexe : vous remplissez une seule demande, notre équipe qualifie ensuite le besoin et construit la meilleure réponse.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/request" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#161616] transition hover:bg-[#ece6dc] sm:w-auto">
              Décrire mon besoin <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/conciergeries" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-white/24 px-8 py-4 text-sm font-medium text-white transition hover:bg-white/5 sm:w-auto">
              Je suis une conciergerie
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">FAQ</p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">Questions fréquentes</h2>
          <p className="mt-6 text-[18px] font-light leading-8 text-[#59544d] md:text-lg">L'essentiel, avant de nous transmettre votre brief.</p>
          <div className="mt-12 border-t border-[#d8d1c7]">
            <FaqItem title="Que se passe-t-il après l'envoi de ma demande ?" content="Nous analysons votre brief (lieu, dates, attentes, budget), puis nous revenons vers vous avec une sélection de chefs disponibles et pertinents dans les 6 heures. Vous validez un profil, et nous coordonnons ensuite l'ensemble de la mission." isDefaultOpen />
            <FaqItem title="Est-ce que je choisis le chef ?" content="Oui. Chefs Talents fonctionne comme un intermédiaire curateur : nous présélectionnons des profils adaptés, et vous choisissez celui qui correspond le mieux à votre style, vos contraintes et votre niveau d'exigence." />
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
