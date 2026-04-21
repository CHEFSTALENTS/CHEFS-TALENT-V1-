'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const SUPPORT_EMAIL = 'contact@chefstalents.com';
const WHATSAPP_NUMBER_E164 = '33756827612';
const WHATSAPP_PREFILL = encodeURIComponent(
  "Hola,\n\nTengo una solicitud para Chefs Talents.\n\nContexto / lugar / fechas:\nPresupuesto indicativo:\nNúmero de invitados:\n\nGracias."
);

const DESTINATIONS_FEATURED = [
  { name: 'Saint-Tropez', country: 'Francia', emoji: '🇫🇷', slug: 'chef-privado-saint-tropez' },
  { name: 'Ibiza', country: 'España', emoji: '🇪🇸', slug: 'chef-privado-ibiza' },
  { name: 'Mykonos', country: 'Grecia', emoji: '🇬🇷', slug: 'chef-privado-mykonos' },
  { name: 'Courchevel', country: 'Francia', emoji: '🇫🇷', slug: 'chef-privado-courchevel' },
  { name: 'Mónaco', country: 'Mónaco', emoji: '🇲🇨', slug: 'chef-privado-monaco' },
  { name: 'Cerdeña', country: 'Italia', emoji: '🇮🇹', slug: 'chef-privado-cerdena' },
  { name: 'Cannes', country: 'Francia', emoji: '🇫🇷', slug: 'chef-privado-cannes' },
  { name: 'Cap Ferrat', country: 'Francia', emoji: '🇫🇷', slug: 'chef-privado-cap-ferrat' },
  { name: 'Megève', country: 'Francia', emoji: '🇫🇷', slug: 'chef-privado-megeve' },
  { name: 'Biarritz', country: 'Francia', emoji: '🇫🇷', slug: 'chef-privado-biarritz' },
  { name: 'Portugal', country: 'Portugal', emoji: '🇵🇹', slug: 'chef-privado-portugal' },
  { name: 'Antibes', country: 'Francia', emoji: '🇫🇷', slug: 'chef-privado-antibes' },
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
            l.code === 'es'
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

export default function HomeES() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Solicitud Chefs Talents')}&body=${encodeURIComponent("Hola,\n\nMe gustaría hacer una solicitud.\n\nContexto / lugar / fechas:\nPresupuesto indicativo:\nNúmero de invitados:\n\nGracias,\n")}`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${WHATSAPP_PREFILL}`;

  return (
    <div className="bg-[#f4efe8] text-[#161616] flex flex-col min-h-screen">

      {/* ── HERO ── */}
      <section className="relative h-[90vh] min-h-[680px] w-full overflow-hidden">
        <motion.img
          src="/images/editorial/hero-chef-talents.jpg"
          alt="Chef privado"
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
              Chefs privados,<br />para misiones<br /><span className="italic">de excepción.</span>
            </h1>
            <p className="mt-6 max-w-[620px] text-[17px] leading-8 text-white/90 md:text-lg md:leading-relaxed">
              Una red de chefs seleccionados para clientes exigentes. Villas, yates, residencias privadas. Una ejecución sin fricciones, en toda Europa.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/request" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition hover:bg-white/85 sm:w-auto">
                Describir mi necesidad
              </Link>
              <Link href="/conciergeries" className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-white/40 bg-black/10 px-8 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto">
                Soy una conserjería
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
              { value: '400+', label: 'Chefs seleccionados', sub: 'formados en estándares de lujo' },
              { value: '400+', label: 'Misiones realizadas', sub: 'desde 2023' },
              { value: '50+', label: 'Destinos', sub: 'en toda Europa' },
              { value: '< 6h', label: 'Tiempo de respuesta', sub: 'persona dedicada' },
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
            <MiniTrust title="Selección rigurosa" text="Perfiles elegidos por su nivel, profesionalismo y fiabilidad sobre el terreno." />
            <MiniTrust title="Cobertura europea" text="Chefs móviles, habituados a residencias privadas, villas, chalets y yates." />
            <MiniTrust title="Coordinación controlada" text="Un único interlocutor para encuadrar, asegurar y supervisar las misiones delicadas." />
          </div>
        </div>
      </section>

      {/* ── POSITIONING ── */}
      <section className="px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Nuestro enfoque</p>
          </div>
          <div className="lg:col-span-9">
            <h2 className="max-w-4xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
              Más que una reserva.<br />Una conexión controlada.
            </h2>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-2xl md:leading-relaxed">
              Chefs Talents fue diseñado para situaciones donde la calidad, la continuidad y la confianza priman sobre la rapidez.
            </p>
            <p className="mt-5 max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-xl md:leading-relaxed">
              No ofrecemos un simple directorio. Cada solicitud es calificada, estructurada y tratada con precisión para identificar el perfil adecuado, en el lugar correcto, en el momento oportuno.
            </p>
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Cobertura</p>
              <h2 className="text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
                Donde<br />usted esté.
              </h2>
              <p className="mt-6 text-[17px] font-light leading-8 text-[#59544d]">
                De la Costa Azul a los Alpes, de Ibiza a Mykonos — nuestros chefs operan en más de 50 destinos premium en toda Europa y más allá.
              </p>
              <Link href="/destinations" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#161616] underline underline-offset-4 hover:opacity-70 transition">
                Ver todos los destinos <ArrowRight className="h-4 w-4" />
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
              <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Exigencia</p>
              <h2 className="text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-5xl">
                Una red pensada para entornos premium.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <p className="max-w-[24rem] text-[18px] font-light leading-8 text-[#59544d] md:max-w-3xl md:text-xl md:leading-relaxed">
                Nuestros 400 chefs son seleccionados según su experiencia, movilidad, capacidad de adaptación y exigencia operacional en contextos privados de alto nivel.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <ValueCard text="400 chefs seleccionados según estándares de lujo" />
                <ValueCard text="Cobertura europea con experiencia local" />
                <ValueCard text="Gestión de continuidad y sustituciones" />
                <ValueCard text="Chefs multilingües, con experiencia UHNW" />
                <ValueCard text="Un único interlocutor para misiones complejas" />
                <ValueCard text="Relación discreta, estructurada y controlada" />
              </div>
              <div className="mt-10">
                <Link href="/conciergeries" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#161616] px-7 py-4 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
                  Acceso conserjerías <ArrowRight className="ml-2 h-4 w-4" />
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
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Confidencialidad</p>
            <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
              La discreción<br />no es opcional.
            </h2>
          </div>
          <div className="lg:col-span-8">
            <p className="max-w-[24rem] text-[18px] font-light leading-8 text-white/88 md:max-w-3xl md:text-2xl md:leading-relaxed">
              Nuestros chefs trabajan en villas, chalets, yates y residencias privadas en toda Europa. Los lugares, clientes y detalles de las misiones nunca se hacen públicos.
            </p>
            <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/78 md:max-w-3xl md:text-xl md:leading-relaxed">
              Las referencias se comparten de forma selectiva. La confidencialidad es fundamental en nuestra manera de trabajar.
            </p>
            <a href={mailtoHref} className="mt-10 inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-white/28 px-7 py-4 text-sm font-medium text-white transition hover:bg-white/6 sm:w-auto">
              Contáctenos
            </a>
          </div>
        </div>
      </section>

      {/* ── IMAGE BREAK ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px]">
          <div className="relative h-[58vh] md:h-[72vh]">
            <img src="/images/editorial/villa-service.jpg" alt="Entorno privado" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/18" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-3xl px-8 pb-10 md:px-12 md:pb-14">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/80">Ejecución</p>
                <h3 className="mt-3 text-[2.2rem] font-serif leading-[1.06] text-white md:text-5xl">
                  Presencia discreta, ejecución constante, nivel de servicio mantenido.
                </h3>
                <p className="mt-4 max-w-[23rem] text-[17px] font-light leading-8 text-white/88 md:max-w-2xl md:text-lg md:leading-relaxed">
                  Intervenciones calibradas para responder a altos estándares, sin fricciones y con una verdadera continuidad operacional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">Método</p>
          <h2 className="mt-4 max-w-3xl text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">
            Una solicitud simple.<br />Un tratamiento estructurado.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard number="01" title="Calificación" text="Analizamos el lugar, las fechas, el nivel de servicio, el formato de misión y el presupuesto indicativo." />
            <StepCard number="02" title="Selección" text="Identificamos los perfiles más relevantes según la misión, el entorno y los requisitos expresados." />
            <StepCard number="03" title="Coordinación" text="Una vez validado el perfil, encuadramos la misión y seguimos siendo el punto de contacto durante su desarrollo." />
          </div>
        </div>
      </section>

      {/* ── TWO ENTRIES ── */}
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] bg-[#161616] px-8 py-12 md:px-14 md:py-16 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">
            <div className="lg:col-span-5 mb-8 lg:mb-0">
              <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-white/60">Acceso</p>
              <h2 className="text-[2.4rem] font-serif leading-[1.04] text-white md:text-5xl">
                Una sola red.<br />Dos entradas.
              </h2>
            </div>
            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-3">Clientes privados</p>
                <h3 className="text-xl font-serif text-white mb-3">Acceso directo</h3>
                <p className="text-[15px] font-light leading-7 text-white/70">Villas, yates, chalets — describa su misión, nuestro equipo selecciona el perfil adecuado en menos de 6h.</p>
                <Link href="/request" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
                  Enviar solicitud <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-[24px] border border-white/20 bg-white/10 px-6 py-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-3">Conserjerías</p>
                <h3 className="text-xl font-serif text-white mb-3">Acceso socio</h3>
                <p className="text-[15px] font-light leading-7 text-white/70">Acceso dedicado a perfiles validados para misiones complejas, de larga duración o recurrentes.</p>
                <Link href="/conciergeries" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition">
                  Acceso conserjerías <ArrowRight className="h-4 w-4" />
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
                <img src="images/editorial/IMG_8782.JPG" alt="Thomas Delcroix — Fundador Chefs Talents" className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5" />
              </div>
              <div className="lg:col-span-8 px-8 py-10 md:px-12 md:py-14 flex flex-col justify-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">Fundador</p>
                <h2 className="text-[2.2rem] font-serif leading-[1.04] text-[#161616] md:text-4xl mb-6">Thomas Delcroix</h2>
                <p className="text-[18px] font-light leading-8 text-[#59544d] mb-4 max-w-2xl">
                  Chef privado desde 2020, apasionado por el mundo del lujo y la gastronomía privada. He trabajado en restaurantes con estrella Michelin en Francia, navegado varios meses en yates privados por el Mediterráneo y realizado más de 200 misiones en villas, chalets y residencias en toda Europa.
                </p>
                <p className="text-[18px] font-light leading-8 text-[#59544d] mb-8 max-w-2xl">
                  Fundé Chefs Talents en 2023 para poner esta red — chefs conocidos en cocinas con estrella y a bordo de superyates — al servicio de clientes que exigen la excelencia.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/about" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#d4cdc2] px-7 text-sm font-medium text-[#3f3a34] transition hover:bg-[#f4efe8] sm:w-auto">
                    Saber más
                  </Link>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER_E164}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#161616] px-7 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
                    Contactarme
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
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/72">Solicitud única</p>
          <h2 className="mt-4 max-w-4xl text-[2.55rem] font-serif leading-[1.04] text-white md:text-6xl">
            Una sola solicitud.<br />La respuesta correcta.
          </h2>
          <p className="mt-6 max-w-[24rem] text-[18px] font-light leading-8 text-white/86 md:max-w-3xl md:text-xl md:leading-relaxed">
            Cena privada, estancia, residencia larga, yate o solicitud más compleja: rellena una sola solicitud, nuestro equipo califica la necesidad y construye la mejor respuesta.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/request" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-[#161616] transition hover:bg-[#ece6dc] sm:w-auto">
              Describir mi necesidad <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/conciergeries" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-white/24 px-8 py-4 text-sm font-medium text-white transition hover:bg-white/5 sm:w-auto">
              Soy una conserjería
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a]">FAQ</p>
          <h2 className="mt-4 text-[2.55rem] font-serif leading-[1.04] text-[#161616] md:text-6xl">Preguntas frecuentes</h2>
          <p className="mt-6 text-[18px] font-light leading-8 text-[#59544d] md:text-lg">Lo esencial, antes de enviarnos su brief.</p>
          <div className="mt-12 border-t border-[#d8d1c7]">
            <FaqItem title="¿Qué sucede después de enviar mi solicitud?" content="Analizamos su brief (lugar, fechas, expectativas, presupuesto) y le respondemos con una selección de chefs disponibles y relevantes en 6 horas. Usted valida un perfil y nosotros coordinamos toda la misión." isDefaultOpen />
            <FaqItem title="¿Elijo yo el chef?" content="Sí. Chefs Talents actúa como intermediario curador: preseleccionamos perfiles adecuados y usted elige el que mejor se adapta a su estilo, sus restricciones y su nivel de exigencia." />
            <FaqItem title="¿Cuándo se realiza el pago?" content="El pago depende de la naturaleza y duración de la misión. Para servicios puntuales, el pago se realiza una vez seleccionado el chef para confirmar la misión. Para misiones más largas o complejas, las condiciones se especifican de antemano con transparencia." />
            <FaqItem title="¿Por qué se cobran honorarios de servicio?" content="Los honorarios de servicio cubren la selección de chefs, la coordinación, la seguridad de la misión y el seguimiento operacional." />
            <FaqItem title="¿Qué pasa si el chef cancela o no puede realizar la misión?" content="En caso de indisponibilidad del chef, activamos inmediatamente una solución de reemplazo con un perfil equivalente." />
            <FaqItem title="¿Es confidencial el servicio?" content="Absolutamente. La discreción es un principio fundamental de Chefs Talents. Los lugares, clientes y detalles de las misiones nunca se hacen públicos." />
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link href="/request" className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#161616] px-8 py-4 text-sm font-medium text-white transition hover:bg-black sm:w-auto">
              Describir mi necesidad
            </Link>
            <a href={mailtoHref} className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full border border-[#d4cdc2] px-8 py-4 text-sm font-medium text-[#3f3a34] transition hover:bg-[#ebe5db] sm:w-auto">
              Escribirnos
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
              <p className="text-sm leading-relaxed font-light text-stone-500 max-w-xs">La referencia para la experiencia culinaria privada en Europa. Servicio a medida para villas, yates y residencias privadas.</p>
              <div className="flex flex-col gap-2 pt-2">
                <a href={`https://wa.me/${WHATSAPP_NUMBER_E164}`} target="_blank" rel="noreferrer" className="text-sm text-stone-400 hover:text-white transition flex items-center gap-2"><span className="text-green-500">●</span> WhatsApp — Thomas</a>
                <a href={mailtoHref} className="text-sm text-stone-400 hover:text-white transition">contact@chefstalents.com</a>
              </div>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Plataforma</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/request" className="hover:text-white transition">Enviar solicitud</Link></li>
                <li><Link href="/conciergeries" className="hover:text-white transition">Conserjerías</Link></li>
                <li><Link href="/destinations" className="hover:text-white transition">Destinos</Link></li>
                <li><Link href="/chefs" className="hover:text-white transition">Portal chef</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Destinos</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/destinations/chef-privado-saint-tropez" className="hover:text-white transition">Chef privado Saint-Tropez</Link></li>
                <li><Link href="/destinations/chef-privado-ibiza" className="hover:text-white transition">Chef privado Ibiza</Link></li>
                <li><Link href="/destinations/chef-privado-mykonos" className="hover:text-white transition">Chef privado Mykonos</Link></li>
                <li><Link href="/destinations/chef-privado-courchevel" className="hover:text-white transition">Chef privado Courchevel</Link></li>
                <li><Link href="/destinations/chef-privado-monaco" className="hover:text-white transition">Chef privado Mónaco</Link></li>
                <li><Link href="/destinations" className="hover:text-white transition text-stone-500">Ver todos →</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Sobre nosotros</h4>
              <ul className="space-y-3 text-sm font-light mb-8">
                <li><Link href="/about" className="hover:text-white transition">Thomas Delcroix</Link></li>
                <li><Link href="/insights" className="hover:text-white transition">Journal</Link></li>
              </ul>
              <h4 className="text-stone-300 font-medium mb-6 uppercase text-[10px] tracking-[0.2em]">Legal</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><Link href="/conditions" className="hover:text-white transition">Términos y Condiciones</Link></li>
                <li><Link href="/legal" className="hover:text-white transition">Aviso Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <span>© {new Date().getFullYear()} Chefs Talents — Thomas Delcroix. Todos los derechos reservados.</span>
            <span className="text-stone-700">Bordeaux, Francia</span>
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
