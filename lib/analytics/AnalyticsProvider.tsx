'use client';

import { useEffect } from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { initPostHog } from './posthog';

/**
 * Provider analytics global :
 *  - Vercel Analytics (page views automatiques)
 *  - PostHog (events custom + session replays + funnels)
 *
 * À monter UNE FOIS dans app/layout.tsx au-dessus de children.
 *
 * Les chemins /admin et /chef sont opt-out automatiquement dans
 * posthog.init() pour respecter la confidentialité des portails privés.
 */
export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      {children}
      <VercelAnalytics />
    </>
  );
}
