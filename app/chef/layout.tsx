import type { Metadata } from 'next';
import { ChefLayout } from '@/components/ChefLayout';
import { ChefLocaleProvider } from '@/lib/ChefLocaleContext';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChefLocaleProvider>
      <ChefLayout>{children}</ChefLayout>
    </ChefLocaleProvider>
  );
}
