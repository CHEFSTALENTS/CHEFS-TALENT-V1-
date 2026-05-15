// app/villa/_components/VillaLanding.tsx
//
// Composant principal de la landing /villa, partagé entre FR/EN/ES.
// Reçoit un objet `copy` (cf. _lib/copy.ts) qui contient toutes les
// strings traduites.

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import TestimonialsCarousel from './TestimonialsCarousel';
import type { VillaCopy } from '../_lib/copy';

const ACCENT = '#7f1d1d';
const ACCENT_SOFT = '#fef2f2';

const WHATSAPP_NUMBER = '33756827612';

function localePath(lang: VillaCopy['lang']): string {
  return lang === 'fr' ? '/request?source=villa-landing' : `/${lang}/request?source=villa-landing`;
}

export default function VillaLanding({ copy }: { copy: VillaCopy }) {
  const requestUrl = localePath(copy.lang);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(copy.hero.whatsappPrefill)}`;

  return (
    <main className="bg-white text-[#161616]" lang={copy.lang}>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#161616] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/editorial/IMG_1619.jpg"
            alt={copy.hero.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-16 lg:py-40">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">
            {copy.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-[2.6rem] font-serif leading-[1.04] text-white md:text-[4.2rem]">
            {copy.hero.titleLine1}<br />
            {copy.hero.titleLine2}
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] font-light leading-8 text-white/90 md:text-2xl md:leading-relaxed">
            {copy.hero.sub}
          </p>
          <p className="mt-3 text-[14px] text-white/70">{copy.hero.delay}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={requestUrl}
              className="inline-flex min-h-[60px] items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#161616] transition hover:bg-white/90"
            >
              {copy.hero.ctaPrimary} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[60px] items-center justify-center rounded-full border border-white/30 px-7 py-4 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              {copy.hero.ctaWhatsapp}
            </a>
          </div>
        </div>

        {/* Bandeau chiffres */}
        <div className="relative border-t border-white/10 bg-black/45 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-4 px-6 py-6 md:grid-cols-4 md:px-10 lg:px-16">
            {copy.stats.map((s) => (
              <Stat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── POUR QUI ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            {copy.forWho.eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            {copy.forWho.title}
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {copy.forWho.cards.map((c) => (
              <PersonaCard key={c.title} title={c.title} body={c.body} />
            ))}
          </div>
        </div>
      </section>

      {/* ── IMAGE BREAK ──────────────────────────────────── */}
      <section className="bg-white px-6 pt-2 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px]">
          <div className="relative h-[52vh] md:h-[64vh]">
            <Image
              src="/images/editorial/IMG_1623.jpg"
              alt={copy.imageBreak.imageAlt}
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-3xl px-7 pb-9 md:px-12 md:pb-14">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/85">
                  {copy.imageBreak.eyebrow}
                </p>
                <h3 className="mt-3 text-[2rem] font-serif leading-[1.06] text-white md:text-5xl">
                  {copy.imageBreak.title}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORCHESTRATION ─────────────────────────────────── */}
      <section className="bg-white px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
              {copy.orchestration.eyebrow}
            </p>
            <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
              {copy.orchestration.titleLine1}<br />
              <span style={{ color: ACCENT }}>{copy.orchestration.titleAccent}</span>
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-[18px] font-light leading-8 text-[#3a352e] md:text-2xl md:leading-relaxed">
              {copy.orchestration.p1}
            </p>
            <p className="mt-6 text-[16px] leading-8 text-[#5d5651] md:text-lg">
              {copy.orchestration.p2}
            </p>
          </div>
        </div>
      </section>

      {/* ── GALERIE ──────────────────────────────────────── */}
      <section className="bg-white px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            {copy.gallery.eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-[2.2rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
            {copy.gallery.title}
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {copy.gallery.items.map((img) => (
              <figure
                key={img.src + img.label}
                className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-stone-100"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition duration-700 hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 md:p-4">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white">
                    {img.label}
                  </span>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────── */}
      <section
        className="overflow-hidden py-24"
        style={{ backgroundColor: ACCENT_SOFT }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            {copy.testimonials.eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            {copy.testimonials.title}
          </h2>
        </div>

        <div className="mt-12">
          <TestimonialsCarousel testimonials={copy.testimonials.items} accent={ACCENT} />
        </div>
      </section>

      {/* ── CONFIDENTIALITÉ ──────────────────────────────── */}
      <section className="bg-[#161616] px-6 py-24 text-white md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">
              {copy.confidentiality.eyebrow}
            </p>
            <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
              {copy.confidentiality.titleLine1}<br />
              {copy.confidentiality.titleLine2}
            </h2>
          </div>
          <div className="lg:col-span-8">
            <p className="max-w-[24rem] text-[18px] font-light leading-8 text-white/88 md:max-w-3xl md:text-2xl md:leading-relaxed">
              {copy.confidentiality.p1}
            </p>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/78 md:max-w-3xl md:text-xl md:leading-relaxed">
              {copy.confidentiality.p2}
            </p>
          </div>
        </div>
      </section>

      {/* ── MÉTHODE ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            {copy.method.eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            {copy.method.titleLine1}<br />{copy.method.titleLine2}
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {copy.method.steps.map((s) => (
              <StepCard key={s.number} number={s.number} title={s.title} text={s.text} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section
        className="px-6 py-24 md:px-10 lg:px-16"
        style={{ backgroundColor: ACCENT_SOFT }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
            {copy.faq.eyebrow}
          </p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
            {copy.faq.title}
          </h2>

          <div className="mt-12 space-y-8">
            {copy.faq.items.map((item) => (
              <div key={item.question}>
                <h3 className="text-xl font-medium text-[#161616]">{item.question}</h3>
                <p className="mt-3 text-[16px] leading-7 text-[#3a352e]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#161616] px-6 py-28 text-white md:px-10 md:py-32 lg:px-16">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/images/editorial/IMG_1620.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/40" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">
            {copy.ctaFinal.eyebrow}
          </p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
            {copy.ctaFinal.titleLine1}<br />{copy.ctaFinal.titleLine2}
          </h2>
          <p className="mt-8 max-w-2xl mx-auto text-[17px] font-light leading-8 text-white/85">
            {copy.ctaFinal.sub}
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={requestUrl}
              className="inline-flex min-h-[60px] items-center justify-center rounded-full bg-white px-9 py-4 text-sm font-medium text-[#161616] transition hover:bg-white/90"
            >
              {copy.ctaFinal.ctaPrimary} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[60px] items-center justify-center rounded-full border border-white/30 px-7 py-4 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              {copy.ctaFinal.ctaWhatsapp}
            </a>
          </div>

          <p className="mt-10 text-[12px] text-white/55">{copy.ctaFinal.footnote}</p>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2 text-white">
      <span className="text-3xl font-serif md:text-4xl">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.2em] text-white/65">{label}</span>
    </div>
  );
}

function PersonaCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="group rounded-[24px] border border-stone-200 bg-white p-7 transition hover:border-[#7f1d1d]/30 hover:shadow-[0_18px_40px_-20px_rgba(127,29,29,0.25)]">
      <div className="h-[3px] w-10 mb-5 rounded-full" style={{ backgroundColor: ACCENT }} />
      <h3 className="text-xl font-serif text-[#161616]">{title}</h3>
      <p className="mt-4 text-[15px] font-light leading-7 text-[#5d5651]">{body}</p>
    </div>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-7">
      <p
        className="text-[11px] font-medium uppercase tracking-[0.24em]"
        style={{ color: ACCENT }}
      >
        {number}
      </p>
      <h3 className="mt-4 text-xl font-serif text-[#161616]">{title}</h3>
      <p className="mt-3 text-[15px] font-light leading-7 text-[#5d5651]">{text}</p>
    </div>
  );
}
