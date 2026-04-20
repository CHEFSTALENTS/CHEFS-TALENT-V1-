import type { Metadata } from "next";
import Link from "next/link";
import { destinations } from "@/lib/destinations";

export const metadata: Metadata = {
  title: "Nos Destinations | Chef Privé en Europe — Chefs Talents",
  description: "Trouvez un chef privé dans toutes les destinations premium d'Europe. Côte d'Azur, Ibiza, Mykonos, Courchevel, Monaco, Sardaigne et bien plus.",
  alternates: { canonical: "https://chefstalents.com/destinations" },
};

export default function DestinationsPage() {
  const france = destinations.filter((d) => d.country === "France");
  const europe = destinations.filter((d) => d.country !== "France");

  return (
    <div className="bg-paper min-h-screen">

      {/* HERO */}
      <section className="relative bg-stone-900 text-white min-h-[60vh] flex flex-col justify-center px-6 md:px-12 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=2600&auto=format&fit=crop"
            alt="Destinations Europe"
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-6">
            Chefs Talents · Europe
          </p>
          <h1 className="text-5xl md:text-7xl font-serif font-normal leading-[1.0] text-white mb-6">
            Nos destinations.
          </h1>
          <p className="text-xl text-stone-400 font-light leading-relaxed max-w-2xl mx-auto">
            Des chefs privés sélectionnés pour les destinations les plus prisées d'Europe.
            Villas, yachts, chalets partout où vous êtes nous trouvons le profil adapté à votre demande.
          </p>
        </div>
      </section>

      {/* FRANCE */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12 border-b border-stone-200 pb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">France</p>
            <span className="text-stone-300">·</span>
            <p className="text-xs text-stone-400">{france.length} destinations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {france.map((d) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] overflow-hidden bg-stone-200 mb-6">
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1.5s]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{d.region}</p>
                    {d.featured && (
                      <span className="text-xs uppercase tracking-[0.1em] text-stone-500 border border-stone-300 px-2 py-1">
                        Prioritaire
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-serif text-stone-900 mb-2 group-hover:text-stone-600 transition-colors">
                    {d.name}
                  </h2>
                  <p className="text-stone-500 font-light text-sm mb-1">{d.season}</p>
                  <p className="text-stone-700 font-medium text-sm">{d.rateRange} / semaine</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SÉPARATEUR IMAGE */}
      <div className="w-full h-[40vh] overflow-hidden bg-stone-200">
        <img
          src="https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=2600&auto=format&fit=crop"
          alt="Méditerranée"
          className="w-full h-full object-cover"
        />
      </div>

      {/* EUROPE */}
      <section className="py-24 px-6 md:px-12 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12 border-b border-stone-200 pb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Europe</p>
            <span className="text-stone-300">·</span>
            <p className="text-xs text-stone-400">{europe.length} destinations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {europe.map((d) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] overflow-hidden bg-stone-200 mb-6">
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[1.5s]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{d.country}</p>
                    {d.featured && (
                      <span className="text-xs uppercase tracking-[0.1em] text-stone-500 border border-stone-300 px-2 py-1">
                        Prioritaire
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-serif text-stone-900 mb-2 group-hover:text-stone-600 transition-colors">
                    {d.name}
                  </h2>
                  <p className="text-stone-500 font-light text-sm mb-1">{d.season}</p>
                  <p className="text-stone-700 font-medium text-sm">{d.rateRange} / semaine</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-900 text-white py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
            Votre destination n'est pas listée ?
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-normal">
            On couvre toute l'Europe.<br />
            Soumettez votre demande.
          </h2>
          <p className="text-stone-400 font-light text-lg max-w-xl mx-auto leading-relaxed">
            Notre réseau de chefs mobiles intervient dans toutes les destinations premium européennes et au-delà.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/request"
              className="bg-white text-stone-900 px-10 py-4 text-sm uppercase tracking-[0.15em] font-medium hover:bg-stone-100 transition-colors"
            >
              Décrire mon besoin
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

    </div>
  );
}
