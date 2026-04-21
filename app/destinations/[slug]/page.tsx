import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDestinationBySlug, getAllDestinationSlugs } from '@/lib/destinations';
import { FaqItem } from '@/app/destinations/_components/FaqItem';
import { LangSwitcher } from '@/app/destinations/_components/LangSwitcher';

export async function generateStaticParams() {
  return getAllDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const dest = getDestinationBySlug(params.slug);
  if (!dest) return {};
  return {
    title: dest.metaTitle,
    description: dest.metaDescription,
    alternates: { canonical: `https://chefstalents.com/destinations/${dest.slug}` },
    openGraph: { title: dest.metaTitle, description: dest.metaDescription, images: [{ url: dest.image }] },
  };
}

// ─────────────────────────────────────────────────────────────
// TRADUCTIONS UI — tout le texte hardcodé de la page
// ─────────────────────────────────────────────────────────────
type Lang = 'fr' | 'en' | 'es';

const UI: Record<Lang, {
  tagline: (name: string) => string;
  whyUs: (name: string) => string;
  zones: (name: string) => string;
  zonesLabel: string;
  selection: string;
  selectionTitle: (name: string) => string;
  missions: string;
  missionsTitle: string;
  method: string;
  methodTitle: string;
  step1Title: string;
  step1Text: string;
  step2Title: (name: string) => string;
  step2Text: string;
  step3Title: string;
  step3Text: string;
  faqLabel: string;
  faqTitle: (name: string) => string;
  others: string;
  allDest: string;
  cta1: string;
  cta2: string;
  rates: string;
  season: string;
  booking: string;
  from: string;
  perWeek: string;
  submit: string;
  whatsapp: string;
}> = {
  fr: {
    tagline: (name) => `Pourquoi Chefs Talents à ${name}`,
    whyUs: (name) => `Pourquoi Chefs Talents à ${name}`,
    zones: (name) => `Partout à ${name}`,
    zonesLabel: 'Zones couvertes',
    selection: 'Notre sélection',
    selectionTitle: (name) => `Ce qui distingue nos chefs à ${name}`,
    missions: 'Types de missions',
    missionsTitle: 'Pour chaque contexte',
    method: 'Méthode',
    methodTitle: 'Comment ça fonctionne',
    step1Title: 'Vous décrivez votre mission',
    step1Text: 'Lieu, dates, nombre de convives, niveau de service souhaité, budget indicatif.',
    step2Title: (name) => `Nous sélectionnons les profils`,
    step2Text: `Parmi nos 50+ chefs actifs sur la destination, nous identifions ceux qui correspondent à votre demande.`,
    step3Title: 'Réponse en moins de 6h',
    step3Text: 'Vous recevez une sélection de profils adaptés. Vous choisissez, nous coordonnons.',
    faqLabel: 'FAQ',
    faqTitle: (name) => `Questions fréquentes — ${name}`,
    others: 'Autres destinations',
    allDest: 'Toutes les destinations →',
    cta1: 'Décrire mon besoin',
    cta2: 'WhatsApp — réponse en 6h',
    rates: 'Tarifs indicatifs',
    season: 'Saison',
    booking: 'Réservation',
    from: 'À partir de / semaine',
    perWeek: 'par semaine',
    submit: 'Soumettre une demande →',
    whatsapp: 'WhatsApp direct',
  },
  en: {
    tagline: (name) => `Why Chefs Talents in ${name}`,
    whyUs: (name) => `Why Chefs Talents in ${name}`,
    zones: (name) => `Everywhere in ${name}`,
    zonesLabel: 'Areas covered',
    selection: 'Our selection',
    selectionTitle: (name) => `What sets our chefs apart in ${name}`,
    missions: 'Mission types',
    missionsTitle: 'For every occasion',
    method: 'How it works',
    methodTitle: 'Simple process, expert result',
    step1Title: 'You describe your mission',
    step1Text: 'Location, dates, number of guests, service level, indicative budget.',
    step2Title: () => 'We select the profiles',
    step2Text: 'From our 50+ active chefs on the island, we identify the right match for your request.',
    step3Title: 'Response within 6 hours',
    step3Text: 'You receive a curated selection of profiles. You choose, we coordinate.',
    faqLabel: 'FAQ',
    faqTitle: (name) => `Frequently asked questions — ${name}`,
    others: 'Other destinations',
    allDest: 'All destinations →',
    cta1: 'Describe my needs',
    cta2: 'WhatsApp — reply within 6h',
    rates: 'Indicative rates',
    season: 'Season',
    booking: 'Booking',
    from: 'From / week',
    perWeek: 'per week',
    submit: 'Submit a request →',
    whatsapp: 'WhatsApp',
  },
  es: {
    tagline: (name) => `Por qué Chefs Talents en ${name}`,
    whyUs: (name) => `Por qué Chefs Talents en ${name}`,
    zones: (name) => `En toda ${name}`,
    zonesLabel: 'Zonas cubiertas',
    selection: 'Nuestra selección',
    selectionTitle: (name) => `Lo que distingue a nuestros chefs en ${name}`,
    missions: 'Tipos de misión',
    missionsTitle: 'Para cada ocasión',
    method: 'Método',
    methodTitle: 'Cómo funciona',
    step1Title: 'Describe tu misión',
    step1Text: 'Lugar, fechas, número de invitados, nivel de servicio deseado, presupuesto indicativo.',
    step2Title: () => 'Seleccionamos los perfiles',
    step2Text: 'Entre nuestros 50+ chefs activos en el destino, identificamos los que mejor se adaptan a tu solicitud.',
    step3Title: 'Respuesta en menos de 6h',
    step3Text: 'Recibes una selección de perfiles adaptados. Tú eliges, nosotros coordinamos.',
    faqLabel: 'FAQ',
    faqTitle: (name) => `Preguntas frecuentes — ${name}`,
    others: 'Otros destinos',
    allDest: 'Todos los destinos →',
    cta1: 'Describir mi necesidad',
    cta2: 'WhatsApp — respuesta en 6h',
    rates: 'Tarifas indicativas',
    season: 'Temporada',
    booking: 'Reserva',
    from: 'Desde / semana',
    perWeek: 'por semana',
    submit: 'Enviar una solicitud →',
    whatsapp: 'WhatsApp directo',
  },
};

// ─────────────────────────────────────────────────────────────
// PAIRES DE SLUGS PAR LANGUE — ajoutez ici chaque destination multilingue
// ─────────────────────────────────────────────────────────────
const LANG_PAIRS: Record<string, { fr: string; en: string; es?: string }> = {
    'chef-prive-cote-azur':      { fr: 'chef-prive-cote-azur',      en: 'private-chef-cote-dazur',    es: 'chef-privado-costa-azul' },
    'private-chef-cote-dazur':   { fr: 'chef-prive-cote-azur',      en: 'private-chef-cote-dazur',    es: 'chef-privado-costa-azul' },
    'chef-privado-costa-azul':   { fr: 'chef-prive-cote-azur',      en: 'private-chef-cote-dazur',    es: 'chef-privado-costa-azul' },
    'chef-prive-saint-tropez':   { fr: 'chef-prive-saint-tropez',   en: 'private-chef-saint-tropez',  es: 'chef-privado-saint-tropez' },
    'private-chef-saint-tropez': { fr: 'chef-prive-saint-tropez',   en: 'private-chef-saint-tropez',  es: 'chef-privado-saint-tropez' },
    'chef-privado-saint-tropez': { fr: 'chef-prive-saint-tropez',   en: 'private-chef-saint-tropez',  es: 'chef-privado-saint-tropez' },
    'chef-prive-cannes':         { fr: 'chef-prive-cannes',         en: 'private-chef-cannes',        es: 'chef-privado-cannes' },
    'private-chef-cannes':       { fr: 'chef-prive-cannes',         en: 'private-chef-cannes',        es: 'chef-privado-cannes' },
    'chef-privado-cannes':       { fr: 'chef-prive-cannes',         en: 'private-chef-cannes',        es: 'chef-privado-cannes' },
    'chef-prive-antibes':        { fr: 'chef-prive-antibes',        en: 'private-chef-antibes',       es: 'chef-privado-antibes' },
    'private-chef-antibes':      { fr: 'chef-prive-antibes',        en: 'private-chef-antibes',       es: 'chef-privado-antibes' },
    'chef-privado-antibes':      { fr: 'chef-prive-antibes',        en: 'private-chef-antibes',       es: 'chef-privado-antibes' },
    'chef-prive-monaco':         { fr: 'chef-prive-monaco',         en: 'private-chef-monaco',        es: 'chef-privado-monaco' },
    'private-chef-monaco':       { fr: 'chef-prive-monaco',         en: 'private-chef-monaco',        es: 'chef-privado-monaco' },
    'chef-privado-monaco':       { fr: 'chef-prive-monaco',         en: 'private-chef-monaco',        es: 'chef-privado-monaco' },
    'chef-prive-nice':           { fr: 'chef-prive-nice',           en: 'private-chef-nice',          es: 'chef-privado-niza' },
    'private-chef-nice':         { fr: 'chef-prive-nice',           en: 'private-chef-nice',          es: 'chef-privado-niza' },
    'chef-privado-niza':         { fr: 'chef-prive-nice',           en: 'private-chef-nice',          es: 'chef-privado-niza' },
    'chef-prive-cap-ferrat':     { fr: 'chef-prive-cap-ferrat',     en: 'private-chef-cap-ferrat',    es: 'chef-privado-cap-ferrat' },
    'private-chef-cap-ferrat':   { fr: 'chef-prive-cap-ferrat',     en: 'private-chef-cap-ferrat',    es: 'chef-privado-cap-ferrat' },
    'chef-privado-cap-ferrat':   { fr: 'chef-prive-cap-ferrat',     en: 'private-chef-cap-ferrat',    es: 'chef-privado-cap-ferrat' },
    'chef-prive-courchevel':     { fr: 'chef-prive-courchevel',     en: 'private-chef-courchevel',    es: 'chef-privado-courchevel' },
    'private-chef-courchevel':   { fr: 'chef-prive-courchevel',     en: 'private-chef-courchevel',    es: 'chef-privado-courchevel' },
    'chef-privado-courchevel':   { fr: 'chef-prive-courchevel',     en: 'private-chef-courchevel',    es: 'chef-privado-courchevel' },
    'chef-prive-megeve':         { fr: 'chef-prive-megeve',         en: 'private-chef-megeve',        es: 'chef-privado-megeve' },
    'private-chef-megeve':       { fr: 'chef-prive-megeve',         en: 'private-chef-megeve',        es: 'chef-privado-megeve' },
    'chef-privado-megeve':       { fr: 'chef-prive-megeve',         en: 'private-chef-megeve',        es: 'chef-privado-megeve' },
    'chef-prive-val-disere':     { fr: 'chef-prive-val-disere',     en: 'private-chef-val-disere',    es: 'chef-privado-val-disere' },
    'private-chef-val-disere':   { fr: 'chef-prive-val-disere',     en: 'private-chef-val-disere',    es: 'chef-privado-val-disere' },
    'chef-privado-val-disere':   { fr: 'chef-prive-val-disere',     en: 'private-chef-val-disere',    es: 'chef-privado-val-disere' },
    'chef-prive-biarritz':       { fr: 'chef-prive-biarritz',       en: 'private-chef-biarritz',      es: 'chef-privado-biarritz' },
    'private-chef-biarritz':     { fr: 'chef-prive-biarritz',       en: 'private-chef-biarritz',      es: 'chef-privado-biarritz' },
    'chef-privado-biarritz':     { fr: 'chef-prive-biarritz',       en: 'private-chef-biarritz',      es: 'chef-privado-biarritz' },
    'chef-prive-ibiza':          { fr: 'chef-prive-ibiza',          en: 'private-chef-ibiza',         es: 'chef-privado-ibiza' },
    'private-chef-ibiza':        { fr: 'chef-prive-ibiza',          en: 'private-chef-ibiza',         es: 'chef-privado-ibiza' },
    'chef-privado-ibiza':        { fr: 'chef-prive-ibiza',          en: 'private-chef-ibiza',         es: 'chef-privado-ibiza' },
    'chef-prive-mykonos':        { fr: 'chef-prive-mykonos',        en: 'private-chef-mykonos',       es: 'chef-privado-mykonos' },
    'private-chef-mykonos':      { fr: 'chef-prive-mykonos',        en: 'private-chef-mykonos',       es: 'chef-privado-mykonos' },
    'chef-privado-mykonos':      { fr: 'chef-prive-mykonos',        en: 'private-chef-mykonos',       es: 'chef-privado-mykonos' },
    'chef-prive-sardaigne':      { fr: 'chef-prive-sardaigne',      en: 'private-chef-sardinia',      es: 'chef-privado-cerdena' },
    'private-chef-sardinia':     { fr: 'chef-prive-sardaigne',      en: 'private-chef-sardinia',      es: 'chef-privado-cerdena' },
    'chef-privado-cerdena':      { fr: 'chef-prive-sardaigne',      en: 'private-chef-sardinia',      es: 'chef-privado-cerdena' },
    'chef-prive-portugal':       { fr: 'chef-prive-portugal',       en: 'private-chef-portugal',      es: 'chef-privado-portugal' },
    'private-chef-portugal':     { fr: 'chef-prive-portugal',       en: 'private-chef-portugal',      es: 'chef-privado-portugal' },
    'chef-privado-portugal':     { fr: 'chef-prive-portugal',       en: 'private-chef-portugal',      es: 'chef-privado-portugal' },
  };

// Détecte la langue depuis le slug ou le champ lang
function detectLang(dest: any): Lang {
  if (dest.lang === 'en') return 'en';
  if (dest.lang === 'es') return 'es';
  if (dest.slug?.startsWith('private-chef-')) return 'en';
  if (dest.slug?.startsWith('chef-privado-')) return 'es';
  return 'fr';
}

export default function DestinationPage({ params }: { params: { slug: string } }) {
  const dest = getDestinationBySlug(params.slug) as any;
  if (!dest) notFound();

  const lang = detectLang(dest);
  const t = UI[lang];
  const langPair = LANG_PAIRS[dest.slug] ?? null;

  const hasFaqs    = Array.isArray(dest.faqs) && dest.faqs.length > 0;
  const hasZones   = Array.isArray(dest.zones) && dest.zones.length > 0;
  const hasLongDesc = Boolean(dest.longDescription);

  const faqSchema = hasFaqs ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dest.faqs.map((f: any) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: dest.heroTitle,
    description: dest.metaDescription,
    provider: { '@type': 'Organization', name: 'Chefs Talents', url: 'https://chefstalents.com' },
    areaServed: { '@type': 'Place', name: dest.name },
    offers: { '@type': 'Offer', description: dest.rateDetail, priceCurrency: 'EUR' },
  };

  // Destinations de maillage selon la langue
  const linkedDests = lang === 'en'
    ? [
        { name: 'Saint-Tropez', slug: 'chef-prive-saint-tropez' },
        { name: 'Monaco', slug: 'chef-prive-monaco' },
        { name: 'Mykonos', slug: 'chef-prive-mykonos' },
        { name: 'Sardinia', slug: 'chef-prive-sardaigne' },
        { name: 'French Riviera', slug: 'chef-prive-cote-azur' },
        { name: 'Courchevel', slug: 'chef-prive-courchevel' },
      ]
    : lang === 'es'
    ? [
        { name: 'Saint-Tropez', slug: 'chef-prive-saint-tropez' },
        { name: 'Mónaco', slug: 'chef-prive-monaco' },
        { name: 'Mykonos', slug: 'chef-prive-mykonos' },
        { name: 'Cerdeña', slug: 'chef-prive-sardaigne' },
        { name: 'Costa Azul', slug: 'chef-prive-cote-azur' },
        { name: 'Courchevel', slug: 'chef-prive-courchevel' },
      ]
    : [
        { name: 'Saint-Tropez', slug: 'chef-prive-saint-tropez' },
        { name: 'Monaco', slug: 'chef-prive-monaco' },
        { name: 'Mykonos', slug: 'chef-prive-mykonos' },
        { name: 'Sardaigne', slug: 'chef-prive-sardaigne' },
        { name: "Côte d'Azur", slug: 'chef-prive-cote-azur' },
        { name: 'Courchevel', slug: 'chef-prive-courchevel' },
        { name: 'Cannes', slug: 'chef-prive-cannes' },
        { name: 'Portugal', slug: 'chef-prive-portugal' },
      ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      <main className="bg-[#f4efe8] text-[#161616]">

        {/* ── HERO ── */}
        <section className="relative h-[70vh] min-h-[560px] overflow-hidden">
          <img src={dest.image} alt={dest.heroTitle} className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-12 lg:px-20">
            <div className="max-w-3xl text-white w-full">
              <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/70">
                  {dest.country} — {dest.region}
                </p>
                {langPair && (
                  <LangSwitcher
                    currentLang={lang}
                    frSlug={langPair.fr}
                    enSlug={langPair.en}
                    esSlug={langPair.es}
                  />
                )}
              </div>
              <h1 className="text-[2.8rem] font-serif leading-[1.0] text-white md:text-6xl lg:text-7xl">{dest.heroTitle}</h1>
              <p className="mt-4 text-[17px] font-light leading-8 text-white/85 md:text-lg max-w-2xl">{dest.heroSubtitle}</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/request" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black hover:bg-white/85 transition">
                  {t.cta1}
                </Link>
                <a href="https://wa.me/33756827612" target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/40 px-8 text-sm font-medium text-white hover:bg-white/10 transition">
                  {t.cta2}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="bg-[#161616] px-6 py-10 md:px-12">
          <div className="mx-auto max-w-5xl grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            <div>
              <p className="font-serif text-3xl text-white">400+</p>
              <p className="text-xs text-white/50 mt-1">{lang === 'en' ? 'Chefs in our network' : lang === 'es' ? 'Chefs en nuestra red' : 'Chefs dans notre réseau'}</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-white">&lt; 6h</p>
              <p className="text-xs text-white/50 mt-1">{lang === 'en' ? 'Response time' : lang === 'es' ? 'Tiempo de respuesta' : 'Délai de réponse'}</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-white">{dest.rateRange.split('—')[0].trim()}</p>
              <p className="text-xs text-white/50 mt-1">{t.from}</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-white">{dest.season.split('(')[0].trim()}</p>
              <p className="text-xs text-white/50 mt-1">{lang === 'en' ? 'Active season' : lang === 'es' ? 'Temporada activa' : 'Saison active'}</p>
            </div>
          </div>
        </section>

        {/* ── DESCRIPTION ── */}
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">{t.whyUs(dest.name)}</p>
              {hasLongDesc ? (
                <div className="space-y-5">
                  {dest.longDescription.split('\n\n').map((para: string, i: number) => (
                    <p key={i} className="text-[18px] font-light leading-8 text-[#3f3a34]">{para}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[18px] font-light leading-8 text-[#3f3a34]">{dest.description}</p>
              )}
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[#d8d1c7] bg-white p-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-3">{t.rates}</p>
                <p className="font-serif text-3xl text-[#161616]">{dest.rateRange}</p>
                <p className="text-sm text-[#7d756a] mt-1">{dest.rateDetail}</p>
                <div className="mt-4 pt-4 border-t border-[#e8e2db] text-sm text-[#59544d]">
                  <p className="font-medium text-[#161616] mb-2">{t.season}</p>
                  <p>{dest.season}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#e8e2db] text-sm text-[#59544d]">
                  <p className="font-medium text-[#161616] mb-2">{t.booking}</p>
                  <p>{dest.bookingDelay}</p>
                </div>
              </div>
              <Link href="/request" className="flex items-center justify-center min-h-[52px] rounded-2xl bg-[#161616] text-white text-sm font-medium hover:bg-black transition">
                {t.submit}
              </Link>
            </div>
          </div>
        </section>

        {/* ── ZONES ── */}
        {hasZones && (
          <section className="bg-white px-6 py-20 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">{t.zonesLabel}</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-10 md:text-4xl">{t.zones(dest.name)}</h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {dest.zones.map((zone: any) => (
                  <div key={zone.name} className="rounded-2xl border border-[#e8e2db] bg-[#faf9f7] px-6 py-5">
                    <p className="font-medium text-[#161616] mb-1">{zone.name}</p>
                    <p className="text-sm font-light text-[#7d756a] leading-6">{zone.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── HIGHLIGHTS + MISSIONS ── */}
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">{t.selection}</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-8 md:text-4xl">{t.selectionTitle(dest.name)}</h2>
              <ul className="space-y-3">
                {dest.highlights.map((h: string) => (
                  <li key={h} className="flex items-start gap-3 text-[16px] font-light leading-7 text-[#3f3a34]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B08D57]" />{h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">{t.missions}</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-8 md:text-4xl">{t.missionsTitle}</h2>
              <div className="flex flex-wrap gap-3">
                {dest.missionTypes.map((m: string) => (
                  <span key={m} className="px-4 py-2 rounded-full border border-[#d8d1c7] text-sm font-light text-[#3f3a34]">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── MÉTHODE ── */}
        <section className="bg-[#161616] px-6 py-20 md:px-12 lg:px-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/50 mb-4">{t.method}</p>
            <h2 className="font-serif text-[2.2rem] leading-[1.04] text-white mb-12 md:text-4xl">{t.methodTitle}</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { n: '01', title: t.step1Title, text: t.step1Text },
                { n: '02', title: t.step2Title(dest.name), text: t.step2Text },
                { n: '03', title: t.step3Title, text: t.step3Text },
              ].map((step) => (
                <div key={step.n}>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-3">{step.n}</p>
                  <h3 className="font-serif text-xl text-white mb-3">{step.title}</h3>
                  <p className="text-sm font-light leading-7 text-white/65">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/request" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-[#161616] hover:bg-white/85 transition">
                {t.cta1}
              </Link>
              <a href="https://wa.me/33756827612" target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/30 px-8 text-sm font-medium text-white hover:bg-white/10 transition">
                {t.whatsapp}
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        {hasFaqs && (
          <section className="px-6 py-20 md:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">{t.faqLabel}</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-10 md:text-4xl">{t.faqTitle(dest.name)}</h2>
              <div className="border-t border-[#e8e2db]">
                {dest.faqs.map((faq: any, i: number) => (
                  <FaqItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── MAILLAGE ── */}
        <section className="bg-white px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-8">{t.others}</p>
            <div className="flex flex-wrap gap-3">
              {linkedDests.filter(d => d.slug !== dest.slug).map((d) => (
                <Link key={d.slug} href={`/destinations/${d.slug}`} className="px-4 py-2 rounded-full border border-[#d8d1c7] text-sm font-light text-[#3f3a34] hover:border-[#a09890] transition">
                  {lang === 'en' ? 'Private Chef' : lang === 'es' ? 'Chef Privado' : 'Chef privé'} {d.name}
                </Link>
              ))}
              <Link href="/destinations" className="px-4 py-2 rounded-full border border-[#161616] text-sm font-medium text-[#161616] hover:bg-[#161616] hover:text-white transition">
                {t.allDest}
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
