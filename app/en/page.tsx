'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const SUPPORT_EMAIL = 'contact@chefstalents.com';
const WHATSAPP_NUMBER_E164 = '33756827612';
const WHATSAPP_PREFILL = encodeURIComponent(
  "Hello,\n\nI have a request for Chefs Talents.\n\nContext / location / dates:\nIndicative budget:\nNumber of guests:\n\nThank you."
);

const DESTINATIONS_FEATURED = [
  { name: 'Saint-Tropez', country: 'France', emoji: '🇫🇷', slug: 'private-chef-saint-tropez' },
  { name: 'Ibiza', country: 'Spain', emoji: '🇪🇸', slug: 'private-chef-ibiza' },
  { name: 'Mykonos', country: 'Greece', emoji: '🇬🇷', slug: 'private-chef-mykonos' },
  { name: 'Courchevel', country: 'France', emoji: '🇫🇷', slug: 'private-chef-courchevel' },
  { name: 'Monaco', country: 'Monaco', emoji: '🇲🇨', slug: 'private-chef-monaco' },
  { name: 'Sardinia', country: 'Italy', emoji: '🇮🇹', slug: 'private-chef-sardinia' },
  { name: 'Cannes', country: 'France', emoji: '🇫🇷', slug: 'private-chef-cannes' },
  { name: 'Cap Ferrat', country: 'France', emoji: '🇫🇷', slug: 'private-chef-cap-ferrat' },
  { name: 'Megève', country: 'France', emoji: '🇫🇷', slug: 'private-chef-megeve' },
  { name: 'Biarritz', country: 'France', emoji: '🇫🇷', slug: 'private-chef-biarritz' },
  { name: 'Portugal', country: 'Portugal', emoji: '🇵🇹', slug: 'private-chef-portugal' },
  { name: 'Antibes', country: 'France', emoji: '🇫🇷', slug: 'private-chef-antibes' },
];

function LangSwitcher() {
  return (
    <div className="inline-flex items-center rounded-full border border-white/30 overflow-hidden">
      {[
        { code: 'fr', label: 'FR', href: '/' },
        { code: 'en', label: 'EN', href: '/en' },
        { code: 'es', label: 'ES', href: '/es' },
      ].map((l, i) => (
        <Link
          key={l.code}
          href={l.href}
          className={[
            'px-4 py-1.5 text-xs font-medium tracking-wide transition',
            i > 0 ? 'border-l border-white/20' : '',
            l.code === 'en'
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

export default function HomeEN() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Chefs Talents Request')}&body=${encodeURIComponent("Hello,\n\nI would like to make a request.\n\nContext / location / dates:\nIndicative budget:\nNumber of guests:\n\nThank you,\n")}`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${WHATSAPP_PREFILL}`;

  return (
    <div className="bg-[#f4efe8] text-[#161616] flex flex-col min-h-screen">

      {/* ── HERO ── */}
      <section className="relative h-[90vh] min-h-[680px] w-full overflow-hidden">
        <motion.img
          src="/images/editorial/hero-chef-talents.jpg"
          alt="Private chef"
          className="absolute inset-0 h-full w-full object-cover object-center"
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div className="absolute inset-0 bg-black/58" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/28 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-black/10" />

        <div className="absolute top-6 right-6 z-20 md:top-8 md:right-10 lg:right-20">
          <LangSwitcher />
        </div>

        <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-12 md:pb-16 lg:px-20 lg:pb-20">
          <motion.div className="max-w-[880px] text-white" initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, delay: 0.2 }}>
            <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-white/78 md:mb-6">Chefs Talents</p>
            <h1 className="max-w-[900px] text-[2.75rem] leading-[0.98] tracking-tight text-white md:text-6xl lg:text-[5rem]">
              Private chefs,<br />for <span className="italic">exceptional</span><br />missions.
            </h1>
            <p className="mt-6 max-w-[620px] text-[17px] leading-8 text-white/90 md:text-lg md:leading-relaxed">
              A network of carefully selected chefs for discerning clients. Villas, yachts, private residences. Seamless execution, across Europe.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/request" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition hover:bg-white/85 sm:w-auto">
                Describe my needs
              </Link>
              <Link href="/conciergeries" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-white/40 bg-black/10 px-8 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto">
                I represent a concierge service
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#161616] px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '400+', label: 'Selected chefs', sub: 'trained to luxury standards' },
              { value: '400+', label: 'Missions completed', sub: 'since 2023' },
              { value: '50+', label: 'Destinations', sub: 'across Europe' },
              { value: '< 6h', label: 'Response time', sub: 'dedicated team member' },
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

      {/* ── TRUST ── */}
      <section className="px-6 pb-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl border-b border-[#d8d1c7] py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <MiniTrust title="Rigorous selection" text="Profiles chosen for their skill level, professionalism and reliability in the field." />
            <MiniTrust title="European coverage" text="Mobile chefs, experienced in private residences, villas, chalets and yachts." />
            <MiniTrust title="Controlled coordination" text="A single point of contact to frame, secure and monitor sensitive missions." />
          </div>
        </div>
      </section>

      {/* ── POSITIONING ── */}
      <section className="px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Our approach</p>
          </div>
          <div className="lg:col-span-9">
            <h2 className="max-w-4xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
              More than a booking.<br />A managed match.
            </h2>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-2xl md:leading-relaxed">
              Chefs Talents was built for situations where quality, continuity and trust come before speed.
            </p>
            <p className="mt-5 max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-xl md:leading-relaxed">
              We don't offer a simple directory. Every request is qualified, structured and handled with precision to identify the right profile, in the right place, at the right time.
            </p>
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Coverage</p>
              <h2 className="text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
                Wherever<br />you are.
              </h2>
              <p className="mt-6 text-[17px] font-light leading-8 text-[#59544d]">
                From the French Riviera to the Alps, from Ibiza to Mykonos — our chefs operate across 50+ premium destinations throughout Europe and beyond.
              </p>
              <Link href="/destinations" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#161616] underline underline-offset-4 hover:opacity-70 transition">
                View all destinations <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {DESTINATIONS_FEATURED.map((dest, i) => (
                  <motion.div key={dest.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                    <Link href={`/destinations/${dest.slug}`} className="group flex flex-col items-start rounded-[20px] border border-[#d8d1c7] bg-white px-4 py-4 transition hover:border-[#a09890] hover:shadow-sm">
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

      {/* ── WHY US ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-[#d8d1c7] bg-white px-8 py-10 md:px-12 md:py-14">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Standards</p>
              <h2 className="text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
                A network built for premium environments.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <p className="max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-xl md:leading-relaxed">
                Our 400 chefs are selected based on their experience, mobility, adaptability and operational standards in high-end private settings.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <ValueCard text="400 chefs selected to luxury standards" />
                <ValueCard text="European coverage with local expertise" />
                <ValueCard text="Continuity management and replacements" />
                <ValueCard text="Multilingual chefs, UHNW-experienced" />
                <ValueCard text="Single point of contact for complex missions" />
                <ValueCard text="Discreet, structured and managed relationship" />
              </div>
              <div className="mt-10">
                <Link href="/conciergeries" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#161616] px-7 py-4 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
                  Concierge access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONFIDENTIALITY ── */}
      <section className="bg-[#161616] px-6 py-24 text-white md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Confidentiality</p>
            <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
              Discretion<br />is non-negotiable.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <p className="max-w-[24rem] text-[18px] font-light leading-8 text-white/88 md:max-w-3xl md:text-2xl md:leading-relaxed">
              Our chefs work in villas, chalets, yachts and private residences across Europe. Locations, clients and mission details are never made public.
            </p>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/78 md:max-w-3xl md:text-xl md:leading-relaxed">
              References are shared selectively. Confidentiality is fundamental to how we operate.
            </p>
            <a href={mailtoHref} className="mt-10 inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-white/28 px-7 py-4 text-sm font-medium text-white transition hover:bg-white/6 sm:w-auto">
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* ── IMAGE BREAK ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px]">
          <div className="relative h-[58vh] md:h-[72vh]">
            <img src="/images/editorial/villa-service.jpg" alt="Private environment" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/18" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-3xl px-8 pb-10 md:px-12 md:pb-14">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/80">Execution</p>
                <h3 className="mt-3 text-[2.2rem] font-serif leading-[1.06] text-white md:text-5xl">
                  Discreet presence, consistent execution, sustained service standards.
                </h3>
                <p className="mt-4 max-w-[23rem] text-[17px] font-light leading-8 text-white/88 md:max-w-2xl md:text-lg md:leading-relaxed">
                  Calibrated to meet high standards, without friction and with genuine operational continuity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Method</p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            One simple request.<br />A structured response.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard number="01" title="Qualification" text="We assess the location, dates, service level, mission format and indicative budget." />
            <StepCard number="02" title="Selection" text="We identify the most relevant profiles based on the mission, environment and stated requirements." />
            <StepCard number="03" title="Coordination" text="Once the profile is confirmed, we frame the mission and remain the point of contact throughout." />
          </div>
        </div>
      </section>

      {/* ── TWO ENTRIES ── */}
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] bg-[#161616] px-8 py-12 md:px-14 md:py-16 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">
            <div className="lg:col-span-5 mb-8 lg:mb-0">
              <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-white/60">Access</p>
              <h2 className="text-[2.4rem] font-serif leading-[1.04] text-white md:text-5xl">
                One network.<br />Two entry points.
              </h2>
            </div>
            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-3">Private clients</p>
                <h3 className="text-xl font-serif text-white mb-3">Direct access</h3>
                <p className="text-[15px] font-light leading-7 text-white/70">Villas, yachts, chalets — describe your mission, our team selects the right profile within 6 hours.</p>
                <Link href="/request" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
                  Submit a request <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-[24px] border border-white/20 bg-white/10 px-6 py-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-3">Concierge services</p>
                <h3 className="text-xl font-serif text-white mb-3">Partner access</h3>
                <p className="text-[15px] font-light leading-7 text-white/70">Dedicated access to validated profiles for complex, long-term or recurring missions.</p>
                <Link href="/conciergeries" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
                  Concierge access <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] border border-[#d8d1c7] bg-white overflow-hidden">
            <div className="grid lg:grid-cols-12">
              <div className="lg:col-span-4 relative h-72 lg:h-auto min-h-[320px]">
                <img src="images/editorial/IMG_8782.JPG" alt="Thomas Delcroix — Founder Chefs Talents" className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5" />
              </div>
              <div className="lg:col-span-8 px-8 py-10 md:px-12 md:py-14 flex flex-col justify-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">Founder</p>
                <h2 className="text-[2.2rem] font-serif leading-[1.04] text-[#161616] md:text-4xl mb-6">Thomas Delcroix</h2>
                <p className="text-[18px] font-light leading-8 text-[#59544d] mb-4 max-w-2xl">
                  Private chef since 2020, passionate about the world of luxury and private gastronomy. I've worked in Michelin-starred restaurants in France, spent several months yachting in the Mediterranean, and completed over 200 missions in villas, chalets and residences across Europe.
                </p>
                <p className="text-[18px] font-light leading-8 text-[#59544d] mb-8 max-w-2xl">
                  I founded Chefs Talents in 2023 to bring this network — chefs met in starred kitchens and aboard superyachts — to clients who demand excellence.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/about" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#d4cdc2] px-7 text-sm font-medium text-[#3f3a34] transition hover:bg-[#f4efe8] sm:w-auto">
                    Learn more
                  </Link>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER_E164}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#161616] px-7 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
                    Contact me
                    <span className="text-xs text-white/55">— Thomas</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#ebe4d9] px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-[#161616] px-8 py-10 text-white md:px-14 md:py-16">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Single request</p>
          <h2 className="mt-4 max-w-4xl text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
            One request.<br />The right answer.
          </h2>
          <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/86 md:max-w-3xl md:text-xl md:leading-relaxed">
            Private dinner, stay, long-term residence, yacht or more complex request: you fill in one request, our team qualifies the need and builds the best response.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/request" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#161616] transition hover:bg-[#ece6dc] sm:w-auto">
              Describe my needs <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/conciergeries" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-white/24 px-8 py-4 text-sm font-medium text-white transition hover:bg-white/5 sm:w-auto">
              I represent a concierge service
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">FAQ</p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">Frequently asked questions</h2>
          <p className="mt-6 text-[18px] font-light leading-8 text-[#59544d] md:text-lg">The essentials, before sending us your brief.</p>
          <div className="mt-12 border-t border-[#d8d1c7]">
            <FaqItem title="What happens after I submit my request?" content="We analyse your brief (location, dates, expectations, budget), then come back to you with a selection of available and relevant chefs within 6 hours. You validate a profile, and we then coordinate the entire mission." isDefaultOpen />
            <FaqItem title="Do I choose the chef?" content="Yes. Chefs Talents works as a curator: we pre-select suitable profiles, and you choose the one that best matches your style, constraints and standards." />
            <FaqItem title="When is payment made?" content="Payment depends on the nature and duration of the mission. For one-off services, payment is made once the chef is selected to confirm the mission. For longer or more complex missions, the terms are clearly set out in advance." />
            <FaqItem title="Why are service fees charged?" content="Service fees cover chef selection, coordination, mission security and operational follow-up." />
            <FaqItem title="What happens if the chef cancels or cannot fulfil the mission?" content="If the chef becomes unavailable, we immediately activate a replacement solution with an equivalent profile." />
            <FaqItem title="Is the service confidential?" content="Absolutely. Discretion is a core principle of Chefs Talents. Locations, clients and mission details are never made public." />
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link href="/request" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#161616] px-8 py-4 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
              Describe my needs
            </Link>
            <a href={mailtoHref} className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db] sm:w-auto">
              Email us
            </a>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db] sm:w-auto">
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto bg-stone-900 text-stone-400 py-20 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-5">
              <span className="font-serif text-2xl text-white">CHEFS TALENTS</span>
              <p className="text-sm leading-relaxed font-light text-stone-500 max-w-xs">The reference for private culinary experiences in Europe. Bespoke service for villas, yachts and private residences.</p>
              <div className="flex flex-col gap-2 pt-2">
                <a href={`https://wa.me/${WHATSAPP_NUMBER_E164}`} target="_blank" rel="noreferrer" className="text-sm text-stone-400 hover:text-white transition flex items-center gap-2"><span className="text-green-500">●</span> WhatsApp — Thomas</a>
                <a href={mailtoHref} className="text-sm text-stone-400 hover:text-white transition">contact@chefstalents.com</a>
              </div>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Platform</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/request" className="hover:text-white transition">Submit a request</Link></li>
                <li><Link href="/conciergeries" className="hover:text-white transition">Concierge services</Link></li>
                <li><Link href="/destinations" className="hover:text-white transition">Destinations</Link></li>
                <li><Link href="/chefs" className="hover:text-white transition">Chef portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Destinations</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/destinations/private-chef-saint-tropez" className="hover:text-white transition">Private chef Saint-Tropez</Link></li>
                <li><Link href="/destinations/private-chef-ibiza" className="hover:text-white transition">Private chef Ibiza</Link></li>
                <li><Link href="/destinations/private-chef-mykonos" className="hover:text-white transition">Private chef Mykonos</Link></li>
                <li><Link href="/destinations/private-chef-courchevel" className="hover:text-white transition">Private chef Courchevel</Link></li>
                <li><Link href="/destinations/private-chef-monaco" className="hover:text-white transition">Private chef Monaco</Link></li>
                <li><Link href="/destinations" className="hover:text-white transition text-stone-500">View all →</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">About</h4>
              <ul className="space-y-3 text-sm font-light mb-8">
                <li><Link href="/about" className="hover:text-white transition">Thomas Delcroix</Link></li>
                <li><Link href="/insights" className="hover:text-white transition">Journal</Link></li>
              </ul>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Legal</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/conditions" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="/legal" className="hover:text-white transition">Legal Notice</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <span>© {new Date().getFullYear()} Chefs Talents — Thomas Delcroix. All rights reserved.</span>
            <span className="text-stone-700">Bordeaux, France</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

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
