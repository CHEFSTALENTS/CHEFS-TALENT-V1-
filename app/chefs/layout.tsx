import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espace chefs — Chefs Talents',
  description: 'Espace dédié aux chefs privés candidats à Chefs Talents.',
  robots: { index: false, follow: true },
};

export default function ChefsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
