import React, { Suspense } from 'react';
import CallbackClient from './CallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-8">Connexion…</div>}>
      <CallbackClient />
    </Suspense>
  );
}
