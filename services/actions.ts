import {
  RequestForm,
  FastMatchResult,
  ChefApplicationForm,
  // ↓ à ajouter dans ../types (ou définir ici)
  BackofficeRequest,
  BackofficeRequestStatus,
  ChefApplication,
  ChefProfile,
  ChefProposal,
} from '../types';
import { api } from './storage';

// --- PUBLIC ACTIONS ---

export const submitRequest = async (data: RequestForm): Promise<FastMatchResult> => {
  const entity = await api.createRequest(data);

  if (data.mode === 'fast') {
    return {
      success: true,
      mode: 'instant_match',
      referenceId: entity.id,
      matchedChef: "Chef Selection Pending"
    };
  }

  return {
    success: true,
    mode: 'concierge_manual',
    referenceId: entity.id
  };
};

export const submitChefApplication = async (data: ChefApplicationForm) => {
  // ✅ on arrête le mock : on persiste la candidature
  const entity = await api.createChefApplication(data);
  return { success: true, id: entity.id };
};

// --- BACKOFFICE: REQUESTS ---

export const boListRequests = async (params?: {
  status?: BackofficeRequestStatus;
  mode?: 'fast' | 'concierge';
  q?: string; // search (client/concierge/location)
  limit?: number;
}): Promise<BackofficeRequest[]> => {
  return api.listRequests(params);
};

export const boGetRequest = async (id: string): Promise<BackofficeRequest> => {
  return api.getRequestById(id);
};

export const boUpdateRequestStatus = async (id: string, status: BackofficeRequestStatus, note?: string) => {
  // Optionnel: log d’audit interne
  return api.updateRequest(id, {
    status,
    ...(note ? { internalNoteAppend: note } : {})
  });
};

export const boAddInternalNote = async (id: string, note: string) => {
  return api.updateRequest(id, { internalNoteAppend: note });
};

// Shortlist: proposer X chefs à la conciergerie
export const boCreateChefProposals = async (requestId: string, proposals: Array<{
  chefId: string;
  priceTotal?: number;
  pricePerPerson?: number;
  message?: string;
}>) => {
  // crée des “proposals” liées à la request
  return api.createProposals(requestId, proposals);
};

// Concierge choisit (ou admin force) un chef
export const boSelectChefForRequest = async (requestId: string, proposalId: string) => {
  return api.selectProposal(requestId, proposalId);
};

// Confirmation finale (paiement / contrat plus tard)
export const boConfirmBooking = async (requestId: string) => {
  return api.updateRequest(requestId, { status: 'confirmed' });
};

// --- BACKOFFICE: CHEF APPLICATIONS / CHEFS ---

export const boListChefApplications = async (params?: {
  status?: 'pending' | 'approved' | 'rejected';
  q?: string;
  limit?: number;
}): Promise<ChefApplication[]> => {
  return api.listChefApplications(params);
};

export const boReviewChefApplication = async (applicationId: string, decision: 'approved' | 'rejected', note?: string) => {
  // approved => on peut convertir en ChefProfile actif
  const updated = await api.updateChefApplication(applicationId, { status: decision, note });

  if (decision === 'approved') {
    // création chef actif (profil) depuis la candidature
    await api.createChefFromApplication(applicationId);
  }

  return updated;
};

export const boListChefs = async (params?: {
  q?: string;
  tags?: string[];
  city?: string;
  availableFrom?: string; // ISO
  limit?: number;
}): Promise<ChefProfile[]> => {
  return api.listChefs(params);
};

export const boUpdateChefProfile = async (chefId: string, patch: Partial<ChefProfile>) => {
  return api.updateChef(chefId, patch);
};
