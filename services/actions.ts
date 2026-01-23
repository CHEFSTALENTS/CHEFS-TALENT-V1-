import type {
  RequestForm,
  FastMatchResult,
  ChefApplicationForm,
  RequestStatus,
  ChefUser,
  ChefProfile,
  Mission,
  MissionStatus,
} from '../types';

import { api, auth } from './storage';
import type { ChefProposalEntity } from './storage';

// --------------------
// PUBLIC ACTIONS
// --------------------

export const submitRequest = async (data: RequestForm): Promise<FastMatchResult> => {
  // 1) construire firstName depuis fullName
  const fullName = (data.fullName || '').trim();
  const firstName = fullName ? fullName.split(' ')[0] : undefined;

  // 2) construire un message lisible (stock/backoffice)
  const message =
    data.mode === 'fast'
      ? [
          `MODE: FAST`,
          `Lieu: ${data.location}`,
          `Date: ${data.startDate}`,
          `Convives: ${data.guestCount}`,
          `Budget/pers: ${(data as any).budgetPerPerson ?? ''}`,
          `Préférences: ${data.cuisinePreferences || ''}`,
          `Téléphone: ${data.phone || ''}`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `MODE: CONCIERGE`,
          `ClientType: ${data.clientType}`,
          `Société: ${data.companyName || ''}`,
          `Lieu: ${data.location}`,
          `Start: ${data.startDate}`,
          `End: ${(data as any).endDate || ''}`,
          `Assignation: ${(data as any).assignmentType || ''}`,
          `Convives: ${data.guestCount}`,
          `Budget: ${data.budgetRange || ''}`,
          `Notes: ${data.notes || ''}`,
          `Téléphone: ${data.phone || ''}`,
        ]
          .filter(Boolean)
          .join('\n');

  // 3) POST vers l’API Next
  const r = await fetch('/api/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // IMPORTANT: envoie aussi les champs structurés si tu veux les stocker en colonnes
    body: JSON.stringify({
      email: data.email,
      firstName,
      matchType: data.mode, // 'fast' | 'concierge'
      message,

      // champs structurés (alignés avec ton route.ts)
      clientType: (data as any).clientType ?? null,
      companyName: (data as any).companyName ?? null,
      location: (data as any).location ?? null,
      startDate: (data as any).startDate ?? null,
      endDate: (data as any).endDate ?? null,
      guestCount: (data as any).guestCount ?? null,
      budgetRange: (data as any).budgetRange ?? null,
      assignmentType: (data as any).assignmentType ?? null,
    }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    console.error('API /api/request error', r.status, txt);
    throw new Error(`API request failed: ${r.status}`);
  }

  const json = (await r.json().catch(() => ({}))) as { ok?: boolean; requestId?: string };

  // 4) retour UI
  if (data.mode === 'fast') {
    return {
      success: true,
      mode: 'instant_match',
      referenceId: json.requestId || crypto.randomUUID(),
      matchedChef: 'Chef Selection Pending',
    };
  }

  return {
    success: true,
    mode: 'concierge_manual',
    referenceId: json.requestId || crypto.randomUUID(),
  };
};

/**
 * ⚠️ IMPORTANT :
 * Dans ton modèle actuel, une "application chef" = un compte chef (ChefUser) en pending_validation.
 * Donc on mappe ChefApplicationForm -> registerChef + updateChefProfile.
 */
export const submitChefApplication = async (data: ChefApplicationForm) => {
  const parts = (data.fullName || '').trim().split(' ');
  const firstName = parts.shift() || 'Chef';
  const lastName = parts.join(' ') || '';

  // 1) create user (pending_validation)
  const res = await auth.registerChef({
    email: data.email,
    password: crypto.randomUUID().slice(0, 10), // password temporaire V1
    firstName,
    lastName,
  });

  if (!res.success || !res.user) return res;

  // 2) prefill profile
  await auth.updateChefProfile(res.user.id, {
    phone: data.phone,
    baseCity: data.baseCity,
    travelRadiusKm: extractKm(data.travelRange),
    languages: splitList(data.languages),
    specialties: splitList(data.specialties),
    bio: data.availabilityNotes || '',
    environments: [
      ...(data.background?.yacht ? ['yacht'] : []),
      ...(data.background?.palace ? ['hotel'] : []),
      ...(data.background?.privateHousehold ? ['private_household'] : []),
      ...(data.background?.michelin ? ['restaurant'] : []),
    ],
  });

  return { success: true, id: res.user.id };
};

// --------------------
// BACKOFFICE: REQUESTS
// --------------------
// (Optionnel: si encore utilisé quelque part)
export const boListRequests = async (): Promise<ReturnType<typeof api.getRequests>> => {
  return api.getRequests();
};

export const boGetRequest = async (id: string) => {
  return api.getRequest(id);
};

export const boUpdateRequestStatus = async (id: string, status: RequestStatus) => {
  return api.updateStatus(id, status);
};

export const boCloseRequest = async (id: string) => {
  return api.closeRequest(id);
};

// --------------------
// BACKOFFICE: PROPOSALS / MATCHING
// --------------------

export const boCreateChefProposals = async (
  requestId: string,
  proposals: Array<{ chefId: string; priceTotal?: number; pricePerPerson?: number; message?: string }>
): Promise<ChefProposalEntity[]> => {
  return api.createProposals(requestId, proposals);
};

export const boGetChefProposals = async (requestId: string): Promise<ChefProposalEntity[]> => {
  return api.listProposalsByRequest(requestId);
};

export const boSelectChefForRequest = async (requestId: string, proposalId: string) => {
  return api.selectProposal(requestId, proposalId);
};

// --------------------
// BACKOFFICE: CHEFS (ADMIN)
// --------------------

export const boListChefs = async (): Promise<ChefUser[]> => {
  return auth.getAllChefs();
};

export const boApproveChef = async (chefId: string) => {
  return auth.updateChefStatus(chefId, 'approved');
};

export const boSetChefActive = async (chefId: string) => {
  return auth.updateChefStatus(chefId, 'active');
};

export const boPauseChef = async (chefId: string) => {
  return auth.updateChefStatus(chefId, 'paused');
};

export const boUpdateChefProfile = async (chefId: string, patch: Partial<ChefProfile>) => {
  return auth.updateChefProfile(chefId, patch);
};

// --------------------
// MISSIONS (ADMIN / CHEF DASHBOARD)
// --------------------

export const boListAllMissions = async (): Promise<Mission[]> => {
  return api.getAllMissions();
};

export const boUpdateMissionStatus = async (missionId: string, status: MissionStatus) => {
  return api.updateMissionStatus(missionId, status);
};

export const chefGetMyMissions = async (chefId: string): Promise<Mission[]> => {
  return api.getChefMissions(chefId);
};

// --------------------
// Helpers
// --------------------

function splitList(value: string): string[] {
  if (!value) return [];
  return value
    .split(/,|\n|;|\|/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractKm(value: string): number {
  if (!value) return 0;
  const m = value.match(/(\d{1,4})/);
  return m ? Number(m[1]) : 0;
}
