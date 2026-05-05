import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CGU & CGV — Chefs Talents',
  description:
    "Conditions générales d'utilisation et de vente de Chefs Talents.",
  alternates: { canonical: 'https://chefstalents.com/conditions' },
  robots: { index: false, follow: true },
};

export default function ConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
