// components/seo/DestinationsLinks.tsx
// Server Component qui affiche un bloc de liens vers les destinations
// principales. Sert deux objectifs SEO :
//  1. Distribuer du link juice depuis les pages stratégiques vers
//     /destinations/[slug] (qui sont actuellement orphelines de links).
//  2. Donner à Googlebot des ancres texte keyword-riches du type
//     "Chef privé Saint-Tropez", "Chef privé Ibiza"...
//
// À insérer en bas de /conciergeries, /private-clients, /accompagnement,
// /insights pour augmenter la profondeur d'internal linking.

import Link from 'next/link';

const FEATURED = [
  { slug: 'chef-prive-cote-azur', name: 'Chef privé Côte d’Azur' },
  { slug: 'chef-prive-saint-tropez', name: 'Chef privé Saint-Tropez' },
  { slug: 'chef-prive-cannes', name: 'Chef privé Cannes' },
  { slug: 'chef-prive-monaco', name: 'Chef privé Monaco' },
  { slug: 'chef-prive-cap-ferrat', name: 'Chef privé Cap Ferrat' },
  { slug: 'chef-prive-courchevel', name: 'Chef privé Courchevel' },
  { slug: 'chef-prive-megeve', name: 'Chef privé Megève' },
  { slug: 'chef-prive-ibiza', name: 'Chef privé Ibiza' },
  { slug: 'chef-prive-mykonos', name: 'Chef privé Mykonos' },
  { slug: 'chef-prive-sardaigne', name: 'Chef privé Sardaigne' },
  { slug: 'chef-prive-portugal', name: 'Chef privé Portugal' },
  { slug: 'chef-prive-biarritz', name: 'Chef privé Biarritz' },
];

export function DestinationsLinks({
  title = 'Nos destinations en Europe',
  intro = 'Chefs privés sélectionnés pour villas, yachts et résidences UHNW dans toute l’Europe.',
}: {
  title?: string;
  intro?: string;
}) {
  return (
    <section className="border-t border-stone-200 bg-stone-50 px-6 md:px-12 py-20">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-3">
          Destinations
        </p>
        <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-3">
          {title}
        </h2>
        <p className="text-stone-500 max-w-2xl mb-10 font-light">{intro}</p>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
          {FEATURED.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/destinations/${d.slug}`}
                className="text-sm text-stone-700 hover:text-stone-900 hover:underline underline-offset-4 decoration-stone-300 transition-colors"
              >
                {d.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/destinations"
            className="inline-flex items-center text-sm font-medium text-stone-900 hover:underline underline-offset-4"
          >
            Voir toutes les destinations →
          </Link>
        </div>
      </div>
    </section>
  );
}
