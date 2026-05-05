import type { Metadata } from 'next';
import { ChefLayout } from '@/components/ChefLayout';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ChefLayout>{children}</ChefLayout>;
}
