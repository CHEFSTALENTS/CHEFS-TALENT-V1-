import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { destinations, getDestinationBySlug, getAllDestinationSlugs } from "@/lib/destinations";

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
      url: `https://chefstalents.com/destinations/${dest.slug}`,
      images: [{ url: dest.image, width: 1200, height: 630, alt: dest.heroTitle }],
    },
  };
}

export default function DestinationPage({ params }: { params: { slug: string } }) {
  const dest = getDestinationBySlug(params.slug);
  if (!dest) notFound();

  const related = destinations
    .filter((d) => d.slug !== dest.slug && d.country === dest.country)
    .slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: dest.heroTitle,
    description: dest.description,
    url: `https://chefstalents.com/destinations/${dest.slug}`,
    provider: {
      "@type": "Organization",
      name: "Chefs Talents",
      url: "https://chefstalents.com",
    },
    areaServed: {
      "@type": "Place",
      name: dest.name,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="bg-paper min-h-screen">

        {/* HERO */}
        <section className="relative bg-stone-900 text-white min-h-[75vh] flex flex-col justify-end px-6 md:px-12 pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <img
              src={dest.image}
              alt={dest.heroTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent" />

          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/destinations"
                className="text-xs uppercase tracking-[0.2em] text-stone-400 hover:text-white transition-colors"
              >
                Destinations
              </Link>
              <span className="text-stone-600">/</span>
              <span className="text-xs uppercase tracking-[0.2em] text-stone-300">
                {dest.name}
              </span>
            </div>

            <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-4">
              {dest.country} · {dest.region}
            </p>

            <h1 className="text-5xl md:text-7xl font-serif font-normal leading-[1.0] text-white mb-6">
              {dest.heroTitle}
            </h1>

            <p className="text-xl md:text-2xl text-stone-400 font-light leading-relaxed max-w-2xl mb-10">
              {dest.heroSubtitle}
            </p>

            <Link
              href="/request"
              className="inline-block bg-white text-stone-900 px-8 py-4 text-sm uppercase tracking-[0.15em] font-medium hover:bg-stone-100 transition-colors"
            >
              Soumettre une demande
            </Link>
          </div>
        </section>

        {/* INFOS CLÉS */}
        <section className="bg-stone-100 border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">Saison</p>
                <p className="text-stone-900 font-medium">{dest.season}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">Tarifs indicatifs</p>
                <p className="text-stone-900 font-medium">{dest.rateRange}</p>
                <p className="text-stone-500 text-sm font-light mt-1">{dest.rateDetail}</p>
              </div>
              <div className="bg-white border border-stone-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">Anticipation</p>
                <p className="text-stone-700 font-light text-sm leading-relaxed">{dest.bookingDelay}</p>
              </div>
            </div>
          </div>
        </section>

        {/* DESCRIPTION + HIGHLIGHTS */}
        <section className="bg-paper py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-12 gap-16">
              <div className="md:col-span-5">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Le contexte</p>
                <h2 className="text-4xl md:text-5xl font-serif font-normal text-stone-900 leading-tight mb-8">
                  Chef privé à {dest.name}.
                </h2>
                <p className="text-stone-600 font-light text-lg leading-relaxed mb-10">
                  {dest.description}
                </p>
                <Link
                  href="/request"
                  className="inline-block border border-stone-900 text-stone-900 px-8 py-4 text-sm uppercase tracking-[0.15em] hover:bg-stone-900 hover:text-white transition-colors"
                >
                  Décrire mon besoin
                </Link>
              </div>

              <div className="md:col-span-7">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Notre sélection</p>
                <div className="space-y-4">
                  {dest.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-4 border-b border-stone-200 pb-4">
                      <div className="mt-2 w-1 h-1 bg-stone-400 rounded-full shrink-0" />
                      <p className="text-stone-700 font-light text-lg">{h}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IMAGE */}
        <div className="w-full h-[50vh] overflow-hidden bg-stone-200">
          <img
            src={dest.image}
            alt={dest.heroTitle}
            className="w-full h-full object-cover"
          />
        </div>

        {/* TYPES DE MISSIONS */}
        <section className="bg-stone-100 py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-12 gap-16 items-start">
              <div className="md:col-span-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Missions disponibles</p>
                <h2 className="text-4xl font-serif font-normal text-stone-900 leading-tight">
                  Ce que nous coordonnons à {dest.name}.
                </h2>
              </div>
              <div className="md:col-span-8">
                <div className="grid grid-cols-2 gap-px bg-stone-300 border border-stone-300">
                  {dest.missionTypes.map((m, i) => (
                    <div key={i} className="bg-paper p-8 hover:bg-white transition-colors">
                      <p className="text-stone-700 font-light text-lg">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-stone-900 text-white py-32 px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
              Prêt à démarrer ?
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-normal">
              Une seule demande.<br />Le bon chef.
            </h2>
            <p className="text-stone-400 font-light text-lg max-w-xl mx-auto leading-relaxed">
              Lieu, dates, nombre de convives, budget indicatif. Notre équipe identifie le bon profil pour {dest.name} et coordonne l'ensemble de la mission.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/request"
                className="bg-white text-stone-900 px-10 py-4 text-sm uppercase tracking-[0.15em] font-medium hover:bg-stone-100 transition-colors"
              >
                Soumettre une demande
              </Link>
              <Link
                href="/conciergeries"
                className="border border-stone-600 text-stone-300 px-10 py-4 text-sm uppercase tracking-[0.15em] hover:border-stone-400 transition-colors"
              >
                Je suis une conciergerie
              </Link>
            </div>
          </div>
        </section>

        {/* DESTINATIONS LIÉES */}
        {related.length > 0 && (
          <section className="bg-paper py-24 px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-12">
                Destinations proches — {dest.country}
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                {related.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/destinations/${d.slug}`}
                    className="group block"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-stone-200 mb-6">
                      <img
                        src={d.image}
                        alt={d.name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1.5s]"
                      />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">{d.country}</p>
                    <h3 className="text-2xl font-serif text-stone-900 mb-2">{d.name}</h3>
                    <p className="text-stone-500 font-light text-sm">{d.rateRange} / semaine</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FOOTER MINI */}
        <section className="bg-stone-100 border-t border-stone-200 py-8 px-6 md:px-12">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/destinations" className="text-xs uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors">
              ← Toutes les destinations
            </Link>
            <Link href="/insights" className="text-xs uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors">
              Journal →
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
