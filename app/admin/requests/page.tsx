import { Suspense } from 'react';
import RequestsClient from './RequestsClient';

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <RequestsClient />
    </Suspense>
  );
}
