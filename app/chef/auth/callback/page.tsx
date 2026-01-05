import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-stone-600">Connexion…</div>}>
      <CallbackClient />
    </Suspense>
  );
}
