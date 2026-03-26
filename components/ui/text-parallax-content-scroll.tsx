'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';

const SUPPORT_EMAIL = 'contact@chefstalents.com';
const WHATSAPP_NUMBER_E164 = '33756827612';
const WHATSAPP_PREFILL = encodeURIComponent(
  "Bonjour,\n\nJ’ai une demande Chef Talents.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci."
);

export default function ChefTalentsHome() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    'Demande Chef Talents'
  )}&body=${encodeURIComponent(
    "Bonjour,\n\nJe souhaite faire une demande.\n\nContexte / lieu / dates :\nBudget indicatif :\nNombre de convives :\n\nMerci,\n"
  )}`;

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${WHATSAPP_PREFILL}`;

  return (
    <div className="bg-[#f4efe8] text-[#161616]">
      {/* HERO */}
      <section className="px-6 pt-28 pb-20 md:px-10 lg:px-16 lg:pt-36 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-8 h-12 w-px bg-[#161616]/70" />

              <p className="mb-6 text-[11px] uppercase tracking-[0.28em] text-[#7d756a]">
                Chef Talents
              </p>

              <h1 className="max-w-5xl text-5xl font-serif leading-[0.94] tracking-tight md:text-7xl lg:text-[5.5rem]">
                Des chefs privés,
                <br />
                sélectionnés pour des
                <br />
                <span className="italic text-[#7d756a]">missions d’exception.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-[#59544d] md:text-xl">
                Chef Talents met en relation des chefs privés soigneusement sélectionnés
                avec des conciergeries, résidences et clients particuliers exigeant
                discrétion, constance et excellence opérationnelle à travers l’Europe.
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
                  className="inline-flex items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db]"
                >
                  Je suis une conciergerie
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-5">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 border-b border-[#d4cdc2] pb-1 text-sm text-[#6b655c] transition hover:border-[#161616] hover:text-[#161616]"
                >
                  <Mail className="h-4 w-4" />
                  Nous écrire
                </a>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border-b border-[#d4cdc2] pb-1 text-sm text-[#6b655c] transition hover:border-[#161616] hover:text-[#161616]"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-[#d8d0c4]">
                <img
                  src="/images/editorial/chef-dining-01.jpg.png"
                  alt="Chef Talents"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="px-6 pb-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl border-y border-[#d8d1c7] py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <MiniTrust
              title="Sélection rigoureuse"
              text="Des profils choisis pour leur niveau, leur posture et leur fiabilité sur le terrain."
            />
            <MiniTrust
              title="Couverture européenne"
              text="Des chefs mobiles, habitués aux résidences privées, villas, chalets et yachts."
            />
            <MiniTrust
              title="Coordination maîtrisée"
              text="Un interlocuteur unique pour cadrer, sécuriser et suivre les missions sensibles."
            />
          </div>
        </div>
      </section>

      {/* POSITIONING */}
      <section className="px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">
              Notre approche
            </p>
          </div>

          <div className="lg:col-span-9">
            <h2 className="max-w-4xl text-4xl font-serif leading-tight text-[#161616] md:text-6xl">
              Plus qu’une réservation.
              <br />
              Une mise en relation maîtrisée.
            </h2>

            <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-[#59544d] md:text-2xl">
              Chef Talents a été pensé pour les situations où la qualité, la continuité et la confiance
              priment sur la rapidité.
            </p>

            <p className="mt-5 max-w-3xl text-lg font-light leading-relaxed text-[#59544d] md:text-xl">
              Nous ne proposons pas un simple annuaire. Chaque demande est qualifiée, cadrée et traitée
              avec précision afin d’identifier le bon profil, au bon endroit, au bon moment.
            </p>
          </div>
        </div>
      </section>

      {/* WHY US - no image */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-[#d8d1c7] bg-white px-8 py-12 md:px-12 md:py-14">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">
                Exigence
              </p>
              <h2 className="text-4xl font-serif leading-tight text-[#161616] md:text-5xl">
                Une sélection pensée pour les environnements premium.
              </h2>
            </div>

            <div className="lg:col-span-8">
              <p className="max-w-3xl text-lg font-light leading-relaxed text-[#59544d] md:text-xl">
                Nos chefs sont sélectionnés selon leur expérience, leur mobilité, leur capacité
                d’adaptation et leur exigence opérationnelle dans des contextes privés haut de gamme.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <ValueCard text="Des chefs sélectionnés" />
                <ValueCard text="Une couverture européenne avec expertise locale" />
                <ValueCard text="Gestion de la continuité et des remplacements" />
                <ValueCard text="Chefs multilingues, habitués aux standards UHNW" />
                <ValueCard text="Un interlocuteur unique pour les missions complexes" />
                <ValueCard text="Une relation discrète, structurée et maîtrisée" />
              </div>

              <div className="mt-10">
                <Link
                  href="/conciergeries"
                  className="inline-flex items-center justify-center rounded-full bg-[#161616] px-7 py-4 text-sm font-medium text-white transition hover:bg-black"
                >
                  Je suis une conciergerie <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIDENTIALITE */}
      <section className="bg-[#161616] px-6 py-24 text-white md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
              Confidentialité
            </p>
            <h2 className="mt-4 text-4xl font-serif leading-tight md:text-6xl">
              La discrétion
              <br />
              n’est pas une option.
            </h2>
          </div>

          <div className="lg:col-span-8">
            <p className="max-w-3xl text-lg font-light leading-relaxed text-white/82 md:text-2xl">
              Nos chefs interviennent dans les villas, chalets, yachts et résidences privées à
              travers l’Europe. Les lieux, les clients et les missions ne sont jamais rendus publics.
            </p>

            <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-white/64 md:text-xl">
              Les références sont partagées de manière sélective. La confidentialité fait partie
              intégrante de notre manière de travailler.
            </p>

            <a
              href={mailtoHref}
              className="mt-10 inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-sm font-medium text-white transition hover:bg-white/5"
            >
              Nous écrire
            </a>
          </div>
        </div>
      </section>

      {/* IMAGE BREAK - fixed contrast */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px]">
          <div className="relative h-[58vh] md:h-[72vh]">
            <img
              src="/images/editorial/chalet-cuisine.png"
              alt="Environnement privé"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/18" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

            <div className="absolute inset-0 flex items-end">
              <div className="max-w-3xl px-8 pb-10 md:px-12 md:pb-14">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/80">
                  Exécution
                </p>
                <h3 className="mt-3 text-3xl font-serif leading-tight text-white md:text-5xl">
                  Une présence discrète, une exécution constante, un niveau de service tenu.
                </h3>
                <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-white/88 md:text-lg">
                  Des interventions calibrées pour répondre à des standards élevés, sans friction
                  et avec une vraie continuité opérationnelle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">
            Méthode
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-serif leading-tight text-[#161616] md:text-6xl">
            Une demande simple.
            <br />
            Un traitement structuré.
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard
              number="01"
              title="Qualification"
              text="Nous analysons le lieu, les dates, le niveau de service, le format de mission et le budget indicatif."
            />
            <StepCard
              number="02"
              title="Sélection"
              text="Nous identifions les profils les plus pertinents selon la mission, l’environnement et les exigences exprimées."
            />
            <StepCard
              number="03"
              title="Coordination"
              text="Une fois le profil validé, nous cadrons la mission et restons le point de contact pour son bon déroulement."
            />
          </div>
        </div>
      </section>

      {/* SELECTION */}
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">
            Sélection
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-serif leading-tight text-[#161616] md:text-6xl">
            Deux niveaux de sélection,
            <br />
            selon vos exigences.
          </h2>

          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-[#59544d]">
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
      <section className="bg-[#ebe4d9] px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-[#161616] px-8 py-12 text-white md:px-14 md:py-16">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
            Demande unique
          </p>

          <h2 className="mt-4 max-w-4xl text-4xl font-serif leading-tight md:text-6xl">
            Une seule demande.
            <br />
            La bonne réponse.
          </h2>

          <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-white/72 md:text-xl">
            Dîner privé, séjour, résidence longue, yacht ou demande plus complexe :
            vous remplissez une seule demande, notre équipe qualifie ensuite le besoin
            et construit la meilleure réponse.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/request"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#161616] transition hover:bg-[#ece6dc]"
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
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">
            FAQ
          </p>

          <h2 className="mt-4 text-4xl font-serif leading-tight text-[#161616] md:text-6xl">
            Questions fréquentes
          </h2>

          <p className="mt-6 text-lg font-light leading-relaxed text-[#59544d]">
            L’essentiel, avant de nous transmettre votre brief.
          </p>

          <div className="mt-12 border-t border-[#d8d1c7]">
            <FaqItem
              title="Que se passe-t-il après l’envoi de ma demande ?"
              content="Nous analysons votre brief (lieu, dates, attentes, budget), puis nous revenons vers vous avec une sélection de chefs disponibles et pertinents. Vous validez un profil, et nous coordonnons ensuite l’ensemble de la mission."
              isDefaultOpen
            />
            <FaqItem
              title="Est-ce que je choisis le chef ?"
              content="Oui. Chef Talents fonctionne comme un intermédiaire curateur : nous présélectionnons des profils adaptés, et vous choisissez celui qui correspond le mieux à votre style, vos contraintes et votre niveau d’exigence."
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
              Décrire mon besoin
            </Link>

            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db]"
            >
              Nous écrire
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniTrust({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-base font-medium text-[#161616]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#59544d]">{text}</p>
    </div>
  );
}

function ValueCard({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-[#d8d1c7] bg-[#fcfbf9] px-6 py-6">
      <p className="text-base font-light leading-relaxed text-[#3f3a34]">{text}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#d8d1c7] bg-white px-6 py-8">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[#8a7f73]">{number}</p>
      <h3 className="mt-4 text-2xl font-serif text-[#161616]">{title}</h3>
      <p className="mt-4 text-base font-light leading-relaxed text-[#59544d]">{text}</p>
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
          : 'border-[#d8d1c7] bg-white text-[#161616]'
      }`}
    >
      {subtitle ? (
        <p
          className={`mb-4 text-[11px] uppercase tracking-[0.24em] ${
            dark ? 'text-white/70' : 'text-[#7d756a]'
          }`}
        >
          {subtitle}
        </p>
      ) : null}

      <h3
        className={`text-3xl font-serif leading-tight ${
          dark ? 'text-white' : 'text-[#161616]'
        }`}
      >
        {title}
      </h3>

      <p
        className={`mt-5 text-lg font-light leading-relaxed ${
          dark ? 'text-white/82' : 'text-[#59544d]'
        }`}
      >
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
    <div className="border-b border-[#d8d1c7]">
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
            <div className="pb-7 pr-8 text-lg font-light leading-relaxed text-[#59544d]">
              {content}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
