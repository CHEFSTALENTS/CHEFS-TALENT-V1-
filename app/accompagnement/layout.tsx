import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accompagnement Chef Privé — Chefs Talents',
  description:
    'Accompagnement personnalisé pour engager un chef privé : qualification de votre besoin, sélection de profils, coordination de la mission.',
  alternates: { canonical: 'https://chefstalents.com/accompagnement' },
  openGraph: {
    title: 'Accompagnement Chef Privé — Chefs Talents',
    description: 'Accompagnement personnalisé pour vos missions de chef privé.',
    url: 'https://chefstalents.com/accompagnement',
  },
};

export default function AccompagnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
