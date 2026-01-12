import { Suspense } from 'react';
import TermsClient from './terms-client';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F5F2] p-10 text-stone-700">Chargement…</div>}>
      <TermsClient />
    </Suspense>
  );
}
