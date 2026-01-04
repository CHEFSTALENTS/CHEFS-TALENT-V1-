import { Suspense } from 'react';
import AccessClient from './AccessClient';

export default function AccessPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-stone-500">Chargement…</div>}>
      <AccessClient />
    </Suspense>
  );
}
