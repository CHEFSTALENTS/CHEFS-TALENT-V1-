import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDestinationBySlug, getAllDestinationSlugs } from '@/lib/destinations';
import { FaqItem } from '@/app/destinations/_components/FaqItem';

export async function generateStaticParams() {
  return getAllDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dest = getDestinationBySlug(params.slug);
  if (!dest) return {};
  return {
    title: dest.metaTitle,
    description: dest.metaDescription,
    alternates: { canonical: `https://chefstalents.com/destinations/${dest.slug}` },
    openGraph: {
      title: dest.metaTitle,
      description: dest.metaDescription,
      images: [{ url: dest.image }],
    },
  };
}

export default function DestinationPage({
  params,
}: {
  params: { slug: string };
}) {
  const dest = getDestinationBySlug(params.slug) as any;
  if (!dest) notFound();

  const hasFaqs    = Array.isArray(dest.faqs) && dest.faqs.length > 0;
  const hasZones   = Array.isArray(dest.zones) && dest.zones.length > 0;
  const hasLongDesc = Boolean(dest.longDescription);

  const faqSchema = hasFaqs
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: dest.faqs.map((f: any) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: dest.heroTitle,
    description: dest.metaDescription,
    provider: {
      '@type': 'Organization',
      name: 'Chefs Talents',
      url: 'https://chefstalents.com',
    },
    areaServed: { '@type': 'Place', name: dest.name },
    offers: {
      '@type': 'Offer',
      description: dest.rateDetail,
      priceCurrency: 'EUR',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <main className="bg-[#f4efe8] text-[#161616]">

        {/* ── HERO ── */}
        <section className="relative h-[70vh] min-h-[560px] overflow-hidden">
          <img
            src={dest.image}
            alt={dest.heroTitle}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-12 lg:px-20">
            <div className="max-w-3xl text-white">
              <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-white/70">
                {dest.country} — {dest.region}
              </p>
              <h1 className="text-[2.8rem] font-serif leading-[1.0] text-white md:text-6xl lg:text-7xl">
                {dest.heroTitle}
              </h1>
              <p className="mt-4 text-[17px] font-light leading-8 text-white/85 md:text-lg max-w-2xl">
                {dest.heroSubtitle}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/request"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black hover:bg-white/85 transition"
                >
                  Décrire mon besoin
                </Link>
                <a
                  href="https://wa.me/33756827612"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/40 px-8 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  WhatsApp — réponse en 6h
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS RAPIDES ── */}
        <section className="bg-[#161616] px-6 py-10 md:px-12">
          <div className="mx-auto max-w-5xl grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            <div>
              <p className="font-serif text-3xl text-white">50+</p>
              <p className="text-xs text-white/50 mt-1">Chefs actifs sur l'île</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-white">&lt; 6h</p>
              <p className="text-xs text-white/50 mt-1">Délai de réponse</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-white">{dest.rateRange.split('—')[0].trim()}</p>
              <p className="text-xs text-white/50 mt-1">À partir de / semaine</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-white">{dest.season.split('(')[0].trim()}</p>
              <p className="text-xs text-white/50 mt-1">Saison active</p>
            </div>
          </div>
        </section>

        {/* ── DESCRIPTION ── */}
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">
                Pourquoi Chefs Talents à {dest.name}
              </p>
              {hasLongDesc ? (
                <div className="space-y-5">
                  {dest.longDescription.split('\n\n').map((para: string, i: number) => (
                    <p key={i} className="text-[18px] font-light leading-8 text-[#3f3a34]">
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[18px] font-light leading-8 text-[#3f3a34]">
                  {dest.description}
                </p>
              )}
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[#d8d1c7] bg-white p-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-3">Tarifs indicatifs</p>
                <p className="font-serif text-3xl text-[#161616]">{dest.rateRange}</p>
                <p className="text-sm text-[#7d756a] mt-1">{dest.rateDetail}</p>
                <div className="mt-4 pt-4 border-t border-[#e8e2db] text-sm text-[#59544d]">
                  <p className="font-medium text-[#161616] mb-2">Saison</p>
                  <p>{dest.season}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#e8e2db] text-sm text-[#59544d]">
                  <p className="font-medium text-[#161616] mb-2">Réservation</p>
                  <p>{dest.bookingDelay}</p>
                </div>
              </div>
              <Link
                href="/request"
                className="flex items-center justify-center min-h-[52px] rounded-2xl bg-[#161616] text-white text-sm font-medium hover:bg-black transition"
              >
                Soumettre une demande →
              </Link>
            </div>
          </div>
        </section>

        {/* ── ZONES COUVERTES ── */}
        {hasZones && (
          <section className="bg-white px-6 py-20 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">Zones couvertes</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-10 md:text-4xl">
                Partout à {dest.name}
              </h2>
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

        {/* ── HIGHLIGHTS ── */}
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">Notre sélection</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-8 md:text-4xl">
                Ce qui distingue nos chefs à {dest.name}
              </h2>
              <ul className="space-y-3">
                {dest.highlights.map((h: string) => (
                  <li key={h} className="flex items-start gap-3 text-[16px] font-light leading-7 text-[#3f3a34]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B08D57]" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">Types de missions</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-8 md:text-4xl">
                Pour chaque contexte
              </h2>
              <div className="flex flex-wrap gap-3">
                {dest.missionTypes.map((m: string) => (
                  <span key={m} className="px-4 py-2 rounded-full border border-[#d8d1c7] text-sm font-light text-[#3f3a34]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── COMMENT ÇA MARCHE ── */}
        <section className="bg-[#161616] px-6 py-20 md:px-12 lg:px-20 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/50 mb-4">Méthode</p>
            <h2 className="font-serif text-[2.2rem] leading-[1.04] text-white mb-12 md:text-4xl">
              Comment ça fonctionne
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { n: '01', title: 'Vous décrivez votre mission', text: `Lieu, dates, nombre de convives, niveau de service souhaité, budget indicatif.` },
                { n: '02', title: 'Nous sélectionnons les profils', text: `Parmi nos 50+ chefs actifs à ${dest.name}, nous identifions ceux qui correspondent à votre demande.` },
                { n: '03', title: 'Réponse en moins de 6h', text: `Vous recevez une sélection de profils adaptés. Vous choisissez, nous coordonnons.` },
              ].map((step) => (
                <div key={step.n}>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-3">{step.n}</p>
                  <h3 className="font-serif text-xl text-white mb-3">{step.title}</h3>
                  <p className="text-sm font-light leading-7 text-white/65">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link
                href="/request"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-[#161616] hover:bg-white/85 transition"
              >
                Décrire mon besoin
              </Link>
              <a
                href="https://wa.me/33756827612"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/30 px-8 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                WhatsApp direct
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        {hasFaqs && (
          <section className="px-6 py-20 md:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-4">FAQ</p>
              <h2 className="font-serif text-[2.2rem] leading-[1.04] text-[#161616] mb-10 md:text-4xl">
                Questions fréquentes — {dest.name}
              </h2>
              <div className="border-t border-[#e8e2db]">
                {dest.faqs.map((faq: any, i: number) => (
                  <FaqItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── MAILLAGE INTERNE ── */}
        <section className="bg-white px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#7d756a] mb-8">Autres destinations</p>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'Saint-Tropez', slug: 'chef-prive-saint-tropez' },
                { name: 'Monaco', slug: 'chef-prive-monaco' },
                { name: 'Mykonos', slug: 'chef-prive-mykonos' },
                { name: 'Sardaigne', slug: 'chef-prive-sardaigne' },
                { name: "Côte d'Azur", slug: 'chef-prive-cote-azur' },
                { name: 'Courchevel', slug: 'chef-prive-courchevel' },
                { name: 'Cannes', slug: 'chef-prive-cannes' },
                { name: 'Portugal', slug: 'chef-prive-portugal' },
              ]
                .filter((d) => d.slug !== dest.slug)
                .map((d) => (
                  <Link
                    key={d.slug}
                    href={`/destinations/${d.slug}`}
                    className="px-4 py-2 rounded-full border border-[#d8d1c7] text-sm font-light text-[#3f3a34] hover:border-[#a09890] transition"
                  >
                    Chef privé {d.name}
                  </Link>
                ))}
              <Link
                href="/destinations"
                className="px-4 py-2 rounded-full border border-[#161616] text-sm font-medium text-[#161616] hover:bg-[#161616] hover:text-white transition"
              >
                Toutes les destinations →
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
