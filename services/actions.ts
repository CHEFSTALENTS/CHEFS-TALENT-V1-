import { RequestForm, FastMatchResult, ChefApplicationForm, RequestStatus, ChefUser, ChefProfile, Mission, MissionStatus } from '../types';
import { api, auth } from './storage';
import type { ChefProposalEntity } from './storage';

// --------------------
// PUBLIC ACTIONS
// --------------------

export const submitRequest = async (data: RequestForm): Promise<FastMatchResult> => {
  const entity = await api.createRequest(data);

  if (data.mode === 'fast') {
    return {
      success: true,
      mode: 'instant_match',
      referenceId: entity.id,
      matchedChef: 'Chef Selection Pending',
    };
  }

  return {
    success: true,
    mode: 'concierge_manual',
    referenceId: entity.id,
  };
};

/**
 * ⚠️ IMPORTANT :
 * Dans ton modèle actuel, une "application chef" = un compte chef (ChefUser) en pending_validation.
 * Donc on mappe ChefApplicationForm -> registerChef + updateChefProfile.
 */
export const submitChefApplication = async (data: ChefApplicationForm) => {
  // Split fullName
  const parts = (data.fullName || '').trim().split(' ');
  const firstName = parts.shift() || 'Chef';
  const lastName = parts.join(' ') || '';

  // 1) create user (pending_validation)
  const res = await auth.registerChef({
    email: data.email,
    password: crypto.randomUUID().slice(0, 10), // password temporaire V1 (à remplacer par un flow email)
    firstName,
    lastName,
  });

  if (!res.success || !res.user) return res;

  // 2) prefill profile
  await auth.updateChefProfile(res.user.id, {
    phone: data.phone,
    baseCity: data.baseCity,
    // tu as travelRadiusKm (number) mais le form travelRange est string → on tente une extraction
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
    // petit défaut structurel: portfolioLink non prévu dans ChefProfile → à stocker ailleurs plus tard
  });

  return { success: true, id: res.user.id };
};

// --------------------
// BACKOFFICE: REQUESTS
// --------------------

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
  // status allowed by your type: pending_validation | approved | active | paused
  // simplest: approved first; you can switch to 'active' once profileCompleted
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
    .map(s => s.trim())
    .filter(Boolean);
}

function extractKm(value: string): number {
  if (!value) return 0;
  const m = value.match(/(\d{1,4})/);
  return m ? Number(m[1]) : 0;
}
