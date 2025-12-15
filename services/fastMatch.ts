import {
  RequestEntity,
  ChefUser,
} from '@/types';

import {
  ChefProposalEntity,
} from './storage';

/**
 * 🔍 Match simple V1
 * Pas de GPS, pas d’IA, pas de scoring
 */
export function matchChefsForFastRequest(
  request: RequestEntity,
  chefs: ChefUser[]
): ChefUser[] {
  return chefs.filter(chef => {
    if (chef.role !== 'chef') return false;
    if (chef.status !== 'active') return false;
    if (!chef.profileCompleted || !chef.profile) return false;

    const profile = chef.profile;

    // 📍 Zone
    const locationMatch =
      profile.baseCity === request.location ||
      profile.coverageZones?.includes(request.location);

    if (!locationMatch) return false;

    // 👥 Guests
    if (profile.maxGuestCount && request.guestCount > profile.maxGuestCount) {
      return false;
    }

    // 📅 Dispo
    if (profile.unavailableDates?.includes(request.dates.start)) {
      return false;
    }

    return true;
  });
}

/**
 * ⚡ Auto proposals FAST
 * Max 5 chefs
 */
export function buildFastMatchProposals(
  request: RequestEntity,
  chefs: ChefUser[]
): ChefProposalEntity[] {
  const createdAt = new Date().toISOString();

  return chefs.slice(0, 5).map(chef => ({
    id: crypto.randomUUID(),
    requestId: request.id,
    chefId: chef.id,
    status: 'sent',
    createdAt,
  }));
}
