import {
  RequestEntity,
  RequestForm,
  RequestStatus,
  ChefUser,
  ChefProfile,
  Mission,
  MissionStatus,
} from '../types';

import { matchChefsForFastRequest, buildFastMatchProposals } from './fastMatch';

/**
 * ⚠️ SOURCE DE VÉRITÉ FRONT
 * Toute méthode utilisée dans app/* ou actions.ts
 * DOIT être ici (api / auth).
 *
 * Ne jamais ajouter de méthodes en dehors de api/auth.
 */

/* =========================================================
   ADMIN
========================================================= */

export const ADMIN_EMAIL = 'thomas@chef-talents.com';
// ⚠️ MVP uniquement : à sortir du repo plus tard (env var)
const ADMIN_PASSWORD = 'Cantine33?';

export function isAdminUser(user: { email?: string } | null | undefined) {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* =========================================================
   TYPES
========================================================= */

export type ProposalStatus = 'sent' | 'accepted' | 'declined';

export interface ChefProposalEntity {
  id: string;
  requestId: string;
  chefId: string;
  priceTotal?: number;
  pricePerPerson?: number;
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
const SESSION_KEY = 'chef_session_user';

/* =========================================================
   HELPERS
========================================================= */

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
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

const getChefById = (id: string) => getChefDb().find(c => c.id === id);

const isChefActive = (chef?: ChefUser | null) =>
  !!chef && chef.role === 'chef' && chef.status === 'active';

const setSessionUser = (u: ChefUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  }
};

const getSessionUser = (): ChefUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as ChefUser) : null;
};

const clearSessionUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};

/**
 * Seed admin (MVP)
 * NOTE: role = 'chef' car ton type n’accepte pas 'admin'
 * => l’admin est détecté via l’email (isAdminUser)
 */
function ensureAdminSeed() {
  if (typeof window === 'undefined') return;

  const db = getChefDb();
  const exists = db.find(u => (u.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (exists) return;

  const admin: ChefUser = {
    id: crypto.randomUUID(),
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    firstName: 'Thomas',
    lastName: 'Admin',
    role: 'chef',
    status: 'active',
    createdAt: new Date().toISOString(),
    profileCompleted: true,
    plan: 'free',
    planStatus: 'coming_soon',
    planUpdatedAt: new Date().toISOString(),
    adminNotes: 'Admin seeded',
    profile: {
      images: [],
      unavailableDates: [],
      environments: [],
      specialties: [],
      coverageZones: [],
      acceptedMissions: ['dinner'],
      languages: [],
      interviewed: true, // badge
    } as any,
  };

  db.push(admin);
  saveChefDb(db);
}

/* =========================================================
   API
========================================================= */

export const api = {
  /* ---------- REQUESTS ---------- */

  async createRequest(form: RequestForm): Promise<RequestEntity> {
    await delay(200);

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

    const db = getDb();
    db.unshift(entity);
    saveDb(db);

    // ✅ FAST MATCH AUTO — B2C uniquement (B2B = veto humain)
    if (entity.mode === 'fast' && entity.userType === 'b2c') {
      const activeChefs = getChefDb().filter(c => isChefActive(c));

      let matched = matchChefsForFastRequest(entity, activeChefs);

      // tri par score (desc) + top 5
      matched = matched
        .map(c => ({ c, s: auth.computeChefScore(c).score }))
        .sort((a, b) => b.s - a.s)
        .map(x => x.c)
        .slice(0, 5);

      if (matched.length) {
        const proposalsToCreate = buildFastMatchProposals(entity, matched);

        // remplace d’éventuelles proposals existantes sur cette request (sécurité)
        const pDb = getProposalsDb().filter(p => p.requestId !== entity.id);
        pDb.unshift(...proposalsToCreate);
        saveProposalsDb(pDb);

        // passe la request en review
        const fresh = getDb();
        const i = fresh.findIndex(r => r.id === entity.id);
        if (i !== -1) {
          fresh[i].status = 'in_review';
          saveDb(fresh);
        }
      }
    }

    return entity;
  },

  async getRequests(): Promise<RequestEntity[]> {
    await delay(120);
    return getDb();
  },
async getProposals(): Promise<ChefProposalEntity[]> {
  await delay(80);
  return getProposalsDb();
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

    // 🔒 garde uniquement chefs actifs
    const allowed = proposals.filter(p => isChefActive(getChefById(p.chefId)));
    if (allowed.length === 0) return [];

    const createdAt = new Date().toISOString();

    const created: ChefProposalEntity[] = allowed.map(p => ({
      id: crypto.randomUUID(),
      requestId,
      chefId: p.chefId,
      priceTotal: p.priceTotal,
      pricePerPerson: p.pricePerPerson,
      message: p.message,
      status: 'sent',
      createdAt,
    }));

    const db = getProposalsDb();
    db.unshift(...created);
    saveProposalsDb(db);

    // met la request en review si new
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Pour l’écran offers : uniquement sent, et request pas assigned/closed
  async getChefProposals(chefId: string): Promise<ChefProposalEntity[]> {
    await delay(100);

    // 🔒 un chef non actif ne voit aucune offer
    if (!isChefActive(getChefById(chefId))) return [];

    const requests = getDb();
    return getProposalsDb()
      .filter(p => p.chefId === chefId && p.status === 'sent')
      .filter(p => {
        const req = requests.find(r => r.id === p.requestId);
        return !!req && req.status !== 'assigned' && req.status !== 'closed';
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  async declineProposal(proposalId: string): Promise<void> {
    await delay(100);
    const proposals = getProposalsDb();
    const p = proposals.find(x => x.id === proposalId);
    if (p) {
      p.status = 'declined';
      saveProposalsDb(proposals);
    }
  },

  async acceptProposal(proposalId: string): Promise<void> {
    await delay(120);

    const proposals = getProposalsDb();
    const target = proposals.find(p => p.id === proposalId);
    if (!target) return;

    // 🔒 chef doit être actif
    const chef = getChefById(target.chefId);
    if (!isChefActive(chef)) throw new Error('CHEF_NOT_ACTIVE');

    const requests = getDb();
    const reqIdx = requests.findIndex(r => r.id === target.requestId);
    if (reqIdx === -1) return;

    const req = requests[reqIdx];
    if (req.status === 'assigned' || req.status === 'closed') return;

    // accepte celle-ci, décline les autres
    for (const p of proposals) {
      if (p.requestId !== target.requestId) continue;
      p.status = p.id === proposalId ? 'accepted' : 'declined';
    }

    req.status = 'assigned';

    saveProposalsDb(proposals);
    saveDb(requests);

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
      clientPhone: (req as any)?.contact?.phone,
      status: 'offered' as any,
    });
  },

  // ✅ utilisé par /chef/offers/[proposalId]
  async selectProposal(requestId: string, proposalId: string): Promise<void> {
    await delay(120);

    const proposals = getProposalsDb();
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error('PROPOSAL_NOT_FOUND');

    if (proposal.requestId !== requestId) {
      throw new Error('PROPOSAL_REQUEST_MISMATCH');
    }

    const requests = getDb();
    const reqIdx = requests.findIndex(r => r.id === requestId);
    if (reqIdx === -1) throw new Error('REQUEST_NOT_FOUND');

    const req = requests[reqIdx];
    if (req.status === 'assigned' || req.status === 'closed') {
      throw new Error('REQUEST_ALREADY_ASSIGNED');
    }

    // 🔒 chef doit être actif
    const chef = getChefById(proposal.chefId);
    if (!isChefActive(chef)) throw new Error('CHEF_NOT_ACTIVE');

    // accepte celle-ci, décline les autres
    for (const p of proposals) {
      if (p.requestId !== requestId) continue;
      p.status = p.id === proposalId ? 'accepted' : 'declined';
    }

    req.status = 'assigned';

    saveProposalsDb(proposals);
    saveDb(requests);

    await this.createMission({
      chefId: proposal.chefId,
      requestId: req.id,
      title: req.missionType ? `Mission - ${req.missionType}` : 'Mission Chef Talents',
      location: req.location,
      startDate: req.dates.start,
      endDate: req.dates.end,
      guestCount: req.guestCount,
      serviceLevel: req.serviceLevel,
      estimatedAmount: proposal.priceTotal ?? 0,
      clientPhone: (req as any)?.contact?.phone,
      status: 'offered' as any,
    });
  },

  /* ---------- MISSIONS ---------- */

  async getChefMissions(chefId: string): Promise<Mission[]> {
    await delay(120);

    // 🔒 un chef non actif ne voit aucune mission
    if (!isChefActive(getChefById(chefId))) return [];

    return getMissionsDb()
      .filter(m => m.chefId === chefId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllMissions(): Promise<Mission[]> {
    await delay(120);
    return getMissionsDb().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

    // 🔒 sécurité finale : pas de mission si chef non actif
    const chef = getChefById(mission.chefId);
    if (!isChefActive(chef)) throw new Error('CHEF_NOT_ACTIVE');

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
  // ✅ SCORING — UNIQUE VERSION
  computeChefScore(chef: ChefUser): { score: number; badges: string[] } {
    let score = 0;
    const badges: string[] = [];
    const profile: any = (chef as any).profile ?? {};

    // Profil de base
    if (profile.bio) score += 10;
    if (profile.yearsExperience) score += 10;
    if (profile.baseCity) score += 8;
    if (profile.profileType) score += 7;

    // Qualité du profil
    const images = Array.isArray(profile.images) ? profile.images.length : 0;
    if (images >= 1) score += 5;
    if (images >= 3) score += 10;

    const specialties = Array.isArray(profile.specialties) ? profile.specialties.length : 0;
    if (specialties >= 1) score += 8;
    if (specialties >= 3) score += 12;

    const coverage = Array.isArray(profile.coverageZones) ? profile.coverageZones.length : 0;
    if (coverage >= 1) score += 10;

    const langs = Array.isArray(profile.languages) ? profile.languages.length : 0;
    if (langs >= 1) score += 5;
    if (langs >= 2) score += 8;

    // Bonus interview
    if (profile.interviewed === true) {
      score += 15;
      badges.push('Interviewé');
    }

    score = Math.max(0, Math.min(100, score));
    return { score, badges };
  },

  async registerChef(
    data: Pick<ChefUser, 'email' | 'password' | 'firstName' | 'lastName'>
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(200);

    const db = getChefDb();

    if (db.find((u) => (u.email || '').toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Cet email est déjà utilisé.' };
    }

    const user: ChefUser = {
      id: crypto.randomUUID(),
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'chef',
      status: 'pending_validation' as any,
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
      } as any,
    };

    db.push(user);
    saveChefDb(db);
    setSessionUser(user);

    return { success: true, user };
  },

  async getAllChefs(): Promise<ChefUser[]> {
    await delay(120);
    return getChefDb().filter((u) => u.role === 'chef');
  },

  async loginChef(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(200);
    ensureAdminSeed();

    const user = getChefDb().find(
      (u) => (u.email || '').toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) return { success: false, error: 'Identifiants invalides' };

    // ✅ RESYNC status depuis Supabase (non bloquant)
    try {
      if (user.id) {
        const res = await fetch(`/api/chef/profile?id=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const profile = json?.profile ?? null;
          const dbStatus = profile?.status ?? profile?.chefStatus ?? profile?.state ?? null;
          if (dbStatus) user.status = dbStatus;
        }
      }
    } catch (e) {
      console.warn('[loginChef] status resync failed (non bloquant)', e);
    }

    const st = String((user as any).status || '').toLowerCase();

    // 🔒 bloque uniquement si vraiment pending (ou paused)
    if (!isAdminUser(user) && user.role === 'chef') {
      if (st === 'pending_validation') {
        return { success: false, error: "Ton compte est en attente de validation par l'équipe Chef Talents." };
      }
      if (st === 'paused') {
        return { success: false, error: "Ton compte est actuellement en pause. Contacte l'équipe Chef Talents." };
      }
    }

    setSessionUser(user);
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {}

    return { success: true, user };
  },

  getCurrentUser(): ChefUser | null {
    const session = getSessionUser();
    if (session) return session;

    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? (JSON.parse(raw) as ChefUser) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: any) {
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {}
  },

  async updateChefStatus(userId: string, status: ChefUser['status']): Promise<void> {
    await delay(120);
    const db = getChefDb();
    const idx = db.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      db[idx].status = status;
      saveChefDb(db);

      // sync session si c’est lui
      const session = getSessionUser();
      if (session?.id === userId) setSessionUser(db[idx]);

      // sync localStorage aussi
      try {
        localStorage.setItem('currentUser', JSON.stringify(db[idx]));
      } catch {}
    }
  },

  async updateChefProfile(userId: string, updates: Partial<ChefProfile>): Promise<ChefUser | null> {
    await delay(200);

    const db = getChefDb();
    const idx = db.findIndex((u) => u.id === userId);
    if (idx === -1) return null;

    const currentUser = db[idx];
    const updatedProfile = { ...(currentUser.profile ?? {}), ...updates };

    const isComplete = !!(
      (updatedProfile as any).bio &&
      (updatedProfile as any).yearsExperience &&
      (updatedProfile as any).baseCity &&
      (updatedProfile as any).profileType
    );

    const updatedUser: ChefUser = {
      ...currentUser,
      profile: updatedProfile,
      profileCompleted: isComplete,
    };

    db[idx] = updatedUser;
    saveChefDb(db);

    // sync session
    const session = getSessionUser();
    if (session?.id === userId) setSessionUser(updatedUser);

    // sync localStorage
    try {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch {}

    return updatedUser;
  },

  async deleteChefAccount(userId: string): Promise<void> {
    await delay(120);

    // 1) Supprime le chef
    saveChefDb(getChefDb().filter((u) => u.id !== userId));

    // 2) Supprime ses proposals
    saveProposalsDb(getProposalsDb().filter((p) => p.chefId !== userId));

    // 3) Supprime ses missions
    saveMissionsDb(getMissionsDb().filter((m) => m.chefId !== userId));

    // 4) Clear session/localStorage si besoin
    const session = getSessionUser();
    if (session?.id === userId) {
      clearSessionUser();
      try {
        localStorage.removeItem('currentUser');
      } catch {}
    }
  },

  logout() {
    clearSessionUser();
    try {
      localStorage.removeItem('currentUser');
    } catch {}
  },
};
