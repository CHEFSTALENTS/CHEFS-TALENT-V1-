// lib/analytics/posthog.ts
// Wrapper PostHog avec init lazy côté client et helpers d'events.
//
// Configuration env vars (à définir sur Vercel + .env.local) :
//   NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
//   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com  (UE pour RGPD)
//
// Si la clé n'est pas définie, tous les helpers sont no-op (pas de
// crash, juste pas de tracking). Pratique en dev local.

'use client';

import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

let initialized = false;

/**
 * Initialise PostHog au démarrage côté client.
 * Idempotent : safe d'appeler plusieurs fois.
 */
export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture page views automatique (utile pour les funnels)
    capture_pageview: true,
    // Permet le replay session pour debug UX
    session_recording: {
      maskAllInputs: true, // masque les champs sensibles par défaut
    },
    // Ne pas tracker l'admin / chef portal (privé)
    loaded: (ph) => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/chef')) {
          ph.opt_out_capturing();
        }
      }
    },
  });

  initialized = true;
}

/**
 * Capture un event custom. No-op si PostHog n'est pas initialisé.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, any>,
): void {
  if (typeof window === 'undefined') return;
  if (!initialized || !POSTHOG_KEY) return;

  try {
    posthog.capture(name, properties);
  } catch (e) {
    // PostHog ne doit jamais casser l'app
    console.warn('[posthog] capture failed', e);
  }
}

/**
 * Identifie un utilisateur pour cross-device tracking (e.g. après
 * conversion). À appeler quand on récupère son email/userId.
 */
export function identifyUser(
  distinctId: string,
  traits?: Record<string, any>,
): void {
  if (typeof window === 'undefined') return;
  if (!initialized || !POSTHOG_KEY) return;
  try {
    posthog.identify(distinctId, traits);
  } catch (e) {
    console.warn('[posthog] identify failed', e);
  }
}

/**
 * Reset session (logout). À appeler quand l'utilisateur se déconnecte.
 */
export function resetUser(): void {
  if (typeof window === 'undefined') return;
  if (!initialized || !POSTHOG_KEY) return;
  try {
    posthog.reset();
  } catch (e) {
    console.warn('[posthog] reset failed', e);
  }
}

/**
 * Events constants pour le funnel /request.
 * Utilisé partout dans le code pour éviter les typos.
 */
export const REQUEST_EVENTS = {
  // Page view automatique via capture_pageview, on ne le track pas en double.
  STEP_VIEWED: 'request_step_viewed',
  STEP_COMPLETED: 'request_step_completed',
  CONTACT_FILLED: 'request_contact_filled',
  SUBMITTED: 'request_submitted',
  ABANDONED: 'request_abandoned',
  DRAFT_SAVED: 'request_draft_saved',
  EMAIL_REMINDER_REQUESTED: 'request_email_reminder_requested',
} as const;
