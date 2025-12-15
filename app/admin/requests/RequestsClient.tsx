'use client';

import { useSearchParams } from 'next/navigation';
// + tous tes imports actuels (useEffect, useState, api/auth, types, etc.)

export default function RequestsClient() {
  const searchParams = useSearchParams();

  // 👉 colle ici TOUT le contenu actuel de ton page.tsx
  // (states, useEffect, UI, etc.)
  return (
    <div className="p-6">
      {/* ton UI */}
    </div>
  );
}
