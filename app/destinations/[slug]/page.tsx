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

  const allOtherDestinations = destinations
    .filter((d) => d.slug !== dest.slug)
    .slice(0, 12);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: dest.heroTitle,
    description: dest.description,
    url: `https://chefstalents.com/destinations/${dest.slug}`,
    provider: { "@type": "Organization", name: "Chefs Talents", url: "https://chefstalents.com" },
    areaServed: { "@type": "Place", name: dest.name },
    offers: {
      "@type": "Offer",
      priceSpecification: { "@type": "PriceSpecification", priceCurrency: "EUR", description: dest.rateRange },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Combien coûte un chef privé à ${dest.name} ?`,
        acceptedAnswer: { "@type": "Answer", text: `Le tarif d'un chef privé à ${dest.name} varie entre ${dest.rateRange} selon le profil, la durée et l'intensité du service. ${dest.rateDetail}.` },
      },
      {
        "@type": "Question",
        name: `Quand réserver un chef privé à ${dest.name} ?`,
        acceptedAnswer: { "@type": "Answer", text: dest.bookingDelay },
      },
      {
        "@type": "Question",
        name: `Quels types de missions sont disponibles à ${dest.name} ?`,
        acceptedAnswer: { "@type": "Answer", text: `À ${dest.name}, Chefs Talents coordonne les types de missions suivants : ${dest.missionTypes.join(", ")}.` },
      },
      {
        "@type": "Question",
        name: `La prestation est-elle confidentielle à ${dest.name} ?`,
        acceptedAnswer: { "@type": "Answer", text: "La confidentialité est au cœur de notre fonctionnement. Les lieux, clients et détails des missions ne sont jamais rendus publics. Les chefs signent des accords de confidentialité selon les exigences du client." },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-paper min-h-screen">

        {/* HERO */}
        <section className="relative bg-stone-900 text-white min-h-[80vh] flex flex-col justify-end px-6 md:px-12 pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={dest.image} alt={dest.heroTitle} className="w-full h-full object-cover" style={{ filter: "brightness(0.35)" }} />
          </div>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,25,23,0.95) 0%, rgba(28,25,23,0.4) 60%, transparent 100%)" }} />

          <div className="relative z-10 max-w-5xl">
            <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-500 mb-8">
              <Link href="/" className="hover:text-stone-300 transition-colors">Chefs Talents</Link>
              <span>/</span>
              <Link href="/destinations" className="hover:text-stone-300 transition-colors">Destinations</Link>
              <span>/</span>
              <span className="text-stone-300">{dest.name}</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-stone-400 border border-stone-700 px-3 py-1">{dest.country}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-stone-400 border border-stone-700 px-3 py-1">{dest.season}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-normal leading-[1.0] text-white mb-6">
              {dest.heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-stone-400 font-light leading-relaxed max-w-2xl mb-10">
              {dest.heroSubtitle}
            </p>
            <Link href="/request" className="inline-block bg-white text-stone-900 px-8 py-4 text-sm uppercase tracking-[0.15em] font-medium hover:bg-stone-100 transition-colors">
              Soumettre une demande
            </Link>
          </div>
        </section>

        {/* CHIFFRES CLÉS */}
        <section className="bg-stone-900 border-b border-stone-800">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Tarifs", value: dest.rateRange, sub: "/ semaine" },
              { label: "Saison", value: dest.season, sub: "" },
              { label: "Types de missions", value: String(dest.missionTypes.length), sub: "formats disponibles" },
              { label: "Couverture", value: "Europe", sub: "chefs mobiles" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">{stat.label}</p>
                <p className="text-white font-medium text-lg">{stat.value}</p>
                {stat.sub && <p className="text-stone-500 text-xs mt-1">{stat.sub}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* DESCRIPTION */}
        <section className="bg-paper py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-16">
            <div className="md:col-span-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Contexte</p>
              <h2 className="text-4xl md:text-5xl font-serif font-normal text-stone-900 leading-tight mb-8">
                Chef privé à {dest.name}.<br />
                Ce qu'il faut savoir.
              </h2>
              <Link href="/request" className="inline-block border border-stone-900 text-stone-900 px-8 py-4 text-sm uppercase tracking-[0.15em] hover:bg-stone-900 hover:text-white transition-colors">
                Décrire mon besoin
              </Link>
            </div>
            <div className="md:col-span-7">
              <p className="text-stone-600 font-light text-lg leading-relaxed mb-8">{dest.description}</p>
              <div className="space-y-4">
                {dest.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-4 py-4 border-b border-stone-200">
                    <div className="mt-2 w-1 h-1 bg-stone-400 rounded-full shrink-0" />
                    <p className="text-stone-700 font-light text-lg">{h}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* IMAGE PLEINE LARGEUR */}
        <div className="w-full overflow-hidden bg-stone-200" style={{ height: "50vh" }}>
          <img src={dest.image} alt={`Chef privé ${dest.name}`} className="w-full h-full object-cover" />
        </div>

        {/* TYPES DE MISSIONS */}
        <section className="bg-stone-100 py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-12 gap-16 items-start">
              <div className="md:col-span-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Ce que nous coordonnons</p>
                <h2 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 leading-tight mb-6">
                  Missions disponibles à {dest.name}.
                </h2>
                <p className="text-stone-500 font-light leading-relaxed">
                  Chaque mission est qualifiée et coordonnée par notre équipe. Un seul interlocuteur du brief à l'exécution.
                </p>
              </div>
              <div className="md:col-span-8">
                <div className="grid grid-cols-2 gap-px bg-stone-300 border border-stone-300 mb-8">
                  {dest.missionTypes.map((m, i) => (
                    <div key={i} className="bg-paper p-8 hover:bg-white transition-colors">
                      <p className="text-stone-700 font-light text-lg">{m}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-stone-200 p-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-4">Délai recommandé</p>
                  <p className="text-stone-700 font-light text-lg leading-relaxed">{dest.bookingDelay}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TARIFS */}
        <section className="bg-paper py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Tarification</p>
            <h2 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 mb-12 max-w-xl">
              Combien coûte un chef privé à {dest.name} ?
            </h2>
            <div className="grid md:grid-cols-3 gap-px bg-stone-200 border border-stone-200 mb-12">
              {[
                { label: "Mission courte", duration: "1 à 3 jours", rate: "500€ — 1 400€ / jour", note: "Hors matières premières" },
                { label: "Mission semaine", duration: "5 à 7 jours", rate: dest.rateRange, note: dest.rateDetail },
                { label: "Mission longue durée", duration: "1 mois et plus", rate: "6 000€ — 18 000€ / mois", note: "Chef résident saisonnier" },
              ].map((tier, i) => (
                <div key={i} className="bg-paper p-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-3">{tier.label}</p>
                  <p className="text-stone-500 font-light text-sm mb-4">{tier.duration}</p>
                  <p className="text-2xl font-serif text-stone-900 mb-3">{tier.rate}</p>
                  <p className="text-stone-400 text-sm font-light">{tier.note}</p>
                </div>
              ))}
            </div>
            <p className="text-stone-500 font-light text-base leading-relaxed max-w-3xl">
              Ces tarifs couvrent le temps et les compétences du chef — pas les matières premières. Un budget ingrédients séparé est généralement prévu (50€ à 150€ par convive et par jour selon le niveau de cuisine attendu). Les déplacements et l'hébergement pour les chefs non résidents sur place s'ajoutent selon les missions.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-stone-100 py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Questions fréquentes</p>
            <h2 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 mb-12">
              Chef privé à {dest.name} —<br />ce que vous voulez savoir.
            </h2>
            <div className="space-y-0 border-t border-stone-200">
              {[
                {
                  q: `Combien coûte un chef privé à ${dest.name} ?`,
                  a: `Le tarif varie entre ${dest.rateRange} selon le profil, la durée et l'intensité du service. ${dest.rateDetail}. Pour une mission ponctuelle de 1 à 3 jours, comptez 500€ à 1 400€ par jour selon le niveau du chef. Pour un chef résident saisonnier, les tarifs vont de 6 000€ à 18 000€ par mois.`,
                },
                {
                  q: `Comment fonctionne la mise en relation à ${dest.name} ?`,
                  a: `Vous soumettez votre demande en 2 minutes : lieu exact, dates, nombre de convives, type de service souhaité et budget indicatif. Notre équipe analyse votre brief et vous présente une sélection de profils adaptés à votre contexte. Vous validez le profil, nous coordonnons l'ensemble de la mission.`,
                },
                {
                  q: `Quand réserver un chef privé à ${dest.name} ?`,
                  a: dest.bookingDelay + ` En général, plus vous anticipez, plus le choix de profils disponibles est large. Les meilleurs chefs reçoivent plusieurs demandes simultanées et ne peuvent pas maintenir leur disponibilité indéfiniment.`,
                },
                {
                  q: `Qu'est-ce qui est inclus dans la prestation ?`,
                  a: `Le tarif du chef couvre son temps et ses compétences. Les matières premières sont généralement facturées en supplément au coût réel sur justificatifs. Les déplacements et l'hébergement pour les chefs non locaux s'ajoutent selon les missions.`,
                },
                {
                  q: `La prestation est-elle confidentielle ?`,
                  a: `La confidentialité est au cœur de notre fonctionnement. Les lieux, clients et détails des missions ne sont jamais rendus publics. Les chefs signent des accords de confidentialité selon les exigences du client. Les références sont partagées de manière sélective auprès de partenaires qualifiés.`,
                },
                {
                  q: `Pouvez-vous couvrir ${dest.name} toute l'année ?`,
                  a: `Oui. Notre réseau de chefs mobiles permet d'intervenir à ${dest.name} tout au long de l'année, avec une couverture renforcée pendant la période ${dest.season}. En dehors de la haute saison, les disponibilités sont généralement meilleures et les tarifs plus accessibles.`,
                },
              ].map((faq, i) => (
                <details key={i} className="group border-b border-stone-200">
                  <summary className="flex items-center justify-between py-6 cursor-pointer list-none">
                    <h3 className="text-lg font-serif text-stone-900 pr-8">{faq.q}</h3>
                    <span className="text-stone-400 font-light text-2xl group-open:rotate-45 transition-transform shrink-0">+</span>
                  </summary>
                  <p className="text-stone-600 font-light leading-relaxed pb-6 max-w-3xl">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA PRINCIPAL */}
        <section className="bg-stone-900 text-white py-32 px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Prêt à démarrer ?</p>
            <h2 className="text-4xl md:text-5xl font-serif font-normal">
              Une seule demande.<br />Le bon chef à {dest.name}.
            </h2>
            <p className="text-stone-400 font-light text-lg max-w-xl mx-auto leading-relaxed">
              Lieu, dates, nombre de convives, budget indicatif. Notre équipe identifie le bon profil et coordonne l'ensemble de la mission.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/request" className="bg-white text-stone-900 px-10 py-4 text-sm uppercase tracking-[0.15em] font-medium hover:bg-stone-100 transition-colors">
                Soumettre une demande
              </Link>
              <Link href="/conciergeries" className="border border-stone-600 text-stone-300 px-10 py-4 text-sm uppercase tracking-[0.15em] hover:border-stone-400 transition-colors">
                Je suis une conciergerie
              </Link>
            </div>
          </div>
        </section>

        {/* DESTINATIONS PROCHES */}
        {related.length > 0 && (
          <section className="bg-paper py-24 px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-12">
                Destinations proches — {dest.country}
              </p>
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {related.map((d) => (
                  <Link key={d.slug} href={`/destinations/${d.slug}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden bg-stone-200 mb-6">
                      <img src={d.image} alt={d.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1.5s]" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-2">{d.region}</p>
                    <h3 className="text-2xl font-serif text-stone-900 mb-2 group-hover:text-stone-600 transition-colors">{d.name}</h3>
                    <p className="text-stone-500 font-light text-sm">{d.rateRange} / semaine</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* MAILLAGE INTERNE — Toutes les destinations */}
        <section className="bg-stone-100 py-16 px-6 md:px-12 border-t border-stone-200">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-8">Chef privé en Europe — toutes nos destinations</p>
            <div className="flex flex-wrap gap-3">
              {allOtherDestinations.map((d) => (
                <Link
                  key={d.slug}
                  href={`/destinations/${d.slug}`}
                  className="text-sm text-stone-600 hover:text-stone-900 font-light border border-stone-300 px-4 py-2 hover:border-stone-500 transition-colors"
                >
                  Chef privé {d.name}
                </Link>
              ))}
              <Link href="/destinations" className="text-sm text-stone-400 hover:text-stone-600 font-light border border-stone-200 px-4 py-2 hover:border-stone-400 transition-colors">
                Voir toutes →
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER NAV */}
        <section className="bg-paper border-t border-stone-200 py-8 px-6 md:px-12">
          <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
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
