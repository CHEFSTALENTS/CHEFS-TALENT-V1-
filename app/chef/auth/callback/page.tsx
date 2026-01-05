import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="p-8">Connexion…</div>}>
      <CallbackClient />
    </Suspense>
  );
}
