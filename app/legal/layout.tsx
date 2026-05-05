import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales — Chefs Talents',
  description: 'Mentions légales du site Chefs Talents.',
  alternates: { canonical: 'https://chefstalents.com/legal' },
  robots: { index: false, follow: true },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
