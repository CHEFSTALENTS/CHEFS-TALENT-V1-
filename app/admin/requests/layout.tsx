import type { ReactNode } from 'react';

export default function RequestsLayout({ children }: { children: ReactNode }) {
  // IMPORTANT :
  // La sidebar admin est déjà gérée par app/admin/layout.tsx
  // Donc ici on ne rajoute rien, sinon double sidebar.
  return <>{children}</>;
}
