import { Suspense } from 'react';
import TermsClient from './terms-client';

export default function ChefTermsPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement…</div>}>
      <TermsClient />
    </Suspense>
  );
}
