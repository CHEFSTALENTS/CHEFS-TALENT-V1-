import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soumettre une demande — Chefs Talents',
  description:
    'Décrivez votre mission en 2 minutes. Lieu, dates, convives, budget. Notre équipe identifie le bon chef privé pour votre projet.',
  alternates: { canonical: 'https://chefstalents.com/request' },
  openGraph: {
    title: 'Soumettre une demande — Chefs Talents',
    description: 'Décrivez votre mission. Notre équipe identifie le bon chef privé.',
    url: 'https://chefstalents.com/request',
  },
};

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
