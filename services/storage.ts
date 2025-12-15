import {
  RequestEntity,
  RequestForm,
  RequestStatus,
  ChefUser,
  ChefProfile,
  SubscriptionPlan,
  Mission,
  MissionStatus
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

const getDb = () =>
  typeof window === 'undefined'
    ? []
    : safeParse<RequestEntity[]>(localStorage.getItem(DB_KEY), []);

const saveDb = (data: RequestEntity[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }
};

const getChefDb = () =>
  typeof window === 'undefined'
    ? []
    : safeParse<ChefUser[]>(localStorage.getItem(CHEF_USERS_KEY), []);

const saveChefDb = (data: ChefUser[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHEF_USERS_KEY, JSON.stringify(data));
  }
};

const getMissionsDb = () =>
  typeof window === 'undefined'
    ? []
    : safeParse<Mission[]>(localStorage.getItem(MISSIONS_KEY), []);

const saveMissionsDb = (data: Mission[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
  }
};

const getProposalsDb = () =>
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
  await delay(600);

  // 1) Create request entity
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

  // 2) FAST MATCH AUTO (uniquement B2C + fast)
  if (entity.mode === 'fast' && entity.userType === 'b2c') {
    const chefs = getChefDb();

    const matchedChefs = matchChefsForFastRequest(entity, chefs);

    if (matchedChefs.length > 0) {
      // Build proposals (max 5)
      const proposalsToCreate = buildFastMatchProposals(entity, matchedChefs);

      // Save proposals (remove any existing proposals for this request just in case)
      const pDb = getProposalsDb().filter(p => p.requestId !== entity.id);
      pDb.unshift(...proposalsToCreate);
      saveProposalsDb(pDb);

      // Put request in review
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
  async getRequests() {
    await delay(200);
    return getDb();
  },

  async getRequest(id: string) {
    await delay(150);
    return getDb().find(r => r.id === id);
  },

  async closeRequest(id: string) {
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
    chefIds: string[]
  ): Promise<ChefProposalEntity[]> {
    await delay(200);

    const created = chefIds.map(chefId => ({
      id: crypto.randomUUID(),
      requestId,
      chefId,
      status: 'sent' as ProposalStatus,
      createdAt: new Date().toISOString()
    }));

    const db = getProposalsDb();
    db.unshift(...created);
    saveProposalsDb(db);

    return created;
  },

  async getProposal(id: string) {
    await delay(100);
    return getProposalsDb().find(p => p.id === id);
  },

  async getChefProposals(chefId: string) {
    await delay(100);
    const requests = getDb();

    return getProposalsDb().filter(p => {
      if (p.chefId !== chefId) return false;
      const req = requests.find(r => r.id === p.requestId);
      return req && req.status !== 'assigned' && req.status !== 'closed';
    });
  },

  async acceptProposal(proposalId: string) {
    const proposals = getProposalsDb();
    const target = proposals.find(p => p.id === proposalId);
    if (!target) return;

    const requests = getDb();
    const req = requests.find(r => r.id === target.requestId);
    if (!req || req.status === 'assigned') return;

    proposals.forEach(p => {
      if (p.requestId === target.requestId) {
        p.status = p.id === proposalId ? 'accepted' : 'declined';
      }
    });

    req.status = 'assigned';

    saveProposalsDb(proposals);
    saveDb(requests);
  },

  async declineProposal(proposalId: string) {
    const proposals = getProposalsDb();
    const p = proposals.find(p => p.id === proposalId);
    if (p) {
      p.status = 'declined';
      saveProposalsDb(proposals);
    }
  }
};

/* =========================================================
   AUTH
========================================================= */

export const auth = {
  async registerChef(
    data: Pick<ChefUser, 'email' | 'password' | 'firstName' | 'lastName'>
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(800);
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
    await delay(800);
    const db = getChefDb();
    const user = db.find(u => u.email === email && u.password === password);

    if (!user) return { success: false, error: 'Identifiants invalides.' };

    if (typeof window !== 'undefined') {
      localStorage.setItem('chef_session_user', JSON.stringify(user));
    }

    return { success: true, user };
  },
  async updateChefProfile(userId: string, updates: Partial<ChefProfile>): Promise<ChefUser | null> {
    await delay(400);

    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    const currentUser = db[idx];
    const updatedProfile = { ...(currentUser.profile ?? {}), ...updates };

    // (optionnel) logique simple "profil complet"
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

    // Sync session si c’est lui
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

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chef_session_user');
    }
  },
};
