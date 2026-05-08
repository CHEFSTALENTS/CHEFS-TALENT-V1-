import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conciergeries — Chefs Talents',
  description:
    'Partenaire de confiance pour conciergeries haut de gamme. Chefs privés validés en Europe pour missions sensibles et récurrentes.',
  alternates: { canonical: 'https://chefstalents.com/conciergeries' },
  openGraph: {
    title: 'Conciergeries — Chefs Talents',
    description: 'Chefs privés pour conciergeries haut de gamme en Europe.',
    url: 'https://chefstalents.com/conciergeries',
  },
};

export default function ConciergeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* H1 sémantique server-side pour les crawlers (visuellement caché). */}
      <h1 className="sr-only">
        Chefs Talents pour conciergeries — Chefs privés validés en Europe
      </h1>
      {children}
    </>
  );
}
