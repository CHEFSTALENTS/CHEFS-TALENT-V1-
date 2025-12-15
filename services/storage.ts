import {
  RequestEntity,
  RequestForm,
  RequestStatus,
  ChefUser,
  ChefProfile,
  SubscriptionPlan,
  Mission,
  MissionStatus,
} from '../types';

import { matchChefsForFastRequest, buildFastMatchProposals } from './fastMatch';

/* =========================================================
   TYPES
========================================================= */

export type ProposalStatus = 'sent' | 'accepted' | 'declined';

export interface ChefProposalEntity {
  id: string;
  requestId: string;
  chefId: string;
  priceTotal?: number;
  message?: string;
  status: ProposalStatus;
  createdAt: string;
  pricePerPerson?: number;
}

/* =========================================================
   STORAGE KEYS
========================================================= */

const DB_KEY = 'chef_talents_requests_db';
const CHEF_USERS_KEY = 'chef_talents_users_db';
const MISSIONS_KEY = 'chef_talents_missions_db';
const PROPOSALS_KEY = 'chef_talents_proposals_db';

/* =========================================================
   HELPERS
========================================================= */

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const getDb = (): RequestEntity[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<RequestEntity[]>(localStorage.getItem(DB_KEY), []);

const saveDb = (data: RequestEntity[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }
};

const getChefDb = (): ChefUser[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<ChefUser[]>(localStorage.getItem(CHEF_USERS_KEY), []);

const saveChefDb = (data: ChefUser[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHEF_USERS_KEY, JSON.stringify(data));
  }
};

const getMissionsDb = (): Mission[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<Mission[]>(localStorage.getItem(MISSIONS_KEY), []);

const saveMissionsDb = (data: Mission[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
  }
};

const getProposalsDb = (): ChefProposalEntity[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<ChefProposalEntity[]>(localStorage.getItem(PROPOSALS_KEY), []);

const saveProposalsDb = (data: ChefProposalEntity[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(data));
  }
};

/* =========================================================
   API
========================================================= */

export const api = {
  /* ---------- REQUESTS ---------- */

  async createRequest(form: RequestForm): Promise<RequestEntity> {
    await delay(200);

    const db = getDb();
    const isB2B = form.clientType === 'concierge';

    const entity: RequestEntity = {
      id: crypto.randomUUID(),
      mode: form.mode,
      userType: isB2B ? 'b2b' : 'b2c',
      location: form.location,
      dates: {
        start: form.startDate,
        end: form.endDate,
        type: form.dateMode,
      },
      guestCount: form.guestCount,
      missionType: form.assignmentType,
      serviceLevel: form.serviceExpectations,
      preferences: {
        cuisine: form.cuisinePreferences,
        allergies: form.dietaryRestrictions,
        languages: form.preferredLanguage,
      },
      budgetRange: form.budgetRange,
      notes: form.notes,
      contact: {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        company: form.companyName,
      },
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    db.unshift(entity);
    saveDb(db);

    // ✅ FAST MATCH AUTO (uniquement B2C + fast)
    if (entity.mode === 'fast' && entity.userType === 'b2c') {
      const chefs = getChefDb();
      const matchedChefs = matchChefsForFastRequest(entity, chefs);

      if (matchedChefs.length > 0) {
        // Proposals max 5
        const proposalsToCreate = buildFastMatchProposals(entity, matchedChefs);

        // Remplace d'éventuelles proposals existantes sur cette request (sécurité)
        const pDb = getProposalsDb().filter(p => p.requestId !== entity.id);
        pDb.unshift(...proposalsToCreate);
        saveProposalsDb(pDb);

        // Met la request en review
        const freshDb = getDb();
        const idx = freshDb.findIndex(r => r.id === entity.id);
        if (idx !== -1) {
          freshDb[idx].status = 'in_review';
          saveDb(freshDb);
        }
      }
    }

    return entity;
  },

  async getRequests(): Promise<RequestEntity[]> {
    await delay(120);
    return getDb();
  },

  async getRequest(id: string): Promise<RequestEntity | undefined> {
    await delay(120);
    return getDb().find(r => r.id === id);
  },

  async updateStatus(id: string, status: RequestStatus): Promise<void> {
    await delay(120);
    const db = getDb();
    const i = db.findIndex(r => r.id === id);
    if (i !== -1) {
      db[i].status = status;
      saveDb(db);
    }
  },

  async closeRequest(id: string): Promise<void> {
    await delay(120);
    const db = getDb();
    const i = db.findIndex(r => r.id === id);
    if (i !== -1) {
      db[i].status = 'closed';
      saveDb(db);
    }
  },

   /* ---------- PROPOSALS ---------- */

  async createProposals(
    requestId: string,
    proposals: Array<{
      chefId: string;
      priceTotal?: number;
      pricePerPerson?: number;
      message?: string;
    }>
  ): Promise<ChefProposalEntity[]> {
    await delay(120);

    const createdAt = new Date().toISOString();

    const created: ChefProposalEntity[] = proposals.map(p => ({
      id: crypto.randomUUID(),
      requestId,
      chefId: p.chefId,
      priceTotal: p.priceTotal,
      // si ton ChefProposalEntity n'a pas pricePerPerson, supprime la ligne suivante
      // @ts-ignore
      pricePerPerson: p.pricePerPerson,
      message: p.message,
      status: 'sent',
      createdAt,
    }));

    const db = getProposalsDb();
    db.unshift(...created);
    saveProposalsDb(db);

    // Mettre la request en review si elle existe
    const rDb = getDb();
    const idx = rDb.findIndex(r => r.id === requestId);
    if (idx !== -1 && rDb[idx].status === 'new') {
      rDb[idx].status = 'in_review';
      saveDb(rDb);
    }

    return created;
  },

  async getProposal(id: string): Promise<ChefProposalEntity | undefined> {
    await delay(80);
    return getProposalsDb().find(p => p.id === id);
  },

  async listProposalsByRequest(requestId: string): Promise<ChefProposalEntity[]> {
    await delay(100);
    return getProposalsDb()
      .filter(p => p.requestId === requestId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  // ✅ Pour l’écran “offers” du chef : uniquement les proposals encore “sent”
  // et uniquement si la request n’est pas déjà assigned/closed
  async getChefProposals(chefId: string): Promise<ChefProposalEntity[]> {
    await delay(100);
    const requests = getDb();

    return getProposalsDb()
      .filter(p => p.chefId === chefId && p.status === 'sent')
      .filter(p => {
        const req = requests.find(r => r.id === p.requestId);
        return !!req && req.status !== 'assigned' && req.status !== 'closed';
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },


  async getOfferDetail(proposalId: string): Promise<{
    proposal?: ChefProposalEntity;
    request?: RequestEntity;
  }> {
    await delay(120);

    const proposal = getProposalsDb().find(p => p.id === proposalId);
    if (!proposal) return {};

    const request = getDb().find(r => r.id === proposal.requestId);
    return { proposal, request };
  },

 
  async acceptProposal(proposalId: string): Promise<void> {
    await delay(120);

    const proposals = getProposalsDb();
    const target = proposals.find(p => p.id === proposalId);
    if (!target) return;

    const requests = getDb();
    const reqIdx = requests.findIndex(r => r.id === target.requestId);
    if (reqIdx === -1) return;

    const req = requests[reqIdx];

    // Si déjà assignée/close -> on empêche
    if (req.status === 'assigned' || req.status === 'closed') return;

    // 1) Proposals : accepte celle-ci, décline les autres de la même request
    for (const p of proposals) {
      if (p.requestId !== target.requestId) continue;
      p.status = p.id === proposalId ? 'accepted' : 'declined';
    }

    // 2) Request : assigned
    req.status = 'assigned';

    saveProposalsDb(proposals);
    saveDb(requests);

    // 3) Mission : créée pour le chef accepté
    await this.createMission({
      chefId: target.chefId,
      requestId: req.id,
      title: req.missionType ? `Mission - ${req.missionType}` : 'Mission Chef Talents',
      location: req.location,
      startDate: req.dates.start,
      endDate: req.dates.end,
      guestCount: req.guestCount,
      serviceLevel: req.serviceLevel,
      estimatedAmount: target.priceTotal ?? 0,
      clientPhone: req.contact?.phone,
      status: 'offered',
    });
  },

    // ✅ Alias utilisé par /chef/offers/[proposalId]
  async selectProposal(requestId: string, proposalId: string): Promise<void> {
    await delay(80);

    const proposals = getProposalsDb();
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) {
      throw new Error('PROPOSAL_NOT_FOUND');
    }

    if (proposal.requestId !== requestId) {
      throw new Error('PROPOSAL_REQUEST_MISMATCH');
    }

    const requests = getDb();
    const req = requests.find(r => r.id === requestId);

    if (!req) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (req.status === 'assigned' || req.status === 'closed') {
      throw new Error('REQUEST_ALREADY_ASSIGNED');
    }

    // On délègue à la logique principale
    await this.acceptProposal(proposalId);
  },

  // ✅ Le chef refuse -> décline + n’apparaît plus dans sa liste (car on filtre sent)
  async declineProposal(proposalId: string): Promise<void> {
    await delay(100);
    const proposals = getProposalsDb();
    const p = proposals.find(x => x.id === proposalId);
    if (p) {
      p.status = 'declined';
      saveProposalsDb(proposals);
    }
  },

  /* ---------- MISSIONS ---------- */

  async getChefMissions(chefId: string): Promise<Mission[]> {
    await delay(120);
    const db = getMissionsDb();
    return db
      .filter(m => m.chefId === chefId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllMissions(): Promise<Mission[]> {
    await delay(120);
    return getMissionsDb().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateMissionStatus(missionId: string, status: MissionStatus): Promise<void> {
    await delay(120);
    const db = getMissionsDb();
    const idx = db.findIndex(m => m.id === missionId);
    if (idx !== -1) {
      db[idx].status = status;
      saveMissionsDb(db);
    }
  },

  async createMission(mission: Omit<Mission, 'id' | 'createdAt'>): Promise<Mission> {
    await delay(120);
    const db = getMissionsDb();
    const newMission: Mission = {
      ...mission,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.push(newMission);
    saveMissionsDb(db);
    return newMission;
  },
};

/* =========================================================
   AUTH
========================================================= */

export const auth = {
  async registerChef(
    data: Pick<ChefUser, 'email' | 'password' | 'firstName' | 'lastName'>
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(200);

    const db = getChefDb();

    if (db.find(u => u.email === data.email)) {
      return { success: false, error: 'Cet email est déjà utilisé.' };
    }

    const newUser: ChefUser = {
      id: crypto.randomUUID(),
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'chef',
      status: 'pending_validation',
      createdAt: new Date().toISOString(),
      profileCompleted: false,
      plan: 'free',
      planStatus: 'coming_soon',
      planUpdatedAt: new Date().toISOString(),
      adminNotes: '',
      profile: {
        images: [],
        unavailableDates: [],
        environments: [],
        specialties: [],
        coverageZones: [],
        acceptedMissions: ['dinner'],
        languages: [],
      },
    };

    db.push(newUser);
    saveChefDb(db);

    if (typeof window !== 'undefined') {
      localStorage.setItem('chef_session_user', JSON.stringify(newUser));
    }

    return { success: true, user: newUser };
  },

  async loginChef(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(200);

    const db = getChefDb();
    const user = db.find(u => u.email === email && u.password === password);

    if (!user) return { success: false, error: 'Identifiants invalides.' };

    if (typeof window !== 'undefined') {
      localStorage.setItem('chef_session_user', JSON.stringify(user));
    }

    return { success: true, user };
  },
  async getAllChefs(): Promise<ChefUser[]> {
    await delay(120);
    return getChefDb();
  },  async updateChefStatus(userId: string, status: ChefUser['status']): Promise<void> {
    await delay(120);

    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx === -1) return;

    db[idx].status = status;
    saveChefDb(db);

    // sync session si c’est le user connecté
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('chef_session_user');
      if (raw) {
        const session = JSON.parse(raw) as ChefUser;
        if (session?.id === userId) {
          localStorage.setItem('chef_session_user', JSON.stringify(db[idx]));
        }
      }
    }
  },
  async updateChefProfile(userId: string, updates: Partial<ChefProfile>): Promise<ChefUser | null> {
    await delay(200);

    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    const currentUser = db[idx];
    const updatedProfile = { ...(currentUser.profile ?? {}), ...updates };

    // logique simple "profil complet"
    const isComplete = !!(
      updatedProfile.bio &&
      updatedProfile.yearsExperience &&
      updatedProfile.baseCity &&
      updatedProfile.profileType
    );

    const updatedUser: ChefUser = {
      ...currentUser,
      profile: updatedProfile,
      profileCompleted: isComplete,
    };

    db[idx] = updatedUser;
    saveChefDb(db);

    // sync session
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('chef_session_user');
      if (raw) {
        const session = JSON.parse(raw) as ChefUser;
        if (session?.id === userId) {
          localStorage.setItem('chef_session_user', JSON.stringify(updatedUser));
        }
      }
    }

    return updatedUser;
  },

  getCurrentUser(): ChefUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('chef_session_user');
    return raw ? (JSON.parse(raw) as ChefUser) : null;
  },
  async deleteChefAccount(userId: string): Promise<void> {
    await delay(120);

    // 1) Supprime le chef
    const chefs = getChefDb().filter(u => u.id !== userId);
    saveChefDb(chefs);

    // 2) Supprime ses proposals (optionnel mais propre)
    const proposals = getProposalsDb().filter(p => p.chefId !== userId);
    saveProposalsDb(proposals);

    // 3) Supprime ses missions (optionnel mais propre)
    const missions = getMissionsDb().filter(m => m.chefId !== userId);
    saveMissionsDb(missions);

    // 4) Clear session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chef_session_user');
    }
  },
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chef_session_user');
    }
  },
};
