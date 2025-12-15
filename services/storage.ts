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
 * DOIT être ici (api / auth)
 */

/* =========================================================
   ADMIN
========================================================= */

export const ADMIN_EMAIL = 'thomas@chef-talents.com';
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
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const getDb = (): RequestEntity[] =>
  typeof window === 'undefined'
    ? []
    : safeParse(localStorage.getItem(DB_KEY), []);

const saveDb = (data: RequestEntity[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }
};

const getChefDb = (): ChefUser[] =>
  typeof window === 'undefined'
    ? []
    : safeParse(localStorage.getItem(CHEF_USERS_KEY), []);

const saveChefDb = (data: ChefUser[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHEF_USERS_KEY, JSON.stringify(data));
  }
};

const getMissionsDb = (): Mission[] =>
  typeof window === 'undefined'
    ? []
    : safeParse(localStorage.getItem(MISSIONS_KEY), []);

const saveMissionsDb = (data: Mission[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
  }
};

const getProposalsDb = (): ChefProposalEntity[] =>
  typeof window === 'undefined'
    ? []
    : safeParse(localStorage.getItem(PROPOSALS_KEY), []);

const saveProposalsDb = (data: ChefProposalEntity[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(data));
  }
};

const getChefById = (id: string) =>
  getChefDb().find(c => c.id === id);

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
  return raw ? JSON.parse(raw) : null;
};

const clearSessionUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};

function ensureAdminSeed() {
  if (typeof window === 'undefined') return;

  const db = getChefDb();
  if (db.find(u => u.email === ADMIN_EMAIL)) return;

  db.push({
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
      interviewed: true,
    },
  });

  saveChefDb(db);
}

/* =========================================================
   API
========================================================= */
/* ---------- MISSIONS (ADMIN) ---------- */

async getAllMissions(): Promise<Mission[]> {
  await delay(120);
  return getMissionsDb().sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
},
export const api = {
  async createRequest(form: RequestForm): Promise<RequestEntity> {
    await delay(200);

    const isB2B = form.clientType === 'concierge';

    const entity: RequestEntity = {
      id: crypto.randomUUID(),
      mode: form.mode,
      userType: isB2B ? 'b2b' : 'b2c',
      location: form.location,
      dates: { start: form.startDate, end: form.endDate, type: form.dateMode },
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

    // ✅ FAST MATCH AUTO — B2C uniquement
    if (entity.mode === 'fast' && entity.userType === 'b2c') {
      const activeChefs = getChefDb().filter(isChefActive);

      let matched = matchChefsForFastRequest(entity, activeChefs);

      matched = matched
        .map(c => ({ c, s: auth.computeChefScore(c).score }))
        .sort((a, b) => b.s - a.s)
        .map(x => x.c)
        .slice(0, 5);

      if (matched.length) {
        saveProposalsDb([
          ...buildFastMatchProposals(entity, matched),
          ...getProposalsDb(),
        ]);

        const fresh = getDb();
        const i = fresh.findIndex(r => r.id === entity.id);
        if (i !== -1) fresh[i].status = 'in_review';
        saveDb(fresh);
      }
    }

    return entity;
  },

  async getRequests() {
    await delay(120);
    return getDb();
  },

  async updateStatus(id: string, status: RequestStatus) {
    await delay(100);
    const db = getDb();
    const i = db.findIndex(r => r.id === id);
    if (i !== -1) {
      db[i].status = status;
      saveDb(db);
    }
  },
};

/* =========================================================
   AUTH
========================================================= */

export const auth = {
  // ✅ SCORING — UNIQUE VERSION
  computeChefScore(chef: ChefUser) {
    let score = 0;
    const badges: string[] = [];
    const p: any = chef.profile ?? {};

    if (chef.status === 'active') { score += 10; badges.push('✅ Actif'); }
    if (chef.profileCompleted) { score += 20; badges.push('🧾 Profil complet'); }
    if ((p.images?.length ?? 0) >= 3) score += 10;
    if ((p.coverageZones?.length ?? 0) >= 1) score += 10;
    if ((p.languages?.length ?? 0) >= 1) score += 5;
    if ((p.specialties?.length ?? 0) >= 2) score += 5;
    if (p.interviewed === true) { score += 15; badges.push('🎥 Interview'); }

    return { score: Math.min(100, score), badges };
  },

  async registerChef(data: Pick<ChefUser, 'email' | 'password' | 'firstName' | 'lastName'>) {
    await delay(200);

    const db = getChefDb();
    if (db.find(u => u.email === data.email)) {
      return { success: false, error: 'Email déjà utilisé' };
    }

    const user: ChefUser = {
      id: crypto.randomUUID(),
      ...data,
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

    db.push(user);
    saveChefDb(db);
    setSessionUser(user);

    return { success: true, user };
  },
// ✅ ADMIN — suppression complète d’un chef
async deleteChefAccount(userId: string): Promise<void> {
  await delay(120);

  // 1) Supprime le chef
  saveChefDb(getChefDb().filter(u => u.id !== userId));

  // 2) Supprime ses proposals
  saveProposalsDb(getProposalsDb().filter(p => p.chefId !== userId));

  // 3) Supprime ses missions
  saveMissionsDb(getMissionsDb().filter(m => m.chefId !== userId));

  // 4) Clear session si besoin
  const session = getSessionUser();
  if (session?.id === userId) {
    clearSessionUser();
  }
},
  async loginChef(email: string, password: string) {
    await delay(200);
    ensureAdminSeed();

    const user = getChefDb().find(u => u.email === email && u.password === password);
    if (!user) return { success: false, error: 'Identifiants invalides' };

    if (!isAdminUser(user) && user.status !== 'active') {
      return { success: false, error: 'Compte en attente de validation' };
    }

    setSessionUser(user);
    return { success: true, user };
  },

  async getAllChefs() {
    await delay(100);
    return getChefDb();
  },

  async updateChefStatus(id: string, status: ChefUser['status']) {
    const db = getChefDb();
    const i = db.findIndex(c => c.id === id);
    if (i !== -1) {
      db[i].status = status;
      saveChefDb(db);
    }
  },

  getCurrentUser() {
    return getSessionUser();
  },

  logout() {
    clearSessionUser();
  },
};
