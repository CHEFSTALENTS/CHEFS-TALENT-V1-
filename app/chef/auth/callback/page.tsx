import { Suspense } from 'react';
import ChefAuthCallbackClient from './ChefAuthCallbackClient';

export default function ChefAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-8">Connexion en cours…</div>}>
      <ChefAuthCallbackClient />
    </Suspense>
  );
}
