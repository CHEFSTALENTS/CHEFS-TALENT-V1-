// lib/stripe.ts
// Stripe server-side singleton. NE JAMAIS importer côté client.

import Stripe from 'stripe';

const SECRET = process.env.STRIPE_SECRET_KEY;

if (!SECRET && typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Warning only — pas de throw pour permettre les builds quand env n'est pas encore set
  console.warn('[stripe] STRIPE_SECRET_KEY manquant — les appels Stripe échoueront');
}

export const stripe = new Stripe(SECRET || 'sk_missing', {
  typescript: true,
});
